document.addEventListener("DOMContentLoaded", () => {

  const db = firebase.firestore();

  // AUTH CHECK
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "profile.html";
    } else {
      loadProfile(user.uid);
    }
  });

  // LOAD PROFILE
  function loadProfile(uid) {
    db.collection("users").doc(uid).get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();

          document.getElementById("profileBox").innerHTML = `
            <div class="profile">
              <img src="${data.avatar || 'https://via.placeholder.com/80'}">
              <h3>${data.name}</h3>
              <p>${data.bio}</p>
            </div>
          `;
        }
      });
  }

  // ❤️ SAVE / UNSAVE
  document.querySelectorAll(".card button").forEach(btn => {

    if (!btn.classList.contains("toggle-btn")) {

      btn.addEventListener("click", async () => {

        const user = firebase.auth().currentUser;
        if (!user) return;

        const card = btn.closest(".card");
        const title = card.querySelector("h3").innerText;

        const snapshot = await db
          .collection("users")
          .doc(user.uid)
          .collection("saved")
          .where("title", "==", title)
          .get();

        if (!snapshot.empty) {
          snapshot.forEach(doc => doc.ref.delete());
          btn.innerText = "♡ save";
        } else {
          db.collection("users")
            .doc(user.uid)
            .collection("saved")
            .add({
              title: title,
              text: card.querySelector("p").innerText,
              image: card.querySelector("img")?.src || ""
            });

          btn.innerText = "❤️ saved";
        }

      });

    }

  });

  // RANDOM VIBE
  const vibes = ["rainy day", "soft morning", "nostalgic", "city lights"];
  document.getElementById("randomBtn").onclick = () => {
    alert("✨ Try this vibe: " + vibes[Math.floor(Math.random() * vibes.length)]);
  };

  // FILTER + MOOD
  const recommendations = {
    gloomy: "☁️ Try Rainy Vibes playlist",
    soft: "🌸 Soft morning songs are perfect",
    nostalgic: "🌙 Midnight playlist hits different"
  };

  document.querySelectorAll(".filters button").forEach(btn => {
    btn.addEventListener("click", () => {

      const filter = btn.getAttribute("data-filter");

      if (recommendations[filter]) {
        alert(recommendations[filter]);
      }

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

  // JOURNAL EXPAND
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