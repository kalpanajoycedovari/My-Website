// CHECK LOGIN STATE
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "profile.html";
  }
});
document.addEventListener("DOMContentLoaded", () => {

  // PROFILE SYSTEM
  const profileData = JSON.parse(localStorage.getItem("profile"));

  if (profileData) {
    const box = document.getElementById("profileBox");

    box.innerHTML = `
      <div class="profile">
        <img src="${profileData.avatar || 'https://via.placeholder.com/80'}">
        <h3>${profileData.name}</h3>
        <p>${profileData.bio}</p>
      </div>
    `;
  } else {
    window.location.href = "profile.html";
  }

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