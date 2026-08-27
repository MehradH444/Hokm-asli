/**
 * HOKM GAME - OTP Manager
 * مدیریت کد تأیید
 */

class OTPManager {
    constructor() {
        this.inputs = [];
        this.currentIndex = 0;
        this.timer = null;
        this.countdown = 0;
        this.phone = null;
        
        this.init();
    }
    
    /**
     * راه‌اندازی
     */
    init() {
        this.setupInputs();
        this.setupButtons();
    }
    
    /**
     * تنظیم input ها
     */
    setupInputs() {
        this.inputs = Array.from(document.querySelectorAll('.code-input'));
        
        this.inputs.forEach((input, index) => {
            // Input event
            input.addEventListener('input', (e) => this.handleInput(e, index));
            
            // Keydown event
            input.addEventListener('keydown', (e) => this.handleKeydown(e, index));
            
            // Focus event
            input.addEventListener('focus', (e) => e.target.select());
            
            // Paste event
            input.addEventListener('paste', (e) => this.handlePaste(e));
        });
    }
    
    /**
     * تنظیم دکمه‌ها
     */
    setupButtons() {
        const verifyBtn = document.getElementById('btn-verify-code');
        const resendBtn = document.getElementById('btn-resend');
        const changePhoneBtn = document.getElementById('btn-change-phone');
        
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.verify());
        }
        
        if (resendBtn) {
            resendBtn.addEventListener('click', () => this.resend());
        }
        
        if (changePhoneBtn) {
            changePhoneBtn.addEventListener('click', () => this.changePhone());
        }
    }
    
    /**
     * شروع OTP
     */
    start(phone, otp) {
        this.phone = phone;
        this.countdown = CONFIG.AUTH.OTP_RESEND_COOLDOWN;
        
        // نمایش شماره
        const displayPhone = document.getElementById('display-phone');
        if (displayPhone) {
            displayPhone.textContent = Utils.toPersianNumber(phone);
        }
        
        // پاک کردن input ها
        this.clearInputs();
        
        // شروع تایمر
        this.startTimer();
        
        // فوکوس روی اولین input
        setTimeout(() => {
            this.inputs[0]?.focus();
        }, 300);
        
        // نمایش مودال اجازه (اختیاری)
        this.showPermissionModal(otp);
    }
    
    /**
     * مدیریت input
     */
    handleInput(e, index) {
        const value = e.target.value;
        
        // فقط اعداد
        if (!/^\d*$/.test(value)) {
            e.target.value = '';
            return;
        }
        
        if (value.length === 1) {
            e.target.classList.add('filled');
            
            // رفتن به input بعدی
            if (index < this.inputs.length - 1) {
                this.inputs[index + 1].focus();
            }
            
            // بررسی تکمیل
            this.checkComplete();
        }
    }
    
    /**
     * مدیریت keydown
     */
    handleKeydown(e, index) {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            this.inputs[index - 1].focus();
            this.inputs[index - 1].value = '';
            this.inputs[index - 1].classList.remove('filled');
        }
    }
    
    /**
     * مدیریت paste
     */
    handlePaste(e) {
        e.preventDefault();
        
        const pastedData = e.clipboardData.getData('text').trim();
        
        if (!/^\d{6}$/.test(pastedData)) {
            Utils.showToast('کد باید ۶ رقم باشد', 'error');
            return;
        }
        
        const digits = pastedData.split('');
        
        digits.forEach((digit, index) => {
            if (this.inputs[index]) {
                this.inputs[index].value = digit;
                this.inputs[index].classList.add('filled');
            }
        });
        
        this.checkComplete();
    }
    
    /**
     * بررسی تکمیل کد
     */
    checkComplete() {
        const code = this.getCode();
        
        if (code.length === 6) {
            // تأیید خودکار بعد از 300ms
            setTimeout(() => this.verify(), 300);
        }
    }
    
    /**
     * دریافت کد وارد شده
     */
    getCode() {
        return this.inputs.map(input => input.value).join('');
    }
    
    /**
     * تأیید کد
     */
    async verify() {
        const code = this.getCode();
        
        if (code.length !== 6) {
            Utils.showToast('لطفاً کد ۶ رقمی را وارد کنید', 'error');
            this.shakeInputs();
            return;
        }
        
        const result = await authManager.verifyOTP(this.phone, code);
        
        if (result.success) {
            this.stopTimer();
            // انتقال به صفحه اصلی توسط app.js
        } else {
            Utils.showToast(result.message, 'error');
            this.shakeInputs();
            this.clearInputs();
            this.inputs[0].focus();
        }
    }
    
    /**
     * ارسال مجدد
     */
    async resend() {
        if (this.countdown > 0) {
            return;
        }
        
        const result = await authManager.resendOTP(this.phone);
        
        if (result.success) {
            this.countdown = CONFIG.AUTH.OTP_RESEND_COOLDOWN;
            this.startTimer();
            this.clearInputs();
            this.inputs[0].focus();
            Utils.showToast('کد جدید ارسال شد', 'success');
        } else {
            Utils.showToast(result.message, 'error');
        }
    }
    
    /**
     * تغییر شماره
     */
    changePhone() {
        this.stopTimer();
        eventBus.emit(EVENTS.UI.SCREEN_CHANGE, 'login-screen');
    }
    
    /**
     * شروع تایمر
     */
    startTimer() {
        this.stopTimer();
        
        const countdownEl = document.getElementById('countdown');
        const timerDisplay = document.getElementById('timer-display');
        const resendBtn = document.getElementById('btn-resend');
        
        if (timerDisplay) timerDisplay.style.display = 'flex';
        if (resendBtn) resendBtn.classList.add('disabled');
        
        this.timer = setInterval(() => {
            this.countdown--;
            
            if (countdownEl) {
                countdownEl.textContent = Utils.toPersianNumber(this.countdown);
            }
            
            if (this.countdown <= 0) {
                this.stopTimer();
                
                if (timerDisplay) timerDisplay.style.display = 'none';
                if (resendBtn) resendBtn.classList.remove('disabled');
            }
        }, 1000);
    }
    
    /**
     * توقف تایمر
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    /**
     * پاک کردن input ها
     */
    clearInputs() {
        this.inputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled');
        });
    }
    
    /**
     * انیمیشن shake
     */
    shakeInputs() {
        const container = document.getElementById('code-inputs');
        if (container) {
            container.style.animation = 'shake 0.5s';
            setTimeout(() => {
                container.style.animation = '';
            }, 500);
        }
    }
    
    /**
     * نمایش مودال اجازه
     */
    showPermissionModal(otp) {
        const modal = document.getElementById('permission-modal');
        const codeDisplay = document.getElementById('modal-code');
        const grantBtn = document.getElementById('btn-grant-permission');
        const denyBtn = document.getElementById('btn-deny-permission');
        
        if (!modal) return;
        
        if (codeDisplay) {
            codeDisplay.textContent = `کد تأیید: ${Utils.toPersianNumber(otp)}`;
        }
        
        modal.classList.add('active');
        
        const handleGrant = () => {
            modal.classList.remove('active');
            cleanup();
        };
        
        const handleDeny = () => {
            modal.classList.remove('active');
            cleanup();
        };
        
        const cleanup = () => {
            grantBtn?.removeEventListener('click', handleGrant);
            denyBtn?.removeEventListener('click', handleDeny);
        };
        
        grantBtn?.addEventListener('click', handleGrant);
        denyBtn?.addEventListener('click', handleDeny);
    }
}

// Global instance
const otpManager = new OTPManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OTPManager, otpManager };
} else {
    window.OTPManager = OTPManager;
    window.otpManager = otpManager;
}
