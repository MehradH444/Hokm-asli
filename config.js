/**
 * HOKM GAME - Configuration
 * تنظیمات اصلی بازی
 */

const CONFIG = {
    // App Info
    APP_NAME: 'حکم',
    APP_VERSION: '1.0.0',
    
    // API
    API_BASE_URL: 'https://api.hokm-game.ir/v1',
    API_TIMEOUT: 10000,
    
    // Authentication
    AUTH: {
        OTP_LENGTH: 6,
        OTP_EXPIRY: 600, // 10 minutes
        OTP_RESEND_COOLDOWN: 60, // 60 seconds
        SESSION_EXPIRY: 2592000, // 30 days
        GUEST_PREFIX: 'guest_'
    },
    
    // Phone
    PHONE: {
        COUNTRY_CODE: '+98',
        MIN_LENGTH: 10,
        MAX_LENGTH: 11,
        PATTERN: /^09\d{9}$/
    },
    
    // Storage Keys
    STORAGE_KEYS: {
        USER: 'hokm_user',
        SESSION: 'hokm_session',
        TOKEN: 'hokm_token',
        SETTINGS: 'hokm_settings',
        PROFILE: 'hokm_profile',
        CURRENCY: 'hokm_currency'
    },
    
    // UI
    UI: {
        TOAST_DURATION: 3000,
        ANIMATION_DURATION: 300,
        MAX_CONTENT_WIDTH: 600
    },
    
    // Game
    GAME: {
        MIN_PLAYERS: 2,
        MAX_PLAYERS: 4,
        CARDS_PER_PLAYER: 13,
        WINNING_SCORE: 7
    },
    
    // Currency
    CURRENCY: {
        INITIAL_COINS: 1000,
        INITIAL_GEMS: 0
    },
    
    // Debug
    DEBUG: false
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
