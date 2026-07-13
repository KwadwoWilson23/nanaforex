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
  // CONTINUE WITH GOOGLE — via Google Identity Services popup
  //
  // Users never leave nanaforex.com. The Google Sign-In popup returns
  // an ID token directly to our page, which we hand to Supabase via
  // signInWithIdToken(). Supabase still creates/updates the user row
  // in auth.users; only the URL flash to supabase.co is avoided.
  //
  // Requires:
  //   - env.js: window.NANA_FOREX_ENV.GOOGLE_CLIENT_ID set
  //   - Google Cloud OAuth Client (Web) with our origin in
  //     "Authorized JavaScript origins"
  //   - Supabase: Auth → Providers → Google → ON, same Client ID
  //     pasted under "Authorized Client IDs (for OAuth)"
  // ====================================
  (function initGoogleSignIn() {
    const clientId =
      (window.NANA_FOREX_ENV && window.NANA_FOREX_ENV.GOOGLE_CLIENT_ID) || "";
    const googleContainers = document.querySelectorAll(
      "[data-google-container]"
    );
    const googleWraps = document.querySelectorAll(".google-btn-wrap");

    // Not configured yet → hide the Google buttons cleanly so users
    // don't click a dead button. When you paste the Client ID and push,
    // they reappear automatically.
    if (!clientId) {
      googleWraps.forEach((w) => (w.style.display = "none"));
      const dividers = document.querySelectorAll(".auth-divider");
      dividers.forEach((d) => (d.style.display = "none"));
      return;
    }

    // Wait for Google's GSI library to load before initializing.
    function whenGsiReady(cb) {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        cb();
      } else {
        setTimeout(() => whenGsiReady(cb), 100);
      }
    }

    // Build a hashed nonce (sent to Google) + keep the raw one (sent to Supabase)
    // for CSRF protection on the ID token exchange.
    async function makeNoncePair() {
      const raw =
        (crypto.randomUUID && crypto.randomUUID()) +
        (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36));
      const bytes = new TextEncoder().encode(raw);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hashed = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return { raw, hashed };
    }

    async function handleCredential(response) {
      // Find the currently-active status element for feedback.
      const statusEl =
        document.querySelector(".auth-form.active .form-status") || loginStatus;
      showStatus(statusEl, "Signing you in…", "success");

      const { error } = await supabaseClient.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
        nonce: currentRawNonce,
      });

      if (error) {
        showStatus(statusEl, "Google sign-in failed: " + error.message, "error");
        return;
      }

      // Refresh the mirror + redirect exactly like the password flow does.
      const { data } = await supabaseClient.auth.getUser();
      if (data && data.user) NanaSession.writeMirror(data.user, true);
      showStatus(statusEl, "Success! Redirecting…", "success");
      setTimeout(() => (window.location.href = DASHBOARD_URL), 500);
    }

    let currentRawNonce = "";

    whenGsiReady(async () => {
      const { raw, hashed } = await makeNoncePair();
      currentRawNonce = raw;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        nonce: hashed,
        auto_select: false,
        use_fedcm_for_prompt: true,
      });

      // Render Google's own button (invisibly) inside each wrapper so it
      // captures clicks over our custom-styled visible button.
      googleContainers.forEach((container) => {
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 360,
        });
      });
    });
  })();

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
