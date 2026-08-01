import CryptoJS from 'crypto-js';

let currentSessionKey = null;

export const setSessionKey = (key) => {
    currentSessionKey = key;
};

export const getSessionKey = () => currentSessionKey;

// Function to encrypt data
function encryptData(data) {
    if (!currentSessionKey) {
        console.warn("No session key set for encryption!");
        return JSON.stringify(data); // Fallback if no key (should not happen in production)
    }
    const formattedKey = CryptoJS.enc.Utf8.parse(currentSessionKey);
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), formattedKey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });

    return encrypted.toString();
}

// Function to decrypt data
function decryptData(encryptedData) {
    if (!currentSessionKey) {
        console.warn("No session key set for decryption!");
        return JSON.parse(encryptedData);
    }
    const formattedKey = CryptoJS.enc.Utf8.parse(currentSessionKey);
    const decrypted = CryptoJS.AES.decrypt(encryptedData, formattedKey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });

    const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
}




export {encryptData, decryptData}
