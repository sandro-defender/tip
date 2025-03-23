function createBackupButton() {
    // Create button element
    const button = document.createElement('button');
    button.innerHTML = '💾 Backup';
    button.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        padding: 10px 20px;
        background: #4f46e5;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-family: 'Noto Sans Georgian', system-ui;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    button.addEventListener('click', async () => {
        const password = prompt('შეიყვანეთ პაროლი:');
        if (!password) return;

        try {
            button.disabled = true;
            button.innerHTML = '⏳ Backing up...';

            const response = await fetch(`https://staff.you.ge/api/github-backup.php?key=${encodeURIComponent(password)}`);
            
            // Check if response is ok first
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response. Please check server logs.');
            }

            const data = await response.json();

            if (data.success) {
                button.innerHTML = '✅ Done!';
                console.log('Backup result:', data);
                alert(`Backup completed!\nFiles changed: ${data.changed_files.length}\nErrors: ${data.errors.length}`);
            } else {
                throw new Error(data.error || 'Backup failed');
            }
        } catch (error) {
            button.innerHTML = '❌ Error';
            console.error('Backup error:', error);
            
            // Provide more helpful error message
            let errorMessage = error.message;
            if (errorMessage.includes('Unexpected token')) {
                errorMessage = 'Server returned invalid response. Please check server logs or try again later.';
            }
            alert('Backup failed: ' + errorMessage);
        } finally {
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = '💾 Backup';
            }, 2000);
        }
    });

    document.body.appendChild(button);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', createBackupButton);
