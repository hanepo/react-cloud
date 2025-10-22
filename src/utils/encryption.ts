import CryptoJS from 'crypto-js';

// Helper function to convert WordArray to ArrayBuffer
function wordArrayToAb(wordArray: CryptoJS.lib.WordArray): ArrayBuffer {
    const { sigBytes } = wordArray;
    const ab = new ArrayBuffer(sigBytes);
    const ua = new Uint8Array(ab);
    for (let i = 0; i < sigBytes; i++) {
        ua[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return ab;
}

// Helper function to convert ArrayBuffer to WordArray
function abToWordArray(ab: ArrayBuffer): CryptoJS.lib.WordArray {
    const ua = new Uint8Array(ab);
    const words: number[] = [];
    for (let i = 0; i < ua.length; i++) {
        words[i >>> 2] |= ua[i] << (24 - (i % 4) * 8);
    }
    return CryptoJS.lib.WordArray.create(words, ua.length);
}


export const encryptFile = (fileBuffer: ArrayBuffer, key: string): { data: ArrayBuffer; iv: string } | null => {
  try {
      // Generate random IV
      const iv = CryptoJS.lib.WordArray.random(16); // 128 bits for AES

      // Convert ArrayBuffer to WordArray
      const wordArray = abToWordArray(fileBuffer);

      // Encrypt the data using AES-256-CBC
      const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Check if encryption produced ciphertext
      if (!encrypted.ciphertext || encrypted.ciphertext.sigBytes <= 0) {
          throw new Error("Encryption resulted in empty ciphertext.");
      }

      // Convert encrypted ciphertext WordArray back to ArrayBuffer
      const encryptedArrayBuffer = wordArrayToAb(encrypted.ciphertext);

      return {
        data: encryptedArrayBuffer,
        iv: CryptoJS.enc.Hex.stringify(iv) // Store IV as hex string
      };
  } catch (error) {
       console.error("Encryption failed:", error);
       return null; // Return null on failure
  }
};

export const decryptFile = (encryptedData: { data: ArrayBuffer; iv: string }, key: string): ArrayBuffer | null => {
    try {
        // Parse IV from hex string
        const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);

        // Convert encrypted ArrayBuffer data to WordArray
        const encryptedWordArray = abToWordArray(encryptedData.data);

        // Create CipherParams object
        const cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: encryptedWordArray
        });

        // Decrypt using AES-256-CBC
        const decrypted = CryptoJS.AES.decrypt(
          cipherParams, // Pass CipherParams object
          key,
          {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          }
        );

        // --- Robustness Check ---
        // Check if decryption produced a result and if sigBytes is valid
        if (!decrypted || typeof decrypted.sigBytes !== 'number' || decrypted.sigBytes < 0) {
           console.error("Decryption failed or produced invalid result. Key might be incorrect.");
           throw new Error("Decryption failed. Incorrect key?"); // Throw specific error
        }
        // Check for empty result (might indicate padding error or wrong key)
        if (decrypted.sigBytes === 0) {
             // Depending on the file, 0 bytes might be valid, but often indicates an issue.
             // If you expect non-empty files, you could throw here. Let's allow it for now.
             console.warn("Decryption resulted in 0 bytes. Key might be incorrect or file was empty.");
        }
        // --- End Robustness Check ---


        // Convert decrypted WordArray to ArrayBuffer
        const decryptedArrayBuffer = wordArrayToAb(decrypted);

        return decryptedArrayBuffer;

    } catch (error) {
        // Log the specific error, including our custom one
        console.error("Decryption failed:", error instanceof Error ? error.message : error);
        // Do not return null here if we throw above, let the caller handle the thrown error
         if (error instanceof Error && error.message.includes("Incorrect key")) {
             throw error; // Re-throw the specific error
         }
         // Throw a generic error for other crypto issues
         throw new Error("Decryption process failed.");
    }
};

// Removed generateEncryptionKey as we are using user-provided keys now
// export const generateEncryptionKey = (): string => {
//   return CryptoJS.lib.WordArray.random(256/8).toString();
// };
