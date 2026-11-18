/**
 * YuBiFlo — 24-Hour Continuous Counter Voice Recorder & Acoustic Filter Engine
 *
 * Solves two real-world Kenyan shopkeeper problems:
 * 1. Continuous 24-Hour Recording (86,400 seconds) — NO 5-minute timeout:
 *    - Combines segmented rolling MediaRecorder windows (12s speech windows, zero RAM bloat)
 *      with auto-restarting SpeechRecognition (unlimited continuous restarts with backoff),
 *      Screen Wake Lock re-acquisition, and a 3s track health watchdog.
 * 2. Music / TikTok / Non-Buyer Noise Filtering:
 *    - Hardware AEC (echoCancellation: true) cancels phone speaker TikTok/YouTube/boomplay playback.
 *    - Web Audio DSP chain: High-pass 110Hz (drops bass beat & matatu rumble) ->
 *      Vocal Bandpass (250Hz–3600Hz human speech formants) -> Compressor -> FFT Analyser.
 *    - Real-time Rhythm / Speech-Formant Classifier detects sustained music/media beats vs
 *      conversational bursts and discards non-speech/music-dominated windows before AI parsing.
 */

export const MAX_SHIFT_DURATION_SECONDS = 24 * 60 * 60; // 24:00:00 (86,400s)

export type AcousticGateStatus =
  | "IDLE"
  | "SILENCE"
  | "SPEECH_ACTIVE"
  | "MUSIC_OR_MEDIA_SUPPRESSED";

export interface AcousticTelemetry {
  elapsedSeconds: number;
  remainingSeconds: number;
  shiftStartedAt: number | null;
  rmsLevel: number; // 0..100
  vocalClarityScore: number; // 0..100 (vocal 300-3400Hz vs sub-bass/music)
  musicSuppressionScore: number; // 0..100 (higher = continuous rhythmic music detected)
  gateStatus: AcousticGateStatus;
  autoRenewals: number;
  capturedSegments: number;
  discardedMusicOrSilentSegments: number;
  wakeLockActive: boolean;
  hardwareAecEnabled: boolean;
  lastRecoveredAt?: string;
}

export interface VoiceShiftRecorderCallbacks {
  onTelemetry: (telemetry: AcousticTelemetry) => void;
  onInterimTranscript?: (text: string) => void;
  onFinalUtterance: (text: string) => void;
  onSpeechAudioSegment: (audioBase64: string, mimeType: string) => void;
  onStatusMessage?: (msg: string) => void;
  onError?: (err: string) => void;
}

export interface VoiceShiftRecorderOptions {
  language?: string;
  enableHardwareAec?: boolean;
  enableVocalBandpass?: boolean;
  ignoreMusicAndMedia?: boolean;
  maxShiftSeconds?: number;
  segmentDurationMs?: number;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...sub);
  }
  return btoa(binary);
}

export function formatShiftDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, "0")).join(":");
}

export class VoiceShiftRecorderEngine {
  private callbacks: VoiceShiftRecorderCallbacks;
  private options: Required<VoiceShiftRecorderOptions>;

  private isRunning = false;
  private shiftStartedAt: number | null = null;
  private rawStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private filteredDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recognition: any = null;
  private wakeLockSentinel: any = null;

  private watchdogTimer: number | null = null;
  private meterTimer: number | null = null;
  private segmentRollTimer: number | null = null;
  private recognitionRestartTimer: number | null = null;

  private currentChunkBlobs: Blob[] = [];
  private speechFramesInWindow = 0;
  private musicFramesInWindow = 0;
  private totalFramesInWindow = 0;
  private recentEnergyHistory: number[] = [];

  private autoRenewals = 0;
  private capturedSegments = 0;
  private discardedMusicOrSilentSegments = 0;
  private lastRecoveredAt: string | undefined;
  private latestRms = 0;
  private latestVocalClarity = 0;
  private latestMusicScore = 0;
  private latestGate: AcousticGateStatus = "IDLE";
  private lastEmittedUtterance = "";
  private lastEmittedAt = 0;

