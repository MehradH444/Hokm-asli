/**
 * HOKM GAME - Main Application Controller
 * کنترلر اصلی برنامه
 */

class App {
    constructor() {
        this.currentScreen = 'splash-screen';
        this.currentPage = 'home';
        
        this.init();
    }
    
    /**
     * راه‌اندازی
     */
    init() {
        console.log('🎮 Hokm Game Initializing...');
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup auth buttons
        this.setupAuthButtons();
        
        // Setup main app buttons
        this.setupMainAppButtons();
        
        // Check existing session
        this.checkSession();
        
        console.log('✅ App Ready');
    }
    
    /**
     * بررسی session موجود
     */
    checkSession() {
        if (authManager.isLoggedIn()) {
            this.showMainApp();
        }
    }
    
    /**
     * تنظیم navigation
     */
    setupNavigation() {
        // Back buttons
        const backToSplash = document.getElementById('back-to-splash');
        const backToLogin = document.getElementById('back-to-login');
        
        if (backToSplash) {
            backToSplash.addEventListener('click', () => {
                this.showScreen('splash-screen');
            });
        }
        
        if (backToLogin) {
            backToLogin.addEventListener('click', () => {
                this.showScreen('login-screen');
            });
        }
        
        // Bottom navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.dataset.page;
                if (page) {
                    this.showPage(page);
                }
            });
        });
        
        // Listen to screen change events
        eventBus.on(EVENTS.UI.SCREEN_CHANGE, (screenId) => {
            this.showScreen(screenId);
        });
        
        eventBus.on(EVENTS.UI.PAGE_CHANGE, (pageId) => {
            this.showPage(pageId);
        });
    }
    
    /**
     * تنظیم دکمه‌های احراز هویت
     */
    setupAuthButtons() {
        // Phone login button
        const phoneLoginBtn = document.getElementById('btn-phone-login');
        if (phoneLoginBtn) {
            phoneLoginBtn.addEventListener('click', () => {
                this.showScreen('login-screen');
            });
        }
        
        // Guest login button
        const guestLoginBtn = document.getElementById('btn-guest-login');
        if (guestLoginBtn) {
            guestLoginBtn.addEventListener('click', async () => {
                const result = await authManager.loginAsGuest();
                
                if (result.success) {
                    this.showMainApp();
                } else {
                    Utils.showToast(result.message, 'error');
                }
            });
        }
        
        // Send code button
        const sendCodeBtn = document.getElementById('btn-send-code');
        if (sendCodeBtn) {
            sendCodeBtn.addEventListener('click', async () => {
                await this.handleSendCode();
            });
        }
        
        // Phone input formatting
        const phoneInput = document.getElementById('phone-input');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length > 3 && value.length <= 7) {
                    value = `${value.slice(0, 3)} ${value.slice(3)}`;
                } else if (value.length > 7) {
                    value = `${value.slice(0, 3)} ${value.slice(3, 7)} ${value.slice(7, 11)}`;
                }
                
                e.target.value = value;
            });
            
            phoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSendCode();
                }
            });
        }
    }
    
    /**
     * مدیریت ارسال کد
     */
    async handleSendCode() {
        const phoneInput = document.getElementById('phone-input');
        if (!phoneInput) return;
        
        const phone = phoneInput.value.replace(/\s/g, '');
        
        const result = await authManager.loginWithPhone(phone);
        
        if (result.success) {
            this.showScreen('otp-screen');
            
            // Start OTP process
            setTimeout(() => {
                otpManager.start(result.phone, result.otp);
            }, 300);
        } else {
            Utils.showToast(result.message, 'error');
        }
    }
    
    /**
     * تنظیم دکمه‌های برنامه اصلی
     */
    setupMainAppButtons() {
        // Profile button
        const profileBtn = document.getElementById('btn-profile');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                this.showPage('profile');
            });
        }
        
        // Settings button
        const settingsBtn = document.getElementById('btn-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showPage('settings');
            });
        }
        
        // Notifications button
        const notifBtn = document.getElementById('btn-notifications');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                Utils.showToast('اعلان‌ها به زودی', 'info');
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (Utils.confirm('آیا می‌خواهید خارج شوید؟')) {
                    authManager.logout();
                    this.showScreen('splash-screen');
                }
            });
        }
        
        // Listen to auth events
        eventBus.on(EVENTS.AUTH.LOGIN_SUCCESS, () => {
            this.showMainApp();
            this.updateUserProfile();
        });
        
        eventBus.on(EVENTS.AUTH.GUEST_LOGIN, () => {
            this.showMainApp();
            this.updateUserProfile();
        });
        
        eventBus.on(EVENTS.AUTH.LOGOUT, () => {
            this.showScreen('splash-screen');
        });
    }
    
    /**
     * نمایش صفحه اصلی
     */
    showMainApp() {
        this.showScreen('main-screen');
        this.showPage('home');
        this.updateUserProfile();
    }
    
    /**
     * تغییر صفحه
     */
    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            eventBus.emit(EVENTS.UI.SCREEN_CHANGE, screenId);
        }
    }
    
    /**
     * تغییر صفحه داخلی
     */
    showPage(pageId) {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active-page');
        });
        
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active-page');
            this.currentPage = pageId;
            
            // Update nav
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.dataset.page === pageId) {
                    item.classList.add('active');
                }
            });
            
            eventBus.emit(EVENTS.UI.PAGE_CHANGE, pageId);
        }
    }
    
    /**
     * به‌روزرسانی پروفایل کاربر
     */
    updateUserProfile() {
        const user = authManager.getCurrentUser();
        if (!user) return;
        
        // Header
        const headerUsername = document.getElementById('header-username');
        const headerLevel = document.getElementById('header-level');
        const headerCoins = document.getElementById('header-coins');
        
        if (headerUsername) {
            headerUsername.textContent = user.username;
        }
        
        if (headerLevel) {
            headerLevel.textContent = `سطح ${Utils.toPersianNumber(user.profile.level)}`;
        }
        
        if (headerCoins) {
            headerCoins.textContent = Utils.toPersianNumber(Utils.formatNumber(user.profile.coins));
        }
        
        // Profile page
        const profileUsername = document.getElementById('profile-username');
        const profileLevel = document.getElementById('profile-level');
        const statGames = document.getElementById('stat-games');
        const statWins = document.getElementById('stat-wins');
        const statWinrate = document.getElementById('stat-winrate');
        const statRating = document.getElementById('stat-rating');
        
        if (profileUsername) {
            profileUsername.textContent = user.username;
        }
        
        if (profileLevel) {
            profileLevel.textContent = Utils.toPersianNumber(user.profile.level);
        }
        
        if (statGames) {
            statGames.textContent = Utils.toPersianNumber(user.profile.stats.totalGames);
        }
        
        if (statWins) {
            statWins.textContent = Utils.toPersianNumber(user.profile.stats.wins);
        }
        
        if (statWinrate) {
            const winrate = user.profile.stats.totalGames > 0 
                ? Math.round((user.profile.stats.wins / user.profile.stats.totalGames) * 100)
                : 0;
            statWinrate.textContent = `${Utils.toPersianNumber(winrate)}%`;
        }
        
        if (statRating) {
            statRating.textContent = Utils.toPersianNumber(user.profile.rating);
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new App();
    });
} else {
    window.app = new App();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} else {
    window.App = App;
}
