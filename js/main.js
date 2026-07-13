// Mobile Menu Functionality
document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.querySelector(".mobile-menu");
  const menuOverlay = document.querySelector(".menu-overlay");
  const mobileMenuClose = document.querySelector(".mobile-menu-close");

  function closeMobileMenu() {
    mobileMenu?.classList.remove("active");
    menuOverlay?.classList.remove("active");
    hamburger?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = ""; // Re-enable scrolling
  }

  function openMobileMenu() {
    mobileMenu?.classList.add("active");
    menuOverlay?.classList.add("active");
    hamburger?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden"; // Prevent scrolling when menu is open
  }

  function toggleMobileMenu() {
    const isOpen = mobileMenu?.classList.contains("active");
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  // Hamburger click event
  if (hamburger && mobileMenu) {
    hamburger.setAttribute("role", "button");
    hamburger.setAttribute("tabindex", "0");
    hamburger.setAttribute("aria-label", "Toggle navigation menu");
    hamburger.setAttribute("aria-expanded", "false");

    hamburger.addEventListener("click", toggleMobileMenu);
    hamburger.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleMobileMenu();
      }
    });
  }

  // Close button click event
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener("click", closeMobileMenu);
  }

  // Overlay click event
  menuOverlay?.addEventListener("click", closeMobileMenu);

  // Close menu when clicking on any link inside mobile menu
  mobileMenu?.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMobileMenu);
  });

  // Close menu on Escape key press
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mobileMenu?.classList.contains("active")) {
      closeMobileMenu();
    }
  });

  // Market Ticker
  const marketData = [
    "EUR/USD ▲ +1.43%",
    "GBP/USD ▲ +0.86%",
    "XAU/USD ▲ +2.11%",
    "BTC/USD ▲ +4.58%",
    "USD/JPY ▼ -0.38%",
    "NAS100 ▲ +1.75%",
  ];

  const ticker =
    document.getElementById("tickerTrack") ||
    document.querySelector(".ticker-track");

  if (ticker) {
    ticker.innerHTML = [...marketData, ...marketData]
      .map(function (item) {
        return `<span>${item}</span>`;
      })
      .join("");
  }
});

// ====================================
// MOTION LAYER — scroll reveals, sticky nav, hero float
// Additive & safe: gated on reduced-motion + IntersectionObserver,
// wrapped in try/catch so a failure never hides content.
// ====================================
(function () {
  "use strict";

  // Load the motion stylesheet once (absolute path works from any page depth).
  if (!document.querySelector('link[data-nf-animations]')) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/animations.css";
    link.setAttribute("data-nf-animations", "");
    document.head.appendChild(link);
  }

  function initMotion() {
    try {
      // Sticky nav condense on scroll (independent of reveal support).
      var nav = document.querySelector(".navbar");
      if (nav) {
        var onScroll = function () {
          nav.classList.toggle("scrolled", window.scrollY > 30);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
      }

      var reduce =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || !("IntersectionObserver" in window)) return; // leave content fully visible

      document.documentElement.classList.add("motion-ready");

      var selector = [
        ".section-title",
        ".hero-badge",
        ".hero h1",
        ".hero p",
        ".hero-buttons",
        ".service-card",
        ".why-card",
        ".stat-card",
        ".metric-card",
        ".testimonial-card",
        ".blog-card",
        ".value-card",
        ".team-card",
        ".about-image",
        ".about-text",
        ".faq-simple-item",
        ".info-item",
        ".contact-form-container",
        ".dashboard-card",
        ".cta h2",
        ".cta p",
      ].join(",");

      var els = Array.prototype.slice.call(document.querySelectorAll(selector));
      var counters = new Map();
      els.forEach(function (el) {
        if (el.hasAttribute("data-reveal")) return;
        el.setAttribute("data-reveal", "");
        var p = el.parentElement;
        var c = counters.get(p) || 0;
        el.style.setProperty("--reveal-i", Math.min(c, 6));
        counters.set(p, c + 1);
      });

      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      els.forEach(function (el) {
        io.observe(el);
      });

      // Failsafe: if the observer never reveals on-screen items shortly
      // after load, reveal anything already in the viewport so above-the-fold
      // content can't get stuck hidden. Below-fold items still wait for scroll.
      setTimeout(function () {
        var vh = window.innerHeight || document.documentElement.clientHeight || 0;
        els.forEach(function (el) {
          if (el.classList.contains("in-view")) return;
          var r = el.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) el.classList.add("in-view");
        });
      }, 2500);
    } catch (e) {
      // On any failure, make sure nothing is left hidden.
      document.documentElement.classList.remove("motion-ready");
      if (window.console) console.warn("[motion] disabled:", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMotion);
  } else {
    initMotion();
  }
})();
