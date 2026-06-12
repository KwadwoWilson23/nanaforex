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
