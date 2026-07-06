// ====================================
// BLOG ADMIN - Supabase powered
// ====================================

let isAdminLoggedIn = false;

// ====================================
// AUTH
// ====================================
async function isCurrentUserAdmin() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return false;
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();
  return !error && data && data.role === "admin";
}

async function checkAdminSession() {
  if (await isCurrentUserAdmin()) {
    isAdminLoggedIn = true;
    showAdminUI();
  }
}

async function adminLogin() {
  const email = document.getElementById("adminEmail")?.value.trim();
  const password = document.getElementById("adminPassword")?.value;
  const loginError = document.getElementById("loginError");

  if (!email || !password) {
    loginError.textContent = "Please enter email and password.";
    return;
  }

  loginError.textContent = "";
  const loginBtn = document.getElementById("loginBtn");
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = error.message;
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
    return;
  }

  // Gate the admin panel on the admin role, not just a valid login.
  if (!(await isCurrentUserAdmin())) {
    await supabaseClient.auth.signOut();
    loginError.textContent = "This account does not have admin access.";
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
    return;
  }

  isAdminLoggedIn = true;
  showAdminUI();
  loadAdminPosts();
}

async function adminLogout() {
  await supabaseClient.auth.signOut();
  isAdminLoggedIn = false;
  hideAdminUI();
}

function showAdminUI() {
  const loginSection = document.getElementById("adminLoginSection");
  const panel = document.getElementById("blogAdminPanel");
  const toggleBtn = document.getElementById("blogAdminToggleBtn");

  if (loginSection) loginSection.style.display = "none";
  if (panel) panel.style.display = "block";
  if (toggleBtn) {
    toggleBtn.innerHTML = '<i class="fas fa-lock-open"></i> Admin Panel';
    toggleBtn.style.borderColor = "#00ff88";
    toggleBtn.style.color = "#00ff88";
  }
}

function hideAdminUI() {
  const loginSection = document.getElementById("adminLoginSection");
  const panel = document.getElementById("blogAdminPanel");
  const toggleBtn = document.getElementById("blogAdminToggleBtn");
  const adminArea = document.getElementById("blogAdminArea");

  if (loginSection) loginSection.style.display = "none";
  if (panel) panel.style.display = "none";
  if (adminArea) adminArea.style.display = "none";
  if (toggleBtn) {
    toggleBtn.innerHTML = '<i class="fas fa-lock"></i> Admin Panel (Owner Only)';
    toggleBtn.style.borderColor = "";
    toggleBtn.style.color = "";
  }
}

function toggleBlogAdmin() {
  const adminArea = document.getElementById("blogAdminArea");
  if (!adminArea) return;

  if (adminArea.style.display === "none" || adminArea.style.display === "") {
    adminArea.style.display = "block";
    if (isAdminLoggedIn) {
      showAdminUI();
      loadAdminPosts();
    } else {
      document.getElementById("adminLoginSection").style.display = "block";
      document.getElementById("blogAdminPanel").style.display = "none";
    }
  } else {
    adminArea.style.display = "none";
  }
}

