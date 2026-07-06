// ====================================
// Nana Forex — Shared user session (Supabase-backed)
//
// Supabase Auth is the source of truth. For backward compatibility with
// the existing user-area pages (which read a `nanaForexUser` object from
// local/session storage), we keep that object as a *mirror* of the real
// session. This lets every users/*.html page keep working unchanged while
// being backed by a real, server-validated session.
//
// Load order on a page:
//   @supabase/supabase-js  ->  env.js  ->  supabase-client.js  ->  user-session.js
// ====================================

(function () {
  "use strict";

  const MIRROR_KEY = "nanaForexUser";

  if (typeof supabaseClient === "undefined") {
    console.error("[user-session] supabaseClient missing — check script order.");
    return;
  }

  function displayNameFromUser(user) {
    const meta = user?.user_metadata || {};
    return meta.full_name || meta.name || (user?.email ? user.email.split("@")[0] : "Trader");
  }

  // Write the compatibility mirror. `remember` picks the storage that the
  // legacy code reads (localStorage vs sessionStorage).
  function writeMirror(user, remember) {
    const data = JSON.stringify({
      id: user.id,
      email: user.email,
      name: displayNameFromUser(user),
      phone: user.user_metadata?.phone || "",
      loggedIn: true,
    });
    if (remember === false) {
      sessionStorage.setItem(MIRROR_KEY, data);
      localStorage.removeItem(MIRROR_KEY);
    } else {
      localStorage.setItem(MIRROR_KEY, data);
      sessionStorage.removeItem(MIRROR_KEY);
    }
  }

  function clearMirror() {
    localStorage.removeItem(MIRROR_KEY);
    sessionStorage.removeItem(MIRROR_KEY);
  }

  function getMirror() {
    try {
      return JSON.parse(localStorage.getItem(MIRROR_KEY) || sessionStorage.getItem(MIRROR_KEY) || "null");
    } catch {
      return null;
    }
  }

  async function getSession() {
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
  }

  // Ensure the mirror reflects the live session (keeps legacy pages honest).
  async function sync() {
    const session = await getSession();
    if (!session) {
      clearMirror();
      return null;
    }
    // preserve which storage the mirror already lives in
    const remember = sessionStorage.getItem(MIRROR_KEY) ? false : true;
    writeMirror(session.user, remember);
    return session;
  }

  // Page guard: call at the top of any protected users/*.html page.
  // If there's no valid Supabase session, clears the mirror and redirects.
  async function guard(loginUrl) {
    const session = await sync();
    if (!session) {
      window.location.href = loginUrl || "login.html";
      return null;
    }
    return session;
  }

  async function logout(loginUrl) {
    await supabaseClient.auth.signOut();
    clearMirror();
    window.location.href = loginUrl || "login.html";
  }

  // ---------- profile CRUD (profiles table) ----------
  async function loadProfile() {
    const session = await getSession();
    if (!session) return null;
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (error) {
      console.warn("[user-session] loadProfile:", error.message);
      return null;
    }
    // convenience: expose the auth email alongside the profile row
    data.email = session.user.email;
    return data;
  }

  async function updateProfile(fields) {
    const session = await getSession();
    if (!session) return { error: { message: "Not logged in." } };
    const res = await supabaseClient.from("profiles").update(fields).eq("id", session.user.id);
    // keep the mirror's name fresh if it changed
    if (!res.error && fields.full_name) {
      const mirror = getMirror() || {};
      mirror.name = fields.full_name;
      const inLocal = !!localStorage.getItem(MIRROR_KEY);
      (inLocal ? localStorage : sessionStorage).setItem(MIRROR_KEY, JSON.stringify(mirror));
    }
    return res;
  }

  async function changePassword(newPassword) {
    return supabaseClient.auth.updateUser({ password: newPassword });
  }

  async function uploadAvatar(file) {
    const session = await getSession();
    if (!session) throw new Error("Not logged in.");
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabaseClient.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) throw error;
    const { data } = supabaseClient.storage.from("avatars").getPublicUrl(path);
    await updateProfile({ avatar_url: data.publicUrl });
    return data.publicUrl;
  }

  window.NanaSession = {
    guard,
    sync,
    logout,
    getSession,
    getMirror,
    writeMirror,
    clearMirror,
    displayNameFromUser,
    loadProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
  };
})();
