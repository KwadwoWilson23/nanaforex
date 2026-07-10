// ====================================
// IB PARTNERSHIP - Application & Management
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

  if (typeof NanaSession !== "undefined") NanaSession.guard("login.html");
  checkUserSession();

  // ====================================
  // LOGOUT
  // ====================================
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn?.addEventListener("click", function () {
    if (confirm("Are you sure you want to logout?")) {
      if (typeof NanaSession !== "undefined") { NanaSession.logout("login.html"); return; }
      localStorage.removeItem("nanaForexUser");
      sessionStorage.removeItem("nanaForexUser");
      window.location.href = "login.html";
    }
  });

  // ====================================
  // APPLICATION MODAL
  // ====================================
  const modal = document.getElementById("applicationModal");
  const modalClose = document.getElementById("applicationModalClose");
  const applyBtn = document.getElementById("applyIBBtn");
  const ctaApplyBtn = document.getElementById("ctaApplyBtn");
  const learnMoreBtn = document.getElementById("learnMoreIBBtn");
  const ctaContactBtn = document.getElementById("ctaContactBtn");

  function openApplicationModal() {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Pre-fill user data if available
    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (document.getElementById("ibFullName") && userData.name) {
          document.getElementById("ibFullName").value = userData.name;
        }
        if (document.getElementById("ibEmail") && userData.email) {
          document.getElementById("ibEmail").value = userData.email;
        }
        if (document.getElementById("ibPhone") && userData.phone) {
          document.getElementById("ibPhone").value = userData.phone;
        }
        if (document.getElementById("ibCountry") && userData.country) {
          document.getElementById("ibCountry").value = userData.country;
        }
      } catch (e) {
        // Ignore
      }
    }

    // Clear previous status
    const status = document.getElementById("ibApplicationStatus");
    status.className = "form-status";
    status.textContent = "";
  }

  function closeApplicationModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  applyBtn?.addEventListener("click", openApplicationModal);
  ctaApplyBtn?.addEventListener("click", openApplicationModal);
  modalClose?.addEventListener("click", closeApplicationModal);

  modal?.addEventListener("click", function (e) {
    if (e.target === this) closeApplicationModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeApplicationModal();
    }
  });

  // ====================================
  // LEARN MORE / CONTACT BUTTONS
  // ====================================
  learnMoreBtn?.addEventListener("click", function () {
    document.querySelector(".benefits-section").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  ctaContactBtn?.addEventListener("click", function () {
    window.location.href = "contact.html";
  });

  // ====================================
  // IB APPLICATION FORM
  // ====================================
  const applicationForm = document.getElementById("ibApplicationForm");
  const applicationStatus = document.getElementById("ibApplicationStatus");

  if (applicationForm) {
    applicationForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("ibFullName").value.trim();
      const email = document.getElementById("ibEmail").value.trim();
      const phone = document.getElementById("ibPhone").value.trim();
      const country = document.getElementById("ibCountry").value.trim();
      const company = document.getElementById("ibCompany").value.trim();
      const website = document.getElementById("ibWebsite").value.trim();
      const source = document.getElementById("ibSource").value;
      const volume = document.getElementById("ibVolume").value;
      const reason = document.getElementById("ibReason").value.trim();
      const agree = document.getElementById("ibAgree").checked;

      // Validation
      if (!name || !email || !phone || !country) {
        showStatus(
          applicationStatus,
          "Please fill in all required fields.",
          "error",
        );
        return;
      }

      if (!isValidEmail(email)) {
        showStatus(
          applicationStatus,
          "Please enter a valid email address.",
          "error",
        );
        return;
      }

      if (!agree) {
        showStatus(
          applicationStatus,
          "Please agree to the Terms and Conditions.",
          "error",
        );
        return;
      }

      // Create application data
      const application = {
        id: Date.now(),
        name: name,
        email: email,
        phone: phone,
        country: country,
        company: company || "Not provided",
        website: website || "Not provided",
        source: source || "Not specified",
        volume: volume || "Not specified",
        reason: reason || "Not provided",
        status: "pending",
        submittedAt: new Date().toISOString(),
      };

      // Save to localStorage
      const applications = JSON.parse(
        localStorage.getItem("ibApplications") || "[]",
      );
      applications.push(application);
      localStorage.setItem("ibApplications", JSON.stringify(applications));

      // Show success
      showStatus(
        applicationStatus,
        "✅ Application submitted successfully! Our team will review and contact you within 24 hours.",
        "success",
      );

      // Disable submit button
      const submitBtn = document.getElementById("submitIBBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Submitting...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<i class="fas fa-paper-plane"></i> Submit Application';
        closeApplicationModal();

        // Show success toast
        showToast(
          "🎉 Your IB Partnership application has been submitted!",
          "success",
        );

        // Clear form
        applicationForm.reset();
      }, 2000);
    });
  }

  // ====================================
  // FAQ ACCORDION
  // ====================================
  document.querySelectorAll(".faq-question").forEach((question) => {
    question.addEventListener("click", function () {
      const item = this.closest(".faq-item");
      item.classList.toggle("active");
    });
  });

  // ====================================
  // HELPER FUNCTIONS
  // ====================================
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

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

  console.log("✅ IB Partnership page initialized");
});
