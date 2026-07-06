// ====================================
// LIVE LEADERBOARD — Supabase backed
// Public visitors read; a signed-in admin writes.
// (Data moved off localStorage so it's shared across all visitors.)
// ====================================

let isAdminAuthenticated = false;

// ====================================
// ADMIN AUTH (Supabase)
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

async function checkDashboardSession() {
  if (await isCurrentUserAdmin()) {
    isAdminAuthenticated = true;
    showDashboardAdmin();
  }
}

async function dashboardLogin() {
  const email = document.getElementById("dashAdminEmail")?.value.trim();
  const password = document.getElementById("dashAdminPassword")?.value;
  const errorEl = document.getElementById("dashLoginError");
  const loginBtn = document.getElementById("dashLoginBtn");

  if (!email || !password) {
    errorEl.textContent = "Please enter email and password.";
    return;
  }

  errorEl.textContent = "";
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = error.message;
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
    return;
  }

  // Gate the admin panel on the admin role, not just a valid login.
  if (!(await isCurrentUserAdmin())) {
    await supabaseClient.auth.signOut();
    errorEl.textContent = "This account does not have admin access.";
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
    return;
  }

  isAdminAuthenticated = true;
  showDashboardAdmin();
  renderLeaderboard();
  showToast("Authentication successful!", "success");
}

async function dashboardLogout() {
  await supabaseClient.auth.signOut();
  isAdminAuthenticated = false;
  hideDashboardAdmin();
  renderLeaderboard();
  showToast("Logged out.", "info");
}

function showDashboardAdmin() {
  const loginSection = document.getElementById("dashboardLoginSection");
  const panel = document.getElementById("adminPanel");
  const toggleBtn = document.getElementById("adminToggleBtn");

  if (loginSection) loginSection.style.display = "none";
  if (panel) panel.style.display = "block";
  if (toggleBtn) {
    toggleBtn.innerHTML = '<i class="fas fa-lock-open"></i> Hide Admin Panel';
    toggleBtn.style.borderColor = "#00ff88";
    toggleBtn.style.color = "#00ff88";
  }
}

function hideDashboardAdmin() {
  const loginSection = document.getElementById("dashboardLoginSection");
  const panel = document.getElementById("adminPanel");
  const adminArea = document.getElementById("dashboardAdminArea");
  const toggleBtn = document.getElementById("adminToggleBtn");

  if (loginSection) loginSection.style.display = "none";
  if (panel) panel.style.display = "none";
  if (adminArea) adminArea.style.display = "none";
  if (toggleBtn) {
    toggleBtn.innerHTML = '<i class="fas fa-lock"></i> Admin Panel (Owner Only)';
    toggleBtn.style.borderColor = "";
    toggleBtn.style.color = "";
  }
}

function checkAuth() {
  return isAdminAuthenticated;
}

// ====================================
// CHALLENGE + LEADERBOARD STATE
// ====================================
let currentChallenge = {
  name: "March 2026 Trading Challenge",
  startDate: "2026-03-01",
  endDate: "2026-04-15",
  prizePool: 5000,
  status: "active",
};

// In-memory cache of the leaderboard (populated from Supabase).
let leaderboardData = [];

// Seed used by "Reset to default".
const defaultLeaderboardData = [
  { name: "Kwame Asante", account: "Pro Account", return: 42.8, pips: 1245, winRate: 89, trades: 47 },
  { name: "Adwoa Mensah", account: "Elite Account", return: 38.2, pips: 1120, winRate: 85, trades: 52 },
  { name: "Michael Osei", account: "Pro Account", return: 31.5, pips: 980, winRate: 82, trades: 41 },
  { name: "Esi Boateng", account: "Standard Account", return: 27.3, pips: 845, winRate: 79, trades: 38 },
  { name: "Kofi Annan", account: "Pro Account", return: 22.9, pips: 720, winRate: 76, trades: 44 },
  { name: "Ama Serwaa", account: "Standard Account", return: 18.4, pips: 610, winRate: 81, trades: 35 },
  { name: "Yaw Tuffour", account: "Elite Account", return: 14.2, pips: 505, winRate: 74, trades: 29 },
  { name: "Nana Ama", account: "Standard Account", return: 9.8, pips: 390, winRate: 71, trades: 33 },
  { name: "Kwabena Darko", account: "Pro Account", return: 5.3, pips: 245, winRate: 68, trades: 27 },
  { name: "Abena Oforiwaa", account: "Standard Account", return: 2.1, pips: 98, winRate: 65, trades: 22 },
];

