document.addEventListener('DOMContentLoaded', function() {
    // Create the floating menu HTML structure
    const menuHTML = `
        <div class="floating-menu-container">
            <input type="checkbox" id="toggle" checked />
            <label class="button" for="toggle">
                <nav class="nav">
                    <ul>
                        <li><a href="/"><i class="ri-home-line"></i></a></li>
                        <li><a href="/tip"><i class="ri-money-dollar-circle-line"></i></a></li>
                        <li><a href="/statistics"><i class="ri-bar-chart-line"></i></a></li>
                        <li><a href="/salary"><i class="ri-bank-line"></i></a></li>
                        <li><a href="/shift"><i class="ri-calendar-line"></i></a></li>
                    </ul>
                </nav>
            </label>
        </div>
    `;

    // Add the Remix Icon CSS
    const remixIconLink = document.createElement('link');
    remixIconLink.rel = 'stylesheet';
    remixIconLink.href = 'https://cdn.jsdelivr.net/npm/remixicon@2.2.0/fonts/remixicon.css';
    document.head.appendChild(remixIconLink);

    // Add menu styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .floating-menu-container {
            position: fixed;
            left: 20px;
            bottom: 20px;
            width: auto;
            z-index: 9999;
        }
        
        .floating-menu-container * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        #toggle {
            -webkit-appearance: none;
        }

        .button {
            position: relative;
            z-index: 999;
            width: 380px;  /* reduced from 420px */
            height: 65px;
            background: rgba(34, 34, 34, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            cursor: pointer;
            display: flex;
            justify-content: left;
            align-items: center;
            padding: 0 24px 0 40px; /* increased left padding */
            overflow: hidden;
            transition: width 300ms linear;
        }

        .button:before {
            position: absolute;
            content: "";
            width: 20px;
            height: 2px;
            background: #eeff00;
            transform: rotate(225deg);
            transition: all 0.4s ease;
            left: 24px;
        }

        .button:after {
            position: absolute;
            content: "";
            width: 20px;
            height: 2px;
            background: #eeff00;
            transform: rotate(135deg);
            transition: all 0.4s ease;
            left: 24px;
        }

        .nav {
            opacity: 1;
            transition: all 0.5s ease-in-out;
            background: transparent;
            width: 100%;
            border-radius: 5px;
            transform: translateX(0%); /* removed transform */
            padding: 10px 20px; /* even padding */
        }

        .nav ul {
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: row;
            gap: 32px;
            justify-content: flex-start;
        }

        .nav li {
            opacity: 0;
            list-style: none;
        }

        .nav li:nth-child(1) { animation: itop 300ms 300ms linear forwards; }
        .nav li:nth-child(2) { animation: itop 300ms 400ms linear forwards; }
        .nav li:nth-child(3) { animation: itop 300ms 500ms linear forwards; }
        .nav li:nth-child(4) { animation: itop 300ms 600ms linear forwards; }
        .nav li:nth-child(5) { animation: itop 300ms 700ms linear forwards; }

        .nav a {
            transition: all 0.5s linear;
            text-decoration: none;
            color: #eeff00;
            font-size: 28px;
            width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
        }

        .nav a i {
            font-size: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .nav a:hover {
            color: #fff;
            background: rgba(28, 28, 28, 0.8);
            border-radius: 12px;
            transform: scale(1.1);
        }

        #toggle:checked ~ label .nav {
            display: none;
            opacity: 0;
            transform: translateX(0);
        }

        #toggle:checked ~ .button:before {
            transform: rotate(90deg);
        }

        #toggle:checked ~ .button:after {
            transform: rotate(0deg);
        }

        #toggle:checked ~ .button {
            width: 70px;
            transition: all 0.1s linear;
            background: rgba(34, 34, 34, 0.8);
        }

        @keyframes itop {
            0% {
                opacity: 0;
                transform: translateY(60px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 480px) {
            .floating-menu-container {
                left: 10px;
                right: 10px;
                bottom: 10px;
                width: calc(100% - 20px);
            }
            .button {
                width: 100%;
                max-width: 380px;
                height: 60px;
                padding: 0 16px 0 35px;
            }
            .nav {
                padding: 10px;
            }
            .nav ul {
                gap: 20px;
                justify-content: space-evenly;
            }
            .nav a {
                font-size: 24px;
                width: 40px;
                height: 40px;
            }
            .nav a i {
                font-size: 24px;
            }
        }

        @media (max-width: 420px) {
            .floating-menu-container {
                left: 10px;
                right: 10px;
                bottom: 10px;
                width: calc(100% - 20px);
            }
            .button {
                width: 100%;
                height: 55px;
                padding: 0 16px 0 35px;
            }
            .nav {
                padding: 10px;
            }
            .nav ul {
                gap: 16px;
                justify-content: space-around;
            }
            .nav a {
                font-size: 22px;
                width: 38px;
                height: 38px;
            }
            .nav a i {
                font-size: 22px;
            }
        }

        @media (max-width: 360px) {
            .button {
                width: 260px;
                height: 50px;
                padding: 0 12px 0 32px;
            }
            .nav ul {
                gap: 12px;
            }
            .nav a {
                font-size: 20px;
                width: 35px;
                height: 35px;
            }
            .nav a i {
                font-size: 20px;
            }
        }

        @media (max-width: 320px) {
            .button {
                height: 45px;
                padding: 0 10px 0 30px;
            }
            .nav ul {
                gap: 10px;
            }
            .nav a {
                font-size: 18px;
                width: 32px;
                height: 32px;
            }
            .nav a i {
                font-size: 18px;
            }
        }
    `;
    document.head.appendChild(styleSheet);

    // Add menu to the page
    const menuContainer = document.createElement('div');
    menuContainer.innerHTML = menuHTML;
    document.body.appendChild(menuContainer);
});