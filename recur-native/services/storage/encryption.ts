import * as Crypto from 'expo-crypto';

// Simple encryption/decryption utilities for additional data protection
export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;

  // Generate a random encryption key
  static async generateKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32); // 256 bits
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Simple XOR-based encryption for non-critical data
  // Note: This is not cryptographically secure, just obfuscation
  static simpleEncrypt(data: string, key: string): string {
    try {
      const keyBytes = this.stringToBytes(key);
      const dataBytes = this.stringToBytes(data);
      const encrypted = dataBytes.map((byte, index) => 
        byte ^ (keyBytes?.[index % keyBytes.length] ?? 0)
      );
      return this.bytesToBase64(encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Return original data if encryption fails
    }
  }

  // Simple XOR-based decryption
  static simpleDecrypt(encryptedData: string, key: string): string {
    try {
      const keyBytes = this.stringToBytes(key);
      const encryptedBytes = this.base64ToBytes(encryptedData);
      const decrypted = encryptedBytes.map((byte, index) => 
        byte ^ (keyBytes?.[index % keyBytes.length] ?? 0)
      );
      return this.bytesToString(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Return encrypted data if decryption fails
    }
  }

  // Hash data for integrity checking
  static async hashData(data: string): Promise<string> {
    try {
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      return digest;
    } catch (error) {
      console.error('Hashing failed:', error);
      return '';
    }
  }

  // Verify data integrity
  static async verifyHash(data: string, hash: string): Promise<boolean> {
    try {
      const computedHash = await this.hashData(data);
      return computedHash === hash;
    } catch (error) {
      console.error('Hash verification failed:', error);
      return false;
    }
  }

  // Helper methods
  private static stringToBytes(str: string): number[] {
    return Array.from(str, char => char.charCodeAt(0));
  }

  private static bytesToString(bytes: number[]): string {
    return String.fromCharCode(...bytes);
  }

  private static bytesToBase64(bytes: number[]): string {
    const binaryString = String.fromCharCode(...bytes);
    return btoa(binaryString);
  }

  private static base64ToBytes(base64: string): number[] {
    const binaryString = atob(base64);
    return Array.from(binaryString, char => char.charCodeAt(0));
  }
}

// Encrypted storage wrapper
export class EncryptedStorage {
  private encryptionKey: string | null = null;

  constructor(private baseStorage: any) {}

  // Initialize with encryption key
  async initialize(): Promise<void> {
    try {
      // Try to get existing key or generate new one
      this.encryptionKey = await this.baseStorage.getItem('encryption_key');
      if (!this.encryptionKey) {
        this.encryptionKey = await EncryptionService.generateKey();
        await this.baseStorage.setItem('encryption_key', this.encryptionKey);
      }
    } catch (error) {
      console.error('Failed to initialize encrypted storage:', error);
      // Fall back to no encryption
      this.encryptionKey = null;
    }
  }

  // Store encrypted data
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.encryptionKey) {
        const encryptedValue = EncryptionService.simpleEncrypt(value, this.encryptionKey);
        await this.baseStorage.setItem(`enc_${key}`, encryptedValue);
      } else {
        await this.baseStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Failed to store encrypted item ${key}:`, error);
      throw error;
    }
  }

  // Retrieve and decrypt data
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.encryptionKey) {
        const encryptedValue = await this.baseStorage.getItem(`enc_${key}`);
        if (encryptedValue) {
          return EncryptionService.simpleDecrypt(encryptedValue, this.encryptionKey);
        }
      } else {
        return await this.baseStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error(`Failed to retrieve encrypted item ${key}:`, error);
      return null;
    }
  }

  // Remove encrypted data
  async removeItem(key: string): Promise<void> {
    try {
      if (this.encryptionKey) {
        await this.baseStorage.removeItem(`enc_${key}`);
      } else {
        await this.baseStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to remove encrypted item ${key}:`, error);
    }
  }

  // Store encrypted object
  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Failed to store encrypted object ${key}:`, error);
      throw error;
    }
  }

  // Retrieve and decrypt object
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await this.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Failed to retrieve encrypted object ${key}:`, error);
      return null;
    }
  }
}