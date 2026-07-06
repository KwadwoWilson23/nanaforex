// blog.js - Works with dynamically loaded Supabase posts

// ====================================
// FILTER FUNCTIONALITY
// ====================================
const filterButtons = document.querySelectorAll(".filter-btn");
const searchInput = document.getElementById("blogSearch");
const blogGrid = document.getElementById("blogGrid");

function filterBlogs() {
  const activeFilter =
    document.querySelector(".filter-btn.active")?.dataset.category || "all";
  const searchTerm = searchInput?.value.toLowerCase().trim() || "";
  const blogCards = blogGrid?.querySelectorAll(".blog-card") || [];
  let visibleCount = 0;

  blogCards.forEach((card) => {
    const category = card.dataset.category;
    const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
    const content = card.querySelector("p")?.innerText.toLowerCase() || "";
    const matchesFilter = activeFilter === "all" || category === activeFilter;
    const matchesSearch =
      title.includes(searchTerm) || content.includes(searchTerm);

    if (matchesFilter && matchesSearch) {
      card.style.display = "";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });

  const existingNoResults = document.querySelector(".no-results");
  if (visibleCount === 0 && blogCards.length > 0) {
    if (!existingNoResults) {
      const noResultsDiv = document.createElement("div");
      noResultsDiv.className = "no-results";
      noResultsDiv.innerHTML = `
        <i class="fas fa-search"></i>
        <p>No articles found matching your search.</p>
        <p style="font-size: 0.875rem;">Try different keywords or browse all categories.</p>
      `;
      blogGrid?.appendChild(noResultsDiv);
    }
  } else {
    if (existingNoResults) {
      existingNoResults.remove();
    }
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filterBlogs();
  });
});

if (searchInput) {
  searchInput.addEventListener("input", filterBlogs);
}

// ====================================
// SMOOTH SCROLL FOR FILTERS (mobile)
// ====================================
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const blogSection = document.querySelector(".blog-grid-section");
    if (window.innerWidth < 768) {
      setTimeout(() => {
        blogSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  });
});

// ====================================
// NEWSLETTER FORM HANDLING
// ====================================
const newsletterForm = document.querySelector(".newsletter-form");
if (newsletterForm) {
  newsletterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const email = emailInput.value;

    const originalButtonText = newsletterForm.querySelector("button").innerHTML;
    newsletterForm.querySelector("button").innerHTML =
      'Subscribed! <i class="fas fa-check"></i>';

    console.log("Newsletter subscription:", email);

    setTimeout(() => {
      newsletterForm.querySelector("button").innerHTML = originalButtonText;
      emailInput.value = "";
    }, 2000);
  });
}
