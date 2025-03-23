class NeumorphismMenu {
    constructor(options = {}) {
        const defaultItems = [
            { icon: '🏠', link: '/' },
            { icon: '💰', link: '/tip' },
            { icon: '📊', link: '/statistics' },
            { icon: '🏦', link: '/salary' },
            { icon: '📅', link: '/shift' }
        ];
        this.menuItems = options.menuItems || defaultItems;
        this.init();
    }

    createStyles() {
        // Remove any existing menu styles first
        const existingStyle = document.getElementById('neum-menu-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'neum-menu-styles';
        style.textContent = `
            .neum-menu {
                position: fixed;
                left: 50%;
                bottom: 0;
                transform: translateX(-50%);
                z-index: 9999;
            }
            .neum-menu .menu {
                position: relative;
                padding: 22px;
                background: rgba(255, 255, 255, 0.27);
                border-radius: 100%;
                cursor: pointer;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            }
            @media (prefers-color-scheme: dark) {
                .neum-menu .menu {
                    background: rgba(42, 42, 60, 0.07);
                }
                .neum-menu .menu::before, .neum-menu .menu::after {
                    background:rgb(28, 28, 95);
                }
                .neum-menu .button {
                    background: rgba(42, 42, 60, 0.22);
                }
            }
            .neum-menu .menu::before, .neum-menu .menu::after {
                content: "";
                background: #c3c2c7;
                border-radius: 5px;
                width: 22px;
                height: 3px;
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                transition: 0.2s ease;
                z-index: 1;
            }
            .neum-menu .menu::before { transform: translate(-50%, -50%) rotate(0deg); }
            .neum-menu .menu::after { transform: translate(-50%, -50%) rotate(-90deg); }
            .neum-menu .menu.open::before { transform: translate(-50%, -50%) rotate(45deg); }
            .neum-menu .menu.open::after { transform: translate(-50%, -50%) rotate(-45deg); }
            .neum-menu .menu.open .button {
                opacity: 1;
                pointer-events: auto;
            }
            .neum-menu .button {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 45px;
                height: 45px;
                border-radius: 50%;
                cursor: pointer;
                background: rgba(232, 232, 243, 0.1);
                position: absolute;
                bottom: 0;
                right: 0;
                opacity: 0;
                pointer-events: auto;
                transition: 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28), 0.2s ease opacity;
                font-size: 20px;
                text-decoration: none;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            }
            .neum-menu .button:hover {
                transform: scale(1.1);
            }
            .neum-menu .menu.open .button:nth-of-type(1) {
                bottom: 0px;
                right: 100px;
                transition-delay: 0s;
            }
            .neum-menu .menu.open .button:nth-of-type(2) {
                bottom: 70px;
                right: 70px;
                transition-delay: 0.1s;
            }
            .neum-menu .menu.open .button:nth-of-type(3) {
                bottom: 100px;
                right: 0;
                transition-delay: 0.2s;
            }
            .neum-menu .menu.open .button:nth-of-type(4) {
                bottom: 70px;
                right: -70px;
                transition-delay: 0.3s;
            }
            .neum-menu .menu.open .button:nth-of-type(5) {
                bottom: 0;
                right: -100px;
                transition-delay: 0.4s;
            }

        `;
        document.head.appendChild(style);
    }

    createMenu() {
        // Remove any existing menu first
        const existingMenu = document.querySelector('.neum-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menuContainer = document.createElement('div');
        menuContainer.className = 'neum-menu';
        
        const menuHtml = `
            <div class="menu">
                ${this.menuItems.map((item, index) => `
                    <a href="${item.link}" class="button">
                        ${item.icon}
                    </a>
                `).join('')}
            </div>
        `;
        
        menuContainer.innerHTML = menuHtml;
        
        const menuToggle = menuContainer.querySelector('.menu');
        
        // Fixed event handling for the menu toggle
        menuToggle.addEventListener('click', (e) => {
            // Check if click is on the menu itself
            if (e.target === menuToggle || 
                e.target.classList.contains('menu')) {
                e.preventDefault();
                e.stopPropagation();
                menuToggle.classList.toggle('open');
            }
        });

        // Enable button clicks
        const buttons = menuContainer.querySelectorAll('.button');
        buttons.forEach(btn => {
            btn.style.pointerEvents = 'auto';
            btn.addEventListener('click', (e) => {
                if (!menuToggle.classList.contains('open')) {
                    e.preventDefault();
                } else {
                    // Allow the link to work when menu is open
                    e.stopPropagation();
                }
            });
        });

        // Simplified append logic
        if (document.body) {
            document.body.appendChild(menuContainer);
        } else {
            window.addEventListener('load', () => {
                document.body.appendChild(menuContainer);
            }, { once: true });
        }
    }

    init() {
        this.createStyles();
        this.createMenu();
    }
}

// Simplified initialization - only create one instance
let menuInstance = null;
window.createNeumorphismMenu = function(options) {
    if (menuInstance) {
        return menuInstance;
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            menuInstance = new NeumorphismMenu(options);
        });
    } else {
        menuInstance = new NeumorphismMenu(options);
    }
    return menuInstance;
};
