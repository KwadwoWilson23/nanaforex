// ====================================
// AUTHENTICATION - Login & Register
// ====================================

document.addEventListener("DOMContentLoaded", function () {
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

    // Update tabs
    tabs.forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });

    // Update forms
    Object.keys(forms).forEach((key) => {
      forms[key].classList.toggle("active", key === formId);
    });

    // Clear status messages
    clearStatus(loginStatus);
    clearStatus(registerStatus);
  }

  function clearStatus(element) {
    element.className = "form-status";
    element.textContent = "";
    element.style.display = "none";
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      switchTab(this);
    });
  });

  // Switch form links
  document
    .getElementById("switchToRegister")
    .addEventListener("click", function (e) {
      e.preventDefault();
      const registerTab = document.querySelector(
        '.auth-tab[data-form="register"]',
      );
      switchTab(registerTab);
    });

  document
    .getElementById("switchToLogin")
    .addEventListener("click", function (e) {
      e.preventDefault();
      const loginTab = document.querySelector('.auth-tab[data-form="login"]');
      switchTab(loginTab);
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

  passwordInput.addEventListener("input", function () {
    const password = this.value;
    let strength = 0;
    let label = "Weak";
    let color = "#ff4d4d";

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
  // SHOW STATUS HELPER
  // ====================================
  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = "form-status " + type;
    element.style.display = "block";
  }

  // ====================================
  // LOGIN HANDLER
  // ====================================
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;
    const btn = document.getElementById("loginBtn");

    // Basic validation
    if (!email || !password) {
      showStatus(loginStatus, "Please fill in all required fields.", "error");
      return;
    }

    // Email validation
    if (!isValidEmail(email)) {
      showStatus(loginStatus, "Please enter a valid email address.", "error");
      return;
    }

    // Simulate loading
    btn.classList.add("loading");
    btn.disabled = true;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check for unverified email (demo)
      if (email.includes("unverified")) {
        verificationNotice.classList.add("show");
        showStatus(
          loginStatus,
          "Please verify your email before logging in. Check your inbox.",
          "error",
        );
        btn.classList.remove("loading");
        btn.disabled = false;
        return;
      }

      // Check for demo credentials
      if (email === "demo@nanaforex.com" && password === "password123") {
        // Store session
        if (rememberMe) {
          localStorage.setItem(
            "nanaForexUser",
            JSON.stringify({
              email: email,
              name: "Demo User",
              loggedIn: true,
            }),
          );
        } else {
          sessionStorage.setItem(
            "nanaForexUser",
            JSON.stringify({
              email: email,
              name: "Demo User",
              loggedIn: true,
            }),
          );
        }

        showStatus(loginStatus, "Login successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);
        return;
      }

      // Check for registered users in localStorage
      const users = JSON.parse(localStorage.getItem("nanaForexUsers") || "[]");
      const user = users.find(
        (u) => u.email === email && u.password === password,
      );

      if (user) {
        // Store session
        const sessionData = {
          email: user.email,
          name: user.name,
          loggedIn: true,
        };
        if (rememberMe) {
          localStorage.setItem("nanaForexUser", JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem("nanaForexUser", JSON.stringify(sessionData));
        }

        showStatus(loginStatus, "Login successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "client-dashboard.html";
        }, 1000);
        return;
      }

      // No user found
      showStatus(
        loginStatus,
        "Invalid email or password. Please try again or create an account.",
        "error",
      );
    } catch (error) {
      showStatus(loginStatus, "Network error. Please try again.", "error");
    }

    btn.classList.remove("loading");
    btn.disabled = false;
  });

  // ====================================
  // REGISTER HANDLER
  // ====================================
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const phone = document.getElementById("registerPhone").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById(
      "registerConfirmPassword",
    ).value;
    const btn = document.getElementById("registerBtn");

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      showStatus(
        registerStatus,
        "Please fill in all required fields.",
        "error",
      );
      return;
    }

    if (name.length < 2) {
      showStatus(
        registerStatus,
        "Name must be at least 2 characters.",
        "error",
      );
      return;
    }

    if (!isValidEmail(email)) {
      showStatus(
        registerStatus,
        "Please enter a valid email address.",
        "error",
      );
      return;
    }

    if (password.length < 8) {
      showStatus(
        registerStatus,
        "Password must be at least 8 characters.",
        "error",
      );
      return;
    }

    if (password !== confirmPassword) {
      showStatus(registerStatus, "Passwords do not match.", "error");
      return;
    }

    // Check if email already registered
    const users = JSON.parse(localStorage.getItem("nanaForexUsers") || "[]");
    if (users.some((u) => u.email === email)) {
      showStatus(
        registerStatus,
        "This email is already registered. Please login.",
        "error",
      );
      return;
    }

    // Simulate loading
    btn.classList.add("loading");
    btn.disabled = true;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Save user
      const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        phone: phone || "",
        password: password,
        created_at: new Date().toISOString(),
        verified: false,
      };

      users.push(newUser);
      localStorage.setItem("nanaForexUsers", JSON.stringify(users));

      // Show verification notice
      verificationNotice.classList.add("show");

      showStatus(
        registerStatus,
        "Account created successfully! Please check your email for verification.",
        "success",
      );

      // Clear form
      registerForm.reset();
      strengthFill.style.width = "0%";
      strengthLabel.textContent = "Weak";
      strengthLabel.style.color = "#ff4d4d";

      btn.classList.remove("loading");
      btn.disabled = false;

      // Auto-switch to login after 2.5 seconds
      setTimeout(() => {
        const loginTab = document.querySelector('.auth-tab[data-form="login"]');
        switchTab(loginTab);
        showStatus(
          loginStatus,
          "Account created! Please log in with your credentials.",
          "success",
        );
        // Pre-fill email
        document.getElementById("loginEmail").value = email;
      }, 2500);
    } catch (error) {
      showStatus(
        registerStatus,
        "Registration failed. Please try again.",
        "error",
      );
      btn.classList.remove("loading");
      btn.disabled = false;
    }
  });

  // ====================================
  // FORGOT PASSWORD
  // ====================================
  document
    .getElementById("forgotPassword")
    .addEventListener("click", function (e) {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();

      if (!email) {
        showStatus(
          loginStatus,
          "Please enter your email address to reset your password.",
          "error",
        );
        return;
      }

      if (!isValidEmail(email)) {
        showStatus(loginStatus, "Please enter a valid email address.", "error");
        return;
      }

      // Check if email exists in registered users
      const users = JSON.parse(localStorage.getItem("nanaForexUsers") || "[]");
      const user = users.find((u) => u.email === email);

      if (user) {
        showStatus(
          loginStatus,
          `✅ Password reset link sent to ${email}. Check your inbox.`,
          "success",
        );
      } else {
        showStatus(
          loginStatus,
          "No account found with this email. Please register first.",
          "error",
        );
      }
    });

  // ====================================
  // SOCIAL LOGIN (Demo)
  // ====================================
  document.querySelectorAll(".social-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const provider = this.classList.contains("google")
        ? "Google"
        : "Facebook";
      const parentForm = this.closest(".auth-form");
      const statusEl = parentForm.querySelector(".form-status");

      showStatus(statusEl, `Connecting with ${provider}...`, "success");

      // Simulate OAuth flow
      setTimeout(() => {
        // Store session
        const sessionData = {
          email: `${provider.toLowerCase()}@nanaforex.com`,
          name: `${provider} User`,
          provider: provider,
          loggedIn: true,
        };
        localStorage.setItem("nanaForexUser", JSON.stringify(sessionData));

        window.location.href = "client-dashboard.html";
      }, 1500);
    });
  });

  // ====================================
  // ENTER KEY SUPPORT
  // ====================================
  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        const form = this.closest("form");
        if (form) {
          form.dispatchEvent(new Event("submit"));
        }
      }
    });
  });

  // ====================================
  // HELPER: EMAIL VALIDATION
  // ====================================
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // ====================================
  // CHECK EXISTING SESSION
  // ====================================
  function checkExistingSession() {
    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.loggedIn) {
          // Redirect to dashboard if already logged in
          window.location.href = "client-dashboard.html";
        }
      } catch (e) {
        // Invalid session data, ignore
      }
    }
  }

  // Check if user is already logged in
  checkExistingSession();

  // ====================================
  // DEMO CREDENTIALS HELPER
  // ====================================
  console.log("🔐 Demo Account:");
  console.log("📧 Email: demo@nanaforex.com");
  console.log("🔑 Password: password123");

  // ====================================
  // CLEAR VERIFICATION NOTICE ON TAB SWITCH
  // ====================================
  const originalSwitchTab = switchTab;
  switchTab = function (tab) {
    originalSwitchTab(tab);
    // Hide verification notice when switching tabs
    if (verificationNotice) {
      verificationNotice.classList.remove("show");
    }
  };

  // ====================================
  // PASSWORD STRENGTH RESET ON REGISTER FORM RESET
  // ====================================
  document
    .getElementById("registerFormElement")
    .addEventListener("reset", function () {
      strengthFill.style.width = "0%";
      strengthLabel.textContent = "Weak";
      strengthLabel.style.color = "#ff4d4d";
    });
});
