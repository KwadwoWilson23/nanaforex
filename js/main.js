const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const menuOverlay = document.querySelector(".menu-overlay");

function closeMobileMenu() {
  mobileMenu?.classList.remove("active");
  menuOverlay?.classList.remove("active");
  hamburger?.setAttribute("aria-expanded", "false");
}

function toggleMobileMenu() {
  const isOpen = mobileMenu?.classList.toggle("active") || false;
  menuOverlay?.classList.toggle("active", isOpen);
  hamburger?.setAttribute("aria-expanded", String(isOpen));
}

if (hamburger && mobileMenu) {
  hamburger.setAttribute("role", "button");
  hamburger.setAttribute("tabindex", "0");
  hamburger.setAttribute("aria-label", "Toggle navigation menu");
  hamburger.setAttribute("aria-expanded", "false");

  hamburger.addEventListener("click", toggleMobileMenu);
  hamburger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMobileMenu();
    }
  });

  menuOverlay?.addEventListener("click", closeMobileMenu);
  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });
}

const marketData = [
  "EUR/USD ▲ +1.43%",
  "GBP/USD ▲ +0.86%",
  "XAU/USD ▲ +2.11%",
  "BTC/USD ▲ +4.58%",
  "USD/JPY ▼ -0.38%",
  "NAS100 ▲ +1.75%",
];

const ticker = document.getElementById("tickerTrack") || document.querySelector(".ticker-track");

if (ticker) {
  ticker.innerHTML = [...marketData, ...marketData]
    .map((item) => `<span>${item}</span>`)
    .join("");
}