  private visibilityHandler: (() => void) | null = null;

  constructor(
    callbacks: VoiceShiftRecorderCallbacks,
    options: VoiceShiftRecorderOptions = {}
  ) {
    this.callbacks = callbacks;
    this.options = {
      language: options.language || "en-KE",
      enableHardwareAec: options.enableHardwareAec ?? true,
      enableVocalBandpass: options.enableVocalBandpass ?? true,
      ignoreMusicAndMedia: options.ignoreMusicAndMedia ?? true,
      maxShiftSeconds: options.maxShiftSeconds ?? MAX_SHIFT_DURATION_SECONDS,
      segmentDurationMs: options.segmentDurationMs ?? 12000
    };
  }

  public updateOptions(partial: Partial<VoiceShiftRecorderOptions>) {
    this.options = { ...this.options, ...partial };
  }

  public getRunningState(): boolean {
    return this.isRunning;
  }

  public async start(): Promise<boolean> {
    if (this.isRunning) return true;
    this.isRunning = true;
    this.shiftStartedAt = Date.now();
    this.autoRenewals = 0;
    this.capturedSegments = 0;
    this.discardedMusicOrSilentSegments = 0;
    this.recentEnergyHistory = [];
    this.lastRecoveredAt = undefined;

    try {
      await this.acquireMicrophoneAndDsp();
    } catch (err: any) {
      this.isRunning = false;
      this.shiftStartedAt = null;
      this.callbacks.onError?.(
        err?.message || "Microphone access was denied. Allow mic permissions to run the 24-hour Voice Ledger."
      );
      return false;
    }

    await this.requestWakeLock();
    this.attachVisibilityRecovery();
    this.startSpeechRecognitionLoop();
    this.startSegmentedMediaRecorder();
    this.startMeterAndWatchdog();
    this.emitTelemetry();
    this.callbacks.onStatusMessage?.(
      "24-Hour Shift Recorder started with Hardware Echo Cancellation & Vocal Filter."
    );
    return true;
  }

