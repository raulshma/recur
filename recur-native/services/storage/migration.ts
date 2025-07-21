import { storage, secureStorage } from './index';
import { STORAGE_KEYS } from '@/constants/config';

// Storage version for migration tracking
const CURRENT_STORAGE_VERSION = 1;
const STORAGE_VERSION_KEY = 'storage_version';

export interface MigrationStep {
  version: number;
  description: string;
  migrate: () => Promise<void>;
}

// Migration utilities
export class StorageMigration {
  private static migrations: MigrationStep[] = [
    {
      version: 1,
      description: 'Initial storage setup',
      migrate: async () => {
        // Initial setup - no migration needed
        console.log('Storage initialized with version 1');
      },
    },
    // Future migrations can be added here
    // {
    //   version: 2,
    //   description: 'Add new storage keys',
    //   migrate: async () => {
    //     // Migration logic for version 2
    //   },
    // },
  ];

  // Run all necessary migrations
  static async runMigrations(): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      console.log(`Current storage version: ${currentVersion}`);

      for (const migration of this.migrations) {
        if (migration.version > currentVersion) {
          console.log(`Running migration: ${migration.description}`);
          await migration.migrate();
          await this.setCurrentVersion(migration.version);
          console.log(`Migration completed: v${migration.version}`);
        }
      }

      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error('Storage migration failed');
    }
  }

  // Get current storage version
  private static async getCurrentVersion(): Promise<number> {
    try {
      const version = await storage.getItem(STORAGE_VERSION_KEY);
      return version ? parseInt(version, 10) : 0;
    } catch (error) {
      console.error('Failed to get storage version:', error);
      return 0;
    }
  }

  // Set current storage version
  private static async setCurrentVersion(version: number): Promise<void> {
    try {
      await storage.setItem(STORAGE_VERSION_KEY, version.toString());
    } catch (error) {
      console.error('Failed to set storage version:', error);
      throw error;
    }
  }

  // Check if migration is needed
  static async isMigrationNeeded(): Promise<boolean> {
    try {
      const currentVersion = await this.getCurrentVersion();
      return currentVersion < CURRENT_STORAGE_VERSION;
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return true; // Assume migration is needed on error
    }
  }
}

// Storage cleanup utilities
export class StorageCleanup {
  // Clean up expired cache data
  static async cleanExpiredCache(): Promise<void> {
    try {
      const allKeys = await storage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      
      let cleanedCount = 0;
      
      for (const key of cacheKeys) {
        try {
          const cacheItem = await storage.getObject<{
            data: any;
            timestamp: number;
            expirationTime: number;
          }>(key);

          if (cacheItem && Date.now() > cacheItem.expirationTime) {
            await storage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // If we can't parse the cache item, remove it
          await storage.removeItem(key);
          cleanedCount++;
        }
      }

      console.log(`Cleaned ${cleanedCount} expired cache items`);
    } catch (error) {
      console.error('Failed to clean expired cache:', error);
    }
  }

  // Clean up old offline actions (older than 30 days)
  static async cleanOldOfflineActions(): Promise<void> {
    try {
      const actions = await storage.getObject<any[]>(STORAGE_KEYS.OFFLINE_QUEUE) || [];
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const filteredActions = actions.filter(action => 
        action.timestamp && action.timestamp > thirtyDaysAgo
      );

      if (filteredActions.length !== actions.length) {
        await storage.setObject(STORAGE_KEYS.OFFLINE_QUEUE, filteredActions);
        console.log(`Cleaned ${actions.length - filteredActions.length} old offline actions`);
      }
    } catch (error) {
      console.error('Failed to clean old offline actions:', error);
    }
  }

  // Remove orphaned data
  static async cleanOrphanedData(): Promise<void> {
    try {
      const allKeys = await storage.getAllKeys();
      const orphanedKeys: string[] = [];

      // Check for keys that don't match our expected patterns
      for (const key of allKeys) {
        if (!this.isValidStorageKey(key)) {
          orphanedKeys.push(key);
        }
      }

      // Remove orphaned keys
      for (const key of orphanedKeys) {
        await storage.removeItem(key);
      }

      if (orphanedKeys.length > 0) {
        console.log(`Cleaned ${orphanedKeys.length} orphaned data items`);
      }
    } catch (error) {
      console.error('Failed to clean orphaned data:', error);
    }
  }

  // Check if a storage key is valid
  private static isValidStorageKey(key: string): boolean {
    const validPrefixes = [
      'cache_',
      'enc_',
      STORAGE_VERSION_KEY,
      ...Object.values(STORAGE_KEYS),
    ];

    return validPrefixes.some(prefix => key.startsWith(prefix) || key === prefix);
  }

  // Run all cleanup operations
  static async runCleanup(): Promise<void> {
    console.log('Starting storage cleanup...');
    
    await Promise.all([
      this.cleanExpiredCache(),
      this.cleanOldOfflineActions(),
      this.cleanOrphanedData(),
    ]);

    console.log('Storage cleanup completed');
  }
}

// Storage backup and restore utilities
export class StorageBackup {
  // Create a backup of important data
  static async createBackup(): Promise<string> {
    try {
      const backup = {
        version: CURRENT_STORAGE_VERSION,
        timestamp: Date.now(),
        data: {
          settings: await storage.getObject(STORAGE_KEYS.APP_SETTINGS),
          // Note: We don't backup sensitive auth data for security
        },
      };

      return JSON.stringify(backup);
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error('Backup creation failed');
    }
  }

  // Restore from backup
  static async restoreFromBackup(backupData: string): Promise<void> {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup format');
      }

      // Restore settings
      if (backup.data.settings) {
        await storage.setObject(STORAGE_KEYS.APP_SETTINGS, backup.data.settings);
      }

      console.log('Backup restored successfully');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw new Error('Backup restoration failed');
    }
  }

  // Get storage usage statistics
  static async getStorageStats(): Promise<{
    totalKeys: number;
    cacheKeys: number;
    encryptedKeys: number;
    estimatedSize: number;
  }> {
    try {
      const allKeys = await storage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      const encryptedKeys = allKeys.filter(key => key.startsWith('enc_'));

      // Rough estimation of storage size
      let estimatedSize = 0;
      for (const key of allKeys.slice(0, 10)) { // Sample first 10 keys
        const value = await storage.getItem(key);
        if (value) {
          estimatedSize += key.length + value.length;
        }
      }
      estimatedSize = Math.round((estimatedSize / 10) * allKeys.length); // Extrapolate

      return {
        totalKeys: allKeys.length,
        cacheKeys: cacheKeys.length,
        encryptedKeys: encryptedKeys.length,
        estimatedSize,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalKeys: 0,
        cacheKeys: 0,
        encryptedKeys: 0,
        estimatedSize: 0,
      };
    }
  }
}