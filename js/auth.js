// ====================================
// Nana Forex — User Auth (Supabase)
// Phase 1: register / login / logout / reset / profile / session
//
// Depends on (loaded before this file):
//   - @supabase/supabase-js CDN
//   - js/env.js
//   - js/supabase-client.js   (exposes `supabaseClient`)
//
// This module is UI-agnostic: it looks for well-known element IDs
// and only wires up whatever it finds on the current page, so it can
// be dropped onto login.html, register.html, or a profile page alike.
// ====================================

(function () {
  "use strict";

  if (typeof supabaseClient === "undefined") {
    console.error("[auth] supabaseClient missing — check env.js / supabase-client.js load order.");
    return;
  }

  const REDIRECT_AFTER_LOGIN = "account.html";
  const REDIRECT_AFTER_LOGOUT = "login.html";

  // ---------- small helpers ----------
  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(el, message, type) {
    if (!el) return;
    el.textContent = message || "";
    el.className = "auth-status" + (type ? " " + type : "");
  }

  function busy(btn, isBusy, busyText) {
    if (!btn) return;
    if (isBusy) {
      btn.dataset.label = btn.dataset.label || btn.textContent;
      btn.disabled = true;
      btn.textContent = busyText || "Please wait…";
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.label || btn.textContent;
    }
  }

  // Lightweight toast (matches dashboard-leaderboard.js styling)
  function toast(message, type) {
    type = type || "info";
    let box = $("toastContainer");
    if (!box) {
      box = document.createElement("div");
      box.id = "toastContainer";
      box.style.cssText =
        "position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;";
      document.body.appendChild(box);
    }
    const colors = { success: "#00ff88", error: "#ff4d4d", warning: "#f5b700", info: "#00c896" };
    const t = document.createElement("div");
    t.style.cssText =
      "background:#0e1726;border-left:4px solid " +
      (colors[type] || colors.info) +
      ";padding:12px 20px;border-radius:12px;color:#fff;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.3);min-width:250px;max-width:350px;";
    t.textContent = message;
    box.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  // ====================================
  // CORE AUTH ACTIONS
  // ====================================

  // #1 Registration
  async function register(evt) {
    if (evt) evt.preventDefault();

    const fullName = $("regFullName")?.value.trim();
    const email = $("regEmail")?.value.trim();
    const phone = $("regPhone")?.value.trim() || "";
    const password = $("regPassword")?.value || "";
    const confirm = $("regConfirmPassword")?.value || "";
    const status = $("registerStatus");
    const btn = $("registerBtn");

    if (!fullName || !email || !password) {
      return setStatus(status, "Please fill in name, email and password.", "error");
    }
    if (password.length < 8) {
      return setStatus(status, "Password must be at least 8 characters.", "error");
    }
    if (confirm !== undefined && confirm !== password) {
      return setStatus(status, "Passwords do not match.", "error");
    }

    setStatus(status, "");
    busy(btn, true, "Creating account…");

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: window.location.origin + window.location.pathname.replace(/[^/]+$/, "login.html"),
      },
    });

    busy(btn, false);

    if (error) return setStatus(status, error.message, "error");

    // If email confirmation is ON, session is null until they verify.
    if (!data.session) {
      setStatus(status, "Account created! Check your email to verify, then log in.", "success");
      toast("Verification email sent.", "success");
    } else {
      setStatus(status, "Account created! Redirecting…", "success");
      setTimeout(() => (window.location.href = REDIRECT_AFTER_LOGIN), 800);
    }
  }

  // #2 Login
  async function login(evt) {
    if (evt) evt.preventDefault();

    const email = $("loginEmail")?.value.trim();
    const password = $("loginPassword")?.value || "";
    const status = $("loginStatus");
    const btn = $("loginBtn");

    if (!email || !password) {
      return setStatus(status, "Please enter email and password.", "error");
    }

    setStatus(status, "");
    busy(btn, true, "Signing in…");

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    busy(btn, false);

    if (error) return setStatus(status, error.message, "error");

    setStatus(status, "Success! Redirecting…", "success");
    setTimeout(() => (window.location.href = REDIRECT_AFTER_LOGIN), 500);
  }

  // #3 Logout
  async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = REDIRECT_AFTER_LOGOUT;
  }

  // #4 Password reset — request email
  async function requestPasswordReset(evt) {
    if (evt) evt.preventDefault();

    const email = $("resetEmail")?.value.trim();
    const status = $("resetStatus");
    const btn = $("resetBtn");

    if (!email) return setStatus(status, "Enter your email.", "error");

    busy(btn, true, "Sending…");
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname.replace(/[^/]+$/, "update-password.html"),
    });
    busy(btn, false);

    if (error) return setStatus(status, error.message, "error");
    setStatus(status, "If that email exists, a reset link is on its way.", "success");
  }

  // #4 Password reset — set the new password (on update-password.html)
  async function updatePassword(evt) {
    if (evt) evt.preventDefault();

    const password = $("newPassword")?.value || "";
    const status = $("updatePasswordStatus");
    const btn = $("updatePasswordBtn");

    if (password.length < 8) return setStatus(status, "Password must be at least 8 characters.", "error");

    busy(btn, true, "Updating…");
    const { error } = await supabaseClient.auth.updateUser({ password });
    busy(btn, false);

    if (error) return setStatus(status, error.message, "error");
    setStatus(status, "Password updated! Redirecting to login…", "success");
    setTimeout(() => (window.location.href = "login.html"), 1000);
  }

  // ====================================
  // SESSION + PROFILE
  // ====================================

  async function getSession() {
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
  }

  // #8 Load profile (own row)
  async function loadProfile() {
    const session = await getSession();
    if (!session) return null;
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (error) {
      console.warn("[auth] loadProfile:", error.message);
      return null;
    }
    return data;
  }

  // #8 Update profile
  async function updateProfile(fields) {
    const session = await getSession();
    if (!session) return { error: { message: "Not logged in." } };
    return supabaseClient.from("profiles").update(fields).eq("id", session.user.id);
  }

  // #9 Avatar upload -> avatars/<uid>/<file>
  async function uploadAvatar(file) {
    const session = await getSession();
    if (!session) throw new Error("Not logged in.");
    const ext = file.name.split(".").pop();
    const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabaseClient.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) throw error;
    const { data } = supabaseClient.storage.from("avatars").getPublicUrl(path);
    await updateProfile({ avatar_url: data.publicUrl });
    return data.publicUrl;
  }

  // Guard: call at top of a protected page to bounce anonymous users.
  async function requireAuth(redirect) {
    const session = await getSession();
    if (!session) {
      window.location.href = redirect || REDIRECT_AFTER_LOGOUT;
      return null;
    }
    return session;
  }

  // ====================================
  // AUTO-WIRE whatever exists on the page
  // ====================================
  document.addEventListener("DOMContentLoaded", () => {
    $("registerForm")?.addEventListener("submit", register);
    $("registerBtn")?.addEventListener("click", (e) => {
      if (!$("registerForm")) register(e);
    });

    $("loginForm")?.addEventListener("submit", login);
    $("loginBtn")?.addEventListener("click", (e) => {
      if (!$("loginForm")) login(e);
    });

    $("resetForm")?.addEventListener("submit", requestPasswordReset);
    $("updatePasswordForm")?.addEventListener("submit", updatePassword);

    // Show/hide password eye toggles
    document.querySelectorAll(".pw-toggle").forEach((btn) =>
      btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector("input");
        const icon = btn.querySelector("i");
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        if (icon) icon.className = show ? "fas fa-eye-slash" : "fas fa-eye";
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      })
    );

    document.querySelectorAll("[data-logout]").forEach((el) =>
      el.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      })
    );

    // If already logged in, keep users off the login/register pages.
    if ($("loginForm") || $("registerForm")) {
      getSession().then((s) => {
        if (s) window.location.href = REDIRECT_AFTER_LOGIN;
      });
    }
  });

  // Public API (for pages that need to call things directly)
  window.NanaAuth = {
    register,
    login,
    logout,
    requestPasswordReset,
    updatePassword,
    getSession,
    loadProfile,
    updateProfile,
    uploadAvatar,
    requireAuth,
    toast,
  };
})();
