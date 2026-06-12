// Stat Counter Animation
document.addEventListener("DOMContentLoaded", function () {
  const counters = document.querySelectorAll(".counter");

  const startCounter = (counter) => {
    const target = Number(counter.dataset.target);
    const suffix = counter.dataset.suffix || "";
    let current = 0;
    const increment = target / 120;

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.ceil(current) + suffix;
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target + suffix;
      }
    };

    updateCounter();
  };

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          startCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.4,
    },
  );

  counters.forEach(function (counter) {
    observer.observe(counter);
  });
});
