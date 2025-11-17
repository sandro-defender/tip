class InstallHelper {
    static VERSION = '0.0.1';

    constructor(options = {}) {
        // Log version on initialization
        console.log(`InstallHelper v${InstallHelper.VERSION} initialized`);

        // Default options
        this.options = {
            autoShow: true,                // Auto show the install button
            showDelay: 1000,              // Delay before showing the button (ms)
            position: 'bottom-right',      // Position of the button
            primaryColor: '#4CAF50',       // Primary color
            secondaryColor: '#45a049',     // Secondary color
            textColor: 'white',            // Text color
            showOnDesktop: true,          // Show install button on desktop browsers
            showVersion: true,             // Show version text on the button
            ...options                     // Override with user options
        };

        this.deferredPrompt = null;
        this.installAttempts = 0;
        this.lastAttemptTime = 0;

        // Messenger detection
        this.isMessengerWebView = this.detectMessengerWebView();

        // Initialize
        this.createStyles();
        this.init();
        // Button creation is now handled within init()
    }

    /**
     * Check if the app is already installed
     * @returns {boolean} True if app is installed
     */
    isAppInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    /**
     * Check if the device is desktop, respecting showOnDesktop option
     * @returns {boolean} True if device is desktop and showOnDesktop is false
     */
    isDesktop() {
        if (this.options.showOnDesktop) return false;
        return !('ontouchstart' in window) || 
               (navigator.maxTouchPoints === 0) || 
               (navigator.msMaxTouchPoints === 0);
    }

    /**
     * Create and inject CSS styles
     */
    createStyles() {
        // Remove any existing styles
        const existingStyle = document.getElementById('pwa-install-helper-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'pwa-install-helper-styles';

        // Get theme colors from CSS variables if available
        const getThemeColor = (cssVar, fallback) => {
            if (typeof window !== 'undefined' && window.getComputedStyle) {
                const value = getComputedStyle(document.documentElement)
                    .getPropertyValue(cssVar).trim();
                return value || fallback;
            }
            return fallback;
        };

        // Try to use site's theme colors
        const primaryColor = getThemeColor('--primary', this.options.primaryColor);
        const secondaryColor = getThemeColor('--secondary', this.options.secondaryColor);
        const textColor = getThemeColor('--text-on-primary', this.options.textColor);

        style.textContent = `
            :root {
                --pwa-helper-primary: ${primaryColor};
                --pwa-helper-secondary: ${secondaryColor};
                --pwa-helper-text: ${textColor};
                --pwa-helper-shadow: rgba(0, 0, 0, 0.1);
                --pwa-helper-backdrop: rgba(0, 0, 0, 0.5);
                --pwa-helper-surface: white;
                --pwa-helper-surface-text: #333;
                --pwa-helper-border: #e5e7eb;
                --pwa-helper-blue-primary: #3b82f6;
                --pwa-helper-blue-secondary: #2563eb;
            }

            [data-theme="dark"] {
                --pwa-helper-shadow: rgba(0, 0, 0, 0.2);
                --pwa-helper-backdrop: rgba(0, 0, 0, 0.7);
                --pwa-helper-surface: #1a1a1a;
                --pwa-helper-surface-text: #ffffff;
                --pwa-helper-border: #333;
            }

            .pwa-install-helper {
                position: fixed;
                z-index: 2147483643;
                bottom: 95px;
                right: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            }

            .pwa-install-helper.top-left {
                top: 20px;
                left: 20px;
                bottom: auto;
                right: auto;
            }

            .pwa-install-helper.top-right {
                top: 20px;
                right: 20px;
                bottom: auto;
                left: auto;
            }

            .pwa-install-helper.bottom-left {
                bottom: 95px;
                left: 20px;
                top: auto;
                right: auto;
            }

            .pwa-install-helper.bottom-center {
                bottom: 95px;
                left: 50%;
                transform: translateX(-50%);
                top: auto;
                right: auto;
            }

            .install-app-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: linear-gradient(135deg, var(--pwa-helper-primary), var(--pwa-helper-secondary));
                color: var(--pwa-helper-text);
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.3s ease;
                box-shadow: 0 4px 6px var(--pwa-helper-shadow);
                animation: pulse 2s infinite;
                position: relative;
                overflow: hidden;
                -webkit-tap-highlight-color: transparent;
            }

            .install-app-button.install-available {
                background: linear-gradient(135deg, var(--pwa-helper-blue-primary), var(--pwa-helper-blue-secondary));
            }

            .install-app-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: 0.5s;
            }

            .install-app-button:hover::before {
                left: 100%;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            .install-app-button:hover {
                background: linear-gradient(135deg, #45a049, #4CAF50);
            }

            .install-app-button.install-available:hover {
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
            }

            .install-app-button svg {
                transition: transform 0.3s ease;
            }

            .install-app-button:hover svg {
                transform: translateY(2px);
            }

            @media (max-width: 350px) {
                .install-app-button {
                    padding: 10px 16px;
                    font-size: 14px;
                }
                .install-app-button svg {
                    width: 16px;
                    height: 16px;
                }
            }

            .install-instructions-modal {
                position: fixed;
                bottom: -100%;
                left: 0;
                width: 100%;
                background: white;
                border-radius: 20px 20px 0 0;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                z-index: 2147483644;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                padding: 20px;
                box-sizing: border-box;
                opacity: 0;
                transform: translateY(20px);
            }

            .install-instructions-modal.show {
                bottom: 0;
                opacity: 1;
                transform: translateY(0);
            }

            .modal-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 20px;
                animation: fadeInDown 0.5s ease-out forwards;
            }

            @keyframes fadeInDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .modal-icon {
                width: 48px;
                height: 48px;
                margin-bottom: 10px;
                color: #4CAF50;
                animation: bounceIn 0.6s ease-out forwards;
            }

            @keyframes bounceIn {
                0% {
                    opacity: 0;
                    transform: scale(0.3);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.05);
                }
                70% {
                    transform: scale(0.9);
                }
                100% {
                    transform: scale(1);
                }
            }

            .install-instructions-steps {
                counter-reset: step;
                list-style: none;
                padding: 0;
            }

            .install-instructions-steps li {
                position: relative;
                padding-left: 40px;
                margin-bottom: 20px;
                line-height: 1.5;
                color: #666;
                transition: transform 0.3s ease;
            }

            .install-instructions-steps li:hover {
                transform: translateX(5px);
            }

            .install-instructions-steps li::before {
                content: '';
                counter-increment: step;
                position: absolute;
                left: 0;
                top: 0;
                width: 30px;
                height: 30px;
                background: #4CAF50;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            }

            .install-instructions-steps li:hover::before {
                transform: scale(1.1);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }

            .install-instructions-steps li:nth-child(1)::before {
                background: #4CAF50 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 11 12 14 22 4'%3E%3C/polyline%3E%3Cpath d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'%3E%3C/path%3E%3C/svg%3E") center no-repeat;
            }

            .install-instructions-steps li:nth-child(2)::before {
                background: #4CAF50 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8'%3E%3C/path%3E%3Cpolyline points='16 6 12 2 8 6'%3E%3C/polyline%3E%3Cline x1='12' y1='2' x2='12' y2='15'%3E%3C/line%3E%3C/svg%3E") center no-repeat;
            }

            .install-instructions-steps li:nth-child(3)::before {
                background: #4CAF50 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5z'%3E%3C/path%3E%3Cpath d='M2 17l10 5 10-5'%3E%3C/path%3E%3Cpath d='M2 12l10 5 10-5'%3E%3C/path%3E%3C/svg%3E") center no-repeat;
            }

            .install-instructions-steps li:nth-child(4)::before {
                background: #4CAF50 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12h14'%3E%3C/path%3E%3Cpath d='M12 5v14'%3E%3C/path%3E%3C/svg%3E") center no-repeat;
            }

            .modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2147483645; /* Ensure it's above other elements */
                touch-action: manipulation; /* Improve touch response */
            }

            .modal-close:hover {
                background-color: rgba(0,0,0,0.05);
                transform: rotate(90deg);
            }

            .modal-close svg {
                width: 24px;
                height: 24px;
                color: #999;
                transition: color 0.3s ease;
            }

            .modal-close:hover svg {
                color: #555;
            }

            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s;
                z-index: 2147483643;
            }

            .modal-backdrop.show {
                opacity: 1;
                visibility: visible;
            }

            @media (prefers-color-scheme: dark) {
                .install-instructions-modal {
                    background: #1a1a1a;
                    color: #ffffff;
                }
                .modal-header h3 {
                    color: #ffffff;
                }
                .install-instructions-steps li {
                    color: #cccccc;
                }
                .modal-close svg {
                    color: #ffffff;
                }
                .modal-backdrop {
                    background: rgba(0,0,0,0.7);
                }
                .install-app-button {
                    background: linear-gradient(135deg, #2d8532, #236b29);
                }
                .install-app-button:hover {
                    background: linear-gradient(135deg, #236b29, #2d8532);
                }
            }

            .safari-link {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-top: 15px;
                padding: 12px 20px;
                background: linear-gradient(135deg, #007AFF, #0056b3);
                color: white;
                text-decoration: none;
                border-radius: 25px;
                font-weight: 500;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .safari-link::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: 0.5s;
            }

            .safari-link:hover::before {
                left: 100%;
            }

            .safari-link:hover {
                background: linear-gradient(135deg, #0056b3, #007AFF);
                transform: translateY(-2px);
                box-shadow: 0 6px 10px rgba(0,0,0,0.15);
            }

            .copy-url-button {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-top: 15px;
                padding: 12px 20px;
                background: linear-gradient(135deg, #007AFF, #0056b3);
                color: white;
                border: none;
                border-radius: 25px;
                font-weight: 500;
                cursor: pointer;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .copy-url-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: 0.5s;
            }

            .copy-url-button:hover::before {
                left: 100%;
            }

            .copy-url-button:hover {
                background: linear-gradient(135deg, #0056b3, #007AFF);
                transform: translateY(-2px);
                box-shadow: 0 6px 10px rgba(0,0,0,0.15);
            }

            .copy-success {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 30px;
                z-index: 2147483645;
                animation: fadeInOutUp 2s forwards;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                font-weight: 500;
            }

            .copy-success::before {
                content: '';
                display: inline-block;
                width: 16px;
                height: 16px;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
                background-size: contain;
                background-repeat: no-repeat;
                animation: checkmark 0.5s ease-out forwards;
            }

            @keyframes checkmark {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }

            @keyframes fadeInOutUp {
                0% { opacity: 0; transform: translate(-50%, 20px); }
                15% { opacity: 1; transform: translate(-50%, 0); }
                85% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }

            .install-success-notification {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--pwa-helper-primary);
                color: var(--pwa-helper-text);
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px var(--pwa-helper-shadow);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 2147483645;
                animation: slideUpFade 0.5s ease forwards;
                font-size: 16px;
                font-weight: 500;
            }

            .install-success-notification.hide {
                animation: slideDownFade 0.5s ease forwards;
            }

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

            @keyframes slideDownFade {
                from {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, 20px);
                }
            }

            /* Reminder option */
            .remind-later-button {
                background: transparent;
                border: 1px solid var(--pwa-helper-text);
                color: var(--pwa-helper-text);
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 15px;
                transition: all 0.3s ease;
            }

            .remind-later-button:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            /* Accessibility improvements */
            .install-app-button:focus-visible,
            .modal-close:focus-visible,
            .copy-url-button:focus-visible,
            .safari-link:focus-visible,
            .remind-later-button:focus-visible {
                outline: 2px solid var(--pwa-helper-primary);
                outline-offset: 2px;
            }

            .version-text {
                font-size: 8px;
                opacity: 0.6;
                margin-left: 4px;
                align-self: flex-end;
                margin-bottom: -2px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Detect browser and platform
     * @returns {Promise<string>} Browser identifier
     */
    async detectBrowser() {
        const ua = navigator.userAgent;
        const vendor = navigator.vendor || ''; // For Opera, Vivaldi

        // iOS detection - using modern approach
        const isIOS = /iPad|iPhone|iPod/.test(ua) ||
                     (/Mac/.test(ua) && navigator.maxTouchPoints > 1);
        
        // Android detection
        const isAndroid = /Android/.test(ua);

        // Check for Brave first
        try {
            if (navigator.brave && await navigator.brave.isBrave()) {
                if (isIOS) return 'ios-brave';
                if (isAndroid) return 'android-brave';
                return 'brave';
            }
        } catch (e) {
            // Brave detection failed, continue
        }

        // iOS browsers
        if (isIOS) {
            if (/CriOS/.test(ua)) return 'ios-chrome';
            if (/FxiOS/.test(ua)) return 'ios-firefox';
            if (/EdgiOS/.test(ua)) return 'ios-edge';
            if (/OPiOS/.test(ua)) return 'ios-opera';
            if (/DuckDuckGo/.test(ua)) return 'ios-duckduckgo';
            if (/Focus/.test(ua)) return 'ios-firefox-focus'; // Firefox Focus
            if (/Vivaldi/.test(ua)) return 'ios-vivaldi';
            // Safari is the fallback for iOS if no other specific browser is detected
            return 'ios-safari';
        }

        // Android browsers
        if (isAndroid) {
            if (/SamsungBrowser/.test(ua)) return 'android-samsung';
            if (/EdgA/.test(ua) || /EdgeA/.test(ua)) return 'android-edge'; // EdgA for newer, EdgeA for older
            if (/Firefox/.test(ua) || /Fennec/.test(ua)) return 'android-firefox'; // Fennec is codename for Firefox mobile
            if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'android-opera';
            if (/Vivaldi/.test(ua)) return 'android-vivaldi';
            if (/DuckDuckGo/.test(ua)) return 'android-duckduckgo';
            if (/YaBrowser/.test(ua)) return 'android-yandex';
            if (/MiuiBrowser/.test(ua)) return 'android-miui';
            // Chrome on Android is often the default, or if it contains 'Chrome' and not other more specific ones
            if (/Chrome/.test(ua)) return 'chrome-android'; 
            return 'android-webview'; // Default for less common Android browsers or WebViews
        }

        // Desktop browsers
        if (/Edg/.test(ua)) return 'edge'; // Microsoft Edge (Chromium based)
        if (/MSIE/.test(ua) || /Trident/.test(ua)) return 'ie'; // Internet Explorer
        if (/Firefox/.test(ua)) return 'firefox';
        if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'opera'; // Opera (uses OPR)
        if (/Vivaldi/.test(ua)) return 'vivaldi';
        if (/YaBrowser/.test(ua)) return 'yandex';
        // Safari must be checked after Chrome, as Chrome UA also contains "Safari"
        if (/Safari/.test(ua) && vendor.includes('Apple')) return 'safari';
        if (/Chrome/.test(ua) && vendor.includes('Google')) return 'chrome';

        return 'other';
    }

    async getButtonText() {
        const browser = await this.detectBrowser();
        switch (browser) {
            case 'ios-safari':
            case 'ios-chrome':
            case 'ios-firefox':
            case 'ios-edge':
            case 'ios-brave':
            case 'ios-opera':
            case 'ios-duckduckgo':
            case 'ios-firefox-focus':
            case 'ios-vivaldi':
                return 'Add to Home Screen';
            case 'chrome-android':
            case 'android-samsung':
            case 'android-firefox':
            case 'android-edge':
            case 'android-opera':
            case 'android-brave':
            case 'android-vivaldi':
            case 'android-duckduckgo':
            case 'android-yandex':
            case 'android-miui':
            case 'android-webview':
                return 'Install App';
            case 'chrome':
            case 'edge':
            case 'opera':
            case 'vivaldi':
            case 'brave':
                return 'Install App';
            case 'firefox':
            case 'safari':
            case 'yandex':
                return 'Add to Desktop'; // Or a more generic term if direct install isn't standard
            case 'ie':
                return 'ბრაუზერის განახლებაა საჭირო';
            default:
                return 'Install App';
        }
    }

    /**
     * Create and add the install button to the page
     * @returns {HTMLElement} The button container
     */
    async createButton() {
        // Don't show button on desktop
        if (this.isDesktop()) {
            return null;
        }

        // Check if we should show the button based on remind later setting
        const remindLater = localStorage.getItem('pwa-remind-later');
        if (remindLater) {
            const remindTime = parseInt(remindLater, 10);
            if (Date.now() < remindTime) {
                // Not time to remind yet
                return null;
            } else {
                // Clear the reminder
                localStorage.removeItem('pwa-remind-later');
            }
        }

        // Create button container
        const container = document.createElement('div');
        container.className = `pwa-install-helper ${this.options.position}`;

        // Create the button
        const button = document.createElement('button');
        button.className = 'install-app-button';
        
        // Add install-available class if deferredPrompt is available
        if (this.deferredPrompt) {
            button.classList.add('install-available');
        }
        
        button.setAttribute('aria-label', 'Install application');

        // Get appropriate button text based on browser
        const buttonText = await this.getButtonText();
        
        // Create version text HTML if showVersion is enabled
        const versionText = this.options.showVersion 
            ? `<span class="version-text">v${InstallHelper.VERSION}</span>` 
            : '';
            
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>${buttonText}</span>
            ${versionText}
        `;

        // Add button to container and container to body
        container.appendChild(button);
        document.body.appendChild(container);

        // Add click event listener
        button.addEventListener('click', () => this.handleInstallClick());

        return container;
    }

    /**
     * Handle install button click
     */
    async handleInstallClick() {
        // Track the attempt
        this.trackInstallAttempt();
        console.log('InstallHelper: handleInstallClick called. deferredPrompt:', this.deferredPrompt);

        if (this.deferredPrompt) {
            try {
                // Show the installation prompt
                await this.deferredPrompt.prompt();

                // Wait for the user to respond to the prompt
                const { outcome } = await this.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    this.hideButton();
                    this.trackInstallSuccess();
                }
                this.deferredPrompt = null;
            } catch (error) {
                console.error('Install prompt error:', error);
                this.showInstallInstructions();
            }
        } else {
            this.showInstallInstructions();
        }
    }

    /**
     * Handle remind later button click
     */
    handleRemindLater() {
        // Hide the modal
        const modal = document.querySelector('.install-instructions-modal');
        const backdrop = document.querySelector('.modal-backdrop');

        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }

        if (backdrop) {
            backdrop.classList.remove('show');
            setTimeout(() => backdrop.remove(), 300);
        }

        // Hide the button temporarily
        this.hideButton();

        // Set a reminder to show again later (4 hours)
        const remindTime = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
        localStorage.setItem('pwa-remind-later', (Date.now() + remindTime).toString());

        // Show again after the remind time
        setTimeout(() => this.showButton(), remindTime);
    }

    hideButton() {
        const button = document.querySelector('.pwa-install-helper');
        if (button) {
            button.style.display = 'none';
        }
    }

    /**
     * Initialize the install helper
     */
    async init() {
        if (this.isDesktop()) {
            console.log('InstallHelper: Desktop environment detected, not initializing install button.');
            return;
        }

        if (this.isAppInstalled()) {
            console.log('InstallHelper: App already installed.');
            this.hideButton(); // Ensure any existing button is hidden if app gets installed later
            return;
        }

        let baseDelay = this.options.showDelay;
        const lastAttempt = localStorage.getItem('pwa-install-last-attempt');
        const attempts = localStorage.getItem('pwa-install-attempts');

        if (lastAttempt && attempts) {
            this.lastAttemptTime = parseInt(lastAttempt, 10);
            this.installAttempts = parseInt(attempts, 10);

            const hoursSinceLastAttempt = (Date.now() - this.lastAttemptTime) / (1000 * 60 * 60);
            if (this.installAttempts > 2 && hoursSinceLastAttempt < 24) {
                console.log('InstallHelper: Install button display will be delayed due to multiple recent attempts.');
                baseDelay = this.options.showDelay * 3; // Apply longer delay
            }
        }

        const tryCreateAndShowButton = async () => {
            let container = document.querySelector('.pwa-install-helper');
            if (!container) {
                container = await this.createButton(); // createButton handles its own conditions (desktop, remind later)
            } else {
                // Update button class if deferredPrompt is available
                const button = container.querySelector('.install-app-button');
                if (button && this.deferredPrompt) {
                    button.classList.add('install-available');
                }
            }

            if (container) { // If button exists or was created
                if (this.options.autoShow) { // If autoShow is true, we generally want to show it
                    this.showButton();
                } else { // autoShow is false
                    if (this.deferredPrompt) { // Only show if beforeinstallprompt has fired
                        this.showButton();
                    } else {
                        console.log('InstallHelper: autoShow is false and no deferredPrompt, button not shown by tryCreateAndShowButton.');
                    }
                }
            }
        };
        
        console.log('InstallHelper: Listening for beforeinstallprompt event...');
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('InstallHelper: beforeinstallprompt event fired!', e);
            // Store the event for later use
            this.deferredPrompt = e;

            // Show install button after page is loaded and after the calculated baseDelay
            if (document.readyState === 'complete') {
                setTimeout(() => tryCreateAndShowButton(), baseDelay);
            } else {
                window.addEventListener('load', () => {
                    setTimeout(() => tryCreateAndShowButton(), baseDelay);
                }, { once: true });
            }
        });

        // Handle autoShow scenario, if enabled in options
        if (!this.isAppInstalled() && this.options.autoShow) {
            // This is for showing the button for manual instructions if beforeinstallprompt doesn't fire.
            console.log(`InstallHelper: autoShow is true. Scheduling button check after delay: ${baseDelay}ms`);
            setTimeout(() => {
                if (!this.deferredPrompt) { // If beforeinstallprompt hasn't fired and set the prompt
                    console.log('InstallHelper: autoShow attempting to show button (beforeinstallprompt did not fire or was not applicable).');
                    tryCreateAndShowButton(); 
                } else {
                    console.log('InstallHelper: autoShow check, but beforeinstallprompt has already handled or will handle button display.');
                }
            }, baseDelay + 50); // Schedule this slightly after the typical beforeinstallprompt delay to give it priority
        }

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            // Track successful installation
            this.trackInstallSuccess();

            // Hide the installation button
            this.hideButton();
            this.deferredPrompt = null;

            // Show success message
            this.showInstallSuccess();
        });

        // Check for display mode changes
        window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
            if (e.matches) {
                this.hideButton();
            }
        });
    }

    /**
     * Show the install button with animation
     */
    showButton() {
        const installButton = document.querySelector('.install-app-button');
        if (installButton) {
            installButton.style.display = 'flex';
            installButton.style.opacity = '0';
            installButton.style.transform = 'translateY(20px)';
            installButton.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

            // Force reflow
            installButton.offsetHeight;

            installButton.style.opacity = '1';
            installButton.style.transform = 'translateY(0)';
        }
    }

    /**
     * Track installation attempt
     */
    trackInstallAttempt() {
        this.installAttempts++;
        this.lastAttemptTime = Date.now();

        localStorage.setItem('pwa-install-attempts', this.installAttempts.toString());
        localStorage.setItem('pwa-install-last-attempt', this.lastAttemptTime.toString());
    }

    /**
     * Track successful installation
     */
    trackInstallSuccess() {
        localStorage.setItem('pwa-installed', 'true');
        localStorage.setItem('pwa-install-date', Date.now().toString());
    }

    /**
     * Show installation success message
     */
    showInstallSuccess() {
        const notification = document.createElement('div');
        notification.className = 'install-success-notification';
        notification.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>აპლიკაცია წარმატებით დაინსტალირდა!</span>
        `;

        document.body.appendChild(notification);

        // Remove after animation completes
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    getCurrentUrl() {
        return window.location.href;
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            const notification = document.createElement('div');
            notification.className = 'copy-success';
            notification.textContent = 'ლინკი დაკოპირდა';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    /**
     * Show installation instructions based on browser
     */
    async showInstallInstructions() {
        // Messenger WebView special case
        if (this.isMessengerWebView) {
            const title = 'Messenger ბრაუზერი აღმოჩენილია';
            const steps = [
                'თქვენ იყენებთ მესენჯერის ბრაუზერს .',
                'აპლიკაციის დასაყენებლად ან სრულფასოვანი ფუნქციონალისთვის, გთხოვთ, გახსენით ეს გვერდი თქვენს მთავარ ბრაუზერში (Chrome, Safari, Firefox და ა.შ.).',
                'დააკოპირეთ ბმული და ჩასვით თქვენს მთავარ ბრაუზერში.'
            ];
            const extraContent = `<button class="copy-url-button" onclick="this.classList.add('clicked')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                დააკოპირე ბმული
            </button>`;

            const modal = document.createElement('div');
            modal.className = 'install-instructions-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-labelledby', 'modal-title');
            modal.innerHTML = `
                <button class="modal-close" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="modal-header">
                    <svg class="modal-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    <h3 id="modal-title">${title}</h3>
                </div>
                <ul class="install-instructions-steps">
                    ${steps.map((step, index) => `<li style="animation: fadeInRight 0.5s ease forwards ${index * 0.15}s; opacity: 0;">${step}</li>`).join('')}
                </ul>
                ${extraContent}
            `;

            // Add the fadeInRight animation to the style element
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                @keyframes fadeInRight {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `;
            document.head.appendChild(styleElement);

            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';

            document.body.appendChild(backdrop);
            document.body.appendChild(modal);

            setTimeout(() => {
                backdrop.classList.add('show');
                modal.classList.add('show');
            }, 10);

            const closeModal = () => {
                backdrop.classList.remove('show');
                modal.classList.remove('show');
                setTimeout(() => {
                    backdrop.remove();
                    modal.remove();
                }, 300);
            };

            const closeButton = modal.querySelector('.modal-close');
            if (closeButton) {
                closeButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                    return false;
                }, true);
                closeButton.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                    return false;
                }, true);
            }
            backdrop.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => { e.stopPropagation(); });

            // Copy link button
            const modalElement = modal.querySelector('.copy-url-button');
            if (modalElement) {
                modalElement.addEventListener('click', () => this.copyToClipboard(this.getCurrentUrl()));
            }

            // Keyboard support
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    closeModal();
                }
            });
            return;
        }

        const browser = await this.detectBrowser();
        console.log('InstallHelper: showInstallInstructions called. Detected browser:', browser);
        let title = 'Install App';
        let steps = [];
        let extraContent = '';
        const showRemindLater = this.installAttempts > 1; // Show remind later after first attempt

        switch (browser) {
            // iOS Browsers - Most require opening in Safari
            case 'ios-chrome':
            case 'ios-firefox':
            case 'ios-edge':
            case 'ios-brave':
            case 'ios-opera':
            case 'ios-duckduckgo':
            case 'ios-firefox-focus':
            case 'ios-vivaldi':
                title = 'საჭიროა Safari ბრაუზერი';
                steps = [
                    'აპლიკაციის დასაყენებლად ამ ბრაუზერში, ჯერ Safari-ში უნდა გახსნათ.',
                    'დააკოპირეთ მიმდინარე გვერდის ბმული.',
                    'გახსენით Safari, ჩასვით ბმული და გადადით გვერდზე.',
                    'Safari-ში მიჰყევით ინსტალაციის ინსტრუქციას.'
                ];
                extraContent = `<button class="copy-url-button" onclick="this.classList.add('clicked')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    დააკოპირე ბმული
                </button>`;
                break;
            case 'ios-safari':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Safari)';
                steps = [
                    'დააჭირეთ "Share" ღილაკს <img src="https://help.apple.com/assets/678AF3BDAED93ED9D1042F84/678AF3C89EC3C835220A70FE/en_US/748a151e2276ad5df4d03ec8d4506bf7.png" style="width: 20px; vertical-align: middle;"> ბრაუზერის ქვედა ან ზედა პანელზე.',
                    'ჩამოსქროლეთ და იპოვეთ "Add to Home Screen" ღილაკი.',
                    'დააჭირეთ "Add" ღილაკს ზედა მარჯვენა კუთხეში.',
                    'აპლიკაცია გამოჩნდება თქვენს მთავარ ეკრანზე.'
                ];
                break;
            
            // Android Browsers
            case 'chrome-android':
                 if (this.deferredPrompt) {
                    console.log('InstallHelper: chrome-android with deferredPrompt. Attempting direct prompt.');
                    try {
                        await this.deferredPrompt.prompt();
                        const { outcome } = await this.deferredPrompt.userChoice;
                        if (outcome === 'accepted') {
                            this.hideButton();
                            this.trackInstallSuccess();
                            this.showInstallSuccess();
                        }
                        this.deferredPrompt = null;
                        return; 
                    } catch (error) {
                        console.error('InstallHelper: Direct prompt failed for chrome-android:', error);
                        // Fall through to manual instructions if prompt fails
                    }
                }
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Chrome - Android)';
                steps = [
                    'დააჭირეთ მენიუს ღილაკს (სამი წერტილი) Chrome-ის ბრაუზერში.',
                    'აირჩიეთ "Install app" ან "Add to Home screen".',
                    'დაადასტურეთ ინსტალაცია.',
                    'აპლიკაცია დაემატება თქვენს მთავარ ეკრანზე.'
                ];
                break;
            case 'android-samsung':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Samsung Internet)';
                steps = [
                    'დააჭირეთ მენიუს ღილაკს (ჰამბურგერი/სამი ხაზი) ბრაუზერის ქვედა პანელზე.',
                    'აირჩიეთ "Add page to".',
                    'აირჩიეთ "Home screen".',
                    'დააჭირეთ "Add" ღილაკს.',
                    'აპლიკაცია დაემატება თქვენს მთავარ ეკრანზე.'
                ];
                break;
            case 'android-firefox':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Firefox - Android)';
                steps = [
                    'დააჭირეთ მენიუს ღილაკს (სამი წერტილი) ბრაუზერში.',
                    'აირჩიეთ "Install" ან "Add to Home screen".',
                    'მიჰყევით ინსტრუქციას ინსტალაციის დასასრულებლად.'
                ];
                break;
            case 'android-edge':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Edge - Android)';
                 steps = [
                    'დააჭირეთ მენიუს ღილაკს (სამი წერტილი) ბრაუზერში.',
                    'აირჩიეთ "Add to phone" ან "Add to Home screen".',
                    'დაადასტურეთ ინსტალაცია.'
                ];
                break;
            case 'android-opera':
                 title = 'აპლიკაციის დაყენების ინსტრუქცია (Opera - Android)';
                 steps = [
                    'დააჭირეთ მენიუს ღილაკს (ხშირად "O" ლოგო) ბრაუზერში.',
                    'მოძებნეთ "Add to..." ან "Home screen" ოფცია.',
                    'დაადასტურეთ დამატება.'
                ];
                break;
            case 'android-brave':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Brave - Android)';
                steps = [
                    'დააჭირეთ მენიუს ღილაკს (სამი წერტილი).',
                    'აირჩიეთ "Install app" ან "Add to Home screen".',
                    'დაადასტურეთ.'
                ];
                break;
            case 'android-vivaldi':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Vivaldi - Android)';
                steps = [
                    'დააჭირეთ Vivaldi-ს ლოგოს (პანელის ღილაკი).',
                    'აირჩიეთ "Install app" ან "Add to Home Screen".',
                    'მიჰყევით ინსტრუქციას.'
                ];
                break;
            case 'android-duckduckgo':
                title = 'ინსტალაცია DuckDuckGo (Android)';
                steps = [
                    'DuckDuckGo ბრაუზერი არ უჭერს მხარს პირდაპირ PWA ინსტალაციას.',
                    'გთხოვთ, გახსენით ეს გვერდი Chrome, Firefox, ან Samsung Internet ბრაუზერში ინსტალაციისთვის.'
                ];
                 extraContent = `<button class="copy-url-button" onclick="this.classList.add('clicked')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    დააკოპირე ბმული
                </button>`;
                break;
            case 'android-yandex':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Yandex - Android)';
                steps = [
                    'Yandex Browser-ში, მოძებნეთ ინსტალაციის ხატულა მისამართების ზოლში, თუ საიტი მხარს უჭერს PWA-ს.',
                    'დააჭირეთ ხატულას და მიჰყევით ინსტრუქციას.',
                    'ალტერნატიულად, მენიუში (სამი ხაზი) მოძებნეთ "Install as application" ან მსგავსი.'
                ];
                break;
             case 'android-miui':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Mi Browser - Android)';
                steps = [
                    'Mi Browser-ში, დააჭირეთ მენიუს ღილაკს.',
                    'აირჩიეთ "Add to Home screen".',
                    'დაადასტურეთ დამატება.'
                ];
                break;
            case 'android-webview':
                 title = 'აპლიკაციის დაყენება';
                 steps = [
                    'როგორც ჩანს, იყენებთ აპლიკაციის შიდა ბრაუზერს (WebView).',
                    'აპლიკაციის სრულფასოვნად დასაყენებლად, გთხოვთ, გახსენით ეს გვერდი თქვენს მთავარ ბრაუზერში (მაგ. Chrome, Firefox, Samsung Internet).',
                    'შემდეგ მიჰყევით ინსტალაციის ინსტრუქციას შესაბამისი ბრაუზერისთვის.'
                ];
                extraContent = `<button class="copy-url-button" onclick="this.classList.add('clicked')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    დააკოპირე ბმული
                </button>`;
                break;

            // Desktop Browsers
            case 'chrome':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Chrome - Desktop)';
                steps = [
                    'მისამართების ზოლში (URL bar) მარჯვნივ, მოძებნეთ ინსტალაციის ხატულა (ხშირად მონიტორი ისრით ქვემოთ).',
                    'დააჭირეთ ამ ხატულას.',
                    'დააჭირეთ "Install" ღილაკს გამოსულ ფანჯარაში.',
                    'აპლიკაცია დაემატება თქვენს დესკტოპზე ან აპლიკაციების სიაში.'
                ];
                break;
            case 'edge':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Edge - Desktop)';
                steps = [
                    'მისამართების ზოლში (URL bar) მარჯვნივ, მოძებნეთ ინსტალაციის ხატულა (ხშირად სამი კვადრატი პლიუსით).',
                    'დააჭირეთ ამ ხატულას.',
                    'აირჩიეთ "Install".',
                    'აპლიკაცია დაემატება თქვენს დესკტოპზე ან აპლიკაციების სიაში.'
                ];
                break;
            case 'opera':
                 title = 'აპლიკაციის დაყენების ინსტრუქცია (Opera - Desktop)';
                 steps = [
                    'Opera-ში შესაძლოა გამოჩნდეს ინსტალაციის შეთავაზება მისამართების ზოლში.',
                    'თუ ხატულა ჩანს, დააჭირეთ მას და აირჩიეთ "Install".',
                    'ზოგიერთ ვერსიაში, შეიძლება დაგჭირდეთ მენიუში (O ლოგო) შესვლა და "Install [AppName]" ოფციის მოძებნა.'
                ];
                break;
            case 'vivaldi':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Vivaldi - Desktop)';
                steps = [
                    'Vivaldi-ში, დააწკაპუნეთ მარჯვენა ღილაკით გვერდის tab-ზე.',
                    'აირჩიეთ "Install [AppName]".',
                    'დაადასტურეთ ინსტალაცია.'
                ];
                break;
            case 'brave':
                title = 'აპლიკაციის დაყენების ინსტრუქცია (Brave - Desktop)';
                steps = [
                    'მისამართების ზოლში (URL bar) მარჯვნივ, მოძებნეთ ინსტალაციის ხატულა.',
                    'დააჭირეთ ხატულას და აირჩიეთ "Install".'
                ];
                break;
            case 'safari': // Desktop Safari
                title = 'აპლიკაციის დამატება Dock-ზე (Safari - macOS)';
                steps = [
                    'Safari-ში, გადაიტანეთ URL (ვებ მისამართი) მისამართების ზოლიდან თქვენს Dock-ზე.',
                    'ეს შექმნის მალსახმობს აპლიკაციისთვის.',
                    'PWA-ს სრული ინტეგრაცია შეიძლება შეზღუდული იყოს Safari-ში macOS-ზე.'
                ];
                break;
            case 'firefox': // Desktop Firefox
                title = 'აპლიკაციის დამატება (Firefox - Desktop)';
                steps = [
                    'Firefox ამჟამად სრულად არ უჭერს მხარს PWA-ების პირდაპირ ინსტალაციას ისე, როგორიცაა Chrome-ის ტიპის ბრაუზერები.',
                    'შეგიძლიათ შექმნათ მალსახმობი: დააჭირეთ სამ წერტილს მისამართების ზოლში, აირჩიეთ "Bookmark this tab" (ან Ctrl+D/Cmd+D).',
                    'შემდეგ შეგიძლიათ ეს სანიშნე გადაიტანოთ დესკტოპზე.'
                ];
                break;
            case 'yandex': // Desktop Yandex
                 title = 'აპლიკაციის დაყენების ინსტრუქცია (Yandex - Desktop)';
                 steps = [
                    'Yandex Browser-ში, მოძებნეთ ინსტალაციის ხატულა მისამართების ზოლში, თუ საიტი მხარს უჭერს PWA-ს.',
                    'დააჭირეთ ხატულას და მიჰყევით ინსტრუქციას.',
                    'ალტერნატიულად, მენიუში (სამი ხაზი) მოძებნეთ "Install as application" ან მსგავსი.'
                ];
                break;
            case 'ie':
                title = 'ბრაუზერის განახლებაა საჭირო';
                steps = [
                    'Internet Explorer-ს არ აქვს ამ აპლიკაციის მხარდაჭერა.',
                    'გთხოვთ, გამოიყენოთ თანამედროვე ბრაუზერი, როგორიცაა Chrome, Edge, Firefox, ან Safari.'
                ];
                break;
            default: // 'other' or unhandled specific cases
                title = 'ინსტალაციის ზოგადი ინსტრუქცია';
                steps = [
                    'თქვენი ბრაუზერის მენიუში (ხშირად სამი წერტილი ან სამი ხაზი) მოძებნეთ ოფცია, როგორიცაა:',
                    '- "Install app"',
                    '- "Add to Home Screen"',
                    '- "Create shortcut"',
                    '- "Pin to Start"',
                    'თუ ასეთი ოფცია არ არის, თქვენი ბრაუზერი შესაძლოა სრულად არ უჭერდეს მხარს PWA ინსტალაციას. სცადეთ სხვა ბრაუზერი.'
                ];
        }

        const modal = document.createElement('div');
        modal.className = 'install-instructions-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'modal-title');
        modal.innerHTML = `
            <button class="modal-close" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="modal-header">
                <svg class="modal-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
                <h3 id="modal-title">${title}</h3>
            </div>
            <ul class="install-instructions-steps">
                ${steps.map((step, index) => `<li style="animation: fadeInRight 0.5s ease forwards ${index * 0.15}s; opacity: 0;">${step}</li>`).join('')}
            </ul>
            ${extraContent}
            ${showRemindLater ? `
            <button class="remind-later-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                მოგვიანებით შემახსენე
            </button>` : ''}
        `;

        // Add the fadeInRight animation to the style element
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes fadeInRight {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(styleElement);

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);

        setTimeout(() => {
            backdrop.classList.add('show');
            modal.classList.add('show');
        }, 10);

        const closeModal = () => {
            backdrop.classList.remove('show');
            modal.classList.remove('show');
            setTimeout(() => {
                backdrop.remove();
                modal.remove();
            }, 300);
        };

        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            // Remove previous event listener and use a single, more robust one
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked');
                closeModal();
                return false; // Prevent any default behavior
            }, true);

            // Add touchend event for mobile devices
            closeButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button touched');
                closeModal();
                return false;
            }, true);
        }
        backdrop.addEventListener('click', closeModal);

        // Ensure modal doesn't close when clicking inside it (except for close button)
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        if (extraContent.includes('copy-url-button')) {
            const modalElement = modal.querySelector('.copy-url-button');
            if (modalElement) {
                modalElement.addEventListener('click', () => this.copyToClipboard(this.getCurrentUrl()));
            }
        }

        // Add remind later functionality
        const remindButton = modal.querySelector('.remind-later-button');
        if (remindButton) {
            remindButton.addEventListener('click', () => this.handleRemindLater());
        }

        // Add keyboard support for closing modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });
    }

    /**
     * Detect if running inside a messenger in-app browser
     * @returns {boolean}
     */
    detectMessengerWebView() {
        const ua = navigator.userAgent || '';
        // Facebook Messenger
        if (/FBAN|FBAV|FB_IAB|FB4A|FBCR|FBMD|FBSN|FBSS|FBID|FBLC|FBOP|FBSV|FBCA|FBMF|FB_Messenger|Messenger/i.test(ua)) return true;
        // Instagram
        if (/Instagram/i.test(ua)) return true;
        // WhatsApp
        if (/WhatsApp/i.test(ua)) return true;
        // Telegram
        if (/Telegram/i.test(ua)) return true;
        // Viber
        if (/Viber/i.test(ua)) return true;
        // Line
        if (/Line/i.test(ua)) return true;
        // WeChat
        if (/MicroMessenger/i.test(ua)) return true;
        // TikTok
        if (/TikTok/i.test(ua)) return true;
        // Snapchat
        if (/Snapchat/i.test(ua)) return true;
        // LinkedIn
        if (/LinkedInApp/i.test(ua)) return true;
        return false;
    }
}