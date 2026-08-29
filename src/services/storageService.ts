const memoryStorage: Record<string, string> = {};

const getStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Test storage availability
      window.localStorage.setItem('__mtams_test__', '1');
      window.localStorage.removeItem('__mtams_test__');
      return window.localStorage;
    }
  } catch (e) {
    // blocked or unavailable
  }

  return {
    getItem: (key: string) => memoryStorage[key] || null,
    setItem: (key: string, value: string) => { memoryStorage[key] = value; },
    removeItem: (key: string) => { delete memoryStorage[key]; },
    clear: () => {
      for (const key in memoryStorage) {
        delete memoryStorage[key];
      }
    }
  };
};

const storage = getStorage();

export const storageService = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading storage key "${key}":`, error);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage key "${key}":`, error);
    }
  },

  update<T>(key: string, updater: (val: T) => T, defaultValue: T): void {
    try {
      const current = this.get<T>(key, defaultValue);
      const updated = updater(current);
      this.set<T>(key, updated);
    } catch (error) {
      console.error(`Error updating storage key "${key}":`, error);
    }
  },

  remove(key: string): void {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
    }
  },

  clear(): void {
    try {
      storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};
