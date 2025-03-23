class InstallHelper {
    constructor() {
        this.createStyles();
        this.init();
        // Ensure button shows up even without install prompt
        if (!window.matchMedia('(display-mode: standalone)').matches) {
            this.createButton();
        }
    }

    createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pwa-install-helper {
                position: fixed;
                z-index: 2147483643;
                bottom: 20px;
                right: 20px;
            }
            
            .install-app-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.3s ease;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 0 0 0 rgba(76, 175, 80, 0.5);
                animation: pulse 2s infinite;
                position: relative;
                overflow: hidden;
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
        `;
        document.head.appendChild(style);
    }

    async detectBrowser() {
        const ua = navigator.userAgent;
        
        // Check for Brave first
        if (navigator.brave && await navigator.brave.isBrave()) {
            if (/iPad|iPhone|iPod/.test(ua)) return 'ios-brave';
            return 'brave';
        }
        
        if (/Chrome/.test(ua) && /Android/.test(ua)) return 'chrome-android';
        if (/iPad|iPhone|iPod/.test(ua)) {
            if (/CriOS/.test(ua)) return 'ios-chrome';
            if (/FxiOS/.test(ua)) return 'ios-firefox';
            if (/EdgiOS/.test(ua)) return 'ios-edge';
            return 'ios-safari';
        }
        if (/Android/.test(ua)) return 'android';
        if (/Edg/.test(ua)) return 'edge';
        if (/Chrome/.test(ua)) return 'chrome';
        if (/Firefox/.test(ua)) return 'firefox';
        if (/Safari/.test(ua)) return 'safari';
        return 'other';
    }

    async getButtonText() {
        const browser = await this.detectBrowser();
        switch (browser) {
            case 'ios':
                return 'Add to Home Screen';
            case 'android':
                return 'Install App';
            default:
                return 'Install App';
        }
    }

    async createButton() {
        const container = document.createElement('div');
        container.className = 'pwa-install-helper';
        
        const button = document.createElement('button');
        button.className = 'install-app-button';
        const buttonText = await this.getButtonText();
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            ${buttonText}
        `;
        
        container.appendChild(button);
        document.body.appendChild(container);
        button.addEventListener('click', () => this.handleInstallClick());

        return container;
    }

    async handleInstallClick() {
        if (this.deferredPrompt) {
            try {
                // Show the installation prompt
                await this.deferredPrompt.prompt();
                
                // Wait for the user to respond to the prompt
                const { outcome } = await this.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    this.hideButton();
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

    hideButton() {
        const button = document.querySelector('.pwa-install-helper');
        if (button) {
            button.style.display = 'none';
        }
    }

    async init() {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.hideButton();
            return;
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            // Store the event for later use without preventing default
            this.deferredPrompt = e;
            if (!document.querySelector('.pwa-install-helper')) {
                this.createButton();
            }
        });

        window.addEventListener('appinstalled', () => {
            this.hideButton();
            this.deferredPrompt = null;
        });
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

    async showInstallInstructions() {
        const browser = await this.detectBrowser();
        let title = 'Install App';
        let steps = [];
        let extraContent = '';
        
        switch (browser) {
            case 'ios-chrome':
            case 'ios-firefox':
            case 'ios-edge':
            case 'ios-brave':
                title = 'საჭიროა Safari ბრაუზერი';
                steps = [
                    'აპლიკაციის დასაყენებლად საჭიროა Safari ბრაუზერის გამოყენება',
                    'დააკოპირეთ ბმული და ჩასვით Safari-ში',
                    'Safari-ში გახსნის შემდეგ დააჭირეთ "Install App" ღილაკს'
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
                title = 'აპლიკაციის დაყენების ინსტრუქცია';
                steps = [
                    'დააჭირეთ "Share" ღილაკს <img src="https://help.apple.com/assets/678AF3BDAED93ED9D1042F84/678AF3C89EC3C835220A70FE/en_US/748a151e2276ad5df4d03ec8d4506bf7.png" style="width: 20px; vertical-align: middle;"> ბრაუზერის ქვედა ან ზედა პანელზე',
                    'ჩამოსქროლეთ და იპოვეთ "Add to Home Screen" ღილაკი',
                    'დააჭირეთ "Add" ღილაკს ზედა მარჯვენა კუთხეში',
                    'აპლიკაცია გამოჩნდება თქვენს მთავარ ეკრანზე'
                ];
                break;
            case 'ios-other':
                title = 'გადადით Safari ბრაუზერში';
                steps = [
                    'აპლიკაციის დასაყენებლად საჭიროა Safari ბრაუზერის გამოყენება',
                    'დააჭირეთ ქვემოთ მოცემულ ღილაკს Safari-ში გასახსნელად',
                    'Safari-ში გახსნის შემდეგ დააჭირეთ "Install App" ღილაკს'
                ];
                extraContent = `<a href="${this.getCurrentUrl()}" class="safari-link">გახსენი Safari-ში</a>`;
                break;
            case 'android':
                title = 'აპლიკაციის დაყენების ინსტრუქცია';
                steps = [
                    'აპლიკაციის დასაყენებლად დააჭირეთ "Add to Home Screen" ღილაკს',
                    'დააჭირეთ "Install" ღილაკს',
                    'აპლიკაცია დაემატება თქვენს მთავარ ეკრანზე'
                ];
                break;
            case 'edge':
                steps = ['აპლიკაციის დასაყენებლად დააჭირეთ ინსტალაციის ხატულას მისამართის ზოლში'];
                break;
            case 'chrome':
                title = 'აპლიკაციის დაყენების ინსტრუქცია';
                steps = [
                    'დააჭირეთ "Install" ღილაკს ბროუზერის ზედა ნაწილში',
                    'დააჭირეთ "Install" ღილაკს გამოსულ ფანჯარაში',
                    'აპლიკაცია დაემატება თქვენს მთავარ ეკრანზე'
                ];
                break;
            default:
                steps = ['ინსტალაციის ღილაკი უნდა იყოს ხელმისაწვდომი თქვენი ბრაუზერის მენიუში'];
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
        
        // Add keyboard support for closing modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });
    }
}