// ====================================
// SETTINGS PAGE - Configuration Management
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
  // NAVIGATION LINKS - FIXED
  // ====================================
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      // Get the href attribute
      const href = this.getAttribute("href");

      // If it's a valid link and not empty
      if (href && href !== "#" && href !== "") {
        // Update active state
        navLinks.forEach(function (l) {
          l.classList.remove("active");
        });
        this.classList.add("active");

        // Update header title (optional, will show briefly)
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

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
          closeSidebar();
        }

        // Allow navigation to proceed - DO NOT prevent default
        return true;
      }
    });
  });

  // ====================================
  // USER SESSION CHECK
  // ====================================
  function checkUserSession() {
    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (!userData.loggedIn) {
        window.location.href = "login.html";
        return;
      }

      const userInitials = document.getElementById("userInitials");
      if (userInitials) {
        const name = userData.name || "Trader";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        userInitials.textContent = initials;
      }
    } catch (e) {
      window.location.href = "login.html";
    }
  }

  checkUserSession();

  // ====================================
  // LOGOUT
  // ====================================
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn?.addEventListener("click", function () {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("nanaForexUser");
      sessionStorage.removeItem("nanaForexUser");
      window.location.href = "login.html";
    }
  });

  // ====================================
  // SETTINGS NAVIGATION - FIXED TOGGLING
  // ====================================
  const navItems = document.querySelectorAll(".settings-nav-item");
  const panels = document.querySelectorAll(".settings-panel");
  const mobileNavSelect = document.getElementById("settingsNavMobile");

  function switchSettingsPanel(sectionId) {
    // Remove active from all nav items
    navItems.forEach((n) => n.classList.remove("active"));

    // Remove active from all panels
    panels.forEach((p) => p.classList.remove("active"));

    // Add active to clicked nav item
    const activeNav = document.querySelector(
      `.settings-nav-item[data-section="${sectionId}"]`,
    );
    if (activeNav) {
      activeNav.classList.add("active");
    }

    // Update mobile select
    if (mobileNavSelect) {
      mobileNavSelect.value = sectionId;
    }

    // Show corresponding panel
    const targetPanel = document.getElementById(`panel-${sectionId}`);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }
  }

  // Add click event to each nav item (Desktop)
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const section = this.dataset.section;
      switchSettingsPanel(section);
    });
  });

  // Add change event to mobile select
  if (mobileNavSelect) {
    mobileNavSelect.addEventListener("change", function () {
      const section = this.value;
      switchSettingsPanel(section);
    });
  }

  // ====================================
  // LANGUAGE TRANSLATION API
  // ====================================
  let currentLanguage = "en";
  const translationCache = {};

  // Language codes mapping
  const languageMap = {
    en: "en",
    fr: "fr",
    es: "es",
    pt: "pt",
    zh: "zh-CN",
    ar: "ar",
    hi: "hi",
    ru: "ru",
    ja: "ja",
    ko: "ko",
  };

  // Load saved language
  function loadSavedLanguage() {
    const saved = localStorage.getItem("userSettings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.language) {
          currentLanguage = settings.language;
          document.getElementById("languageSelect").value = currentLanguage;
        }
      } catch (e) {
        console.error("Error loading language:", e);
      }
    }
  }

  // Translate text using Google Translate API
  async function translateText(text, targetLang) {
    if (!text || text.trim() === "") return text;

    // Check cache first
    const cacheKey = `${text}_${targetLang}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    try {
      // Using Google Translate API (free tier)
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Translation API error");

      const data = await response.json();
      let translatedText = "";

      if (data && data[0]) {
        for (let i = 0; i < data[0].length; i++) {
          if (data[0][i] && data[0][i][0]) {
            translatedText += data[0][i][0];
          }
        }
      }

      if (translatedText) {
        translationCache[cacheKey] = translatedText;
        return translatedText;
      }

      return text;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  }

  // Translate all translatable elements on the page
  async function translatePage(langCode) {
    const elements = document.querySelectorAll("[data-translate]");

    // Show loading indicator
    const statusEl = document.getElementById("generalStatus");
    if (statusEl) {
      statusEl.textContent = "🔄 Translating page...";
      statusEl.className = "settings-status visible";
    }

    // Process elements in batches to avoid rate limiting
    const batchSize = 10;
    const elementArray = Array.from(elements);

    for (let i = 0; i < elementArray.length; i += batchSize) {
      const batch = elementArray.slice(i, i + batchSize);
      const promises = batch.map(async (el) => {
        const key = el.getAttribute("data-translate");
        const originalText = el.textContent.trim();

        // Don't translate if it's just an icon or empty
        if (!originalText || originalText.length < 1) return;

        // Skip if text is already in target language (simple check)
        if (
          langCode === "en" &&
          /^[a-zA-Z0-9\s\.,!?'"-]+$/.test(originalText)
        ) {
          return;
        }

        const translated = await translateText(
          originalText,
          languageMap[langCode] || langCode,
        );
        if (translated && translated !== originalText) {
          el.textContent = translated;
        }
      });

      await Promise.all(promises);
    }

    // Update status
    if (statusEl) {
      const langNames = {
        en: "English",
        fr: "Français",
        es: "Español",
        pt: "Português",
        zh: "中文",
        ar: "العربية",
        hi: "हिन्दी",
        ru: "Русский",
        ja: "日本語",
        ko: "한국어",
      };
      statusEl.textContent = `✅ Page translated to ${langNames[langCode] || langCode}!`;
      statusEl.className = "settings-status visible";

      setTimeout(() => {
        statusEl.className = "settings-status";
        statusEl.textContent = "";
      }, 3000);
    }

    // Save language preference
    const settings = JSON.parse(localStorage.getItem("userSettings") || "{}");
    settings.language = langCode;
    localStorage.setItem("userSettings", JSON.stringify(settings));
    currentLanguage = langCode;
  }

  // ====================================
  // SAVE GENERAL SETTINGS (with language)
  // ====================================
  document
    .getElementById("saveGeneralSettings")
    ?.addEventListener("click", async function () {
      const language = document.getElementById("languageSelect").value;
      const timezone = document.getElementById("timezoneSelect").value;
      const currency = document.getElementById("currencySelect").value;

      // Save settings
      const settings = JSON.parse(localStorage.getItem("userSettings") || "{}");
      settings.language = language;
      settings.timezone = timezone;
      settings.currency = currency;
      localStorage.setItem("userSettings", JSON.stringify(settings));

      // Show saving status
      const statusEl = document.getElementById("generalStatus");
      if (statusEl) {
        statusEl.textContent = "🌐 Translating page...";
        statusEl.className = "settings-status visible";
      }

      // Translate the page
      await translatePage(language);

      // Show success
      if (statusEl) {
        statusEl.textContent = "✅ Settings saved and page translated!";
        statusEl.className = "settings-status visible";

        setTimeout(() => {
          statusEl.className = "settings-status";
          statusEl.textContent = "";
        }, 3000);
      }
    });

  // ====================================
  // LOAD SETTINGS
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

      // Apply language if saved
      if (settings.language) {
        currentLanguage = settings.language;
        // Translate page after a small delay to ensure DOM is ready
        setTimeout(() => {
          translatePage(settings.language);
        }, 500);
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
        const confirmText = prompt(
          "Type 'DELETE' to confirm account deletion.",
        );
        if (confirmText === "DELETE") {
          showStatus(
            "accountStatus",
            "Account deletion request submitted. You will receive a confirmation email.",
            "success",
          );
        }
      }
    });

  // ====================================
  // GENERIC SAVE HANDLERS
  // ====================================
  const saveButtons = {
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

  // ====================================
  // LOAD SETTINGS ON INIT
  // ====================================
  loadSavedLanguage();
  loadSettings();

  console.log("✅ Settings page initialized");
  console.log("ℹ️ Click settings nav items to switch between panels");
  console.log("🌐 Language translation API ready");
});
