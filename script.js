document.addEventListener("DOMContentLoaded", () => {

  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      loadProfile(user.uid);
      loadPosts();
      updateMenuProfile(user);
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

  function updateMenuProfile(user) {
    const menu = document.getElementById("menuProfile");
    if (menu) {
      menu.innerHTML = `
        <img src="https://via.placeholder.com/40">
        <span>${user.email}</span>
      `;
    }
  }

  // ❤️ SAVE
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
  document.getElementById("searchInput")?.addEventListener("input", e => {
    const query = e.target.value.toLowerCase();

    document.querySelectorAll(".card").forEach(card => {
      const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
      const text = card.querySelector("p")?.innerText.toLowerCase() || "";

      card.style.display =
        (title.includes(query) || text.includes(query)) ? "block" : "none";
    });
  });

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

  // 🎲 RANDOM
  document.getElementById("randomBtn")?.addEventListener("click", () => {
    const vibes = ["rainy", "soft", "nostalgic"];
    alert("✨ Try: " + vibes[Math.floor(Math.random() * vibes.length)]);
  });

});


// 🌙 DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode",
    document.body.classList.contains("dark") ? "on" : "off");
}
if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark");
}


// 🚪 LOGOUT
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "login.html";
  });
}


// ✍️ CREATE POST (WITH IMAGE)
function createPost() {
  const text = document.getElementById("postInput").value;
  const file = document.getElementById("imageInput").files[0];
  const user = firebase.auth().currentUser;

  if (!user) return alert("Login first!");

  if (file) {
    const ref = firebase.storage().ref("posts/" + Date.now());

    ref.put(file).then(snapshot => {
      snapshot.ref.getDownloadURL().then(url => {
        savePost(text, user.uid, url);
      });
    });
  } else {
    savePost(text, user.uid, "");
  }
}

function savePost(text, uid, image) {
  firebase.firestore().collection("posts").add({
    uid,
    text,
    image,
    createdAt: new Date()
  });
}


// 📡 POSTS (Pinterest + social)
function loadPosts() {
  firebase.firestore().collection("posts")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      const container = document.getElementById("postsContainer");
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const post = doc.data();
        const id = doc.id;

        container.innerHTML += `
          <div class="post-card">

            <h4 onclick="goToProfile('${post.uid}')" style="cursor:pointer;">👤 View User</h4>

            <p>${post.text}</p>
            ${post.image ? `<img src="${post.image}" style="width:100%; border-radius:10px;">` : ""}

            <div class="post-actions">
              <span onclick="toggleLike('${id}')">❤️ Like</span>
              <span onclick="toggleComments('${id}')">💬 Comment</span>
            </div>

            <div id="comments-${id}" style="display:none;">
              <div id="list-${id}"></div>
              <input placeholder="comment..."
                onkeypress="addComment(event,'${id}')">
            </div>

          </div>
        `;

        loadComments(id);
      });
    });
}


// ❤️ LIKE
function toggleLike(postId) {
  const user = firebase.auth().currentUser;

  firebase.firestore()
    .collection("posts")
    .doc(postId)
    .collection("likes")
    .doc(user.uid)
    .set({ liked: true });
}


// 💬 COMMENTS
function toggleComments(id) {
  const el = document.getElementById("comments-" + id);
  el.style.display = el.style.display === "none" ? "block" : "none";
}

function addComment(e, id) {
  if (e.key !== "Enter") return;

  firebase.firestore()
    .collection("posts")
    .doc(id)
    .collection("comments")
    .add({
      text: e.target.value,
      createdAt: new Date()
    });

  e.target.value = "";
}

function loadComments(id) {
  firebase.firestore()
    .collection("posts")
    .doc(id)
    .collection("comments")
    .onSnapshot(snapshot => {

      let html = "";
      snapshot.forEach(doc => {
        html += `<p>💬 ${doc.data().text}</p>`;
      });

      document.getElementById("list-" + id).innerHTML = html;
    });
}


// 👤 PROFILE PAGE NAV
function goToProfile(uid) {
  window.location.href = `profile.html?uid=${uid}`;
}


// ➕ FOLLOW
function followUser(targetUid) {
  const user = firebase.auth().currentUser;

  firebase.firestore()
    .collection("users")
    .doc(targetUid)
    .collection("followers")
    .doc(user.uid)
    .set({ followed: true });

  // 🔔 notification
  firebase.firestore()
    .collection("users")
    .doc(targetUid)
    .collection("notifications")
    .add({
      text: "Someone followed you ❤️",
      createdAt: new Date()
    });
}