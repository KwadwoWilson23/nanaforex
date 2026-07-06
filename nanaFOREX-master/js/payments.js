// ====================================
// PAYMENTS PAGE - Deposit, Withdraw, History
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  // ====================================
  // PAYMENT TABS
  // ====================================
  const tabs = document.querySelectorAll(".payment-tab");
  const tabContents = document.querySelectorAll(".payment-tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      this.classList.add("active");
      const tabId = this.dataset.tab;
      const content = document.getElementById(`tab-${tabId}`);
      if (content) content.classList.add("active");
    });
  });

  // ====================================
  // METHOD SELECTION
  // ====================================
  const methodCards = document.querySelectorAll(".method-card");
  const depositMethodSelect = document.getElementById("depositMethod");

  methodCards.forEach((card) => {
    card.addEventListener("click", function () {
      methodCards.forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");

      const method = this.dataset.method;
      if (depositMethodSelect) {
        depositMethodSelect.value = method;
      }
    });
  });

  // ====================================
  // DEPOSIT FORM
  // ====================================
  const depositForm = document.getElementById("depositForm");
  const depositStatus = document.getElementById("depositStatus");

  if (depositForm) {
    depositForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const amount = document.getElementById("depositAmount").value;
      const method = document.getElementById("depositMethod").value;
      const reference = document.getElementById("depositReference").value;

      if (!amount || parseFloat(amount) <= 0) {
        showStatus(depositStatus, "Please enter a valid amount.", "error");
        return;
      }

      if (!method) {
        showStatus(depositStatus, "Please select a payment method.", "error");
        return;
      }

      // Show deposit modal
      const modal = document.getElementById("depositModal");
      const modalAmount = document.getElementById("modalDepositAmount");
      if (modalAmount) {
        modalAmount.textContent = parseFloat(amount).toFixed(2);
      }
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  }

  // ====================================
  // DEPOSIT MODAL
  // ====================================
  const depositModal = document.getElementById("depositModal");
  const modalClose = document.getElementById("depositModalClose");
  const modalCancel = document.getElementById("modalDepositCancel");
  const modalConfirm = document.getElementById("modalDepositConfirm");
  const modalStatus = document.getElementById("modalDepositStatus");

  function closeDepositModal() {
    depositModal.classList.remove("active");
    document.body.style.overflow = "";
    modalStatus.className = "form-status";
    modalStatus.textContent = "";
  }

  modalClose?.addEventListener("click", closeDepositModal);
  modalCancel?.addEventListener("click", closeDepositModal);

  depositModal?.addEventListener("click", function (e) {
    if (e.target === this) closeDepositModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && depositModal.classList.contains("active")) {
      closeDepositModal();
    }
  });

  // Quick amount buttons
  document.querySelectorAll(".quick-amount-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".quick-amount-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const amount = this.dataset.amount;
      const modalAmount = document.getElementById("modalDepositAmount");
      if (modalAmount) {
        modalAmount.textContent = parseFloat(amount).toFixed(2);
      }
      document.getElementById("depositAmount").value = amount;
    });
  });

  modalConfirm?.addEventListener("click", function () {
    const amount = document.getElementById("modalDepositAmount").textContent;
    const method = document.getElementById("depositMethod").value;

    // Simulate processing
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    setTimeout(() => {
      showModalStatus(
        modalStatus,
        `✅ Deposit of $${amount} via ${method} initiated successfully!`,
        "success",
      );
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-check"></i> Confirm Deposit';

      // Clear form
      document.getElementById("depositAmount").value = "";
      document.getElementById("depositReference").value = "";
      methodCards.forEach((c) => c.classList.remove("selected"));

      setTimeout(() => {
        closeDepositModal();
        showStatus(
          depositStatus,
          `✅ Deposit of $${amount} submitted successfully!`,
          "success",
        );
        setTimeout(() => {
          depositStatus.className = "form-status";
          depositStatus.textContent = "";
        }, 3000);
      }, 1500);
    }, 1500);
  });

  function showModalStatus(element, message, type) {
    element.textContent = message;
    element.className = "form-status " + type;
    element.style.display = "block";
  }

  // ====================================
  // WITHDRAW FORM
  // ====================================
  const withdrawForm = document.getElementById("withdrawForm");
  const withdrawStatus = document.getElementById("withdrawStatus");

  if (withdrawForm) {
    withdrawForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const amount = document.getElementById("withdrawAmount").value;
      const method = document.getElementById("withdrawMethod").value;
      const account = document.getElementById("withdrawAccount").value;

      if (!amount || parseFloat(amount) < 50) {
        showStatus(withdrawStatus, "Minimum withdrawal is $50.00", "error");
        return;
      }

      if (!method) {
        showStatus(
          withdrawStatus,
          "Please select a withdrawal method.",
          "error",
        );
        return;
      }

      if (!account) {
        showStatus(
          withdrawStatus,
          "Please enter your account details.",
          "error",
        );
        return;
      }

      const submitBtn = document.getElementById("withdrawSubmitBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';

      setTimeout(() => {
        showStatus(
          withdrawStatus,
          `✅ Withdrawal of $${amount} via ${method} submitted successfully!`,
          "success",
        );
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<i class="fas fa-paper-plane"></i> Request Withdrawal';

        // Clear form
        document.getElementById("withdrawAmount").value = "";
        document.getElementById("withdrawAccount").value = "";

        setTimeout(() => {
          withdrawStatus.className = "form-status";
          withdrawStatus.textContent = "";
        }, 3000);
      }, 1500);
    });
  }

  // ====================================
  // HISTORY FILTER
  // ====================================
  const historyFilter = document.getElementById("historyFilter");
  const historyItems = document.querySelectorAll(".history-item");

  if (historyFilter) {
    historyFilter.addEventListener("change", function () {
      const filter = this.value;

      historyItems.forEach((item) => {
        const status = item
          .querySelector(".history-status")
          ?.textContent.toLowerCase()
          .trim();
        const isDeposit = item.querySelector(".history-icon.deposit") !== null;
        const type = isDeposit ? "deposit" : "withdraw";

        let show = true;

        if (filter === "deposit" && type !== "deposit") show = false;
        if (filter === "withdraw" && type !== "withdraw") show = false;
        if (filter === "pending" && status !== "pending") show = false;
        if (filter === "completed" && status !== "completed") show = false;
        if (filter === "failed" && status !== "failed") show = false;

        item.style.display = show ? "" : "none";
      });
    });
  }

  // ====================================
  // LOAD MORE HISTORY
  // ====================================
  let historyVisible = 5;
  const loadMoreBtn = document.getElementById("loadMoreHistory");

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function () {
      const allItems = document.querySelectorAll(".history-item");
      const hiddenItems = Array.from(allItems).filter(
        (item) => item.style.display === "none" || !item.style.display,
      );

      if (hiddenItems.length === 0) {
        this.textContent = "No more transactions";
        this.disabled = true;
        return;
      }

      // Show next 3 items
      let count = 0;
      hiddenItems.forEach((item) => {
        if (count < 3) {
          item.style.display = "";
          count++;
        }
      });

      if (
        document.querySelectorAll(".history-item[style*='display: none']")
          .length === 0
      ) {
        this.textContent = "No more transactions";
        this.disabled = true;
      }
    });
  }

  // ====================================
  // ADD PAYMENT METHOD
  // ====================================
  document
    .getElementById("addMethodBtn")
    ?.addEventListener("click", function () {
      showToast("Add payment method feature coming soon!", "info");
    });

  // ====================================
  // HELPER: SHOW STATUS
  // ====================================
  function showStatus(element, message, type = "success") {
    if (!element) return;
    element.textContent = message;
    element.className = "form-status " + type;
    element.style.display = "block";
  }

  // ====================================
  // TOAST NOTIFICATIONS
  // ====================================
  function showToast(message, type = "info") {
    let toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toastContainer";
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    const colors = {
      success: "#00ff88",
      error: "#ff4d4d",
      warning: "#f5b700",
      info: "#00c896",
    };

    toast.style.cssText = `
      background: #0e1726;
      border-left: 4px solid ${colors[type] || colors.info};
      padding: 12px 20px;
      border-radius: 12px;
      color: white;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
      min-width: 250px;
      max-width: 350px;
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle"}" style="color: ${colors[type] || colors.info}"></i>
        <span>${message}</span>
      </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Add toast animation styles
  if (!document.querySelector("#toastStyles")) {
    const style = document.createElement("style");
    style.id = "toastStyles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  console.log("✅ Payments page initialized");
});
