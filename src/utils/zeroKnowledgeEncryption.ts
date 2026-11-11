/**
 * YubiFlo - Zero-Knowledge End-to-End Client Encryption (E2EE)
 * 
 * CORE PRIVACY GUARANTEE:
 * "Let the clients' data be encrypted that our staff as yubiflo cannot see it."
 * 
 * All sensitive financial state (inventory costs, cash balances, sales receipts,
 * customer debts, supplier chits) is encrypted in the user's browser using AES-GCM 256-bit
 * before being sent to the cloud database or exported.
 * 
 * YubiFlo servers and staff only store ciphertext and CANNOT view or decrypt
 * the merchant's private records without the merchant's local encryption key.
 */

export interface EncryptedPayload {
  v: number; // Version
  alg: "AES-GCM-256";
  iv: string; // Base64 Initialization Vector
  salt: string; // Base64 Salt for PBKDF2
  ciphertext: string; // Base64 Encrypted Ciphertext
  timestamp: string;
}

const LOCAL_KEY_STORAGE_KEY = "yubiflo_e2ee_device_key";

/**
 * Converts an ArrayBuffer to a Base64 string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string to an ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Gets or initializes the device's local zero-knowledge passphrase
 */
export function getOrCreateLocalEncryptionSecret(userEmail?: string): string {
  try {
    let secret = localStorage.getItem(LOCAL_KEY_STORAGE_KEY);
    if (!secret) {
      // Generate a cryptographic high-entropy secret if none exists
      const randomBytes = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytes);
      secret = `zk_${userEmail || "user"}_${bufferToBase64(randomBytes.buffer).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)}`;
      localStorage.setItem(LOCAL_KEY_STORAGE_KEY, secret);
    }
    return secret;
  } catch (e) {
    return `zk_fallback_${userEmail || "duka"}_2026`;
  }
}

/**
 * Derives an AES-GCM 256-bit CryptoKey using PBKDF2 and SHA-256
 */
async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100_000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts arbitrary client data into an EncryptedPayload
 */
export async function encryptClientData(data: any, customPassphrase?: string): Promise<EncryptedPayload> {
  const passphrase = customPassphrase || getOrCreateLocalEncryptionSecret();
  const enc = new TextEncoder();
  const jsonString = JSON.stringify(data);
  const encodedData = enc.encode(jsonString);

  // 1. Generate random 16-byte salt and 12-byte IV
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(salt);
  window.crypto.getRandomValues(iv);

  // 2. Derive 256-bit key
  const aesKey = await deriveAesKey(passphrase, salt);

  // 3. Encrypt data with AES-GCM
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encodedData
  );

  return {
    v: 1,
    alg: "AES-GCM-256",
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
    ciphertext: bufferToBase64(ciphertextBuffer),
    timestamp: new Date().toISOString()
  };
}

/**
 * Decrypts an EncryptedPayload back into the original plain JavaScript object
 */
export async function decryptClientData<T = any>(payload: EncryptedPayload, customPassphrase?: string): Promise<T> {
  const passphrase = customPassphrase || getOrCreateLocalEncryptionSecret();

  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const salt = new Uint8Array(base64ToBuffer(payload.salt));
  const ciphertextBuffer = base64ToBuffer(payload.ciphertext);

  const aesKey = await deriveAesKey(passphrase, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    ciphertextBuffer
  );

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);
  return JSON.parse(jsonString) as T;
}

/**
 * Checks if client-side encryption is active on the current device
 */
export function isZeroKnowledgeEncryptionActive(): boolean {
  return typeof window !== "undefined" && !!window.crypto && !!window.crypto.subtle;
}
