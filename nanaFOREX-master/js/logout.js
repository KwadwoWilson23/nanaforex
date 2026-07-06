// ====================================
// LOGOUT PAGE - Secure Logout Flow
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  // ====================================
  // LOAD USER DATA
  // ====================================
  function loadUserData() {
    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");

    if (!user) {
      // If no user found, redirect to login
      window.location.href = "login.html";
      return;
    }

    try {
      const userData = JSON.parse(user);

      // Update user info on logout page
      const userNameEl = document.getElementById("logoutUserName");
      const userEmailEl = document.getElementById("logoutUserEmail");
      const userInitials = document.getElementById("userInitials");

      const name = userData.name || "Trader";
      const email = userData.email || "trader@example.com";

      if (userNameEl) userNameEl.textContent = name;
      if (userEmailEl) userEmailEl.textContent = email;

      // Update initials
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      if (userInitials) userInitials.textContent = initials;

      // Update session expiry
      const sessionExpiry = document.getElementById("sessionExpiry");
      if (sessionExpiry) {
        // Get session duration from settings or use default
        const settings = JSON.parse(
          localStorage.getItem("userSettings") || "{}",
        );
        const duration = parseInt(settings.sessionDuration) || 30;
        sessionExpiry.textContent = `${duration} minutes`;
      }
    } catch (e) {
      console.error("Error loading user data:", e);
      window.location.href = "login.html";
    }
  }

  loadUserData();

  // ====================================
  // LOGOUT MODAL
  // ====================================
  const logoutModal = document.getElementById("logoutModal");
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");
  const sidebarLogoutBtn = document.getElementById("logoutBtn");

  function openLogoutModal() {
    logoutModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLogoutModal() {
    logoutModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Open modal from main button
  confirmLogoutBtn?.addEventListener("click", openLogoutModal);

  // Open modal from sidebar logout button
  sidebarLogoutBtn?.addEventListener("click", function (e) {
    e.preventDefault();
    openLogoutModal();
  });

  // Close modal from cancel buttons
  cancelLogoutBtn?.addEventListener("click", closeLogoutModal);
  modalCancelBtn?.addEventListener("click", closeLogoutModal);

  // Close modal on backdrop click
  logoutModal?.addEventListener("click", function (e) {
    if (e.target === this) closeLogoutModal();
  });

  // Close modal on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && logoutModal.classList.contains("active")) {
      closeLogoutModal();
    }
  });

  // ====================================
  // PERFORM LOGOUT
  // ====================================
  function performLogout() {
    // Close modal
    closeLogoutModal();

    // Show success overlay
    const overlay = document.getElementById("logoutSuccessOverlay");
    overlay.classList.add("active");

    // Start countdown
    let countdown = 5;
    const countdownEl = document.getElementById("redirectCountdown");

    const interval = setInterval(() => {
      countdown--;
      if (countdownEl) {
        countdownEl.textContent = countdown;
      }

      if (countdown <= 0) {
        clearInterval(interval);
        // Clear user data and redirect
        clearUserSession();
        window.location.href = "login.html";
      }
    }, 1000);

    // Also redirect on button click
    document
      .getElementById("redirectNowBtn")
      ?.addEventListener("click", function () {
        clearInterval(interval);
        clearUserSession();
        window.location.href = "login.html";
      });
  }

  function clearUserSession() {
    // End the real Supabase session (and the compatibility mirror)
    if (typeof supabaseClient !== "undefined") {
      supabaseClient.auth.signOut();
    }
    localStorage.removeItem("nanaForexUser");
    sessionStorage.removeItem("nanaForexUser");

    // Optional: Clear other related data
    // localStorage.removeItem("nanaForexLeaderboard");
    // localStorage.removeItem("nanaForexChallenge");
    // localStorage.removeItem("userSettings");

    // Clear any other session data
    // sessionStorage.clear();
  }

  // Confirm logout from modal
  modalConfirmBtn?.addEventListener("click", performLogout);

  // ====================================
  // KEYBOARD SHORTCUT: Cmd/Ctrl + Shift + L
  // ====================================
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "L") {
      e.preventDefault();
      openLogoutModal();
    }
  });

  // ====================================
  // PREVENT ACCIDENTAL NAVIGATION
  // ====================================
  let isLoggingOut = false;

  window.addEventListener("beforeunload", function (e) {
    if (isLoggingOut) {
      // Allow navigation during logout
      return;
    }

    // Warn user if they're on the logout page and haven't confirmed
    if (!logoutModal.classList.contains("active")) {
      e.preventDefault();
      e.returnValue =
        "You are on the logout page. Are you sure you want to leave?";
      return e.returnValue;
    }
  });

  // ====================================
  // TOAST NOTIFICATION (if needed)
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

  console.log("✅ Logout page initialized");
});
