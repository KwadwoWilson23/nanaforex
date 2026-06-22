// ====================================
// MENTORSHIP PAGE - Programs, Mentors, Applications
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  // ====================================
  // PROGRAM ENROLLMENT BUTTONS
  // ====================================
  const programButtons = document.querySelectorAll(".program-btn");

  programButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const program = this.dataset.program;
      const programName =
        this.closest(".program-card").querySelector("h3").textContent;

      // Open application modal with program pre-selected
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

    // Pre-select program if provided
    if (program && document.getElementById("appProgram")) {
      document.getElementById("appProgram").value = program;
    }

    // Pre-fill user data if available
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

    // Clear previous status
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

      // Validation
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

      // Create application data
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

      // Save to localStorage
      const applications = JSON.parse(
        localStorage.getItem("mentorshipApplications") || "[]",
      );
      applications.push(application);
      localStorage.setItem(
        "mentorshipApplications",
        JSON.stringify(applications),
      );

      // Show success
      showStatus(
        applicationStatus,
        "✅ Application submitted successfully! We'll get back to you within 24 hours.",
        "success",
      );

      // Disable submit button
      const submitBtn = document.getElementById("submitApplicationBtn");
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
          "🎉 Your mentorship application has been submitted!",
          "success",
        );

        // Clear form
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
      // Open Calendly or scheduling modal
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

  console.log("✅ Mentorship page initialized");
});