// map a DB row -> UI shape
function rowToTrader(r) {
  return {
    id: r.id,
    name: r.name,
    account: r.account,
    return: Number(r.return_pct),
    pips: r.pips,
    winRate: r.win_rate,
    trades: r.trades,
  };
}

// map a UI trader -> DB columns
function traderToRow(t) {
  return {
    name: t.name,
    account: t.account,
    return_pct: t.return,
    pips: t.pips,
    win_rate: t.winRate,
    trades: t.trades,
  };
}

// ====================================
// DATA FETCH (Supabase)
// ====================================
async function fetchLeaderboard() {
  const { data, error } = await supabaseClient
    .from("leaderboard_traders")
    .select("*")
    .order("return_pct", { ascending: false });

  if (error) {
    console.error("[leaderboard] fetch:", error.message);
    leaderboardData = [];
  } else {
    leaderboardData = (data || []).map(rowToTrader);
  }
  renderLeaderboard();
}

async function fetchChallenge() {
  const { data, error } = await supabaseClient
    .from("challenge_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!error && data) {
    currentChallenge = {
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      prizePool: Number(data.prize_pool),
      status: data.status,
    };
  }
  checkChallengeStatus();
  updateChallengeDateDisplay();
  updatePrizePoolDisplay();
  loadDatesIntoPickers();
}

async function saveChallenge(patch) {
  const { error } = await supabaseClient
    .from("challenge_config")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) {
    showToast("Could not save: " + error.message, "error");
    return false;
  }
  return true;
}

