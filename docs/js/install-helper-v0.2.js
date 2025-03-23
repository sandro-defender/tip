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
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                animation: pulse 2s infinite;
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
                transition: bottom 0.3s ease-in-out;
                padding: 20px;
                box-sizing: border-box;
            }

            .install-instructions-modal.show {
                bottom: 0;
            }

            .modal-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 20px;
            }

            .modal-icon {
                width: 48px;
                height: 48px;
                margin-bottom: 10px;
                color: #4CAF50;
            }

            .install-instructions-steps {
                counter-reset: step;
                list-style: none;
                padding: 0;
            }

            .install-instructions-steps li {
                position: relative;
                padding-left: 30px;
                margin-bottom: 15px;
                line-height: 1.5;
                color: #666;
            }

            .install-instructions-steps li::before {
                content: counter(step);
                counter-increment: step;
                position: absolute;
                left: 0;
                top: 0;
                width: 24px;
                height: 24px;
                background: #4CAF50;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }

            .modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 5px;
            }

            .modal-close svg {
                width: 24px;
                height: 24px;
                color: #999;
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
                display: inline-block;
                margin-top: 15px;
                padding: 10px 20px;
                background: #007AFF;
                color: white;
                text-decoration: none;
                border-radius: 25px;
                font-weight: 500;
            }
            
            .safari-link:hover {
                background: #0056b3;
            }

            .copy-url-button {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-top: 15px;
                padding: 12px 20px;
                background: #007AFF;
                color: white;
                border: none;
                border-radius: 25px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            
            .copy-url-button:hover {
                background: #0056b3;
            }
            
            .copy-success {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                z-index: 2147483645;
                animation: fadeInOut 2s forwards;
            }
            
            @keyframes fadeInOut {
                0% { opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { opacity: 0; }
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
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <h3 id="modal-title">${title}</h3>
            </div>
            <ul class="install-instructions-steps">
                ${steps.map(step => `<li>${step}</li>`).join('')}
            </ul>
            ${extraContent}
        `;

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

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);

        if (extraContent.includes('copy-url-button')) {
            const modalElement = modal.querySelector('.copy-url-button');
            if (modalElement) {
                modalElement.addEventListener('click', () => this.copyToClipboard(this.getCurrentUrl()));
            }
        }
    }
}