// ====================================
// SETTINGS PAGE - Configuration Management
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  // ====================================
  // LOAD SAVED SETTINGS
  // ====================================
  function loadSettings() {
    const saved = localStorage.getItem("userSettings");
    if (!saved) return;

    try {
      const settings = JSON.parse(saved);

      // Apply saved settings to form elements
      Object.keys(settings).forEach((key) => {
        const element = document.getElementById(key);
        if (element) {
          if (element.type === "checkbox") {
            element.checked = settings[key];
          } else {
            element.value = settings[key];
          }
        }
      });

      // Apply theme if saved
      if (settings.theme) {
        applyTheme(settings.theme);
      }

      // Apply accent color if saved
      if (settings.accentColor) {
        applyAccentColor(settings.accentColor);
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  }

  // ====================================
  // SAVE SETTINGS
  // ====================================
  function saveSettings(settings) {
    const current = JSON.parse(localStorage.getItem("userSettings") || "{}");
    const updated = { ...current, ...settings };
    localStorage.setItem("userSettings", JSON.stringify(updated));
  }

  // ====================================
  // THEME APPLICATION
  // ====================================
  function applyTheme(theme) {
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });

    if (theme === "light") {
      document.documentElement.style.setProperty("--bg-dark", "#f5f5f5");
      document.documentElement.style.setProperty("--card-bg", "#ffffff");
      document.documentElement.style.setProperty("--text-muted", "#6b7280");
      document.documentElement.style.setProperty("--white", "#111827");
      document.documentElement.style.setProperty("--border", "rgba(0,0,0,0.1)");
    } else if (theme === "dark") {
      document.documentElement.style.setProperty("--bg-dark", "#050a16");
      document.documentElement.style.setProperty("--card-bg", "#0e1726");
      document.documentElement.style.setProperty(
        "--text-muted",
        "rgba(255,255,255,0.55)",
      );
      document.documentElement.style.setProperty("--white", "#ffffff");
      document.documentElement.style.setProperty(
        "--border",
        "rgba(255,255,255,0.08)",
      );
    } else {
      // System default - use prefers-color-scheme
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  }

  // ====================================
  // ACCENT COLOR APPLICATION
  // ====================================
  function applyAccentColor(color) {
    document.querySelectorAll(".color-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.color === color);
    });
    document.documentElement.style.setProperty("--secondary", color);
  }

  // ====================================
  // SETTINGS NAVIGATION
  // ====================================
  const navItems = document.querySelectorAll(".settings-nav-item");
  const panels = document.querySelectorAll(".settings-panel");

  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Update nav
      navItems.forEach((n) => n.classList.remove("active"));
      this.classList.add("active");

      // Update panel
      const section = this.dataset.section;
      panels.forEach((p) => p.classList.remove("active"));
      const targetPanel = document.getElementById(`panel-${section}`);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // ====================================
  // THEME SELECTION
  // ====================================
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const theme = this.dataset.theme;
      applyTheme(theme);
      saveSettings({ theme: theme });
      showStatus("appearanceStatus", "Theme updated!", "success");
    });
  });

  // ====================================
  // COLOR SELECTION
  // ====================================
  document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const color = this.dataset.color;
      applyAccentColor(color);
      saveSettings({ accentColor: color });
      showStatus("appearanceStatus", "Accent color updated!", "success");
    });
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
  // CHANGE PASSWORD MODAL
  // ====================================
  const passwordModal = document.getElementById("passwordModal");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const modalClose = document.getElementById("passwordModalClose");
  const modalCancel = document.getElementById("modalCancelBtn");

  function openPasswordModal() {
    passwordModal.classList.add("active");
    document.body.style.overflow = "hidden";
    document.getElementById("modalCurrentPassword").value = "";
    document.getElementById("modalNewPassword").value = "";
    document.getElementById("modalConfirmPassword").value = "";
    document.getElementById("modalPasswordStatus").className = "form-status";
    document.getElementById("modalPasswordStatus").textContent = "";
  }

  function closePasswordModal() {
    passwordModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  changePasswordBtn?.addEventListener("click", openPasswordModal);
  modalClose?.addEventListener("click", closePasswordModal);
  modalCancel?.addEventListener("click", closePasswordModal);

  passwordModal?.addEventListener("click", function (e) {
    if (e.target === this) closePasswordModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && passwordModal.classList.contains("active")) {
      closePasswordModal();
    }
  });

  // ====================================
  // PASSWORD CHANGE FORM
  // ====================================
  document
    .getElementById("passwordChangeForm")
    ?.addEventListener("submit", function (e) {
      e.preventDefault();

      const current = document.getElementById("modalCurrentPassword").value;
      const newPass = document.getElementById("modalNewPassword").value;
      const confirm = document.getElementById("modalConfirmPassword").value;
      const status = document.getElementById("modalPasswordStatus");

      if (!current || !newPass || !confirm) {
        showModalStatus(status, "Please fill in all fields.", "error");
        return;
      }

      if (newPass.length < 8) {
        showModalStatus(
          status,
          "Password must be at least 8 characters.",
          "error",
        );
        return;
      }

      if (newPass !== confirm) {
        showModalStatus(status, "Passwords do not match.", "error");
        return;
      }

      // Simulate password update
      showModalStatus(status, "Password updated successfully!", "success");

      setTimeout(() => {
        closePasswordModal();
        showStatus(
          "securityStatus",
          "Password changed successfully!",
          "success",
        );
      }, 1500);
    });

  function showModalStatus(element, message, type) {
    element.textContent = message;
    element.className = "form-status " + type;
    element.style.display = "block";
  }

  // ====================================
  // GENERATE API KEY
  // ====================================
  document
    .getElementById("generateApiKeyBtn")
    ?.addEventListener("click", function () {
      // Generate a random API key
      const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let key = "nf_";
      for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      alert(
        `Your new API key: ${key}\n\nPlease copy and save this key. It will not be shown again.`,
      );
      showStatus("apiStatus", "New API key generated!", "success");
    });

  // ====================================
  // DELETE ACCOUNT
  // ====================================
  document
    .getElementById("deleteAccountBtn")
    ?.addEventListener("click", function () {
      if (
        confirm(
          "⚠️ WARNING: This action is permanent. Are you sure you want to delete your account?",
        )
      ) {
        if (
          confirm("Type 'DELETE' to confirm account deletion.") === "DELETE"
        ) {
          // Simulate account deletion
          showStatus(
            "accountStatus",
            "Account deletion request submitted. You will receive a confirmation email.",
            "success",
          );
          // In real app, redirect to login after deletion
        }
      }
    });

  // ====================================
  // GENERIC SAVE HANDLERS
  // ====================================
  const saveButtons = {
    saveGeneralSettings: "generalStatus",
    saveNotificationSettings: "notificationStatus",
    saveSecuritySettings: "securityStatus",
    saveTradingSettings: "tradingStatus",
    saveAppearanceSettings: "appearanceStatus",
    saveApiSettings: "apiStatus",
    saveAccountSettings: "accountStatus",
  };

  Object.keys(saveButtons).forEach((btnId) => {
    document.getElementById(btnId)?.addEventListener("click", function () {
      const statusId = saveButtons[btnId];
      showStatus(statusId, "Settings saved successfully!", "success");
      setTimeout(() => {
        const el = document.getElementById(statusId);
        if (el) {
          el.classList.remove("visible");
          el.classList.remove("error");
          el.textContent = "";
        }
      }, 3000);
    });
  });

  // ====================================
  // HELPER: SHOW STATUS
  // ====================================
  function showStatus(elementId, message, type = "success") {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = message;
    element.className = "settings-status visible";
    if (type === "error") {
      element.classList.add("error");
    }

    setTimeout(() => {
      element.classList.remove("visible");
      element.classList.remove("error");
      setTimeout(() => {
        element.textContent = "";
      }, 300);
    }, 3000);
  }

  // ====================================
  // LOAD SETTINGS ON INIT
  // ====================================
  loadSettings();

  // ====================================
  // SAVE SETTINGS ON INPUT CHANGE
  // ====================================
  document
    .querySelectorAll(
      ".setting-control select, .setting-control input[type='number'], .setting-control input[type='url']",
    )
    .forEach((input) => {
      input.addEventListener("change", function () {
        if (this.id) {
          const settings = {};
          if (this.type === "checkbox") {
            settings[this.id] = this.checked;
          } else {
            settings[this.id] = this.value;
          }
          saveSettings(settings);
        }
      });
    });

  document.querySelectorAll(".toggle-switch input").forEach((input) => {
    input.addEventListener("change", function () {
      if (this.id) {
        const settings = {};
        settings[this.id] = this.checked;
        saveSettings(settings);
      }
    });
  });

  console.log("✅ Settings page initialized");
});
