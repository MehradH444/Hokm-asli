/**
 * HOKM GAME - Event System
 * سیستم رویداد مرکزی برای ارتباط بین ماژول‌ها
 */

class EventBus {
    constructor() {
        this.events = new Map();
    }
    
    /**
     * ثبت شنونده رویداد
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);
        
        return () => this.off(event, callback);
    }
    
    /**
     * ثبت شنونده یک‌بار مصرف
     */
    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }
    
    /**
     * حذف شنونده
     */
    off(event, callback) {
        if (this.events.has(event)) {
            this.events.get(event).delete(callback);
        }
    }
    
    /**
     * انتشار رویداد
     */
    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event handler error for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * حذف همه شنوندگان یک رویداد
     */
    clear(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }
    
    /**
     * تعداد شنوندگان یک رویداد
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).size : 0;
    }
}

// Global event bus
const eventBus = new EventBus();

// Event names constant
const EVENTS = {
    // Auth Events
    AUTH: {
        LOGIN_STARTED: 'auth:login_started',
        LOGIN_SUCCESS: 'auth:login_success',
        LOGIN_FAILED: 'auth:login_failed',
        LOGOUT: 'auth:logout',
        OTP_SENT: 'auth:otp_sent',
        OTP_VERIFIED: 'auth:otp_verified',
        OTP_FAILED: 'auth:otp_failed',
        GUEST_LOGIN: 'auth:guest_login',
        SESSION_EXPIRED: 'auth:session_expired'
    },
    
    // UI Events
    UI: {
        SCREEN_CHANGE: 'ui:screen_change',
        PAGE_CHANGE: 'ui:page_change',
        MODAL_OPEN: 'ui:modal_open',
        MODAL_CLOSE: 'ui:modal_close',
        TOAST_SHOW: 'ui:toast_show',
        LOADING_START: 'ui:loading_start',
        LOADING_END: 'ui:loading_end'
    },
    
    // Profile Events
    PROFILE: {
        UPDATED: 'profile:updated',
        LEVEL_UP: 'profile:level_up',
        COINS_CHANGED: 'profile:coins_changed',
        GEMS_CHANGED: 'profile:gems_changed'
    },
    
    // Game Events
    GAME: {
        STARTED: 'game:started',
        ENDED: 'game:ended',
        TURN_CHANGED: 'game:turn_changed',
        CARD_PLAYED: 'game:card_played',
        TRICK_WON: 'game:trick_won',
        MATCH_WON: 'game:match_won',
        MATCH_LOST: 'game:match_lost'
    },
    
    // Network Events
    NETWORK: {
        ONLINE: 'network:online',
        OFFLINE: 'network:offline',
        RECONNECTING: 'network:reconnecting',
        RECONNECTED: 'network:reconnected'
    },
    
    // Storage Events
    STORAGE: {
        SAVED: 'storage:saved',
        LOADED: 'storage:loaded',
        CLEARED: 'storage:cleared'
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, eventBus, EVENTS };
} else {
    window.EventBus = EventBus;
    window.eventBus = eventBus;
    window.EVENTS = EVENTS;
}
