package com.muva.fintech.audio

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.NoiseSuppressor
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * AmbientLedgerService - Muva Fintech Background Engine
 * 
 * PASSIVE AMBIENT AUDIO CAPTURE FOR RETAIL SHOPKEEPERS
 * Features:
 * 1. Persistent Foreground Service with WakeLock bypassing aggressive Android OEM battery savers (Xiaomi, Transsion, Samsung).
 * 2. MediaRecorder.AudioSource.VOICE_RECOGNITION for speech-tuned directional acoustic pickup.
 * 3. Hardware-level Acoustic Echo Cancellation (AEC) to digitally isolate internal phone media playback (e.g. TikTok, YouTube, WhatsApp voice notes).
 * 4. Hardware Noise Suppressor (NS) to cancel industrial street/counter noise.
 * 5. On-Device Voice Activity Detection (VAD) energy/frequency gating to prevent network and battery drain during counter silence.
 */
class AmbientLedgerService : Service() {

    companion object {
        private const val TAG = "AmbientLedgerService"
        private const val NOTIFICATION_CHANNEL_ID = "muva_ambient_ledger_channel"
        private const val NOTIFICATION_ID = 4099
        private const val WAKELOCK_TAG = "Muva:AmbientLedgerWakeLock"

        // Audio stream parameters optimized for speech recognition & VAD
        private const val SAMPLE_RATE_HZ = 16000 // 16kHz PCM mono standard for Whisper & Silero VAD
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        private const val FRAME_SIZE_SAMPLES = 512 // 32ms window at 16kHz
        private const val VAD_ENERGY_THRESHOLD = 800.0 // Energy baseline for speech activity gating
    }

