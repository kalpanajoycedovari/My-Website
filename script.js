document.addEventListener("DOMContentLoaded", () => {

  // USER SYSTEM
  const user = localStorage.getItem("user");

  if (user) {
    document.getElementById("welcomeUser").innerText = "🌸 Welcome, " + user;
    document.getElementById("logoutBtn").style.display = "inline-block";
  } else {
    window.location.href = "login.html";
  }

  window.logout = function () {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  };

  // RANDOM VIBE
  const vibes = ["rainy day", "soft morning", "nostalgic", "city lights", "cozy"];
  document.getElementById("randomBtn").onclick = () => {
    const random = vibes[Math.floor(Math.random() * vibes.length)];
    alert("✨ Try this vibe: " + random);
  };

  // SAVE SYSTEM
  document.querySelectorAll(".card button").forEach(btn => {
    if (!btn.classList.contains("toggle-btn")) {

      btn.addEventListener("click", () => {

        const card = btn.closest(".card");
        let saved = JSON.parse(localStorage.getItem("savedCards")) || [];

        if (btn.innerText === "♡ save") {
          btn.innerText = "❤️ saved";
          saved.push(card.innerHTML);
        } else {
          btn.innerText = "♡ save";
          saved.pop();
        }

        localStorage.setItem("savedCards", JSON.stringify(saved));
      });

    }
  });

  // FILTER
  document.querySelectorAll(".filters button").forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter");

      document.querySelectorAll(".card").forEach(card => {
        const category = card.getAttribute("data-category");
        card.style.display = (filter === "all" || category === filter) ? "block" : "none";
      });
    });
  });

  // SEARCH
  document.querySelector(".top-bar input").addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();

    document.querySelectorAll(".card").forEach(card => {
      card.style.display = card.innerText.toLowerCase().includes(value) ? "block" : "none";
    });
  });

  // EXPAND JOURNAL
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