// ====================================
// IMAGE UPLOAD
// ====================================
async function uploadImage(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `blog/${fileName}`;

  const { error } = await supabaseClient.storage
    .from("blog-media")
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from("blog-media")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// ====================================
// CREATE POST
// ====================================
async function createPost() {
  if (!isAdminLoggedIn) return;

  const title = document.getElementById("postTitle")?.value.trim();
  const category = document.getElementById("postCategory")?.value;
  const excerpt = document.getElementById("postExcerpt")?.value.trim();
  const content = document.getElementById("postContent")?.value.trim();
  const readTime = document.getElementById("postReadTime")?.value.trim();
  const imageInput = document.getElementById("postImage");
  const statusEl = document.getElementById("postStatus");
  const submitBtn = document.getElementById("submitPostBtn");

  if (!title || !category || !excerpt) {
    statusEl.textContent = "Please fill in title, category, and excerpt.";
    statusEl.className = "post-status error";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Publishing...";
  statusEl.textContent = "";

  try {
    let imageUrl = null;

    if (imageInput?.files?.length > 0) {
      const file = imageInput.files[0];
      if (file.size > 5 * 1024 * 1024) {
        statusEl.textContent = "Image must be under 5MB.";
        statusEl.className = "post-status error";
        submitBtn.disabled = false;
        submitBtn.textContent = "Publish Post";
        return;
      }
      imageUrl = await uploadImage(file);
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const insertData = {
      title,
      slug,
      category,
      excerpt,
      content: content || "",
      image_url: imageUrl,
      read_time: readTime || "5 min read",
    };

    console.log("Inserting post:", insertData);
    console.log("Auth session:", await supabaseClient.auth.getSession());

    const { data: insertResult, error } = await supabaseClient.from("blog_posts").insert(insertData).select();

    console.log("Insert result:", insertResult);
    console.log("Insert error:", error);

    if (error) throw error;

    statusEl.textContent = "Post published!";
    statusEl.className = "post-status success";

    document.getElementById("postTitle").value = "";
    document.getElementById("postExcerpt").value = "";
    document.getElementById("postContent").value = "";
    document.getElementById("postReadTime").value = "";
    if (imageInput) imageInput.value = "";
    clearImagePreview();

    loadAdminPosts();
    loadSupabasePosts();
  } catch (err) {
    statusEl.textContent = "Error: " + err.message;
    statusEl.className = "post-status error";
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Publish Post";
}

// ====================================
// DELETE POST
// ====================================
async function deletePost(postId, imageUrl) {
  if (!isAdminLoggedIn) return;
  if (!confirm("Delete this post? This cannot be undone.")) return;

  try {
    if (imageUrl) {
      const path = imageUrl.split("/blog-media/")[1];
      if (path) {
        await supabaseClient.storage.from("blog-media").remove([path]);
      }
    }

    const { error } = await supabaseClient.from("blog_posts").delete().eq("id", postId);
    if (error) throw error;

    loadAdminPosts();
    loadSupabasePosts();
  } catch (err) {
    alert("Error deleting post: " + err.message);
  }
}

// ====================================
// LOAD ADMIN POST LIST
// ====================================
async function loadAdminPosts() {
  const listEl = document.getElementById("adminPostList");
  if (!listEl) return;

  const { data, error } = await supabaseClient
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    listEl.innerHTML = '<p style="color: var(--danger);">Error loading posts.</p>';
    return;
  }

  if (!data || data.length === 0) {
    listEl.innerHTML = '<p style="color: var(--text-muted);">No posts yet. Create your first one above!</p>';
    return;
  }

  listEl.innerHTML = data
    .map(
      (post) => `
    <div class="admin-post-item">
      <div class="admin-post-info">
        <strong>${escapeHtml(post.title)}</strong>
        <span class="admin-post-meta">${post.category} &middot; ${new Date(post.created_at).toLocaleDateString()}</span>
      </div>
      <button class="admin-delete-btn" onclick="deletePost('${post.id}', ${post.image_url ? "'" + escapeHtml(post.image_url) + "'" : "null"})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `
    )
    .join("");
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ====================================
// IMAGE PREVIEW
// ====================================
function previewImage(input) {
  const preview = document.getElementById("imagePreview");
  if (!preview) return;

  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview" /><button type="button" class="remove-preview" onclick="clearImagePreview()">&times;</button>`;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function clearImagePreview() {
  const preview = document.getElementById("imagePreview");
  const input = document.getElementById("postImage");
  if (preview) preview.innerHTML = "";
  if (input) input.value = "";
}

// ====================================
// LOAD POSTS INTO BLOG GRID
// ====================================
const CATEGORY_LABELS = {
  analysis: "Market Analysis",
  psychology: "Trading Psychology",
  strategy: "Trading Strategies",
  news: "Forex News",
};

async function loadSupabasePosts() {
  const blogGrid = document.getElementById("blogGrid");
  if (!blogGrid) return;

  const { data, error } = await supabaseClient
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    blogGrid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Could not load posts. Please try again later.</p>
      </div>
    `;
    return;
  }

  // Clear the grid
  blogGrid.innerHTML = "";

  if (!data || data.length === 0) {
    blogGrid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-chart-line"></i>
        <p>No posts yet. Check back soon for daily market analysis!</p>
      </div>
    `;
    return;
  }

  data.forEach((post, index) => {
    const card = document.createElement("div");
    card.className = "blog-card" + (index === 0 && data.length > 1 ? " featured" : "");
    card.setAttribute("data-category", post.category);
    card.style.animationDelay = `${index * 0.05}s`;

    const dateStr = new Date(post.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const postUrl = `post.html?id=${post.id}`;

    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      window.location.href = postUrl;
    });

    card.innerHTML = `
      <div class="blog-image">
        ${post.image_url ? `<img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.title)}" />` : ""}
      </div>
      <div class="blog-content">
        <span class="blog-category">${CATEGORY_LABELS[post.category] || post.category}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
        <div class="blog-meta">
          <span><i class="far fa-calendar"></i> ${dateStr}</span>
          <span><i class="far fa-clock"></i> ${escapeHtml(post.read_time) || "5 min read"}</span>
        </div>
        <span class="read-more">Read More <i class="fas fa-arrow-right"></i></span>
      </div>
    `;

    blogGrid.appendChild(card);
  });

  if (typeof filterBlogs === "function") {
    filterBlogs();
  }
}

// ====================================
// INIT
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  checkAdminSession();
  loadSupabasePosts();

  document.getElementById("blogAdminToggleBtn")?.addEventListener("click", toggleBlogAdmin);
  document.getElementById("loginBtn")?.addEventListener("click", adminLogin);
  document.getElementById("logoutBtn")?.addEventListener("click", adminLogout);
  document.getElementById("submitPostBtn")?.addEventListener("click", createPost);

  document.getElementById("postImage")?.addEventListener("change", function () {
    previewImage(this);
  });

  // Allow Enter key on password field
  document.getElementById("adminPassword")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") adminLogin();
  });
});
