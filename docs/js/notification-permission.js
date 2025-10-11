/*
Project: Tip Tracker
File: notification-permission.js
Version: 1.1
Author: Cursor AI
Model: Claude 3.5 Sonnet
Last Modified: 2025-01-27
Purpose: Simple notification permission modal for PWA mode only
*/

(function() {
    'use strict';

    // Check if we're in PWA mode
    function isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }

    // Check notification permission state
    function getNotificationPermission() {
        if ('Notification' in window) {
            return Notification.permission;
        }
        return 'denied';
    }

    // Check if we should show the modal
    function shouldShowModal() {
        // Only show in PWA mode
        if (!isPWA()) {
            console.log('Not in PWA mode, skipping notification permission');
            return false;
        }

        // Don't show if already granted or denied
        const permission = getNotificationPermission();
        if (permission === 'granted' || permission === 'denied') {
            console.log('Notification permission already handled:', permission);
            return false;
        }

        // Check if user previously skipped
        const skipData = localStorage.getItem('notification-skipped');
        if (skipData) {
            const skipTime = parseInt(skipData, 10);
            const hoursSinceSkip = (Date.now() - skipTime) / (1000 * 60 * 60);
            
            // Show again after 24 hours
            if (hoursSinceSkip < 24) {
                console.log('User skipped recently, not showing');
                return false;
            } else {
                // Clear old skip data
                localStorage.removeItem('notification-skipped');
            }
        }

        return true;
    }

    // Create modal HTML
    function createModal() {
        const modal = document.createElement('div');
        modal.id = 'notification-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                margin: 20px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            ">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="
                        width: 64px;
                        height: 64px;
                        margin: 0 auto 16px;
                        background: linear-gradient(135deg, #6366f1, #3b82f6);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                    ">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </div>
                    <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #374151;">
                        მიიღეთ შეტყობინებები
                    </h3>
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                        ჩვენ გაგზავნით შეტყობინებებს ახალი ჩარიცხვებისა და განახლებების შესახებ.
                    </p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button id="notification-skip" style="
                        flex: 1;
                        padding: 12px 16px;
                        border: 1px solid #e5e7eb;
                        background: transparent;
                        color: #6b7280;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">
                        ახლა არა
                    </button>
                    <button id="notification-allow" style="
                        flex: 1;
                        padding: 12px 16px;
                        border: none;
                        background: linear-gradient(135deg, #6366f1, #3b82f6);
                        color: white;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">
                        დაშვება
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    // Show modal
    function showModal() {
        if (!shouldShowModal()) {
            return;
        }

        const modal = createModal();
        document.body.appendChild(modal);

        // Show with animation
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            const content = modal.querySelector('div');
            content.style.transform = 'scale(1)';
        }, 10);

        // Add event listeners
        const allowBtn = modal.querySelector('#notification-allow');
        const skipBtn = modal.querySelector('#notification-skip');

        allowBtn.addEventListener('click', handleAllow);
        skipBtn.addEventListener('click', handleSkip);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleSkip();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.visibility === 'visible') {
                handleSkip();
            }
        });
    }

    // Handle allow button
    async function handleAllow() {
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('Notification permission granted');
                
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
                localStorage.setItem('notification-granted', Date.now().toString());
                localStorage.removeItem('notification-skipped');
                
                showSuccessMessage();
            } else {
                console.log('Notification permission denied');
                localStorage.setItem('notification-denied', Date.now().toString());
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }

        closeModal();
    }

    // Handle skip button
    function handleSkip() {
        console.log('User skipped notification permission');
        localStorage.setItem('notification-skipped', Date.now().toString());
        closeModal();
    }

    // Close modal
    function closeModal() {
        const modal = document.getElementById('notification-modal');
        if (modal) {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // Show success message
    function showSuccessMessage() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #6366f1;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000000;
            font-size: 14px;
            font-weight: 500;
            animation: slideUp 0.5s ease;
        `;
        
        notification.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: middle;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            შეტყობინებები ჩართულია!
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from { opacity: 0; transform: translate(-50%, 20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.5s ease reverse';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // Initialize when page loads
    function init() {
        // Wait for page to be fully loaded
        if (document.readyState === 'complete') {
            setTimeout(showModal, 2000);
        } else {
            window.addEventListener('load', () => {
                setTimeout(showModal, 2000);
            }, { once: true });
        }
    }

    // Start initialization
    init();

})();

/*
CHANGELOG
[2025-01-27] v1.1 – Created simple notification permission modal for PWA mode only.
Reason: To implement a working notification permission request that only appears in PWA mode.
Thoughts: Simple IIFE approach with inline styles for better compatibility and reliability.
Model: Claude 3.5 Sonnet
*/