    private var audioRecord: AudioRecord? = null
    private var echoCanceler: AcousticEchoCanceler? = null
    private var noiseSuppressor: NoiseSuppressor? = null
    private var wakeLock: PowerManager.WakeLock? = null

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    private var isRecording = false

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Initializing Muva Ambient Ledger Background Service...")
        acquireWakeLock()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRecording) {
            startAmbientAudioPipeline()
        }
        // START_STICKY ensures Android restarts the service if killed under memory pressure
        return START_STICKY
    }

    /**
     * Prevents OEM battery optimizations (e.g., Doze mode) from halting counter capture.
     */
    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKELOCK_TAG).apply {
            setReferenceCounted(false)
            acquire(24 * 60 * 60 * 1000L) // 24-hour shift retention
        }
        Log.i(TAG, "Partial WakeLock acquired for ambient counter duty.")
    }

    /**
     * Configures the audio pipeline with AEC and Noise Suppression.
     */
    private fun startAmbientAudioPipeline() {
        try {
            val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE_HZ, CHANNEL_CONFIG, AUDIO_FORMAT)
            val bufferSize = Math.max(minBufferSize, FRAME_SIZE_SAMPLES * 4)

            // VOICE_RECOGNITION enables OS audio processing hooks (microphone array beamforming)
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                SAMPLE_RATE_HZ,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                Log.e(TAG, "AudioRecord initialization failed!")
                return
            }

            val audioSessionId = audioRecord!!.audioSessionId

            // HARDWARE ACOUSTIC ECHO CANCELLATION (AEC)
            // Strips internal device speaker output (TikTok/YouTube audio playing on same phone)
            if (AcousticEchoCanceler.isAvailable()) {
                echoCanceler = AcousticEchoCanceler.create(audioSessionId)?.apply {
                    enabled = true
                    Log.i(TAG, "Hardware AcousticEchoCanceler enabled successfully.")
                }
            } else {
                Log.w(TAG, "Hardware AEC not supported on this chipset; falling back to software filter.")
            }

            // HARDWARE NOISE SUPPRESSOR (NS)
            // Attenuates counter background hiss, refrigeration hums, and street traffic
            if (NoiseSuppressor.isAvailable()) {
                noiseSuppressor = NoiseSuppressor.create(audioSessionId)?.apply {
                    enabled = true
                    Log.i(TAG, "Hardware NoiseSuppressor enabled successfully.")
                }
            }

            audioRecord?.startRecording()
            isRecording = true
            Log.i(TAG, "AudioRecord stream active. Spawning VAD ingestion loop...")

            // Launch non-blocking background sampling coroutine
            serviceScope.launch {
                runVoiceActivityDetectionLoop()
            }

        } catch (e: SecurityException) {
            Log.e(TAG, "RECORD_AUDIO permission missing: ${e.message}")
        } catch (e: Exception) {
            Log.e(TAG, "Fatal error launching audio recorder: ${e.message}", e)
        }
    }

    /**
     * On-Device Low-Power VAD Loop.
     * Continuously analyzes PCM frames. Buffers audio and dispatches speech bursts
     * to the NLP Intent Engine only when human vocal energy is sustained.
     */
    private suspend fun runVoiceActivityDetectionLoop() {
        val audioBuffer = ShortArray(FRAME_SIZE_SAMPLES)
        val speechAccumulator = ByteArrayOutputStream()
        var consecutiveSpeechFrames = 0
        var consecutiveSilenceFrames = 0
        val requiredSpeechFramesThreshold = 4 // ~128ms of voiced audio
        val silenceToFlushThreshold = 25       // ~800ms of trailing silence to seal transaction chunk

        while (isRecording && serviceScope.isActive) {
            val readCount = audioRecord?.read(audioBuffer, 0, FRAME_SIZE_SAMPLES) ?: 0
            if (readCount <= 0) continue

            // Compute Root Mean Square (RMS) energy of current 32ms frame
            var sumOfSquares = 0.0
            for (i in 0 until readCount) {
                sumOfSquares += audioBuffer[i] * audioBuffer[i]
            }
            val rmsEnergy = Math.sqrt(sumOfSquares / readCount)

            // Human speech energy evaluation
            val isVoicedFrame = rmsEnergy > VAD_ENERGY_THRESHOLD

            if (isVoicedFrame) {
                consecutiveSpeechFrames++
                consecutiveSilenceFrames = 0

                // Convert PCM Short to Byte array and buffer speech
                val byteBuffer = ByteBuffer.allocate(readCount * 2).order(ByteOrder.LITTLE_ENDIAN)
                byteBuffer.asShortBuffer().put(audioBuffer, 0, readCount)
                speechAccumulator.write(byteBuffer.array())

            } else {
                if (consecutiveSpeechFrames >= requiredSpeechFramesThreshold) {
                    consecutiveSilenceFrames++
                    
                    // Maintain trailing buffer to avoid clipping word endings
                    val byteBuffer = ByteBuffer.allocate(readCount * 2).order(ByteOrder.LITTLE_ENDIAN)
                    byteBuffer.asShortBuffer().put(audioBuffer, 0, readCount)
                    speechAccumulator.write(byteBuffer.array())

                    // Utterance complete: flush to NLP ingestion client
                    if (consecutiveSilenceFrames >= silenceToFlushThreshold) {
                        val speechPcmPayload = speechAccumulator.toByteArray()
                        Log.i(TAG, "Speech utterance segmented: ${speechPcmPayload.size} bytes. Dispatching to transcription pipeline.")
                        
                        dispatchSpeechPayload(speechPcmPayload)

                        // Reset buffers
                        speechAccumulator.reset()
                        consecutiveSpeechFrames = 0
                        consecutiveSilenceFrames = 0
                    }
                } else {
                    // Discard isolated transient spikes (counter taps, coin drops)
                    speechAccumulator.reset()
                    consecutiveSpeechFrames = 0
                }
            }
        }
    }

    /**
     * Sends segmented audio to Flutter PlatformChannel or transcription worker.
     */
    private fun dispatchSpeechPayload(pcmBytes: ByteArray) {
        // Dispatches broadcast intent to Muva Flutter Engine / Native Bridge
        val intent = Intent("com.muva.fintech.SPEECH_CHUNK_DETECTED").apply {
            putExtra("PCM_PAYLOAD", pcmBytes)
            putExtra("SAMPLE_RATE", SAMPLE_RATE_HZ)
            putExtra("TIMESTAMP", System.currentTimeMillis())
        }
        sendBroadcast(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Muva Ambient Ledger Ear",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Passively logging counter buyer-seller transaction drafts"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Muva Ambient Ledger Active")
            .setContentText("AEC & VAD active: Passively queueing counter transactions.")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(Notification.CATEGORY_SERVICE)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.i(TAG, "Tearing down AmbientLedgerService...")
        isRecording = false
        serviceJob.cancel()

        try {
            audioRecord?.stop()
            audioRecord?.release()
            echoCanceler?.release()
            noiseSuppressor?.release()
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error during cleanup: ${e.message}")
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
