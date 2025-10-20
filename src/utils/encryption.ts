import CryptoJS from 'crypto-js';

export const encryptFile = (fileBuffer: ArrayBuffer, key: string): { data: ArrayBuffer; iv: string } => {
  // Generate random IV
  const iv = CryptoJS.lib.WordArray.random(16);
  
  // Convert ArrayBuffer to WordArray
  const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
  
  // Encrypt the data
  const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  // Convert encrypted data back to ArrayBuffer
  const encryptedWordArray = encrypted.ciphertext;
  const encryptedArrayBuffer = new ArrayBuffer(encryptedWordArray.sigBytes);
  const encryptedView = new Uint8Array(encryptedArrayBuffer);
  
  for (let i = 0; i < encryptedWordArray.sigBytes; i++) {
    encryptedView[i] = (encryptedWordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  
  return {
    data: encryptedArrayBuffer,
    iv: iv.toString()
  };
};

export const decryptFile = (encryptedData: { data: ArrayBuffer; iv: string }, key: string): ArrayBuffer => {
  const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
  const encryptedWordArray = CryptoJS.lib.WordArray.create(encryptedData.data);
  
  const decrypted = CryptoJS.AES.decrypt(
    CryptoJS.lib.CipherParams.create({
      ciphertext: encryptedWordArray
    }),
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );
  
  // Convert decrypted WordArray to ArrayBuffer
  const decryptedArrayBuffer = new ArrayBuffer(decrypted.sigBytes);
  const decryptedView = new Uint8Array(decryptedArrayBuffer);
  
  for (let i = 0; i < decrypted.sigBytes; i++) {
    decryptedView[i] = (decrypted.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  
  return decryptedArrayBuffer;
};

export const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(256/8).toString();
};
