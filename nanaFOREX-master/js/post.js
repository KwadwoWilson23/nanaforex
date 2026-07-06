// ====================================
// SINGLE POST PAGE
// ====================================

const CATEGORY_LABELS = {
  analysis: "Market Analysis",
  psychology: "Trading Psychology",
  strategy: "Trading Strategies",
  news: "Forex News",
};

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatContent(text) {
  if (!text) return "";
  // Convert line breaks to paragraphs
  return text
    .split(/\n\n+/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

async function loadPost() {
  const container = document.getElementById("postContainer");
  const loading = document.getElementById("postLoading");
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  if (!postId) {
    container.innerHTML = `
      <div class="post-not-found">
        <i class="fas fa-exclamation-triangle"></i>
        <h2>Post Not Found</h2>
        <p>The post you're looking for doesn't exist.</p>
        <a href="blog.html" class="btn-primary">Back to Blog</a>
      </div>
    `;
    return;
  }

  try {
    const { data: post, error } = await supabaseClient
      .from("blog_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error || !post) {
      container.innerHTML = `
        <div class="post-not-found">
          <i class="fas fa-exclamation-triangle"></i>
          <h2>Post Not Found</h2>
          <p>This post may have been removed or the link is incorrect.</p>
          <a href="blog.html" class="btn-primary">Back to Blog</a>
        </div>
      `;
      return;
    }

    // Update page title
    document.title = `${post.title} | Nana Forex Blog`;

    const dateStr = new Date(post.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const categoryLabel = CATEGORY_LABELS[post.category] || post.category;

    container.innerHTML = `
      <a href="blog.html" class="back-link">
        <i class="fas fa-arrow-left"></i> Back to Blog
      </a>

      <header class="post-header">
        <span class="post-category-badge">${categoryLabel}</span>
        <h1>${escapeHtml(post.title)}</h1>
        <div class="post-meta-bar">
          <span><i class="far fa-calendar"></i> ${dateStr}</span>
          <span><i class="far fa-clock"></i> ${escapeHtml(post.read_time) || "5 min read"}</span>
        </div>
      </header>

      ${post.image_url ? `
      <div class="post-hero-image">
        <img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.title)}" />
      </div>
      ` : ""}

      <div class="post-body">
        ${post.content && post.content.trim()
          ? formatContent(escapeHtml(post.content))
          : `<p>${escapeHtml(post.excerpt)}</p>`
        }
      </div>

      <div class="post-footer-bar">
        <div class="post-share">
          <span>Share this analysis:</span>
          <div class="share-buttons">
            <a href="https://wa.me/?text=${encodeURIComponent(post.title + " - " + window.location.href)}" target="_blank" class="share-btn whatsapp">
              <i class="fab fa-whatsapp"></i>
            </a>
            <a href="https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}" target="_blank" class="share-btn telegram">
              <i class="fab fa-telegram"></i>
            </a>
            <button class="share-btn copy-link" onclick="copyPostLink()">
              <i class="fas fa-link"></i>
            </button>
          </div>
        </div>
        <a href="blog.html" class="btn-secondary" style="background: transparent;">
          <i class="fas fa-arrow-left"></i> More Articles
        </a>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="post-not-found">
        <i class="fas fa-exclamation-triangle"></i>
        <h2>Something Went Wrong</h2>
        <p>Could not load this post. Please try again later.</p>
        <a href="blog.html" class="btn-primary">Back to Blog</a>
      </div>
    `;
  }
}

function copyPostLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.querySelector(".copy-link");
    if (btn) {
      btn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-link"></i>';
      }, 2000);
    }
  });
}

document.addEventListener("DOMContentLoaded", loadPost);
