// ====================================
// Nana Forex — Account page
// Uses window.NanaAuth (js/auth.js) to load/edit the user's profile,
// upload an avatar, change password, and list notifications.
// ====================================

(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  let session = null;

  document.addEventListener("DOMContentLoaded", async () => {
    // Guard — bounce anonymous visitors to login.
    session = await NanaAuth.requireAuth("login.html");
    if (!session) return;

    $("accountEmail").textContent = session.user.email;

    await hydrateProfile();
    await loadNotifications();

    $("profileForm")?.addEventListener("submit", saveProfile);
    $("avatarInput")?.addEventListener("change", onAvatarPicked);
    $("passwordForm")?.addEventListener("submit", changePassword);
    $("markAllReadBtn")?.addEventListener("click", markAllRead);
  });

  // ---------- profile ----------
  async function hydrateProfile() {
    const p = await NanaAuth.loadProfile();
    if (!p) return;

    if ($("fullName")) $("fullName").value = p.full_name || "";
    if ($("phone")) $("phone").value = p.phone || "";
    if ($("country")) $("country").value = p.country || "";
    if ($("bio")) $("bio").value = p.bio || "";

    const name = p.full_name || session.user.email;
    if ($("accountName")) $("accountName").textContent = name;
    setAvatar(p.avatar_url, name);
  }

  function setAvatar(url, name) {
    const img = $("avatarImg");
    const fallback = $("avatarFallback");
    if (!img || !fallback) return;
    if (url) {
      img.src = url;
      img.style.display = "block";
      fallback.style.display = "none";
    } else {
      img.style.display = "none";
      fallback.style.display = "flex";
      fallback.textContent = (name || "?").trim().charAt(0).toUpperCase();
    }
  }

  async function saveProfile(evt) {
    evt.preventDefault();
    const status = $("profileStatus");
    const btn = $("saveProfileBtn");
    btn.disabled = true;

    const fields = {
      full_name: $("fullName").value.trim(),
      phone: $("phone").value.trim(),
      country: $("country").value.trim(),
      bio: $("bio").value.trim(),
    };

    const { error } = await NanaAuth.updateProfile(fields);
    btn.disabled = false;

    if (error) {
      status.textContent = error.message;
      status.className = "auth-status error";
      return;
    }
    status.textContent = "Profile saved.";
    status.className = "auth-status success";
    if ($("accountName")) $("accountName").textContent = fields.full_name || session.user.email;
    NanaAuth.toast("Profile updated.", "success");
  }

  // ---------- avatar ----------
  async function onAvatarPicked(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      NanaAuth.toast("Image must be under 2MB.", "error");
      return;
    }
    try {
      NanaAuth.toast("Uploading…", "info");
      const url = await NanaAuth.uploadAvatar(file);
      setAvatar(url, $("accountName")?.textContent);
      NanaAuth.toast("Avatar updated.", "success");
    } catch (err) {
      NanaAuth.toast("Upload failed: " + err.message, "error");
    }
  }

  // ---------- password ----------
  async function changePassword(evt) {
    evt.preventDefault();
    const status = $("passwordStatus");
    const pw = $("accountNewPassword").value;
    if (pw.length < 8) {
      status.textContent = "Password must be at least 8 characters.";
      status.className = "auth-status error";
      return;
    }
    const btn = $("changePasswordBtn");
    btn.disabled = true;
    const { error } = await supabaseClient.auth.updateUser({ password: pw });
    btn.disabled = false;

    if (error) {
      status.textContent = error.message;
      status.className = "auth-status error";
      return;
    }
    $("accountNewPassword").value = "";
    status.textContent = "Password changed.";
    status.className = "auth-status success";
    NanaAuth.toast("Password changed.", "success");
  }

  // ---------- notifications ----------
  async function loadNotifications() {
    const list = $("notificationList");
    if (!list) return;

    const { data, error } = await supabaseClient
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      list.innerHTML = '<p class="acct-empty">Could not load notifications.</p>';
      return;
    }
    if (!data || data.length === 0) {
      list.innerHTML = '<p class="acct-empty">No notifications yet.</p>';
      return;
    }

    list.innerHTML = data
      .map(
        (n) => `
        <div class="acct-notif ${n.read ? "" : "unread"}">
          <div class="acct-notif-dot ${n.type}"></div>
          <div>
            <strong>${escapeHtml(n.title)}</strong>
            ${n.body ? `<p>${escapeHtml(n.body)}</p>` : ""}
            <span class="acct-notif-time">${new Date(n.created_at).toLocaleString()}</span>
          </div>
        </div>`
      )
      .join("");
  }

  async function markAllRead() {
    const { error } = await supabaseClient
      .from("notifications")
      .update({ read: true })
      .eq("user_id", session.user.id)
      .eq("read", false);
    if (!error) {
      await loadNotifications();
      NanaAuth.toast("All notifications marked read.", "success");
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
