/**
 * HOKM GAME - Storage Manager
 * مدیریت ذخیره‌سازی محلی با رمزنگاری
 */

class StorageManager {
    constructor() {
        this.prefix = 'hokm_';
        this.isAvailable = this.checkAvailability();
    }
    
    /**
     * بررسی دسترسی به localStorage
     */
    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage not available');
            return false;
        }
    }
    
    /**
     * ذخیره داده
     */
    set(key, value, encrypt = false) {
        if (!this.isAvailable) {
            console.warn('Storage not available');
            return false;
        }
        
        try {
            const fullKey = this.prefix + key;
            const data = JSON.stringify(value);
            
            if (encrypt) {
                // Simple encryption for sensitive data
                const encrypted = btoa(unescape(encodeURIComponent(data)));
                localStorage.setItem(fullKey, encrypted);
            } else {
                localStorage.setItem(fullKey, data);
            }
            
            eventBus.emit(EVENTS.STORAGE.SAVED, { key, value });
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }
    
    /**
     * دریافت داده
     */
    get(key, decrypt = false) {
        if (!this.isAvailable) {
            return null;
        }
        
        try {
            const fullKey = this.prefix + key;
            const data = localStorage.getItem(fullKey);
            
            if (!data) {
                return null;
            }
            
            let parsed;
            if (decrypt) {
                const decrypted = decodeURIComponent(escape(atob(data)));
                parsed = JSON.parse(decrypted);
            } else {
                parsed = JSON.parse(data);
            }
            
            eventBus.emit(EVENTS.STORAGE.LOADED, { key, value: parsed });
            return parsed;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }
    
    /**
     * حذف داده
     */
    remove(key) {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }
    
    /**
     * پاک کردن همه داده‌ها
     */
    clear() {
        if (!this.isAvailable) {
            return false;
        }
        
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
            
            eventBus.emit(EVENTS.STORAGE.CLEARED);
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
    
    /**
     * بررسی وجود کلید
     */
    has(key) {
        if (!this.isAvailable) {
            return false;
        }
        
        const fullKey = this.prefix + key;
        return localStorage.getItem(fullKey) !== null;
    }
    
    /**
     * دریافت همه کلیدها
     */
    keys() {
        if (!this.isAvailable) {
            return [];
        }
        
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.replace(this.prefix, ''));
    }
    
    /**
     * ذخیره با تاریخ انقضا
     */
    setWithExpiry(key, value, ttl) {
        const now = new Date().getTime();
        const item = {
            value: value,
            expiry: now + ttl
        };
        return this.set(key, item);
    }
    
    /**
     * دریافت با بررسی انقضا
     */
    getWithExpiry(key) {
        const item = this.get(key);
        
        if (!item) {
            return null;
        }
        
        if (item.expiry && new Date().getTime() > item.expiry) {
            this.remove(key);
            return null;
        }
        
        return item.value;
    }
}

// Global instance
const storage = new StorageManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, storage };
} else {
    window.StorageManager = StorageManager;
    window.storage = storage;
}
