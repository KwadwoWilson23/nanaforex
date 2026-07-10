// ====================================
// ACADEMY - Courses, Learning & More
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
  // COURSE DATA WITH VIDEO LINKS
  // ====================================
  const courses = [
    {
      id: 1,
      title: "Forex Trading for Beginners",
      description:
        "Learn the fundamentals of forex trading including currency pairs, pips, lots, and basic strategies.",
      category: "Forex Basics",
      level: "Beginner",
      duration: "4 weeks",
      price: "free",
      videoUrl: "https://www.youtube.com/embed/3tF34NvY4gY",
      icon: "fa-book",
    },
    {
      id: 2,
      title: "Technical Analysis Mastery",
      description:
        "Master chart patterns, indicators, trend analysis, and price action strategies.",
      category: "Technical Analysis",
      level: "Intermediate",
      duration: "6 weeks",
      price: "free",
      videoUrl: "https://www.youtube.com/embed/eEYrUjg4Px4",
      icon: "fa-chart-line",
    },
    {
      id: 3,
      title: "Advanced Price Action",
      description:
        "Learn to read naked charts, identify high-probability setups, and trade with precision.",
      category: "Price Action",
      level: "Advanced",
      duration: "8 weeks",
      price: "paid",
      amount: "$299",
      videoUrl: "https://www.youtube.com/embed/VhD64qNQxEM",
      icon: "fa-arrows-alt-h",
    },
    {
      id: 4,
      title: "Trading Psychology & Discipline",
      description:
        "Master your emotions, develop discipline, and build a winning trader's mindset.",
      category: "Trading Psychology",
      level: "Intermediate",
      duration: "5 weeks",
      price: "free",
      videoUrl: "https://www.youtube.com/embed/4bHrSsH0I5I",
      icon: "fa-brain",
    },
    {
      id: 5,
      title: "Risk Management Pro",
      description:
        "Learn position sizing, stop-loss strategies, and how to protect your trading capital.",
      category: "Risk Management",
      level: "Intermediate",
      duration: "4 weeks",
      price: "paid",
      amount: "$199",
      videoUrl: "https://www.youtube.com/embed/yf8nFYBs_rQ",
      icon: "fa-shield-alt",
    },
    {
      id: 6,
      title: "Fundamental Analysis for Traders",
      description:
        "Understand economic indicators, news trading, and central bank policies.",
      category: "Fundamental Analysis",
      level: "Intermediate",
      duration: "6 weeks",
      price: "free",
      videoUrl: "https://www.youtube.com/embed/7PJZg_1eDFU",
      icon: "fa-globe",
    },
    {
      id: 7,
      title: "Scalping & Day Trading Strategies",
      description:
        "Master short-term trading strategies for fast profits in any market condition.",
      category: "Advanced Strategies",
      level: "Advanced",
      duration: "8 weeks",
      price: "paid",
      amount: "$399",
      videoUrl: "https://www.youtube.com/embed/FlHznUUEQMc",
      icon: "fa-rocket",
    },
    {
      id: 8,
      title: "Swing Trading Masterclass",
      description:
        "Capture medium-term moves with proven swing trading strategies and setups.",
      category: "Advanced Strategies",
      level: "Advanced",
      duration: "6 weeks",
      price: "paid",
      amount: "$349",
      videoUrl: "https://www.youtube.com/embed/awx9G5dFpcc",
      icon: "fa-chart-pie",
    },
  ];

  // ====================================
  // RENDER COURSES
  // ====================================
  function renderCourses() {
    const grid = document.getElementById("coursesGrid");
    if (!grid) return;

    grid.innerHTML = courses
      .map(
        (course) => `
      <div class="course-card" data-id="${course.id}">
        <div class="course-image">
          <div class="course-thumbnail" style="background: linear-gradient(135deg, #0a2540, #1a3a5c); display: flex; align-items: center; justify-content: center;">
            <i class="fas ${course.icon}" style="font-size: 3rem; color: var(--gold); opacity: 0.8;"></i>
          </div>
          <span class="course-badge ${course.price}">${course.price === "free" ? "Free" : "Premium"}</span>
        </div>
        <div class="course-content">
          <h3>${course.title}</h3>
          <p class="course-description">${course.description}</p>
          <div class="course-meta">
            <span><i class="fas fa-signal"></i> ${course.level}</span>
            <span><i class="fas fa-clock"></i> ${course.duration}</span>
            <span><i class="fas fa-tag"></i> ${course.category}</span>
          </div>
          <div class="course-actions">
            <span class="course-price ${course.price}">${course.price === "free" ? "Free" : course.amount}</span>
            <button class="btn-access ${course.price}-btn" onclick="accessCourse(${course.id})">
              ${course.price === "free" ? '<i class="fas fa-play"></i> Watch Now' : '<i class="fas fa-lock"></i> Get Access'}
            </button>
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  // ====================================
  // COURSE ACCESS FUNCTION
  // ====================================
  window.accessCourse = function (courseId) {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const modal = document.getElementById("courseModal");
    const body = document.getElementById("courseModalBody");

    if (course.price === "free") {
      // Free course - show video player option
      body.innerHTML = `
        <div class="modal-icon"><i class="fas fa-graduation-cap"></i></div>
        <h3>${course.title}</h3>
        <p>This is a free course. Click below to start watching!</p>
        <div class="modal-price free">Free</div>
        <button class="btn-primary" onclick="closeModal(); playVideo(${course.id});">
          <i class="fas fa-play"></i> Watch Video
        </button>
      `;
    } else {
      // Paid course - show payment flow
      body.innerHTML = `
        <div class="modal-icon"><i class="fas fa-lock"></i></div>
        <h3>${course.title}</h3>
        <p>This is a premium course. You need to complete payment before accessing the content.</p>
        <div class="modal-price">${course.amount}</div>
        <button class="btn-primary" onclick="closeModal(); requestPayment(${course.id});">
          <i class="fas fa-credit-card"></i> Pay & Access
        </button>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem;">
          <i class="fas fa-info-circle"></i> Payment will be verified by admin before access.
        </p>
      `;
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  // ====================================
  // PLAY VIDEO (Free Courses)
  // ====================================
  window.playVideo = function (courseId) {
    const course = courses.find((c) => c.id === courseId);
    if (!course || !course.videoUrl) {
      showToast("Video not available yet. Coming soon!", "warning");
      return;
    }

    const videoModal = document.getElementById("videoModal");
    const videoWrapper = document.getElementById("videoWrapper");

    videoWrapper.innerHTML = `
      <iframe 
        src="${course.videoUrl}" 
        title="${course.title}"
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        style="width: 100%; height: 100%; border-radius: 12px;"
      ></iframe>
    `;

    videoModal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Save progress
    const progress = JSON.parse(localStorage.getItem("courseProgress") || "{}");
    progress[courseId] = {
      started: true,
      startedAt: new Date().toISOString(),
      completed: false,
      lastWatched: new Date().toISOString(),
    };
    localStorage.setItem("courseProgress", JSON.stringify(progress));

    showToast(`🎬 Playing: ${course.title}`, "success");
  };

  // ====================================
  // VIDEO MODAL CONTROLS
  // ====================================
  document
    .getElementById("videoModalClose")
    ?.addEventListener("click", function () {
      const videoModal = document.getElementById("videoModal");
      const videoWrapper = document.getElementById("videoWrapper");
      videoModal.classList.remove("active");
      videoWrapper.innerHTML = "";
      document.body.style.overflow = "";
    });

  document
    .getElementById("videoModal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) {
        const videoWrapper = document.getElementById("videoWrapper");
        this.classList.remove("active");
        videoWrapper.innerHTML = "";
        document.body.style.overflow = "";
      }
    });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const videoModal = document.getElementById("videoModal");
      if (videoModal.classList.contains("active")) {
        const videoWrapper = document.getElementById("videoWrapper");
        videoModal.classList.remove("active");
        videoWrapper.innerHTML = "";
        document.body.style.overflow = "";
      }
      const courseModal = document.getElementById("courseModal");
      if (courseModal.classList.contains("active")) {
        closeModal();
      }
    }
  });

  // ====================================
  // REQUEST PAYMENT (Paid)
  // ====================================
  window.requestPayment = function (courseId) {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");
    if (!user) {
      showToast("Please login first to purchase courses.", "warning");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
      return;
    }

    const paymentRequest = {
      id: Date.now(),
      courseId: course.id,
      courseTitle: course.title,
      amount: course.amount,
      status: "pending",
      userId: getCurrentUserId(),
      userName: getUserName(),
      createdAt: new Date().toISOString(),
    };

    const requests = JSON.parse(
      localStorage.getItem("paymentRequests") || "[]",
    );
    requests.push(paymentRequest);
    localStorage.setItem("paymentRequests", JSON.stringify(requests));

    showToast(
      `💰 Payment request for "${course.title}" submitted. Waiting for admin approval.`,
      "info",
    );

    console.log("Payment request:", paymentRequest);

    closeModal();
  };

  // ====================================
  // MODAL CONTROLS
  // ====================================
  window.closeModal = function () {
    const modal = document.getElementById("courseModal");
    modal.classList.remove("active");
    document.body.style.overflow = "";
  };

  document
    .getElementById("courseModalClose")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("courseModal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal();
      }
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

  // Add toast animation styles if not present
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

  // ====================================
  // HELPER FUNCTIONS
  // ====================================
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

  function getUserName() {
    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");
    if (user) {
      try {
        return JSON.parse(user).name || "Trader";
      } catch (e) {
        return "Trader";
      }
    }
    return "Trader";
  }

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

      const userName = document.getElementById("userName");
      const userInitials = document.getElementById("userInitials");

      if (userName) {
        userName.textContent = userData.name || "Trader";
      }

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
  // INITIALIZE
  // ====================================
  renderCourses();

  console.log("✅ Academy initialized with", courses.length, "courses");
});
