document.addEventListener("DOMContentLoaded", () => {

  const db = firebase.firestore();

  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      loadProfile(user.uid);
    }
  });

  function loadProfile(uid) {
    db.collection("users").doc(uid).get().then(doc => {
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

  // ❤️ SAVE SYSTEM (UPDATED)
  document.querySelectorAll(".save-btn").forEach(btn => {

    btn.addEventListener("click", async () => {

      const user = firebase.auth().currentUser;
      if (!user) return;

      const card = btn.closest(".card");
      const title = card.querySelector("h3").innerText;

      const snapshot = await db.collection("users")
        .doc(user.uid)
        .collection("saved")
        .where("title", "==", title)
        .get();

      if (!snapshot.empty) {
        snapshot.forEach(doc => doc.ref.delete());
        btn.classList.remove("saved");
        btn.querySelector(".heart").innerText = "♡";

      } else {
        db.collection("users")
          .doc(user.uid)
          .collection("saved")
          .add({
            title,
            text: card.querySelector("p").innerText,
            image: card.querySelector("img")?.src || ""
          });

        btn.classList.add("saved");
        btn.querySelector(".heart").innerText = "❤";
      }

    });

  });

  // 🔍 SEARCH
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("input", () => {

      const query = searchInput.value.toLowerCase();

      document.querySelectorAll(".card").forEach(card => {

        const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
        const text = card.querySelector("p")?.innerText.toLowerCase() || "";

        if (title.includes(query) || text.includes(query)) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }

      });

    });
  }

  // 🎲 RANDOM VIBE
  const vibes = ["rainy", "soft", "nostalgic"];
  document.getElementById("randomBtn").onclick = () => {
    alert("✨ Try this vibe: " + vibes[Math.floor(Math.random() * vibes.length)]);
  };

});