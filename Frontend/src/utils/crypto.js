import CryptoJS from 'crypto-js';

let currentSessionKey = null;

export const setSessionKey = (key) => {
    currentSessionKey = key;
};

export const getSessionKey = () => currentSessionKey;

// Function to encrypt data
// Uses AES-CBC with a fresh random IV per message so identical payloads
// (like repeated location updates) always produce different ciphertext.
// Output format: "<iv_base64>:<ciphertext_base64>"
function encryptData(data) {
    if (!currentSessionKey) {
        console.warn("No session key set for encryption!");
        return JSON.stringify(data); // Fallback — should not happen in production
    }
    const formattedKey = CryptoJS.enc.Utf8.parse(currentSessionKey);
    const iv = CryptoJS.lib.WordArray.random(16); // 128-bit random IV
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), formattedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    // Prepend IV so the receiver can decrypt: "<iv_base64>:<ciphertext_base64>"
    return iv.toString(CryptoJS.enc.Base64) + ':' + encrypted.toString();
}

// Function to decrypt data
// Expects the "<iv_base64>:<ciphertext_base64>" format produced by encryptData.
function decryptData(encryptedData) {
    if (!currentSessionKey) {
        console.warn("No session key set for decryption!");
        return JSON.parse(encryptedData);
    }
    // Use indexOf to split on the FIRST ':' only — safe even if ciphertext contained one
    const separatorIdx = encryptedData.indexOf(':');
    const ivBase64 = encryptedData.slice(0, separatorIdx);
    const ciphertext = encryptedData.slice(separatorIdx + 1);
    const iv = CryptoJS.enc.Base64.parse(ivBase64);
    const formattedKey = CryptoJS.enc.Utf8.parse(currentSessionKey);
    const decrypted = CryptoJS.AES.decrypt(ciphertext, formattedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
}




export {encryptData, decryptData}
