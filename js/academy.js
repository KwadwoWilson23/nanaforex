// ====================================
// ACADEMY - Courses, Learning & More
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  // ====================================
  // COURSE DATA
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
      image: "forex-basics.jpg",
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
      image: "technical-analysis.jpg",
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
      image: "price-action.jpg",
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
      image: "psychology.jpg",
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
      image: "risk-management.jpg",
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
      image: "fundamental.jpg",
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
      image: "scalping.jpg",
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
      image: "swing-trading.jpg",
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
          <img src="../images/${course.image}" alt="${course.title}" onerror="this.style.display='none'">
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
              ${course.price === "free" ? '<i class="fas fa-play"></i> Access Now' : '<i class="fas fa-lock"></i> Get Access'}
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
      // Free course - open directly
      body.innerHTML = `
        <div class="modal-icon"><i class="fas fa-graduation-cap"></i></div>
        <h3>${course.title}</h3>
        <p>You're about to access this free course. Click below to start learning!</p>
        <div class="modal-price free">Free</div>
        <button class="btn-primary" onclick="closeModal(); startCourse(${course.id});">
          <i class="fas fa-play"></i> Start Learning
        </button>
      `;
    } else {
      // Paid course - show payment/approval flow
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
  // START COURSE (Free)
  // ====================================
  window.startCourse = function (courseId) {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    showToast(`🎓 Starting "${course.title}". Happy learning!`, "success");

    // Save progress to localStorage
    const progress = JSON.parse(localStorage.getItem("courseProgress") || "{}");
    progress[courseId] = {
      started: true,
      startedAt: new Date().toISOString(),
      completed: false,
    };
    localStorage.setItem("courseProgress", JSON.stringify(progress));
  };

  // ====================================
  // REQUEST PAYMENT (Paid)
  // ====================================
  window.requestPayment = function (courseId) {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    // Check if user is logged in
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

    // Create payment request
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

    // Save payment request
    const requests = JSON.parse(
      localStorage.getItem("paymentRequests") || "[]",
    );
    requests.push(paymentRequest);
    localStorage.setItem("paymentRequests", JSON.stringify(requests));

    showToast(
      `💰 Payment request for "${course.title}" submitted. Waiting for admin approval.`,
      "info",
    );

    // Send notification to admin (in a real app, this would be an email)
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

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("courseModal");
      if (modal.classList.contains("active")) {
        closeModal();
      }
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
  // INITIALIZE
  // ====================================
  renderCourses();

  console.log("✅ Academy initialized with", courses.length, "courses");
});
