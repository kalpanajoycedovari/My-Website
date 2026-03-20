document.addEventListener("DOMContentLoaded", () => {

  // RANDOM VIBE
  const vibes = ["rainy day", "soft morning", "nostalgic", "city lights", "cozy"];
  document.getElementById("randomBtn").onclick = () => {
    const random = vibes[Math.floor(Math.random() * vibes.length)];
    alert("✨ Try this vibe: " + random);
  };

  // SAVE BUTTON
  document.querySelectorAll(".card button").forEach(btn => {
    if (!btn.classList.contains("toggle-btn")) {
      btn.addEventListener("click", () => {
        btn.innerText = btn.innerText === "♡ save" ? "❤️ saved" : "♡ save";
      });
    }
  });

  // FILTER SYSTEM
  document.querySelectorAll(".filters button").forEach(button => {
    button.addEventListener("click", () => {

      const filter = button.getAttribute("data-filter");

      document.querySelectorAll(".card").forEach(card => {
        const category = card.getAttribute("data-category");

        if (filter === "all" || category === filter) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });

    });
  });

  // SEARCH
  document.querySelector(".top-bar input").addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();

    document.querySelectorAll(".card").forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(value) ? "block" : "none";
    });
  });

  // EXPANDABLE JOURNAL
  document.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {

      const card = btn.closest(".card");
      const preview = card.querySelector(".preview");
      const full = card.querySelector(".full");

      if (full.classList.contains("hidden")) {
        full.classList.remove("hidden");
        preview.style.display = "none";
        btn.innerText = "Read less";
      } else {
        full.classList.add("hidden");
        preview.style.display = "block";
        btn.innerText = "Read more";
      }

    });
  });

});