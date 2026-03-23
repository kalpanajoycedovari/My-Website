document.addEventListener("DOMContentLoaded", () => {

  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  let currentUser = null;

  // AUTH
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      currentUser = user;
      loadProfile(user.uid);
      loadPosts();
    }
  });

  // PROFILE
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

        document.getElementById("menuProfile").innerHTML = `
          <img src="${data.avatar || 'https://via.placeholder.com/40'}">
          <span>${data.name}</span>
        `;
      }
    });
  }

  // CREATE POST (WITH IMAGE)
  window.createPost = async function () {
    const text = document.getElementById("postInput").value;
    const type = document.getElementById("postType").value;
    const extra = document.getElementById("extraInput").value;
    const file = document.getElementById("imageInput").files[0];

    if (!text) return alert("Write something first!");

    let imageUrl = "";

    if (file) {
      const ref = storage.ref("posts/" + Date.now());
      await ref.put(file);
      imageUrl = await ref.getDownloadURL();
    }

    await db.collection("posts").add({
      uid: currentUser.uid,
      text,
      type,
      extra,
      image: imageUrl,
      likes: [],
      createdAt: new Date()
    });

    document.getElementById("postInput").value = "";
    document.getElementById("extraInput").value = "";
    document.getElementById("imageInput").value = "";
  };

  // LOAD POSTS
  function loadPosts() {
    db.collection("posts")
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {

        const container = document.getElementById("postsContainer");
        container.innerHTML = "";

        snapshot.forEach(doc => {
          const post = doc.data();
          const id = doc.id;

          const liked = post.likes?.includes(currentUser.uid);

          container.innerHTML += `
            <div class="post-card">

              <div style="display:flex; justify-content:space-between;">
                <h4 onclick="goToProfile('${post.uid}')" style="cursor:pointer;">👤 View User</h4>

                ${currentUser.uid === post.uid ? 
                  `<button onclick="deletePost('${id}')" style="background:none;border:none;cursor:pointer;">🗑</button>` 
                  : ""}
              </div>

              <p>${post.type}</p>
              <p>${post.text}</p>

              ${post.image ? `<img src="${post.image}" class="post-img">` : ""}

              <small>${post.extra || ""}</small>

              <div class="post-actions">
                <span onclick="toggleLike('${id}')">
                  ${liked ? "❤️" : "🤍"} ${post.likes?.length || 0}
                </span>
                <span onclick="toggleComments('${id}')">💬 Comment</span>
              </div>

              <div id="comments-${id}" style="display:none;">
                <div id="list-${id}"></div>
                <input placeholder="comment..." onkeypress="addComment(event,'${id}')">
              </div>

            </div>
          `;
        });
      });
  }

  // SEARCH
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();

      document.querySelectorAll(".post-card, .card").forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? "block" : "none";
      });
    });
  }

  // FILTERS
  document.querySelectorAll(".filters button").forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      document.querySelectorAll(".card").forEach(card => {
        card.style.display =
          filter === "all" || card.dataset.category === filter
            ? "block"
            : "none";
      });
    });
  });

  // RANDOM
  document.getElementById("randomBtn").onclick = () => {
    const vibes = ["rainy", "soft", "nostalgic"];
    alert("✨ Try this vibe: " + vibes[Math.floor(Math.random() * 3)]);
  };

});


// ❤️ LIKE
function toggleLike(postId) {
  const user = firebase.auth().currentUser;
  const ref = firebase.firestore().collection("posts").doc(postId);

  ref.get().then(doc => {
    const data = doc.data();
    let likes = data.likes || [];

    if (likes.includes(user.uid)) {
      likes = likes.filter(id => id !== user.uid);
    } else {
      likes.push(user.uid);
    }

    ref.update({ likes });
  });
}


// 💬 COMMENTS
function toggleComments(id) {
  const el = document.getElementById("comments-" + id);
  el.style.display = el.style.display === "none" ? "block" : "none";
}

function addComment(e, postId) {
  if (e.key !== "Enter") return;

  const text = e.target.value;
  const user = firebase.auth().currentUser;

  firebase.firestore()
    .collection("posts")
    .doc(postId)
    .collection("comments")
    .add({
      text,
      user: user.email,
      createdAt: new Date()
    });

  e.target.value = "";
}


// 🗑 DELETE POST
function deletePost(postId) {
  if (!confirm("Delete this post?")) return;

  firebase.firestore()
    .collection("posts")
    .doc(postId)
    .delete();
}


// 👤 PROFILE NAV
function goToProfile(uid) {
  window.location.href = "profile.html?uid=" + uid;
}


// 🌙 DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
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