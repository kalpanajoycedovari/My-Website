document.addEventListener("DOMContentLoaded", () => {

  // ✅ AUTH CHECK
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      loadProfile(user.uid);
      loadPosts();
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


// 🌙 DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("darkMode", "on");
  } else {
    localStorage.setItem("darkMode", "off");
  }
}

// APPLY SAVED MODE
if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark");
}


// 🚪 LOGOUT
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


// 📡 LOAD POSTS (Pinterest + Likes + Comments)
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
        const postId = doc.id;

        container.innerHTML += `
          <div class="post-card">

            <h3>${post.type}</h3>
            <p>${post.text}</p>
            <small>${post.extra || ""}</small>

            <div class="post-actions">
              <span class="like-btn" onclick="toggleLike('${postId}')">♡ Like</span>
              <span onclick="toggleComments('${postId}')">💬 Comment</span>
            </div>

            <div class="comments" id="comments-${postId}" style="display:none;">
              <div id="commentList-${postId}"></div>

              <input type="text" placeholder="write a comment..."
                onkeypress="addComment(event, '${postId}')">
            </div>

          </div>
        `;

        loadComments(postId);
      });
    });
}


// ❤️ LIKE
function toggleLike(postId) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const ref = firebase.firestore()
    .collection("posts")
    .doc(postId)
    .collection("likes")
    .doc(user.uid);

  ref.get().then(doc => {
    if (doc.exists) {
      ref.delete();
    } else {
      ref.set({ liked: true });
    }
  });
}


// 💬 TOGGLE COMMENTS
function toggleComments(postId) {
  const el = document.getElementById(`comments-${postId}`);
  el.style.display = (el.style.display === "none") ? "block" : "none";
}


// 💬 ADD COMMENT
function addComment(e, postId) {
  if (e.key !== "Enter") return;

  const text = e.target.value;
  const user = firebase.auth().currentUser;
  if (!user) return;

  firebase.firestore()
    .collection("posts")
    .doc(postId)
    .collection("comments")
    .add({
      text,
      uid: user.uid,
      createdAt: new Date()
    });

  e.target.value = "";
}


// 📡 LOAD COMMENTS
function loadComments(postId) {
  firebase.firestore()
    .collection("posts")
    .doc(postId)
    .collection("comments")
    .orderBy("createdAt")
    .onSnapshot(snapshot => {

      const list = document.getElementById(`commentList-${postId}`);
      if (!list) return;

      list.innerHTML = "";

      snapshot.forEach(doc => {
        const c = doc.data();

        list.innerHTML += `<p>💬 ${c.text}</p>`;
      });
    });
}