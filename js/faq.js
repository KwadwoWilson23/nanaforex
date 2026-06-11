// FAQ Accordion Functionality for Services Page

document.addEventListener("DOMContentLoaded", function () {
  // Get all FAQ items
  const faqItems = document.querySelectorAll(".faq-item");

  // Function to toggle FAQ item
  function toggleFaq(item) {
    // Close all other FAQ items (optional - for accordion behavior)
    // Uncomment the code below if you want only one FAQ open at a time
    /*
    faqItems.forEach(otherItem => {
      if (otherItem !== item && otherItem.classList.contains('active')) {
        otherItem.classList.remove('active');
      }
    });
    */

    // Toggle the clicked item
    item.classList.toggle("active");
  }

  // Add click event to each FAQ question
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");

    if (question) {
      question.addEventListener("click", function (e) {
        e.preventDefault();
        toggleFaq(item);
      });
    }
  });

  // Optional: Open first FAQ item by default
  if (faqItems.length > 0) {
    faqItems[0].classList.add("active");
  }
});
