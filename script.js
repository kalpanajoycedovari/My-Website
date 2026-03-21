document.addEventListener("DOMContentLoaded", () => {

  // ✅ AUTH CHECK + PROFILE LOAD
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      loadProfile(user.uid);
      loadPosts(); // load posts after login
      updateMenuProfile(user);
    }
  });

  // 👤 LOAD PROFILE
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

  // 👤 MENU PROFILE FALLBACK
  function updateMenuProfile(user) {
    const menu = document.getElementById("menuProfile");
    if (menu) {
      menu.innerHTML = `
        <img src="https://via.placeholder.com/40">
        <span>${user.email}</span>
      `;
    }
  }

  // ❤️ SAVE BUTTON
  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", async () => {

      const user = firebase.auth().currentUser;
      if (!user) return;

      const card = btn.closest(".card");
      const title = card.querySelector("h3").innerText;

      const snapshot = await firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("saved")
        .where("title", "==", title)
        .get();

      if (!snapshot.empty) {
        snapshot.forEach(doc => doc.ref.delete());
        btn.classList.remove("saved");
        btn.querySelector(".heart").innerText = "♡";
      } else {
        firebase.firestore()
          .collection("users")
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

        card.style.display =
          (title.includes(query) || text.includes(query)) ? "block" : "none";
      });
    });
  }

  // 🎭 FILTERS
  document.querySelectorAll(".filters button").forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      document.querySelectorAll(".card").forEach(card => {
        card.style.display =
          (filter === "all" || card.dataset.category === filter)
            ? "block"
            : "none";
      });
    });
  });

  // 🎲 RANDOM VIBE
  const vibes = ["rainy", "soft", "nostalgic"];
  const randomBtn = document.getElementById("randomBtn");

  if (randomBtn) {
    randomBtn.onclick = () => {
      alert("✨ Try this vibe: " + vibes[Math.floor(Math.random() * vibes.length)]);
    };
  }

});


// 🌙 DARK MODE (clean single version)
function toggleDarkMode() {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("darkMode", "on");
  } else {
    localStorage.setItem("darkMode", "off");
  }
}

// APPLY SAVED DARK MODE
if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark");
}


// 🚪 LOGOUT (clean single version)
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "login.html";
  });
}


// ✍️ CREATE POST
function createPost() {
  const text = document.getElementById("postInput").value;
  const type = document.getElementById("postType").value;
  const extra = document.getElementById("extraInput").value;

  const user = firebase.auth().currentUser;
  if (!user) return alert("Login first!");

  firebase.firestore().collection("posts").add({
    uid: user.uid,
    text,
    type,
    extra,
    createdAt: new Date()
  });

  document.getElementById("postInput").value = "";
  document.getElementById("extraInput").value = "";
}


// 📡 LOAD POSTS
function loadPosts() {
  firebase.firestore()
    .collection("posts")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      const container = document.getElementById("postsContainer");
      if (!container) return;

      container.innerHTML = "";

      snapshot.forEach(doc => {
        const post = doc.data();

        container.innerHTML += `
          <div class="card">
            <div class="card-content">
              <h3>${post.type}</h3>
              <p>${post.text}</p>
              <small>${post.extra || ""}</small>
            </div>
          </div>
        `;
      });
    });
}