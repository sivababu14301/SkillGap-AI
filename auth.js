/* ============================================================
   SkillGap AI — Authentication Logic (Login + Register)
   Uses localStorage to simulate a database for this prototype.
   In production: replace with backend API calls.
   ============================================================ */

/* ===== Shared Utilities ===== */

function togglePassword(fieldId, btn) {
    const field = document.getElementById(fieldId);
    const icon  = btn.querySelector("i");
    if (field.type === "password") {
        field.type = "text";
        icon.className = "fas fa-eye-slash";
    } else {
        field.type = "password";
        icon.className = "fas fa-eye";
    }
}

function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.className = `auth-msg ${type}`;
    el.innerHTML = `<i class="fas fa-${type === "error" ? "exclamation-triangle" : "check-circle"}"></i> ${text}`;
    el.style.display = "flex";
}

function hideMsg(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
}

function setFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = msg ? `<i class="fas fa-exclamation-circle"></i> ${msg}` : "";
}

function setInputState(inputId, valid) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.classList.remove("valid", "invalid");
    el.classList.add(valid ? "valid" : "invalid");
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text    = btn.querySelector(".btn-text");
    const spinner = btn.querySelector(".btn-spinner");
    if (loading) {
        text.style.display    = "none";
        spinner.style.display = "flex";
        btn.disabled = true;
    } else {
        text.style.display    = "flex";
        spinner.style.display = "none";
        btn.disabled = false;
    }
}

/* --- DB helpers using localStorage --- */
const DB_KEY = "skillgap_users";

function getUsers() {
    let users = JSON.parse(localStorage.getItem(DB_KEY) || "[]");
    // Ensure default admin always exists
    if (!users.find(u => u.email === "adminsiva@skillgap.ai")) {
        users.push({ id: 1, user_id: "USR001", name: "Super Admin", email: "adminsiva@skillgap.ai", password: "password", role: "admin", status: "active", created_at: "2025-01-01T10:00:00Z" });
        localStorage.setItem(DB_KEY, JSON.stringify(users));
    }
    return users;
}

function saveUsers(users) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
}

function getSession() {
    return JSON.parse(sessionStorage.getItem("skillgap_session") || "null");
}

function saveSession(sessionData, remember) {
    sessionStorage.setItem("skillgap_session", JSON.stringify(sessionData));
    if (remember) {
        localStorage.setItem("skillgap_session", JSON.stringify(sessionData));
    }
}

function logout() {
    sessionStorage.removeItem("skillgap_session");
    localStorage.removeItem("skillgap_session");
    window.location.href = "login.html";
}

function requireAuth() {
    const session = getSession() || JSON.parse(localStorage.getItem("skillgap_session") || "null");
    if (!session) {
        window.location.href = "login.html";
        return null;
    }
    return session;
}

/* ===== Login Page Logic ===== */

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    const emailInput    = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    // Real-time validation
    emailInput.addEventListener("blur", () => {
        const val = emailInput.value.trim();
        if (!val) {
            setInputState("loginEmail", false);
            setFieldError("emailError", "Email is required.");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            setInputState("loginEmail", false);
            setFieldError("emailError", "Enter a valid email address.");
        } else {
            setInputState("loginEmail", true);
            setFieldError("emailError", "");
        }
    });

    passwordInput.addEventListener("blur", () => {
        const val = passwordInput.value;
        if (!val) {
            setInputState("loginPassword", false);
            setFieldError("passwordError", "Password is required.");
        } else if (val.length < 6) {
            setInputState("loginPassword", false);
            setFieldError("passwordError", "Password must be at least 6 characters.");
        } else {
            setInputState("loginPassword", true);
            setFieldError("passwordError", "");
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideMsg("loginMsg");

        const email    = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = document.getElementById("rememberMe")?.checked || false;
        const roleInput = document.querySelector('input[name="loginRole"]:checked') || document.querySelector('input[name="loginRole"]');
        const selectedRole = roleInput ? roleInput.value : "user";
        let valid      = true;

        // Validate email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setInputState("loginEmail", false);
            setFieldError("emailError", "Please enter a valid email address.");
            valid = false;
        }

        // Validate password
        if (!password || password.length < 6) {
            setInputState("loginPassword", false);
            setFieldError("passwordError", "Password must be at least 6 characters.");
            valid = false;
        }

        if (!valid) return;

        setLoading("loginBtn", true);

        try {
            const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://localhost:5000' : '';
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role: selectedRole })
            });

            const result = await response.json().catch(() => ({}));
            setLoading("loginBtn", false);

            if (!response.ok) {
                showMsg("loginMsg", result.error || "Login failed. Please try again.", "error");
                setInputState("loginEmail", false);
                setInputState("loginPassword", false);
                return;
            }

            // Success via Flask Backend API
            saveSession(result.session, remember);
            showMsg("loginMsg", `Welcome back, ${result.session.user_name}! Redirecting...`, "success");

            setTimeout(() => {
                if (result.session.role === "admin") {
                    window.location.href = "admin-dashboard.html";
                } else {
                    window.location.href = "dashboard.html";
                }
            }, 1200);

        } catch (err) {
            setLoading("loginBtn", false);
            showMsg("loginMsg", "Cannot connect to the server. Please ensure the backend is running.", "error");
        }
    });
}

