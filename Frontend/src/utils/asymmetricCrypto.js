// Utility for converting string to ArrayBuffer
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// Utility for converting ArrayBuffer to string
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

// Utility to encode base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Utility to decode base64
function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates an RSA-OAEP Key Pair.
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey, publicKeyJwk: Object}>}
 */
export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey
  );

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyJwk,
  };
}

/**
 * Encrypts a string (like our AES Key) using a recipient's Public Key.
 * @param {Object} publicKeyJwk - The recipient's exported public key in JWK format.
 * @param {string} dataString - The secret string to encrypt.
 * @returns {Promise<string>} Base64 encoded encrypted string.
 */
export async function encryptWithPublicKey(publicKeyJwk, dataString) {
  const publicKey = await window.crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );

  const encodedData = new TextEncoder().encode(dataString);
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    encodedData
  );

  return arrayBufferToBase64(encryptedBuffer);
}

/**
 * Decrypts a base64 encoded encrypted string using our Private Key.
 * @param {CryptoKey} privateKey - Our private key object.
 * @param {string} encryptedBase64 - The base64 encrypted data.
 * @returns {Promise<string>} The decrypted secret string.
 */
export async function decryptWithPrivateKey(privateKey, encryptedBase64) {
  const encryptedBuffer = base64ToArrayBuffer(encryptedBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Generates a strong random AES Key for the Group Session.
 * @returns {string} 256-bit Hex String
 */
export function generateAESGroupSessionKey() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let key = '';
  for(let i = 0; i < 32; i++){
    key += chars[array[i] % chars.length];
  }
  return key; // Exactly 32 characters (256 bits)
}
