// Contact form handling - Sends messages to WhatsApp

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

// WhatsApp number (without + or spaces, just the number)
// Update this with your WhatsApp number
const WHATSAPP_NUMBER = "233247107781"; // Your WhatsApp number

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      formStatus.textContent = "Please fill in all required fields.";
      formStatus.className = "form-status error";
      setTimeout(() => {
        formStatus.textContent = "";
      }, 3000);
      return;
    }

    formStatus.textContent = "Preparing WhatsApp message...";
    formStatus.className = "form-status";

    try {
      // Build the WhatsApp message
      const message = [
        "🔔 *NEW CONTACT FORM SUBMISSION*",
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        "👤 *Name:* " + data.name,
        "📧 *Email:* " + data.email,
        "📞 *Phone:* " + (data.phone || "Not provided"),
        "🎯 *Service:* " + getServiceLabel(data.service || "other"),
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        "💬 *Message:*",
        "─────────────────────",
        data.message,
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        "_Sent from Nana Forex Website_",
      ].join("%0A"); // %0A is line break for WhatsApp

      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

      // Open WhatsApp in a new tab
      window.open(whatsappUrl, "_blank");

      formStatus.textContent =
        "✓ Redirecting to WhatsApp... Please send the message.";
      formStatus.className = "form-status success";

      // Reset the form
      contactForm.reset();

      // Clear the success message after 5 seconds
      setTimeout(() => {
        formStatus.textContent = "";
      }, 5000);
    } catch (error) {
      console.error("WhatsApp error:", error);
      formStatus.textContent =
        "Something went wrong. Please contact us directly on WhatsApp.";
      formStatus.className = "form-status error";
      setTimeout(() => {
        formStatus.textContent = "";
      }, 5000);
    }
  });
}

// Helper function to get readable service labels
function getServiceLabel(serviceValue) {
  const serviceMap = {
    mentorship: "📚 Forex Mentorship",
    "copy-trading": "📊 Copy Trading",
    funded: "💰 Funded Trader Program",
    analysis: "📈 Market Analysis",
    other: "❓ Other",
  };
  return serviceMap[serviceValue] || serviceValue;
}