  public stop(reason = "24-hour shift recorder stopped cleanly.") {
    if (!this.isRunning && !this.rawStream) return;
    this.isRunning = false;

    if (this.watchdogTimer !== null) {
      window.clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.meterTimer !== null) {
      window.clearInterval(this.meterTimer);
      this.meterTimer = null;
    }
    if (this.segmentRollTimer !== null) {
      window.clearInterval(this.segmentRollTimer);
      this.segmentRollTimer = null;
    }
    if (this.recognitionRestartTimer !== null) {
      window.clearTimeout(this.recognitionRestartTimer);
      this.recognitionRestartTimer = null;
    }

    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }

    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
    } catch {}
    this.mediaRecorder = null;

    try {
      if (this.recognition) {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.stop();
      }
    } catch {}
    this.recognition = null;

    try {
      this.rawStream?.getTracks().forEach((t) => t.stop());
    } catch {}
    this.rawStream = null;

    try {
      if (this.audioCtx && this.audioCtx.state !== "closed") {
        void this.audioCtx.close();
      }
    } catch {}
    this.audioCtx = null;
    this.analyser = null;
    this.filteredDest = null;

    try {
      void this.wakeLockSentinel?.release?.();
    } catch {}
    this.wakeLockSentinel = null;

    this.latestGate = "IDLE";
    this.latestRms = 0;
    this.emitTelemetry();
    this.callbacks.onStatusMessage?.(reason);
  }

  private async acquireMicrophoneAndDsp() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Audio capture is not supported in this browser.");
    }

    this.rawStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: this.options.enableHardwareAec,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      }
    });

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx: AudioContext = new AudioCtx();
    this.audioCtx = ctx;
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    const source = ctx.createMediaStreamSource(this.rawStream);

    // 1. High-pass filter @ 110Hz strips heavy sub-bass music & passing matatu rumble
    const highPass = ctx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = this.options.enableVocalBandpass ? 110 : 40;

    // 2. Gentle bandpass centered on human speech formants (300Hz–3400Hz)
    const vocalBand = ctx.createBiquadFilter();
    vocalBand.type = "bandpass";
    vocalBand.frequency.value = 1350;
    vocalBand.Q.value = this.options.enableVocalBandpass ? 0.65 : 0.2;

    // 3. Dynamics compressor levels quiet speakers vs loud counter clatter
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -28;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.18;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.72;
    this.analyser = analyser;

    const dest = ctx.createMediaStreamDestination();
    this.filteredDest = dest;

    source.connect(highPass);
    highPass.connect(vocalBand);
    vocalBand.connect(compressor);
    compressor.connect(analyser);
    compressor.connect(dest);
  }

  private async requestWakeLock() {
    try {
      const nav = navigator as any;
      if (nav.wakeLock?.request) {
        this.wakeLockSentinel = await nav.wakeLock.request("screen");
        this.wakeLockSentinel.addEventListener?.("release", () => {
          this.wakeLockSentinel = null;
        });
      }
    } catch {
      // Wake lock optional in background or unsupported browsers
    }
  }

  private attachVisibilityRecovery() {
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
    this.visibilityHandler = () => {
      if (!this.isRunning) return;
      if (document.visibilityState === "visible") {
        void this.requestWakeLock();
        if (this.audioCtx?.state === "suspended") {
          void this.audioCtx.resume().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  private startSpeechRecognitionLoop() {
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const spawn = () => {
      if (!this.isRunning) return;
      try {
        const rec = new SpeechRecognitionCtor();
        rec.lang = this.options.language;
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (event: any) => {
          let interim = "";
          let finalized = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const chunk = event.results[i]?.[0]?.transcript || "";
            if (event.results[i]?.isFinal) {
              finalized += " " + chunk;
            } else {
              interim += " " + chunk;
            }
          }
          if (interim.trim()) {
            this.callbacks.onInterimTranscript?.(interim.trim());
          }
          const cleanFinal = finalized.trim();
          if (cleanFinal) {
            const now = Date.now();
            if (
              cleanFinal.toLowerCase() !== this.lastEmittedUtterance.toLowerCase() ||
              now - this.lastEmittedAt > 2500
            ) {
              this.lastEmittedUtterance = cleanFinal;
              this.lastEmittedAt = now;
              this.callbacks.onFinalUtterance(cleanFinal);
            }
          }
        };

        rec.onerror = (ev: any) => {
          const code = ev?.error || "";
          if (code === "not-allowed" || code === "service-not-allowed") {
            this.callbacks.onError?.("Microphone permission denied by browser.");
            this.stop("Stopped due to microphone permission error.");
            return;
          }
          // Transient errors ("no-speech", "network", "aborted") auto-restart cleanly
        };

        rec.onend = () => {
          if (!this.isRunning) return;
          // Auto-heal without ever terminating at 60s or 5 minutes!
          this.autoRenewals += 1;
          this.lastRecoveredAt = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
          this.recognitionRestartTimer = window.setTimeout(() => {
            if (this.isRunning) spawn();
          }, 180);
        };

        this.recognition = rec;
        rec.start();
      } catch {
        this.recognitionRestartTimer = window.setTimeout(() => {
          if (this.isRunning) spawn();
        }, 1200);
      }
    };

    spawn();
  }

  private pickSupportedMimeType(): string {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4"
    ];
    for (const mime of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return "";
  }

  private startSegmentedMediaRecorder() {
    const targetStream = this.filteredDest?.stream || this.rawStream;
    if (!targetStream || typeof MediaRecorder === "undefined") return;

    const mimeType = this.pickSupportedMimeType();

    const startNewSegment = () => {
      if (!this.isRunning || !targetStream) return;
      this.currentChunkBlobs = [];
      this.speechFramesInWindow = 0;
      this.musicFramesInWindow = 0;
      this.totalFramesInWindow = 0;

      try {
        const mr = mimeType
          ? new MediaRecorder(targetStream, { mimeType, audioBitsPerSecond: 24000 })
          : new MediaRecorder(targetStream);

        mr.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            this.currentChunkBlobs.push(ev.data);
          }
        };

        mr.onstop = async () => {
          const blobs = [...this.currentChunkBlobs];
          const speechFrames = this.speechFramesInWindow;
          const musicFrames = this.musicFramesInWindow;
          this.currentChunkBlobs = [];

          // Immediately restart the next rolling window if the 24h shift is still running
          if (this.isRunning) {
            startNewSegment();
          }

          // Only forward segments that actually contain human speech and aren't dominated by continuous music/TikTok
          const hasMeaningfulSpeech = speechFrames >= 3;
          const dominatedByMusic =
            this.options.ignoreMusicAndMedia &&
            musicFrames > speechFrames * 1.4 &&
            musicFrames >= 6;

          if (!hasMeaningfulSpeech || dominatedByMusic || blobs.length === 0) {
            this.discardedMusicOrSilentSegments += 1;
            this.emitTelemetry();
            return;
          }

          try {
            const combined = new Blob(blobs, { type: mimeType || "audio/webm" });
            if (combined.size < 1800) {
              this.discardedMusicOrSilentSegments += 1;
              this.emitTelemetry();
              return;
            }
            const ab = await combined.arrayBuffer();
            const b64 = arrayBufferToBase64(ab);
            this.capturedSegments += 1;
            this.emitTelemetry();
            this.callbacks.onSpeechAudioSegment(b64, mimeType || "audio/webm");
          } catch {
            this.discardedMusicOrSilentSegments += 1;
          }
        };

        this.mediaRecorder = mr;
        mr.start(1000);
      } catch {
        // Safe fallback if MediaRecorder fails to start on restricted browser
      }
    };

    startNewSegment();

    // Rotate window every segmentDurationMs (12s default) so memory stays flat across all 24 hours
    this.segmentRollTimer = window.setInterval(() => {
      if (!this.isRunning) return;
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        try {
          this.mediaRecorder.stop();
        } catch {}
      }
    }, this.options.segmentDurationMs);
  }

  private startMeterAndWatchdog() {
    const freqBuf = this.analyser ? new Uint8Array(this.analyser.frequencyBinCount) : null;
    const sampleRate = this.audioCtx?.sampleRate || 48000;

    // 150ms acoustic meter & music-vs-speech spectral classifier
    this.meterTimer = window.setInterval(() => {
      if (!this.isRunning) return;

      if (this.analyser && freqBuf) {
        this.analyser.getByteFrequencyData(freqBuf);
        const binHz = sampleRate / this.analyser.fftSize;

        let bassSum = 0;
        let bassCount = 0;
        let vocalSum = 0;
        let vocalCount = 0;
        let totalSum = 0;

        for (let i = 0; i < freqBuf.length; i++) {
          const hz = i * binHz;
          const v = freqBuf[i];
          totalSum += v;
          if (hz >= 40 && hz <= 190) {
            bassSum += v;
            bassCount++;
          } else if (hz >= 300 && hz <= 3400) {
            vocalSum += v;
            vocalCount++;
          }
        }

        const avgBass = bassCount > 0 ? bassSum / bassCount : 0;
        const avgVocal = vocalCount > 0 ? vocalSum / vocalCount : 0;
        const avgTotal = freqBuf.length > 0 ? totalSum / freqBuf.length : 0;

        this.latestRms = Math.min(100, Math.round((avgTotal / 128) * 100));
        this.recentEnergyHistory.push(avgTotal);
        if (this.recentEnergyHistory.length > 36) {
          this.recentEnergyHistory.shift();
        }

        // Sustained steady wall of sound (>28 of last 36 frames active) with low dynamic pauses = music / TikTok soundtrack
        const activeFramesCount = this.recentEnergyHistory.filter((x) => x > 14).length;
        const steadySustainedRatio =
          this.recentEnergyHistory.length >= 20
            ? activeFramesCount / this.recentEnergyHistory.length
            : 0;

        const vocalOverBass = avgVocal / Math.max(4, avgBass + 6);
        this.latestVocalClarity = Math.min(100, Math.round(vocalOverBass * 28));
        this.latestMusicScore = Math.min(
          100,
          Math.round(
            (steadySustainedRatio > 0.85 ? 55 : steadySustainedRatio * 35) +
              (avgBass > avgVocal * 0.9 ? 40 : 0)
          )
        );

        this.totalFramesInWindow += 1;

        if (avgVocal < 12 && avgTotal < 10) {
          this.latestGate = "SILENCE";
        } else if (
          this.options.ignoreMusicAndMedia &&
          (this.latestMusicScore >= 68 || (avgBass > avgVocal * 1.15 && avgBass > 22))
        ) {
          this.latestGate = "MUSIC_OR_MEDIA_SUPPRESSED";
          this.musicFramesInWindow += 1;
        } else if (avgVocal >= 14) {
          this.latestGate = "SPEECH_ACTIVE";
          this.speechFramesInWindow += 1;
        } else {
          this.latestGate = "SILENCE";
        }
      }

      this.emitTelemetry();
    }, 180);

    // 3-second Watchdog: enforces exact 24-hour cap and auto-recovers mic stream if OS pauses track
    this.watchdogTimer = window.setInterval(async () => {
      if (!this.isRunning || !this.shiftStartedAt) return;

      const elapsed = Math.floor((Date.now() - this.shiftStartedAt) / 1000);
      if (elapsed >= this.options.maxShiftSeconds) {
        this.stop("24-Hour Voice Ledger shift completed cleanly (24:00:00).");
        return;
      }

      if (this.audioCtx?.state === "suspended") {
        await this.audioCtx.resume().catch(() => {});
      }

      const audioTracks = this.rawStream?.getAudioTracks() || [];
      const hasLiveTrack = audioTracks.some((t) => t.readyState === "live" && t.enabled);
      if (!hasLiveTrack) {
        try {
          await this.acquireMicrophoneAndDsp();
          this.startSegmentedMediaRecorder();
          this.autoRenewals += 1;
          this.lastRecoveredAt = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
          this.callbacks.onStatusMessage?.("Microphone track auto-recovered cleanly to sustain 24h shift.");
        } catch {
          // Will retry on next watchdog tick
        }
      }

      this.emitTelemetry();
    }, 3000);
  }

  private emitTelemetry() {
    const elapsed = this.shiftStartedAt
      ? Math.max(0, Math.floor((Date.now() - this.shiftStartedAt) / 1000))
      : 0;
    const remaining = Math.max(0, this.options.maxShiftSeconds - elapsed);

    this.callbacks.onTelemetry({
      elapsedSeconds: elapsed,
      remainingSeconds: remaining,
      shiftStartedAt: this.shiftStartedAt,
      rmsLevel: this.latestRms,
      vocalClarityScore: this.latestVocalClarity,
      musicSuppressionScore: this.latestMusicScore,
      gateStatus: this.latestGate,
      autoRenewals: this.autoRenewals,
      capturedSegments: this.capturedSegments,
      discardedMusicOrSilentSegments: this.discardedMusicOrSilentSegments,
      wakeLockActive: Boolean(this.wakeLockSentinel),
      hardwareAecEnabled: this.options.enableHardwareAec,
      lastRecoveredAt: this.lastRecoveredAt
    });
  }
}