/* ===== Register Page Logic ===== */

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    const passwordInput  = document.getElementById("regPassword");

    // Password strength meter
    if (passwordInput) {
        passwordInput.addEventListener("input", () => {
            const val    = passwordInput.value;
            const meter  = document.getElementById("strengthMeter");
            const fill   = document.getElementById("strengthFill");
            const label  = document.getElementById("strengthLabel");

            meter.classList.add("visible");

            let strength = 0;
            if (val.length >= 6)               strength++;
            if (val.length >= 10)              strength++;
            if (/[A-Z]/.test(val))             strength++;
            if (/[0-9]/.test(val))             strength++;
            if (/[^A-Za-z0-9]/.test(val))      strength++;

            const levels = [
                { pct: "20%",  color: "#EF4444", text: "Very Weak" },
                { pct: "40%",  color: "#F97316", text: "Weak" },
                { pct: "60%",  color: "#EAB308", text: "Fair" },
                { pct: "80%",  color: "#3B82F6", text: "Strong" },
                { pct: "100%", color: "#10B981", text: "Very Strong" },
            ];

            const lvl = levels[Math.max(0, strength - 1)];
            fill.style.width      = lvl.pct;
            fill.style.background = lvl.color;
            label.textContent     = lvl.text;
            label.style.color     = lvl.color;
        });
    }

    let userRememberKey = "";

    const hitRememberKeyBtn = document.getElementById("hitRememberKeyBtn");
    const hitRememberKeyMsg = document.getElementById("hitRememberKeyMsg");
    const rememberKeyInput = document.getElementById("rememberKey");
    
    if (hitRememberKeyBtn && hitRememberKeyMsg && rememberKeyInput) {
        hitRememberKeyBtn.addEventListener("click", () => {
            const keyVal = rememberKeyInput.value.trim();
            if (keyVal.length > 0) {
                userRememberKey = keyVal;
                hitRememberKeyMsg.style.display = "block";
                hitRememberKeyBtn.style.background = "rgba(16, 185, 129, 0.15)";
                hitRememberKeyBtn.style.color = "#10B981";
                hitRememberKeyBtn.style.borderColor = "rgba(16, 185, 129, 0.4)";
                setFieldError("rememberKeyError", "");
                
                setTimeout(() => {
                    hitRememberKeyBtn.style.background = "rgba(79, 70, 229, 0.15)";
                    hitRememberKeyBtn.style.color = "#818CF8";
                    hitRememberKeyBtn.style.borderColor = "rgba(79, 70, 229, 0.4)";
                }, 2000);
            } else {
                setFieldError("rememberKeyError", "Please enter a memorable key first.");
            }
        });
    }

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideMsg("registerMsg");

        const name      = document.getElementById("fullName").value.trim();
        const email     = document.getElementById("regEmail").value.trim();
        const password  = document.getElementById("regPassword").value;
        const confirm   = document.getElementById("confirmPassword").value;
        const agreed    = document.getElementById("agreeTerms").checked;
        const roleInput = document.querySelector('input[name="accountType"]:checked') || document.querySelector('input[name="accountType"]');
        const selectedRole = roleInput ? roleInput.value : "user";
        let valid       = true;

        // Clear previous errors
        ["nameError","regEmailError","regPasswordError","confirmPasswordError","termsError"].forEach(id => setFieldError(id, ""));

        // Validate name
        if (!name || name.length < 2) {
            setFieldError("nameError", "Full name is required (at least 2 characters).");
            setInputState("fullName", false);
            valid = false;
        } else {
            setInputState("fullName", true);
        }

        // Validate email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFieldError("regEmailError", "Please enter a valid email address.");
            setInputState("regEmail", false);
            valid = false;
        } else {
            setInputState("regEmail", true);
        }

        // Validate password
        if (!password || password.length < 6) {
            setFieldError("regPasswordError", "Password must be at least 6 characters.");
            setInputState("regPassword", false);
            valid = false;
        } else {
            setInputState("regPassword", true);
        }

        // Validate confirm password
        if (password !== confirm) {
            setFieldError("confirmPasswordError", "Passwords do not match.");
            setInputState("confirmPassword", false);
            valid = false;
        } else if (confirm.length > 0) {
            setInputState("confirmPassword", true);
        }

        // Validate terms
        if (!agreed) {
            setFieldError("termsError", "You must agree to the Terms of Service.");
            valid = false;
        }

        if (!valid) return;

        setLoading("registerBtn", true);

        try {
            const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:5000' : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000') ? 'http://localhost:5000' : '';
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role: selectedRole, remember_key: userRememberKey })
            });

            const result = await response.json().catch(() => ({}));
            setLoading("registerBtn", false);

            if (!response.ok) {
                showMsg("registerMsg", result.error || "Registration failed.", "error");
                setInputState("regEmail", false);
                setFieldError("regEmailError", result.error || "Failed");
                return;
            }

            // Success via Flask Backend API
            showMsg("registerMsg", "Registration successful! Redirecting to login...🎉", "success");

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (err) {
            setLoading("registerBtn", false);
            showMsg("registerMsg", "Cannot connect to the server. Please ensure the backend is running.", "error");
        }
    });
}

