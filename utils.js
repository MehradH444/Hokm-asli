/**
 * HOKM GAME - Utility Functions
 * توابع کمکی
 */

const Utils = {
    /**
     * تبدیل اعداد انگلیسی به فارسی
     */
    toPersianNumber(num) {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, digit => persianDigits[digit]);
    },
    
    /**
     * تبدیل اعداد فارسی به انگلیسی
     */
    toEnglishNumber(str) {
        const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, //g, /۸/g, /۹/g];
        const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        
        let result = str;
        persianDigits.forEach((regex, index) => {
            result = result.replace(regex, englishDigits[index]);
        });
        
        return result;
    },
    
    /**
     * فرمت شماره موبایل
     */
    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length <= 3) {
            return cleaned;
        } else if (cleaned.length <= 7) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        } else {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7, 11)}`;
        }
    },
    
    /**
     * اعتبارسنجی شماره موبایل ایران
     */
    validatePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return CONFIG.PHONE.PATTERN.test(cleaned);
    },
    
    /**
     * تولید کد OTP تصادفی
     */
    generateOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        
        return otp;
    },
    
    /**
     * تولید UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    /**
     * فرمت عدد با جداکننده
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    /**
     * تبدیل timestamp به تاریخ شمسی
     */
    toShamsiDate(timestamp) {
        const date = new Date(timestamp);
        // Simple conversion (for production use a library like moment-jalaali)
        return date.toLocaleDateString('fa-IR');
    },
    
    /**
     * debounce
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * throttle
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * deep clone
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * random integer
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * shuffle array
     */
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },
    
    /**
     * show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    /**
     * confirm dialog
     */
    confirm(message) {
        return window.confirm(message);
    },
    
    /**
     * copy to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('کپی شد', 'success');
            return true;
        } catch (error) {
            console.error('Copy failed:', error);
            return false;
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}