// ====================================
// DATE FORMATTING / CHALLENGE DISPLAY
// ====================================
function formatDate(dateString) {
  if (!dateString) return "Not set";
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function updateChallengeDateDisplay() {
  const challengeDatesElement = document.getElementById("challengeDates");
  const statusBadge = document.getElementById("challengeStatusBadge");

  if (challengeDatesElement) {
    const startFormatted = formatDate(currentChallenge.startDate);
    const endFormatted = formatDate(currentChallenge.endDate);
    challengeDatesElement.innerHTML = `${currentChallenge.name}<br><small style="font-size: 0.75rem;">${startFormatted} - ${endFormatted}</small>`;
  }

  if (statusBadge) {
    const today = new Date();
    const startDate = new Date(currentChallenge.startDate);
    const endDate = new Date(currentChallenge.endDate);

    if (today < startDate) {
      statusBadge.textContent = "Upcoming Challenge";
      statusBadge.className = "status-badge upcoming";
    } else if (today > endDate) {
      statusBadge.textContent = "Challenge Ended";
      statusBadge.className = "status-badge ended";
    } else {
      statusBadge.textContent = "Active Challenge";
      statusBadge.className = "status-badge active";
    }
  }
}

function loadDatesIntoPickers() {
  const startDateInput = document.getElementById("challengeStartDate");
  const endDateInput = document.getElementById("challengeEndDate");
  const nameInput = document.getElementById("challengeName");

  if (startDateInput && currentChallenge.startDate) startDateInput.value = currentChallenge.startDate;
  if (endDateInput && currentChallenge.endDate) endDateInput.value = currentChallenge.endDate;
  if (nameInput && currentChallenge.name) nameInput.value = currentChallenge.name;
}

function checkChallengeStatus() {
  const today = new Date();
  const startDate = new Date(currentChallenge.startDate);
  const endDate = new Date(currentChallenge.endDate);

  if (today < startDate) currentChallenge.status = "upcoming";
  else if (today > endDate) currentChallenge.status = "ended";
  else currentChallenge.status = "active";

  updateChallengeDateDisplay();
}

// ====================================
// TOAST NOTIFICATIONS
// ====================================
function showToast(message, type = "info") {
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.style.cssText = `position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;`;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  const colors = { success: "#00ff88", error: "#ff4d4d", warning: "#f5b700", info: "#00c896" };

  toast.style.cssText = `background: #0e1726; border-left: 4px solid ${colors[type] || colors.info}; padding: 12px 20px; border-radius: 12px; color: white; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease; min-width: 250px; max-width: 350px;`;
  toast.innerHTML = `<div style="display: flex; align-items: center; gap: 10px;"><i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle"}" style="color: ${colors[type] || colors.info}"></i><span>${message}</span></div>`;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

if (!document.querySelector("#toastStyles")) {
  const style = document.createElement("style");
  style.id = "toastStyles";
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  `;
  document.head.appendChild(style);
}

// ====================================
// CHALLENGE ADMIN ACTIONS
// ====================================
async function updateChallengeDates() {
  if (!checkAuth()) return showToast("Please log in first.", "error");

  const startDate = document.getElementById("challengeStartDate")?.value;
  const endDate = document.getElementById("challengeEndDate")?.value;

  if (!startDate || !endDate) return showToast("Please select both dates.", "error");
  if (new Date(startDate) > new Date(endDate)) return showToast("Start date cannot be after end date.", "error");

  currentChallenge.startDate = startDate;
  currentChallenge.endDate = endDate;
  if (await saveChallenge({ start_date: startDate, end_date: endDate })) {
    checkChallengeStatus();
    showToast(`Dates updated: ${formatDate(startDate)} - ${formatDate(endDate)}`, "success");
  }
}

async function updateChallengeName() {
  if (!checkAuth()) return showToast("Please log in first.", "error");

  const newName = document.getElementById("challengeName")?.value.trim();
  if (!newName) return showToast("Please enter a challenge name.", "error");

  currentChallenge.name = newName;
  if (await saveChallenge({ name: newName })) {
    updateChallengeDateDisplay();
    showToast(`Challenge name updated to "${newName}"`, "success");
  }
}

async function updatePrizePool() {
  if (!checkAuth()) return showToast("Please log in first.", "error");

  const newAmount = prompt("New prize pool ($):", currentChallenge.prizePool);
  if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
    currentChallenge.prizePool = parseFloat(newAmount);
    if (await saveChallenge({ prize_pool: currentChallenge.prizePool })) {
      updatePrizePoolDisplay();
      showToast(`Prize pool: $${currentChallenge.prizePool.toLocaleString()}`, "success");
    }
  }
}

function updatePrizePoolDisplay() {
  const prizeElement = document.querySelector(".prize-amount");
  if (prizeElement) prizeElement.textContent = `$${(currentChallenge.prizePool || 0).toLocaleString()}`;
}

// ====================================
// TRADER ADMIN ACTIONS
// ====================================
async function addTrader(name, account, returnPercent, pips, winRate, trades) {
  if (!checkAuth()) return showToast("Please log in first.", "error");
  if (!name || !name.trim()) return showToast("Please enter a trader name.", "error");
  if (!returnPercent || isNaN(returnPercent)) return showToast("Please enter a valid return %.", "error");
  if (!pips || isNaN(pips)) return showToast("Please enter valid pips.", "error");
  if (!winRate || isNaN(winRate) || winRate < 0 || winRate > 100) return showToast("Win rate must be 0-100.", "error");
  if (!trades || isNaN(trades) || trades < 0) return showToast("Please enter valid trades.", "error");

  if (leaderboardData.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) {
    return showToast(`"${name}" already exists!`, "error");
  }

  const { error } = await supabaseClient.from("leaderboard_traders").insert(
    traderToRow({
      name: name.trim(),
      account,
      return: parseFloat(returnPercent),
      pips: parseInt(pips),
      winRate: parseInt(winRate),
      trades: parseInt(trades),
    })
  );

  if (error) return showToast("Error: " + error.message, "error");

  await fetchLeaderboard();
  showToast(`${name} added!`, "success");
  return true;
}

async function removeTrader(traderId, traderName) {
  if (!checkAuth()) return showToast("Please log in first.", "error");
  if (!confirm(`Remove ${traderName}?`)) return;

  const { error } = await supabaseClient.from("leaderboard_traders").delete().eq("id", traderId);
  if (error) return showToast("Error: " + error.message, "error");

  await fetchLeaderboard();
  showToast(`Removed ${traderName}`, "success");
}

async function editTrader(traderId, field, value) {
  if (!checkAuth()) return showToast("Please log in first.", "error");

  const columnMap = { return: "return_pct", winRate: "win_rate", pips: "pips", trades: "trades", account: "account" };
  const column = columnMap[field];
  if (!column) return showToast("Invalid field.", "error");

  const numericFields = ["return", "pips", "winRate", "trades"];
  const parsed = numericFields.includes(field) ? parseFloat(value) : value;

  const { error } = await supabaseClient
    .from("leaderboard_traders")
    .update({ [column]: parsed })
    .eq("id", traderId);

  if (error) return showToast("Error: " + error.message, "error");

  await fetchLeaderboard();
  showToast("Trader updated", "success");
}

function editTraderPrompt(traderId, traderName) {
  const field = prompt(`Edit ${traderName}\n\nField to edit (return, pips, winRate, trades, account):`);
  if (field) {
    const validFields = ["return", "pips", "winRate", "trades", "account"];
    if (!validFields.includes(field)) return showToast("Invalid field.", "error");
    const value = prompt(`New value for ${field}:`);
    if (value) editTrader(traderId, field, value);
  }
}

async function resetToDefaultLeaderboard() {
  if (!checkAuth()) return showToast("Please log in first.", "error");
  if (!confirm("Reset to default leaderboard data?")) return;

  const del = await supabaseClient.from("leaderboard_traders").delete().not("id", "is", null);
  if (del.error) return showToast("Error: " + del.error.message, "error");

  const { error } = await supabaseClient.from("leaderboard_traders").insert(defaultLeaderboardData.map(traderToRow));
  if (error) return showToast("Error: " + error.message, "error");

  await fetchLeaderboard();
  showToast("Leaderboard reset!", "success");
}

async function clearAllLeaderboardData() {
  if (!checkAuth()) return showToast("Please log in first.", "error");

  const confirmText = prompt('Type "CONFIRM" to delete all traders:');
  if (confirmText === "CONFIRM") {
    const { error } = await supabaseClient.from("leaderboard_traders").delete().not("id", "is", null);
    if (error) return showToast("Error: " + error.message, "error");
    await fetchLeaderboard();
    showToast("All data cleared!", "warning");
  }
}

// ====================================
// RENDER LEADERBOARD (from cache)
// ====================================
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, (m) => (m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;"));
}

function renderLeaderboard() {
  const data = [...leaderboardData].sort((a, b) => b.return - a.return);
  data.forEach((item, index) => { item.rank = index + 1; });

  const tbody = document.getElementById("leaderboardBody");
  const actionsHeader = document.getElementById("actionsHeader");
  if (!tbody) return;

  if (actionsHeader) actionsHeader.style.display = isAdminAuthenticated ? "" : "none";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 3rem;"><i class="fas fa-trophy" style="font-size: 2rem; color: var(--gold); margin-bottom: 1rem; display: block;"></i>No traders yet. Use the admin panel to add participants!</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((item) => `
    <tr data-id="${item.id}">
      <td class="${item.rank === 1 ? "rank-1" : item.rank === 2 ? "rank-2" : item.rank === 3 ? "rank-3" : ""}">
        ${item.rank === 1 ? '<i class="fas fa-crown"></i> ' : ""}${item.rank}
      </td>
      <td class="trader-name">${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.account)}</td>
      <td class="positive">+${item.return}%</td>
      <td class="positive">+${item.pips.toLocaleString()}</td>
      <td>${item.winRate}%</td>
      <td>${item.trades}</td>
      ${isAdminAuthenticated ? `
      <td class="actions">
        <button class="edit-btn" onclick="editTraderPrompt('${item.id}', '${escapeHtml(item.name)}')" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="delete-btn" onclick="removeTrader('${item.id}', '${escapeHtml(item.name)}')" title="Delete"><i class="fas fa-trash"></i></button>
      </td>` : ""}
    </tr>
  `).join("");
}

// ====================================
// TOGGLE ADMIN PANEL
// ====================================
function toggleAdminPanel() {
  const adminArea = document.getElementById("dashboardAdminArea");
  const adminToggleBtn = document.getElementById("adminToggleBtn");

  if (!adminArea) return;

  if (adminArea.style.display === "none" || adminArea.style.display === "") {
    adminArea.style.display = "block";
    if (isAdminAuthenticated) {
      showDashboardAdmin();
    } else {
      document.getElementById("dashboardLoginSection").style.display = "block";
      document.getElementById("adminPanel").style.display = "none";
    }
  } else {
    adminArea.style.display = "none";
    if (adminToggleBtn) {
      adminToggleBtn.innerHTML = '<i class="fas fa-lock"></i> Admin Panel (Owner Only)';
      adminToggleBtn.style.borderColor = "";
      adminToggleBtn.style.color = "";
    }
  }
}

// ====================================
// INITIALIZE
// ====================================
document.addEventListener("DOMContentLoaded", function () {
  fetchChallenge();
  fetchLeaderboard();
  checkDashboardSession();

  document.getElementById("adminToggleBtn")?.addEventListener("click", toggleAdminPanel);
  document.getElementById("dashLoginBtn")?.addEventListener("click", dashboardLogin);
  document.getElementById("dashLogoutBtn")?.addEventListener("click", dashboardLogout);

  document.getElementById("dashAdminPassword")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") dashboardLogin();
  });

  document.getElementById("addTraderBtn")?.addEventListener("click", function () {
    const name = document.getElementById("traderName")?.value;
    const account = document.getElementById("accountType")?.value;
    const returnPercent = document.getElementById("returnPercent")?.value;
    const pips = document.getElementById("totalPips")?.value;
    const winRate = document.getElementById("winRate")?.value;
    const trades = document.getElementById("tradesCount")?.value;

    addTrader(name, account, returnPercent, pips, winRate, trades).then((ok) => {
      if (ok) {
        document.getElementById("traderName").value = "";
        document.getElementById("returnPercent").value = "";
        document.getElementById("totalPips").value = "";
        document.getElementById("winRate").value = "";
        document.getElementById("tradesCount").value = "";
      }
    });
  });

  document.getElementById("resetLeaderboardBtn")?.addEventListener("click", resetToDefaultLeaderboard);
  document.getElementById("clearAllLeaderboardBtn")?.addEventListener("click", clearAllLeaderboardData);
  document.getElementById("updatePrizeBtn")?.addEventListener("click", updatePrizePool);
  document.getElementById("updateDatesBtn")?.addEventListener("click", updateChallengeDates);
  document.getElementById("updateChallengeNameBtn")?.addEventListener("click", updateChallengeName);

  window.editTraderPrompt = editTraderPrompt;
  window.removeTrader = removeTrader;
  window.toggleAdminPanel = toggleAdminPanel;
});
