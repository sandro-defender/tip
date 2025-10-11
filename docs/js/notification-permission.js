<!--
Project: Tip Tracker
File: notification-permission.js
Version: 1.0
Author: Cursor AI
Model: Claude 3.5 Sonnet
Last Modified: 2025-01-27
Purpose: Notification permission modal with skipable option for PWA mode only
-->

class NotificationPermissionManager {
    static VERSION = '1.0';

    constructor(options = {}) {
        console.log(`NotificationPermissionManager v${NotificationPermissionManager.VERSION} initialized`);

        this.options = {
            autoShow: true,
            showDelay: 2000,
            position: 'center',
            primaryColor: '#6366f1',
            secondaryColor: '#3b82f6',
            textColor: 'white',
            ...options
        };

        this.isPWA = this.detectPWA();
        this.permissionState = this.getPermissionState();
        
        this.createStyles();
        this.init();
    }

    /**
     * Detect if app is running in PWA mode
     * @returns {boolean} True if running as PWA
     */
    detectPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }

    /**
     * Get current notification permission state
     * @returns {string} Permission state
     */
    getPermissionState() {
        if ('Notification' in window) {
            return Notification.permission;
        }
        return 'denied';
    }

    /**
     * Check if we should show the permission modal
     * @returns {boolean} True if should show
     */
    shouldShowModal() {
        // Only show in PWA mode
        if (!this.isPWA) {
            console.log('NotificationPermissionManager: Not in PWA mode, skipping notification permission request');
            return false;
        }

        // Don't show if already granted or denied
        if (this.permissionState === 'granted' || this.permissionState === 'denied') {
            console.log('NotificationPermissionManager: Permission already handled:', this.permissionState);
            return false;
        }

        // Check if user previously skipped
        const skipData = localStorage.getItem('notification-permission-skipped');
        if (skipData) {
            const skipTime = parseInt(skipData, 10);
            const hoursSinceSkip = (Date.now() - skipTime) / (1000 * 60 * 60);
            
            // Show again after 24 hours
            if (hoursSinceSkip < 24) {
                console.log('NotificationPermissionManager: User skipped recently, not showing');
                return false;
            } else {
                // Clear old skip data
                localStorage.removeItem('notification-permission-skipped');
            }
        }

        return true;
    }

    /**
     * Create and inject CSS styles
     */
    createStyles() {
        const existingStyle = document.getElementById('notification-permission-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'notification-permission-styles';

        style.textContent = `
            .notification-permission-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2147483647;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                backdrop-filter: blur(4px);
            }

            .notification-permission-modal.show {
                opacity: 1;
                visibility: visible;
            }

            .notification-permission-content {
                background: var(--surface, #ffffff);
                color: var(--text, #374151);
                border-radius: 16px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                margin: 20px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                transform: scale(0.9) translateY(20px);
                transition: transform 0.3s ease;
                position: relative;
            }

            .notification-permission-modal.show .notification-permission-content {
                transform: scale(1) translateY(0);
            }

            .notification-permission-header {
                text-align: center;
                margin-bottom: 20px;
            }

            .notification-permission-icon {
                width: 64px;
                height: 64px;
                margin: 0 auto 16px;
                background: linear-gradient(135deg, var(--primary, #6366f1), var(--secondary, #3b82f6));
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            .notification-permission-title {
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 8px 0;
                color: var(--text, #374151);
            }

            .notification-permission-description {
                font-size: 14px;
                line-height: 1.5;
                color: var(--text, #6b7280);
                margin: 0;
            }

            .notification-permission-buttons {
                display: flex;
                gap: 12px;
                margin-top: 24px;
            }

            .notification-permission-btn {
                flex: 1;
                padding: 12px 16px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .notification-permission-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: 0.5s;
            }

            .notification-permission-btn:hover::before {
                left: 100%;
            }

            .notification-permission-btn.primary {
                background: linear-gradient(135deg, var(--primary, #6366f1), var(--secondary, #3b82f6));
                color: white;
            }

            .notification-permission-btn.primary:hover {
                background: linear-gradient(135deg, #4f46e5, #2563eb);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }

            .notification-permission-btn.secondary {
                background: transparent;
                color: var(--text, #6b7280);
                border: 1px solid var(--border, #e5e7eb);
            }

            .notification-permission-btn.secondary:hover {
                background: var(--background, #f9fafb);
                border-color: var(--primary, #6366f1);
                color: var(--primary, #6366f1);
            }

            .notification-permission-btn:active {
                transform: translateY(0);
            }

            /* Dark theme support */
            [data-theme="dark"] .notification-permission-content {
                background: var(--surface, #111827);
                color: var(--text, #e5e7eb);
            }

            [data-theme="dark"] .notification-permission-title {
                color: var(--text, #e5e7eb);
            }

            [data-theme="dark"] .notification-permission-description {
                color: var(--text, #9ca3af);
            }

            [data-theme="dark"] .notification-permission-btn.secondary {
                border-color: var(--border, #4b5563);
                color: var(--text, #9ca3af);
            }

            [data-theme="dark"] .notification-permission-btn.secondary:hover {
                background: var(--background, #1f2937);
                border-color: var(--primary, #818cf8);
                color: var(--primary, #818cf8);
            }

            /* Mobile responsive */
            @media (max-width: 480px) {
                .notification-permission-content {
                    padding: 20px;
                    margin: 16px;
                }

                .notification-permission-title {
                    font-size: 18px;
                }

                .notification-permission-description {
                    font-size: 13px;
                }

                .notification-permission-buttons {
                    flex-direction: column;
                }

                .notification-permission-btn {
                    padding: 14px 16px;
                }
            }

            /* Accessibility */
            .notification-permission-btn:focus-visible {
                outline: 2px solid var(--primary, #6366f1);
                outline-offset: 2px;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Show the notification permission modal
     */
    showModal() {
        if (!this.shouldShowModal()) {
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'notification-permission-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'notification-permission-title');
        modal.setAttribute('aria-describedby', 'notification-permission-description');

        modal.innerHTML = `
            <div class="notification-permission-content">
                <div class="notification-permission-header">
                    <div class="notification-permission-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </div>
                    <h3 id="notification-permission-title" class="notification-permission-title">
                        მიიღეთ შეტყობინებები
                    </h3>
                    <p id="notification-permission-description" class="notification-permission-description">
                        ჩვენ გაგზავნით შეტყობინებებს ახალი ჩარიცხვებისა და განახლებების შესახებ. თქვენ ყოველთვის შეგიძლიათ გამორთოთ ეს შეტყობინებები პარამეტრებში.
                    </p>
                </div>
                <div class="notification-permission-buttons">
                    <button class="notification-permission-btn secondary" id="notification-skip-btn">
                        ახლა არა
                    </button>
                    <button class="notification-permission-btn primary" id="notification-allow-btn">
                        დაშვება
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Add event listeners
        const allowBtn = modal.querySelector('#notification-allow-btn');
        const skipBtn = modal.querySelector('#notification-skip-btn');

        allowBtn.addEventListener('click', () => this.handleAllow());
        skipBtn.addEventListener('click', () => this.handleSkip());

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.handleSkip();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                this.handleSkip();
            }
        });
    }

    /**
     * Handle allow button click
     */
    async handleAllow() {
        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('NotificationPermissionManager: Permission granted');
                
                // Send subscription to service worker
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.ready;
                    if (registration.active) {
                        registration.active.postMessage({
                            type: 'PWA_SUBSCRIBE'
                        });
                    }
                }
                
                // Store permission granted
                localStorage.setItem('notification-permission-granted', Date.now().toString());
                localStorage.removeItem('notification-permission-skipped');
                
                this.showSuccessMessage();
            } else {
                console.log('NotificationPermissionManager: Permission denied');
                localStorage.setItem('notification-permission-denied', Date.now().toString());
            }
        } catch (error) {
            console.error('NotificationPermissionManager: Error requesting permission:', error);
        }

        this.closeModal();
    }

    /**
     * Handle skip button click
     */
    handleSkip() {
        console.log('NotificationPermissionManager: User skipped notification permission');
        
        // Store skip timestamp
        localStorage.setItem('notification-permission-skipped', Date.now().toString());
        
        this.closeModal();
    }

    /**
     * Close the modal
     */
    closeModal() {
        const modal = document.querySelector('.notification-permission-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary, #6366f1);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2147483648;
            font-size: 14px;
            font-weight: 500;
            animation: slideUpFade 0.5s ease forwards;
        `;
        
        notification.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            შეტყობინებები ჩართულია!
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUpFade {
                from {
                    opacity: 0;
                    transform: translate(-50%, 20px);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUpFade 0.5s ease reverse';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    /**
     * Initialize the notification permission manager
     */
    init() {
        if (!this.options.autoShow) {
            return;
        }

        // Wait for page to be fully loaded
        if (document.readyState === 'complete') {
            setTimeout(() => this.showModal(), this.options.showDelay);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.showModal(), this.options.showDelay);
            }, { once: true });
        }
    }

    /**
     * Manually trigger the permission modal
     */
    show() {
        this.showModal();
    }

    /**
     * Check if notifications are enabled
     * @returns {boolean} True if notifications are enabled
     */
    isEnabled() {
        return this.permissionState === 'granted';
    }

    /**
     * Get permission status
     * @returns {string} Permission status
     */
    getStatus() {
        return this.permissionState;
    }
}

// Export for use in other scripts
window.NotificationPermissionManager = NotificationPermissionManager;

<!--
CHANGELOG
[2025-01-27] v1.0 – Created notification permission modal with skipable option for PWA mode only.
Reason: To implement user-friendly notification permission request that only appears in PWA mode and can be skipped.
Thoughts: Modal includes skip functionality with 24-hour cooldown, success feedback, and proper accessibility features.
Model: Claude 3.5 Sonnet
-->
