// ====================================
// PERFORMANCE - CHALLENGE FLOW
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  // ====================================
  // DOM REFERENCES
  // ====================================
  const joinChallengeBtn = document.getElementById("joinChallengeBtn");
  const challengeModal = document.getElementById("challengeModal");
  const challengeModalClose = document.getElementById("challengeModalClose");
  const challengeJoinForm = document.getElementById("challengeJoinForm");
  const joinFormStatus = document.getElementById("joinFormStatus");
  const pendingList = document.getElementById("pendingList");
  const pendingApplications = document.getElementById("pendingApplications");
  const pendingCount = document.getElementById("pendingCount");
  const participantsCount = document.getElementById("participantsCount");

  // ====================================
  // LOAD APPLICATIONS FROM STORAGE
  // ====================================
  function loadApplications() {
    const saved = localStorage.getItem("challengeApplications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  function saveApplications(applications) {
    localStorage.setItem("challengeApplications", JSON.stringify(applications));
  }

  // ====================================
  // LOAD PARTICIPANTS FROM STORAGE
  // ====================================
  function loadParticipants() {
    const saved = localStorage.getItem("challengeParticipants");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  function saveParticipants(participants) {
    localStorage.setItem("challengeParticipants", JSON.stringify(participants));
    updateParticipantsCount();
  }

  // ====================================
  // UPDATE PARTICIPANTS COUNT
  // ====================================
  function updateParticipantsCount() {
    const participants = loadParticipants();
    if (participantsCount) {
      participantsCount.textContent = participants.length + " participants";
    }
  }

  // ====================================
  // SHOW/HIDE MODAL
  // ====================================
  function openModal() {
    challengeModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    challengeModal.classList.remove("active");
    document.body.style.overflow = "";
    challengeJoinForm.reset();
    joinFormStatus.className = "form-status";
    joinFormStatus.textContent = "";
    joinFormStatus.style.display = "none";
  }

  joinChallengeBtn?.addEventListener("click", function () {
    // Check if user is logged in
    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");
    if (!user) {
      showToast("Please login first to join the challenge.", "warning");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
      return;
    }

    // Pre-fill form with user data
    try {
      const userData = JSON.parse(user);
      document.getElementById("joinFullName").value = userData.name || "";
      document.getElementById("joinEmail").value = userData.email || "";
    } catch (e) {
      // Ignore
    }

    openModal();
  });

  challengeModalClose?.addEventListener("click", closeModal);

  challengeModal?.addEventListener("click", function (e) {
    if (e.target === this) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && challengeModal.classList.contains("active")) {
      closeModal();
    }
  });

  // ====================================
  // SUBMIT CHALLENGE APPLICATION
  // ====================================
  challengeJoinForm?.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("joinFullName").value.trim();
    const email = document.getElementById("joinEmail").value.trim();
    const phone = document.getElementById("joinPhone").value.trim();
    const experience = document.getElementById("joinExperience").value;
    const reason = document.getElementById("joinReason").value.trim();
    const submitBtn = document.getElementById("submitJoinBtn");

    // Validation
    if (!name || !email || !phone) {
      showFormStatus("Please fill in all required fields.", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showFormStatus("Please enter a valid email address.", "error");
      return;
    }

    // Create application
    const application = {
      id: Date.now(),
      name: name,
      email: email,
      phone: phone,
      experience: experience,
      reason: reason || "No reason provided",
      status: "pending",
      submittedAt: new Date().toISOString(),
      userId: getCurrentUserId(),
    };

    // Save application
    const applications = loadApplications();
    applications.push(application);
    saveApplications(applications);

    // Show success
    showFormStatus(
      "Application submitted successfully! Admin will review and approve your participation.",
      "success",
    );

    // Disable button temporarily
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    // Reset form and close modal after delay
    setTimeout(() => {
      closeModal();
      showToast(
        "Your application has been submitted! You'll be notified once approved.",
        "success",
      );
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<i class="fas fa-paper-plane"></i> Submit Application';
      renderPendingApplications();
    }, 2000);
  });

  function showFormStatus(message, type) {
    joinFormStatus.textContent = message;
    joinFormStatus.className = "form-status " + type;
    joinFormStatus.style.display = "block";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getCurrentUserId() {
    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");
    if (user) {
      try {
        return JSON.parse(user).id || Date.now();
      } catch (e) {
        return Date.now();
      }
    }
    return Date.now();
  }

  // ====================================
  // RENDER PENDING APPLICATIONS (ADMIN)
  // ====================================
  function renderPendingApplications() {
    const applications = loadApplications();
    const pending = applications.filter((a) => a.status === "pending");

    if (pending.length === 0) {
      pendingList.innerHTML =
        '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No pending applications.</p>';
      pendingCount.textContent = "0 pending";
      return;
    }

    pendingCount.textContent = pending.length + " pending";
    pendingList.innerHTML = pending
      .map(
        (app) => `
      <div class="pending-item" data-id="${app.id}">
        <div class="pending-info">
          <span class="pending-name">${escapeHtml(app.name)}</span>
          <span class="pending-details">
            ${escapeHtml(app.email)} • ${escapeHtml(app.phone)} • ${getExperienceLabel(app.experience)}
          </span>
          <span class="pending-details" style="font-size: 0.7rem; color: var(--gold);">
            Submitted: ${new Date(app.submittedAt).toLocaleDateString()}
          </span>
        </div>
        <div class="pending-actions">
          <button class="approve-btn" onclick="approveApplication(${app.id})">
            <i class="fas fa-check"></i> Approve
          </button>
          <button class="reject-btn" onclick="rejectApplication(${app.id})">
            <i class="fas fa-times"></i> Reject
          </button>
        </div>
      </div>
    `,
      )
      .join("");
  }

  function getExperienceLabel(value) {
    const labels = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      professional: "Professional",
    };
    return labels[value] || value;
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ====================================
  // APPROVE APPLICATION (ADMIN)
  // ====================================
  window.approveApplication = function (appId) {
    if (!isAdminAuthenticated && !checkAuth()) {
      showToast("Please login as admin first.", "error");
      return;
    }

    if (!confirm("Approve this application and add to the leaderboard?"))
      return;

    const applications = loadApplications();
    const appIndex = applications.findIndex((a) => a.id === appId);

    if (appIndex === -1) {
      showToast("Application not found.", "error");
      return;
    }

    const app = applications[appIndex];
    app.status = "approved";

    // Add to participants/leaderboard
    const participants = loadParticipants();
    const newParticipant = {
      id: participants.length + 1,
      name: app.name,
      account: "Standard Account",
      return: 0,
      pips: 0,
      winRate: 0,
      trades: 0,
      email: app.email,
      phone: app.phone,
      approvedAt: new Date().toISOString(),
    };

    participants.push(newParticipant);
    saveParticipants(participants);

    // Also add to leaderboard data for display
    const leaderboardData = loadLeaderboardData();
    leaderboardData.push({
      id: leaderboardData.length + 1,
      name: app.name,
      account: "Standard Account",
      return: 0,
      pips: 0,
      winRate: 0,
      trades: 0,
    });
    saveLeaderboardData(leaderboardData);

    saveApplications(applications);
    renderPendingApplications();
    renderLeaderboard();

    // Send notification (in a real app, this would be an email/SMS)
    showToast(
      `${app.name} has been approved and added to the leaderboard!`,
      "success",
    );

    // Create notification for the user
    createNotification(
      app.userId,
      `🎉 Congratulations! You've been approved for the ${currentChallenge.name}!`,
    );
  };

  // ====================================
  // REJECT APPLICATION (ADMIN)
  // ====================================
  window.rejectApplication = function (appId) {
    if (!isAdminAuthenticated && !checkAuth()) {
      showToast("Please login as admin first.", "error");
      return;
    }

    if (!confirm("Reject this application?")) return;

    const applications = loadApplications();
    const appIndex = applications.findIndex((a) => a.id === appId);

    if (appIndex === -1) {
      showToast("Application not found.", "error");
      return;
    }

    const app = applications[appIndex];
    app.status = "rejected";

    saveApplications(applications);
    renderPendingApplications();

    // Send notification
    createNotification(
      app.userId,
      `Sorry, your application for ${currentChallenge.name} was not approved. Please contact support for more information.`,
    );
    showToast(`Application rejected.`, "info");
  };

  // ====================================
  // NOTIFICATIONS SYSTEM
  // ====================================
  function createNotification(userId, message) {
    const notifications = JSON.parse(
      localStorage.getItem("userNotifications") || "[]",
    );
    notifications.push({
      id: Date.now(),
      userId: userId,
      message: message,
      read: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("userNotifications", JSON.stringify(notifications));

    // Update notification badge if on dashboard
    updateNotificationBadge();
  }

  function getNotifications(userId) {
    const notifications = JSON.parse(
      localStorage.getItem("userNotifications") || "[]",
    );
    return notifications.filter((n) => n.userId === userId);
  }

  function updateNotificationBadge() {
    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");
    if (user) {
      try {
        const userData = JSON.parse(user);
        const userId = userData.id || Date.now();
        const notifications = getNotifications(userId);
        const unread = notifications.filter((n) => !n.read);
        const badge = document.querySelector(".notif-badge");
        if (badge) {
          badge.textContent = unread.length;
          badge.style.display = unread.length > 0 ? "flex" : "none";
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  // ====================================
  // CHECK ADMIN SESSION
  // ====================================
  function checkAdminSession() {
    const session = localStorage.getItem("adminSession");
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.loggedIn && Date.now() < data.expiry) {
          isAdminAuthenticated = true;
          showDashboardAdmin();
          renderPendingApplications();
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  // ====================================
  // UPDATE PARTICIPANTS COUNT ON LOAD
  // ====================================
  updateParticipantsCount();

  // ====================================
  // EXPOSE FUNCTIONS FOR ADMIN PANEL
  // ====================================
  window.renderPendingApplications = renderPendingApplications;
  window.loadApplications = loadApplications;
  window.saveApplications = saveApplications;
  window.loadParticipants = loadParticipants;
  window.saveParticipants = saveParticipants;
  window.updateParticipantsCount = updateParticipantsCount;

  // ====================================
  // AUTO-CHECK FOR PENDING APPLICATIONS
  // ====================================
  if (isAdminAuthenticated) {
    renderPendingApplications();
    pendingApplications.style.display = "block";
  }

  console.log("✅ Performance - Challenge flow initialized");
});
