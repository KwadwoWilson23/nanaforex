// ====================================
// PROFILE PAGE - User Profile Management
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  // ====================================
  // HAMBURGER MENU TOGGLE
  // ====================================
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");
    hamburgerBtn?.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
    hamburgerBtn?.classList.remove("active");
    document.body.style.overflow = "";
  }

  hamburgerBtn?.addEventListener("click", function (e) {
    e.stopPropagation();
    if (sidebar.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  const sidebarClose = document.getElementById("sidebarClose");
  sidebarClose?.addEventListener("click", closeSidebar);

  sidebarOverlay?.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768 && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  // ====================================
  // NAVIGATION LINKS
  // ====================================
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      navLinks.forEach(function (l) {
        l.classList.remove("active");
      });

      this.classList.add("active");

      const pageName = this.dataset.page;
      const headerTitle = document.querySelector(".dashboard-header h1");
      const pageTitles = {
        dashboard: "Dashboard",
        profile: "Profile",
        academy: "Academy",
        signals: "Signals",
        "copy-trading": "Copy Trading",
        "funded-account": "Funded Account",
        mentorship: "Mentorship",
        "ib-partnership": "IB Partnership",
        "trading-tools": "Trading Tools",
        "market-analysis": "Market Analysis",
        referrals: "Referrals",
        payments: "Payments",
        settings: "Settings",
      };

      if (headerTitle && pageTitles[pageName]) {
        headerTitle.textContent = pageTitles[pageName];
      }

      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  // ====================================
  // LOAD USER DATA
  // ====================================
  async function loadUserData() {
    // Validate the real Supabase session (redirects if absent).
    const session =
      typeof NanaSession !== "undefined" ? await NanaSession.guard("login.html") : null;
    if (!session) return;

    const profile = (await NanaSession.loadProfile()) || {};
    const prefs = profile.preferences || {};

    const name = profile.full_name || NanaSession.displayNameFromUser(session.user);
    const email = profile.email || session.user.email || "";

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val != null) el.value = val;
    };

    setText("profileName", name);
    setText("profileEmail", email);
    setVal("fullName", name);
    setVal("emailAddress", email);

    // Email is managed by Supabase Auth — keep it read-only here.
    const emailInput = document.getElementById("emailAddress");
    if (emailInput) emailInput.setAttribute("readonly", "readonly");

    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    setText("profileInitials", initials);
    setText("userInitials", initials);

    if (profile.avatar_url && window.__renderProfileAvatar) {
      window.__renderProfileAvatar(profile.avatar_url);
    }

    setVal("phoneNumber", profile.phone);
    setVal("location", profile.country);
    setVal("bio", profile.bio);

    setVal("tradingStyle", prefs.tradingStyle);
    setVal("riskTolerance", prefs.riskTolerance);
    setVal("preferredPairs", prefs.preferredPairs);
    setVal("leverage", prefs.leverage);
  }

  loadUserData();

  // ====================================
  // PROFILE TABS - FIXED TOGGLING
  // ====================================
  const tabs = document.querySelectorAll(".profile-tab");
  const tabContents = document.querySelectorAll(".profile-tab-content");

  function switchTab(tabId) {
    // Remove active from all tabs
    tabs.forEach((t) => t.classList.remove("active"));

    // Remove active from all contents
    tabContents.forEach((c) => c.classList.remove("active"));

    // Add active to clicked tab
    const activeTab = document.querySelector(
      `.profile-tab[data-tab="${tabId}"]`,
    );
    if (activeTab) {
      activeTab.classList.add("active");
    }

    // Show corresponding content
    const content = document.getElementById(`tab-${tabId}`);
    if (content) {
      content.classList.add("active");
    }
  }

  // Add click event to each tab
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabId = this.dataset.tab;
      switchTab(tabId);
    });
  });

  // ====================================
  // EDIT PROFILE BUTTON - FIXED
  // ====================================
  document
    .getElementById("editProfileBtn")
    ?.addEventListener("click", function () {
      // Switch to Personal Info tab
      switchTab("personal");

      // Scroll to the form after a slight delay
      setTimeout(() => {
        const tabContent = document.getElementById("tab-personal");
        if (tabContent) {
          tabContent.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);
    });

  // ====================================
  // TOGGLE PASSWORD VISIBILITY
  // ====================================
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", function () {
      const input = this.closest(".password-wrapper").querySelector("input");
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
  // PASSWORD STRENGTH (Security Tab)
  // ====================================
  const newPassword = document.getElementById("newPassword");
  const strengthFill = document.getElementById("securityStrengthFill");
  const strengthLabel = document.getElementById("securityStrengthLabel");

  if (newPassword) {
    newPassword.addEventListener("input", function () {
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
      if (strengthFill) {
        strengthFill.style.width = percentage + "%";
        strengthFill.style.background = result.color;
      }
      if (strengthLabel) {
        strengthLabel.textContent = result.label;
        strengthLabel.style.color = result.color;
      }
    });
  }

  // ====================================
  // PERSONAL INFO FORM
  // ====================================
  const personalForm = document.getElementById("personalInfoForm");
  const personalStatus = document.getElementById("personalFormStatus");

  if (personalForm) {
    personalForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = document.getElementById("fullName").value.trim();
      const phone = document.getElementById("phoneNumber").value.trim();
      const location = document.getElementById("location").value.trim();
      const bio = document.getElementById("bio").value.trim();

      if (!name) {
        showStatus(personalStatus, "Name is required.", "error");
        return;
      }

      const { error } = await NanaSession.updateProfile({
        full_name: name,
        phone,
        country: location,
        bio,
      });

      if (error) {
        showStatus(personalStatus, "Error updating profile: " + error.message, "error");
        return;
      }

      // Update display
      document.getElementById("profileName").textContent = name;
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      document.getElementById("profileInitials").textContent = initials;
      document.getElementById("userInitials").textContent = initials;

      showStatus(personalStatus, "✅ Profile updated successfully!", "success");
      setTimeout(() => {
        personalStatus.className = "form-status";
        personalStatus.textContent = "";
      }, 3000);
    });
  }

  // ====================================
  // TRADING PREFERENCES FORM
  // ====================================
  const tradingPrefsForm = document.getElementById("tradingPrefsForm");
  const tradingPrefsStatus = document.getElementById("tradingPrefsStatus");

  if (tradingPrefsForm) {
    tradingPrefsForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const tradingStyle = document.getElementById("tradingStyle").value;
      const riskTolerance = document.getElementById("riskTolerance").value;
      const preferredPairs = document
        .getElementById("preferredPairs")
        .value.trim();
      const leverage = document.getElementById("leverage").value;

      // Get notification preferences
      const notificationPrefs = [];
      document
        .querySelectorAll("#tab-trading .toggle-switch input")
        .forEach((input) => {
          if (input.checked) {
            const label = input
              .closest(".toggle-switch")
              .querySelector(".toggle-label");
            if (label) notificationPrefs.push(label.textContent.trim());
          }
        });

      // Merge into the existing preferences jsonb so we don't drop other keys.
      const existing = (await NanaSession.loadProfile()) || {};
      const preferences = Object.assign({}, existing.preferences || {}, {
        tradingStyle,
        riskTolerance,
        preferredPairs,
        leverage,
        notifications: notificationPrefs,
      });

      const { error } = await NanaSession.updateProfile({ preferences });

      if (error) {
        showStatus(tradingPrefsStatus, "Error saving preferences: " + error.message, "error");
        return;
      }

      showStatus(tradingPrefsStatus, "✅ Trading preferences saved!", "success");
      setTimeout(() => {
        tradingPrefsStatus.className = "form-status";
        tradingPrefsStatus.textContent = "";
      }, 3000);
    });
  }

  // ====================================
  // SECURITY FORM
  // ====================================
  const securityForm = document.getElementById("securityForm");
  const securityStatus = document.getElementById("securityFormStatus");

  if (securityForm) {
    securityForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const newPasswordVal = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (!newPasswordVal || !confirmPassword) {
        showStatus(securityStatus, "Please fill in the new password fields.", "error");
        return;
      }

      if (newPasswordVal.length < 8) {
        showStatus(
          securityStatus,
          "New password must be at least 8 characters.",
          "error",
        );
        return;
      }

      if (newPasswordVal !== confirmPassword) {
        showStatus(securityStatus, "Passwords do not match.", "error");
        return;
      }

      const { error } = await NanaSession.changePassword(newPasswordVal);

      if (error) {
        showStatus(securityStatus, "Error updating password: " + error.message, "error");
        return;
      }

      // Clear fields
      const cur = document.getElementById("currentPassword");
      if (cur) cur.value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";

      // Reset strength meter
      if (strengthFill) {
        strengthFill.style.width = "0%";
        strengthFill.style.background = "#ff4d4d";
      }
      if (strengthLabel) {
        strengthLabel.textContent = "Weak";
        strengthLabel.style.color = "#ff4d4d";
      }

      showStatus(securityStatus, "✅ Password updated successfully!", "success");
      setTimeout(() => {
        securityStatus.className = "form-status";
        securityStatus.textContent = "";
      }, 3000);
    });
  }

  // ====================================
  // AVATAR UPLOAD (Supabase Storage)
  // ====================================
  function renderAvatar(url) {
    if (!url) return;
    const img = `<img src="${url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />`;
    const profileAvatar = document.getElementById("profileAvatar");
    if (profileAvatar) profileAvatar.innerHTML = img;
    // small header/sidebar avatar
    const smallInitials = document.getElementById("userInitials");
    if (smallInitials && smallInitials.parentElement) {
      smallInitials.parentElement.innerHTML = img;
    }
  }
  // expose so loadUserData can call it
  window.__renderProfileAvatar = renderAvatar;

  // hidden file input, triggered by the camera button
  const avatarInput = document.createElement("input");
  avatarInput.type = "file";
  avatarInput.accept = "image/*";
  avatarInput.style.display = "none";
  document.body.appendChild(avatarInput);

  document.getElementById("avatarEditBtn")?.addEventListener("click", function () {
    avatarInput.click();
  });

  avatarInput.addEventListener("change", async function () {
    const file = this.files && this.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2MB.", "error");
      return;
    }
    try {
      showToast("Uploading photo…", "info");
      const url = await NanaSession.uploadAvatar(file);
      renderAvatar(url);
      showToast("✅ Profile photo updated!", "success");
    } catch (err) {
      showToast("Upload failed: " + err.message, "error");
    }
    avatarInput.value = "";
  });

  // ====================================
  // HELPER: SHOW STATUS
  // ====================================
  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = "form-status " + type;
    element.style.display = "block";
  }

  // ====================================
  // TOAST NOTIFICATIONS
  // ====================================
  function showToast(message, type = "info") {
    let toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toastContainer";
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    const colors = {
      success: "#00ff88",
      error: "#ff4d4d",
      warning: "#f5b700",
      info: "#00c896",
    };

    toast.style.cssText = `
      background: #0e1726;
      border-left: 4px solid ${colors[type] || colors.info};
      padding: 12px 20px;
      border-radius: 12px;
      color: white;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
      min-width: 250px;
      max-width: 350px;
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle"}" style="color: ${colors[type] || colors.info}"></i>
        <span>${message}</span>
      </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Add toast animation styles
  if (!document.querySelector("#toastStyles")) {
    const style = document.createElement("style");
    style.id = "toastStyles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  console.log("✅ Profile page initialized");
  console.log("ℹ️ Click 'Edit Profile' to switch to Personal Info tab");
});
