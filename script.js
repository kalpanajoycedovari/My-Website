document.addEventListener("DOMContentLoaded", () => {

  // Auth redirect
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      loadProfile(user.uid);
    }
  });

  function loadProfile(uid) {
    firebase.firestore().collection("users").doc(uid).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        document.getElementById("profileBox").innerHTML = `
          <div class="profile">
            <img src="${data.avatar || 'https://via.placeholder.com/80'}">
            <h3>${data.name}</h3>
            <p>${data.bio}</p>
          </div>
        `;
        document.getElementById("menuProfile").innerHTML = `
          <img src="${data.avatar || 'https://via.placeholder.com/40'}">
          <span>${data.name}</span>
        `;
      }
    });
  }

  // SAVE BUTTON LOGIC
  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", async () => {

      const user = firebase.auth().currentUser;
      if (!user) return;

      const card = btn.closest(".card");
      const title = card.querySelector("h3").innerText;

      const snapshot = await firebase.firestore().collection("users")
        .doc(user.uid)
        .collection("saved")
        .where("title", "==", title)
        .get();

      if (!snapshot.empty) {
        snapshot.forEach(doc => doc.ref.delete());
        btn.classList.remove("saved");
        btn.querySelector(".heart").innerText = "♡";
      } else {
        firebase.firestore().collection("users")
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

  // SEARCH FUNCTION
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      document.querySelectorAll(".card").forEach(card => {
        const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
        const text = card.querySelector("p")?.innerText.toLowerCase() || "";
        card.style.display = (title.includes(query) || text.includes(query)) ? "block" : "none";
      });
    });
  }

  // FILTERS
  document.querySelectorAll(".filters button").forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      document.querySelectorAll(".card").forEach(card => {
        card.style.display = (filter === "all" || card.dataset.category === filter) ? "block" : "none";
      });
    });
  });

  // RANDOM VIBE
  const vibes = ["rainy", "soft", "nostalgic"];
  document.getElementById("randomBtn").onclick = () => {
    alert("✨ Try this vibe: " + vibes[Math.floor(Math.random() * vibes.length)]);
  };

});

// DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "on" : "off");
}
if (localStorage.getItem("darkMode") === "on") document.body.classList.add("dark");

// LOGOUT
function logout() {
  firebase.auth().signOut().then(() => window.location.href = "login.html");
}