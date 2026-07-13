// ====================================
// AUTHENTICATION - Login & Register (Supabase-backed)
//
// UI behaviour (tabs, password strength, show/hide, remember-me,
// verification notice, social buttons) is unchanged from the original.
// The localStorage "mock" backend has been replaced with real Supabase
// Auth. On success we also write the `nanaForexUser` mirror via
// NanaSession so the rest of the users/* pages keep working.
//
// Requires (loaded before this file):
//   @supabase/supabase-js -> env.js -> supabase-client.js -> user-session.js
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  if (typeof supabaseClient === "undefined" || typeof NanaSession === "undefined") {
    console.error("[authentication] Supabase not loaded — check script order.");
  }

  const DASHBOARD_URL = "client-dashboard.html";

  // ====================================
  // DOM REFERENCES
  // ====================================
  const tabs = document.querySelectorAll(".auth-tab");
  const forms = {
    login: document.getElementById("loginForm"),
    register: document.getElementById("registerForm"),
  };
  const loginForm = document.getElementById("loginFormElement");
  const registerForm = document.getElementById("registerFormElement");
  const loginStatus = document.getElementById("loginStatus");
  const registerStatus = document.getElementById("registerStatus");
  const verificationNotice = document.getElementById("verificationNotice");

  // ====================================
  // TAB SWITCHING
  // ====================================
  function switchTab(tab) {
    const formId = tab.dataset.form;

    tabs.forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });

    Object.keys(forms).forEach((key) => {
      forms[key].classList.toggle("active", key === formId);
    });

    clearStatus(loginStatus);
    clearStatus(registerStatus);

    if (verificationNotice) verificationNotice.classList.remove("show");
  }

  function clearStatus(element) {
    if (!element) return;
    element.className = "form-status";
    element.textContent = "";
    element.style.display = "none";
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      switchTab(this);
    });
  });

  document.getElementById("switchToRegister")?.addEventListener("click", function (e) {
    e.preventDefault();
    switchTab(document.querySelector('.auth-tab[data-form="register"]'));
  });

  document.getElementById("switchToLogin")?.addEventListener("click", function (e) {
    e.preventDefault();
    switchTab(document.querySelector('.auth-tab[data-form="login"]'));
  });

  // ====================================
  // TOGGLE PASSWORD VISIBILITY
  // ====================================
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", function () {
      const input = this.closest(".input-wrapper").querySelector("input");
      const icon = this.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.className = "fas fa-eye-slash";
      } else {
        input.type = "password";
        icon.className = "fas fa-eye";
      }
    });
  });

  // ====================================
  // PASSWORD STRENGTH (Register)
  // ====================================
  const passwordInput = document.getElementById("registerPassword");
  const strengthFill = document.getElementById("strengthFill");
  const strengthLabel = document.getElementById("strengthLabel");

  passwordInput?.addEventListener("input", function () {
    const password = this.value;
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    const percentage = (strength / 4) * 100;
    const strengthMap = {
      0: { label: "Weak", color: "#ff4d4d" },
      1: { label: "Weak", color: "#ff4d4d" },
      2: { label: "Fair", color: "#f5b700" },
      3: { label: "Good", color: "#00c896" },
      4: { label: "Strong", color: "#00ff88" },
    };

    const result = strengthMap[strength] || strengthMap[0];
    strengthFill.style.width = percentage + "%";
    strengthFill.style.background = result.color;
    strengthLabel.textContent = result.label;
    strengthLabel.style.color = result.color;
  });

  // ====================================
  // STATUS + BUTTON HELPERS
  // ====================================
  function showStatus(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = "form-status " + type;
    element.style.display = "block";
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle("loading", loading);
    btn.disabled = loading;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ====================================
  // LOGIN HANDLER (Supabase)
  // ====================================
  loginForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;
    const btn = document.getElementById("loginBtn");

    if (!email || !password) {
      showStatus(loginStatus, "Please fill in all required fields.", "error");
      return;
    }
    if (!isValidEmail(email)) {
      showStatus(loginStatus, "Please enter a valid email address.", "error");
      return;
    }

    setLoading(btn, true);

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      // Supabase returns "Email not confirmed" when verification is pending.
      if (/confirm/i.test(error.message)) {
        verificationNotice?.classList.add("show");
      }
      showStatus(loginStatus, error.message, "error");
      setLoading(btn, false);
      return;
    }

    NanaSession.writeMirror(data.user, rememberMe);
    showStatus(loginStatus, "Login successful! Redirecting...", "success");
    setTimeout(() => (window.location.href = DASHBOARD_URL), 800);
  });

  // ====================================
  // REGISTER HANDLER (Supabase)
  // ====================================
  registerForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const phone = document.getElementById("registerPhone").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;
    const btn = document.getElementById("registerBtn");

    if (!name || !email || !password || !confirmPassword) {
      showStatus(registerStatus, "Please fill in all required fields.", "error");
      return;
    }
    if (name.length < 2) {
      showStatus(registerStatus, "Name must be at least 2 characters.", "error");
      return;
    }
    if (!isValidEmail(email)) {
      showStatus(registerStatus, "Please enter a valid email address.", "error");
      return;
    }
    if (password.length < 8) {
      showStatus(registerStatus, "Password must be at least 8 characters.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showStatus(registerStatus, "Passwords do not match.", "error");
      return;
    }

    setLoading(btn, true);

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone: phone || "" },
        emailRedirectTo: window.location.origin + "/users/login",
      },
    });

    if (error) {
      showStatus(registerStatus, error.message, "error");
      setLoading(btn, false);
      return;
    }

    setLoading(btn, false);

    // No session => email confirmation is required.
    if (!data.session) {
      verificationNotice?.classList.add("show");
      showStatus(
        registerStatus,
        "Account created! Please check your email to verify your address.",
        "success"
      );
      registerForm.reset();
      if (strengthFill) strengthFill.style.width = "0%";
      if (strengthLabel) {
        strengthLabel.textContent = "Weak";
        strengthLabel.style.color = "#ff4d4d";
      }
      setTimeout(() => {
        switchTab(document.querySelector('.auth-tab[data-form="login"]'));
        showStatus(loginStatus, "Please log in once your email is verified.", "success");
        document.getElementById("loginEmail").value = email;
      }, 2500);
      return;
    }

    // Confirmation disabled => user is signed in immediately.
    NanaSession.writeMirror(data.user, true);
    showStatus(registerStatus, "Account created! Redirecting...", "success");
    setTimeout(() => (window.location.href = DASHBOARD_URL), 800);
  });

  // ====================================
  // FORGOT PASSWORD (Supabase reset email)
  // ====================================
  document.getElementById("forgotPassword")?.addEventListener("click", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();

    if (!email || !isValidEmail(email)) {
      showStatus(loginStatus, "Enter your email above to reset your password.", "error");
      return;
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/update-password",
    });

    if (error) {
      showStatus(loginStatus, error.message, "error");
      return;
    }
    showStatus(loginStatus, `Password reset link sent to ${email}. Check your inbox.`, "success");
  });

  // ====================================
  // SOCIAL LOGIN (Supabase OAuth)
  // Requires the provider to be enabled in the Supabase dashboard.
  // ====================================
  document.querySelectorAll(".social-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const provider = this.classList.contains("google") ? "google" : "facebook";
      const parentForm = this.closest(".auth-form");
      const statusEl = parentForm.querySelector(".form-status");

      showStatus(statusEl, `Connecting with ${provider}...`, "success");

      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + "/users/" + DASHBOARD_URL },
      });

      if (error) {
        showStatus(statusEl, error.message, "error");
      }
    });
  });

  // ====================================
  // ENTER KEY SUPPORT
  // ====================================
  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        const form = this.closest("form");
        if (form) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit"));
      }
    });
  });

  // ====================================
  // REDIRECT IF ALREADY LOGGED IN
  // ====================================
  (async () => {
    const session = await NanaSession.getSession();
    if (session) {
      NanaSession.writeMirror(session.user, true);
      window.location.href = DASHBOARD_URL;
    }
  })();

  // ====================================
  // PASSWORD STRENGTH RESET ON REGISTER FORM RESET
  // ====================================
  document.getElementById("registerFormElement")?.addEventListener("reset", function () {
    if (strengthFill) strengthFill.style.width = "0%";
    if (strengthLabel) {
      strengthLabel.textContent = "Weak";
      strengthLabel.style.color = "#ff4d4d";
    }
  });
});
