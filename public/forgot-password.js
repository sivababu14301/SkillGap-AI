document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgotForm');
    if (!forgotForm) return;

    const emailInput = document.getElementById('forgotEmail');
    const emailGroup = document.getElementById('emailGroup');
    const passwordFields = document.getElementById('passwordFields');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    const emailError = document.getElementById('emailError');
    const newPasswordError = document.getElementById('newPasswordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    
    const forgotMsg = document.getElementById('forgotMsg');
    const forgotBtn = document.getElementById('forgotBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const spinnerText = btnSpinner ? btnSpinner.querySelector('.spinner-text') : null;
    
    const hitGenerate = document.getElementById('hitGenerate');
    if (hitGenerate) {
        hitGenerate.addEventListener('click', () => {
            const prefixes = ['Siva', 'Skill', 'User', 'Tech', 'Data', 'Code', 'Admin', 'Dev', 'AI'];
            const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            const generated = `${randomPrefix}@${randomNum}`;
            if (newPassword) newPassword.value = generated;
        });
    }

    let step = 1; // 1: Verify Email, 2: Remember Access, 3: Reset Password
    let userToken = "";

    const rememberAccessSection = document.getElementById('rememberAccessSection');
    const accessBtn = document.getElementById('accessBtn');

    if (accessBtn) {
        accessBtn.addEventListener('click', async () => {
            const email = emailInput.value.trim();
            const tokenInput = document.getElementById('forgotRememberKey');
            const token = tokenInput ? tokenInput.value.trim() : "";
            
            if (!token) {
                showMessage('Please enter your Remember Access key.', 'error');
                return;
            }
            
            userToken = token;
            
            const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';
            accessBtn.disabled = true;
            accessBtn.textContent = 'Verifying...';

            try {
                const response = await fetch(`${API_BASE}/api/auth/verify-recovery-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, token })
                });
                const data = await response.json();

                if (response.ok) {
                    step = 3;
                    if (rememberAccessSection) rememberAccessSection.style.display = 'none';
                    if (passwordFields) passwordFields.style.display = 'block';
                    if (forgotBtn) {
                        forgotBtn.style.display = 'flex';
                        forgotBtn.disabled = false;
                    }
                    if (btnText) {
                        btnText.innerHTML = '<i class="fas fa-key"></i> Reset Password';
                        btnText.style.display = 'flex';
                    }
                    if (btnSpinner) btnSpinner.style.display = 'none';
                    
                    const headerH1 = document.querySelector('.form-header h1');
                    if (headerH1) headerH1.innerHTML = 'New <span class="gradient-text">Password</span>';
                    
                    const headerP = document.querySelector('.form-header p');
                    if (headerP) headerP.textContent = 'Enter your new secure password';
                    clearError(emailError);
                    forgotMsg.style.display = 'none';
                } else {
                    showMessage(data.error || 'Failed to verify Remember Access.', 'error');
                }
            } catch (err) {
                showMessage('Network error. Please try again.', 'error');
            } finally {
                accessBtn.disabled = false;
                accessBtn.textContent = 'Remember Access';
            }
        });
    }

    function showError(el, msg) {
        el.textContent = msg;
        el.style.display = 'block';
        el.previousElementSibling.classList.add('error');
    }

    function clearError(el) {
        el.textContent = '';
        el.style.display = 'none';
        el.previousElementSibling.classList.remove('error');
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showMessage(msg, type = 'success') {
        forgotMsg.textContent = msg;
        forgotMsg.className = `auth-msg ${type}`;
        forgotMsg.style.display = 'block';
    }

    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        clearError(emailError);
        clearError(newPasswordError);
        clearError(confirmPasswordError);
        forgotMsg.style.display = 'none';

        const email = emailInput.value.trim();
        const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';

        if (step === 1) {
            // Step 1: Verify Email
            let isValid = true;
            if (!email) {
                if (emailError) showError(emailError, 'Email is required');
                isValid = false;
            } else if (!validateEmail(email)) {
                if (emailError) showError(emailError, 'Please enter a valid email address');
                isValid = false;
            }
            if (!isValid) return;

            if (forgotBtn) forgotBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnSpinner) {
                if (spinnerText) spinnerText.textContent = 'Processing...';
                btnSpinner.style.display = 'flex';
            }

            try {
                const response = await fetch(`${API_BASE}/api/auth/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();

                if (response.ok) {
                    // Move to Step 2
                    step = 2;
                    if (emailGroup) emailGroup.style.display = 'none';
                    if (rememberAccessSection) rememberAccessSection.style.display = 'block';
                    if (forgotBtn) forgotBtn.style.display = 'none';
                } else {
                    showMessage(data.error || 'Failed to verify email', 'error');
                }
            } catch (err) {
                showMessage('Network error. Please try again.', 'error');
            } finally {
                if (forgotBtn && step === 1) forgotBtn.disabled = false;
                if (btnText && step === 1) btnText.style.display = 'flex';
                if (btnSpinner && step === 1) btnSpinner.style.display = 'none';
            }

        } else if (step === 3) {
            // Step 3: Reset Password
            let isValid = true;
            const pwd = newPassword ? newPassword.value : '';
            const cpwd = confirmPassword ? confirmPassword.value : '';

            if (!pwd) {
                if (newPasswordError) showError(newPasswordError, 'New password is required');
                isValid = false;
            } else if (pwd.length < 6) {
                if (newPasswordError) showError(newPasswordError, 'Password must be at least 6 characters');
                isValid = false;
            }

            if (!cpwd) {
                if (confirmPasswordError) showError(confirmPasswordError, 'Please confirm your password');
                isValid = false;
            } else if (pwd !== cpwd) {
                if (confirmPasswordError) showError(confirmPasswordError, 'Passwords do not match');
                isValid = false;
            }

            if (!isValid) return;

            if (forgotBtn) forgotBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnSpinner) {
                if (spinnerText) spinnerText.textContent = 'Resetting...';
                btnSpinner.style.display = 'flex';
            }

            try {
                const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: pwd, token: userToken })
                });
                const data = await response.json();

                if (response.ok) {
                    showMessage(data.message || 'Password changed successfully ✓', 'success');
                    if (forgotForm) forgotForm.reset();
                    // Redirect to login after 2 seconds
                    setTimeout(() => {
                        window.location.href = "login.html";
                    }, 2000);
                } else {
                    showMessage(data.error || 'Failed to reset password', 'error');
                }
            } catch (err) {
                showMessage('Network error. Please try again.', 'error');
            } finally {
                if (forgotBtn) forgotBtn.disabled = false;
                if (btnText) {
                    btnText.innerHTML = '<i class="fas fa-key"></i> Reset Password';
                    btnText.style.display = 'flex';
                }
                if (btnSpinner) btnSpinner.style.display = 'none';
            }
        }
    });
});
