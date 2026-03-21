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

  // SAVE / UNSAVE
  document.querySelectorAll(".card button").forEach(btn => {

    if (!btn.classList.contains("toggle-btn")) {

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
          btn.innerText = "♡ save";
        } else {
          db.collection("users")
            .doc(user.uid)
            .collection("saved")
            .add({
              title,
              text: card.querySelector("p").innerText,
              image: card.querySelector("img")?.src || ""
            });

          btn.innerText = "❤️ saved";
        }

      });

    }

  });

  // RANDOM VIBE
  const vibes = ["rainy", "soft", "nostalgic"];
  document.getElementById("randomBtn").onclick = () => {
    alert("✨ Try this vibe: " + vibes[Math.floor(Math.random() * vibes.length)]);
  };

  // FILTERS
  document.querySelectorAll(".filters button").forEach(btn => {
    btn.addEventListener("click", () => {

      const filter = btn.dataset.filter;

      document.querySelectorAll(".card").forEach(card => {
        card.style.display = (filter === "all" || card.dataset.category === filter) ? "block" : "none";
      });

    });
  });

});
// 🌙 DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("darkMode", "on");
  } else {
    localStorage.setItem("darkMode", "off");
  }
}

// load dark mode
if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark");
}

// 🚪 LOGOUT
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "login.html";
  });
}

// 👤 LOAD PROFILE IN MENU
function loadMenuProfile(uid) {
  firebase.firestore().collection("users").doc(uid).get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();

        document.getElementById("menuProfile").innerHTML = `
          <img src="${data.avatar || 'https://via.placeholder.com/40'}">
          <span>${data.name}</span>
        `;
      }
    });
}

// connect with auth
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    loadMenuProfile(user.uid);
  }
});
// 🔍 SEARCH FUNCTION
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