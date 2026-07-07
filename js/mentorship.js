// ====================================
// MENTORSHIP PAGE - Programs, Mentors, Applications
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
  // PROGRAM ENROLLMENT BUTTONS
  // ====================================
  const programButtons = document.querySelectorAll(".program-btn");

  programButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const program = this.dataset.program;
      const programName =
        this.closest(".program-card").querySelector("h3").textContent;

      openApplicationModal(program, programName);
    });
  });

  // ====================================
  // APPLICATION MODAL
  // ====================================
  const modal = document.getElementById("applicationModal");
  const modalClose = document.getElementById("applicationModalClose");
  const applyBtn = document.getElementById("applyMentorshipBtn");
  const applyNowBtn = document.getElementById("applyNowBtn");

  function openApplicationModal(program = null, programName = null) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    if (program && document.getElementById("appProgram")) {
      document.getElementById("appProgram").value = program;
    }

    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (document.getElementById("appFullName") && userData.name) {
          document.getElementById("appFullName").value = userData.name;
        }
        if (document.getElementById("appEmail") && userData.email) {
          document.getElementById("appEmail").value = userData.email;
        }
        if (document.getElementById("appPhone") && userData.phone) {
          document.getElementById("appPhone").value = userData.phone;
        }
      } catch (e) {
        // Ignore
      }
    }

    const status = document.getElementById("applicationStatus");
    status.className = "form-status";
    status.textContent = "";
  }

  function closeApplicationModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  applyBtn?.addEventListener("click", () => openApplicationModal());
  applyNowBtn?.addEventListener("click", () => openApplicationModal());
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
  // APPLICATION FORM
  // ====================================
  const applicationForm = document.getElementById("mentorshipApplicationForm");
  const applicationStatus = document.getElementById("applicationStatus");

  if (applicationForm) {
    applicationForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("appFullName").value.trim();
      const email = document.getElementById("appEmail").value.trim();
      const phone = document.getElementById("appPhone").value.trim();
      const program = document.getElementById("appProgram").value;
      const experience = document.getElementById("appExperience").value;
      const mentor = document.getElementById("appMentor").value;
      const reason = document.getElementById("appReason").value.trim();

      if (!name || !email || !phone || !program) {
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

      const application = {
        id: Date.now(),
        name: name,
        email: email,
        phone: phone,
        program: program,
        experience: experience,
        mentor: mentor || "no-preference",
        reason: reason || "Not provided",
        status: "pending",
        submittedAt: new Date().toISOString(),
      };

      const applications = JSON.parse(
        localStorage.getItem("mentorshipApplications") || "[]",
      );
      applications.push(application);
      localStorage.setItem(
        "mentorshipApplications",
        JSON.stringify(applications),
      );

      showStatus(
        applicationStatus,
        "✅ Application submitted successfully! We'll get back to you within 24 hours.",
        "success",
      );

      const submitBtn = document.getElementById("submitApplicationBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Submitting...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<i class="fas fa-paper-plane"></i> Submit Application';
        closeApplicationModal();

        showToast(
          "🎉 Your mentorship application has been submitted!",
          "success",
        );

        applicationForm.reset();
      }, 2000);
    });
  }

  // ====================================
  // SCHEDULE A CALL
  // ====================================
  document
    .getElementById("scheduleCallBtn")
    ?.addEventListener("click", function () {
      showToast(
        "📅 Schedule a call feature coming soon! Please check back.",
        "info",
      );
    });

  // ====================================
  // LEARN MORE BUTTON
  // ====================================
  document
    .getElementById("learnMoreBtn")
    ?.addEventListener("click", function () {
      document.querySelector(".programs-section").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

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
  // HELPER: EMAIL VALIDATION
  // ====================================
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

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

  
});
