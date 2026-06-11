// Contact form handling
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    formStatus.textContent = "Sending message...";
    formStatus.className = "form-status";

    try {
      const subject = encodeURIComponent(`Nana Forex inquiry from ${data.name}`);
      const body = encodeURIComponent(
        [
          `Name: ${data.name}`,
          `Email: ${data.email}`,
          `Phone: ${data.phone || "Not provided"}`,
          `Service: ${data.service || "Not selected"}`,
          "",
          data.message,
        ].join("\n"),
      );

      window.location.href = `mailto:info@nanaforex.com?subject=${subject}&body=${body}`;
      formStatus.textContent =
        "Your email app is opening with the message ready to send.";
      formStatus.className = "form-status success";
      contactForm.reset();
    } catch (error) {
      formStatus.textContent =
        "Something went wrong. Please email us directly at info@nanaforex.com.";
      formStatus.className = "form-status error";
    }

    setTimeout(() => {
      formStatus.textContent = "";
    }, 5000);
  });
}
