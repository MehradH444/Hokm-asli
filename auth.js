/**
 * HOKM GAME - Authentication System
 * سیستم احراز هویت
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.session = null;
        this.isLoading = false;
        
        this.init();
    }
    
    /**
     * راه‌اندازی اولیه
     */
    init() {
        // بررسی session موجود
        this.checkExistingSession();
        
        // ثبت event listeners
        this.setupEventListeners();
    }
    
    /**
     * بررسی session موجود
     */
    checkExistingSession() {
        const session = storage.get(CONFIG.STORAGE_KEYS.SESSION);
        
        if (session && session.token && session.expiry > Date.now()) {
            this.session = session;
            this.currentUser = storage.get(CONFIG.STORAGE_KEYS.USER);
            
            eventBus.emit(EVENTS.AUTH.LOGIN_SUCCESS, {
                user: this.currentUser,
                session: this.session
            });
            
            return true;
        }
        
        // Session منقضی شده
        if (session) {
            this.clearSession();
            eventBus.emit(EVENTS.AUTH.SESSION_EXPIRED);
        }
        
        return false;
    }
    
    /**
     * ثبت event listeners
     */
    setupEventListeners() {
        // OTP sent
        eventBus.on(EVENTS.AUTH.OTP_SENT, (data) => {
            Utils.showToast('کد تأیید ارسال شد', 'success');
        });
        
        // OTP verified
        eventBus.on(EVENTS.AUTH.OTP_VERIFIED, (data) => {
            Utils.showToast('ورود موفقیت‌آمیز بود', 'success');
        });
        
        // Login failed
        eventBus.on(EVENTS.AUTH.LOGIN_FAILED, (data) => {
            Utils.showToast(data.message || 'خطا در ورود', 'error');
        });
    }
    
    /**
     * ورود با شماره موبایل
     */
    async loginWithPhone(phone) {
        if (this.isLoading) {
            return { success: false, message: 'لطفاً صبر کنید' };
        }
        
        // اعتبارسنجی
        if (!Utils.validatePhone(phone)) {
            return { success: false, message: 'شماره موبایل معتبر نیست' };
        }
        
        this.isLoading = true;
        eventBus.emit(EVENTS.UI.LOADING_START);
        
        try {
            // تولید OTP (در production از API استفاده می‌شود)
            const otp = Utils.generateOTP(CONFIG.AUTH.OTP_LENGTH);
            
            // ذخیره موقت
            const tempData = {
                phone: phone,
                otp: otp,
                timestamp: Date.now(),
                expiry: Date.now() + (CONFIG.AUTH.OTP_EXPIRY * 1000)
            };
            
            storage.set('temp_otp', tempData, true);
            
            eventBus.emit(EVENTS.AUTH.OTP_SENT, { phone, otp });
            
            return { 
                success: true, 
                phone: phone,
                otp: otp // فقط برای debug
            };
        } catch (error) {
            console.error('Login error:', error);
            eventBus.emit(EVENTS.AUTH.LOGIN_FAILED, { message: 'خطا در ارسال کد' });
            return { success: false, message: 'خطا در ارسال کد' };
        } finally {
            this.isLoading = false;
            eventBus.emit(EVENTS.UI.LOADING_END);
        }
    }
    
    /**
     * تأیید OTP
     */
    async verifyOTP(phone, otp) {
        if (this.isLoading) {
            return { success: false, message: 'لطفاً صبر کنید' };
        }
        
        this.isLoading = true;
        eventBus.emit(EVENTS.UI.LOADING_START);
        
        try {
            const tempData = storage.get('temp_otp', true);
            
            if (!tempData) {
                throw new Error('کد منقضی شده است');
            }
            
            if (tempData.phone !== phone) {
                throw new Error('شماره موبایل مطابقت ندارد');
            }
            
            if (Date.now() > tempData.expiry) {
                storage.remove('temp_otp');
                throw new Error('کد منقضی شده است');
            }
            
            if (tempData.otp !== otp) {
                throw new Error('کد وارد شده صحیح نیست');
            }
            
            // ایجاد کاربر جدید یا دریافت کاربر موجود
            const user = await this.getOrCreateUser(phone);
            
            // ایجاد session
            const session = this.createSession(user);
            
            // ذخیره
            storage.set(CONFIG.STORAGE_KEYS.USER, user);
            storage.set(CONFIG.STORAGE_KEYS.SESSION, session);
            storage.set(CONFIG.STORAGE_KEYS.TOKEN, session.token, true);
            
            // پاک کردن OTP موقت
            storage.remove('temp_otp');
            
            this.currentUser = user;
            this.session = session;
            
            eventBus.emit(EVENTS.AUTH.OTP_VERIFIED, { user, session });
            
            return { success: true, user, session };
        } catch (error) {
            console.error('OTP verification error:', error);
            eventBus.emit(EVENTS.AUTH.LOGIN_FAILED, { message: error.message });
            return { success: false, message: error.message };
        } finally {
            this.isLoading = false;
            eventBus.emit(EVENTS.UI.LOADING_END);
        }
    }
    
    /**
     * دریافت یا ایجاد کاربر
     */
    async getOrCreateUser(phone) {
        // در production از API استفاده می‌شود
        const existingUser = storage.get(`user_${phone}`);
        
        if (existingUser) {
            return existingUser;
        }
        
        // ایجاد کاربر جدید
        const user = {
            id: Utils.generateUUID(),
            phone: phone,
            username: `Player${Utils.randomInt(1000, 9999)}`,
            isGuest: false,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            profile: {
                avatar: 1,
                frame: 1,
                title: 1,
                level: 1,
                xp: 0,
                coins: CONFIG.CURRENCY.INITIAL_COINS,
                gems: CONFIG.CURRENCY.INITIAL_GEMS,
                rating: 1000,
                league: 1,
                stats: {
                    totalGames: 0,
                    wins: 0,
                    losses: 0,
                    tricksWon: 0,
                    kotCount: 0,
                    bestStreak: 0
                }
            }
        };
        
        storage.set(`user_${phone}`, user);
        return user;
    }
    
    /**
     * ایجاد session
     */
    createSession(user) {
        const token = Utils.generateUUID() + Utils.generateUUID();
        const expiry = Date.now() + (CONFIG.AUTH.SESSION_EXPIRY * 1000);
        
        return {
            token: token,
            userId: user.id,
            phone: user.phone,
            createdAt: Date.now(),
            expiry: expiry,
            device: navigator.userAgent
        };
    }
    
    /**
     * ورود به عنوان مهمان
     */
    async loginAsGuest() {
        if (this.isLoading) {
            return { success: false, message: 'لطفاً صبر کنید' };
        }
        
        this.isLoading = true;
        eventBus.emit(EVENTS.UI.LOADING_START);
        
        try {
            const guestId = CONFIG.AUTH.GUEST_PREFIX + Utils.generateUUID();
            
            const user = {
                id: guestId,
                phone: null,
                username: `Guest${Utils.randomInt(1000, 9999)}`,
                isGuest: true,
                createdAt: Date.now(),
                lastLogin: Date.now(),
                profile: {
                    avatar: 1,
                    frame: 1,
                    title: 1,
                    level: 1,
                    xp: 0,
                    coins: CONFIG.CURRENCY.INITIAL_COINS,
                    gems: CONFIG.CURRENCY.INITIAL_GEMS,
                    rating: 1000,
                    league: 1,
                    stats: {
                        totalGames: 0,
                        wins: 0,
                        losses: 0,
                        tricksWon: 0,
                        kotCount: 0,
                        bestStreak: 0
                    }
                }
            };
            
            const session = this.createSession(user);
            
            storage.set(CONFIG.STORAGE_KEYS.USER, user);
            storage.set(CONFIG.STORAGE_KEYS.SESSION, session);
            
            this.currentUser = user;
            this.session = session;
            
            eventBus.emit(EVENTS.AUTH.GUEST_LOGIN, { user, session });
            
            return { success: true, user, session };
        } catch (error) {
            console.error('Guest login error:', error);
            return { success: false, message: 'خطا در ورود' };
        } finally {
            this.isLoading = false;
            eventBus.emit(EVENTS.UI.LOADING_END);
        }
    }
    
    /**
     * خروج
     */
    logout() {
        this.clearSession();
        eventBus.emit(EVENTS.AUTH.LOGOUT);
    }
    
    /**
     * پاک کردن session
     */
    clearSession() {
        storage.remove(CONFIG.STORAGE_KEYS.USER);
        storage.remove(CONFIG.STORAGE_KEYS.SESSION);
        storage.remove(CONFIG.STORAGE_KEYS.TOKEN);
        
        this.currentUser = null;
        this.session = null;
    }
    
    /**
     * بررسی لاگین بودن
     */
    isLoggedIn() {
        return this.currentUser !== null && this.session !== null;
    }
    
    /**
     * دریافت کاربر فعلی
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * دریافت session
     */
    getSession() {
        return this.session;
    }
    
    /**
     * ارسال مجدد OTP
     */
    async resendOTP(phone) {
        const tempData = storage.get('temp_otp', true);
        
        if (tempData && tempData.phone === phone) {
            const timeSinceLastSend = Date.now() - tempData.timestamp;
            const cooldown = CONFIG.AUTH.OTP_RESEND_COOLDOWN * 1000;
            
            if (timeSinceLastSend < cooldown) {
                const remaining = Math.ceil((cooldown - timeSinceLastSend) / 1000);
                return { 
                    success: false, 
                    message: `لطفاً ${remaining} ثانیه صبر کنید` 
                };
            }
        }
        
        // تولید OTP جدید
        return await this.loginWithPhone(phone);
    }
}

// Global instance
const authManager = new AuthManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, authManager };
} else {
    window.AuthManager = AuthManager;
    window.authManager = authManager;
}
