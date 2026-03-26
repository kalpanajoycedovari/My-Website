
// 🔥 FIREBASE INIT
const db = firebase.firestore();
const auth = firebase.auth();

// ==========================
// 🔐 AUTH STATE
// ==========================
auth.onAuthStateChanged(user => {
  if (user) {
    loadUserProfile(user);
    loadPosts();
  } else {
    window.location.href = "login.html";
  }
});

// ==========================
// 👤 USER PROFILE
// ==========================
function loadUserProfile(user) {
  db.collection("users").doc(user.uid).get().then(doc => {
    const data = doc.data();

    document.getElementById("profileBox").innerHTML = `
      <img src="${data.photo || 'https://via.placeholder.com/40'}">
      <span>${data.username || "User"}</span>
    `;

    document.getElementById("menuProfile").innerHTML = `
      <img src="${data.photo || 'https://via.placeholder.com/40'}">
      <span>${data.username || "User"}</span>
    `;
  });
}

// ==========================
// ✏️ CREATE POST
// ==========================
async function createPost() {
  const user = auth.currentUser;

  const text = document.getElementById("postInput").value;
  const type = document.getElementById("postType").value;
  const extra = document.getElementById("extraInput").value;
  const lyrics = document.getElementById("lyricsInput")?.value || "";

  let imageUrl = "";

  const file = document.getElementById("imageInput").files[0];
  if (file) {
    const ref = firebase.storage().ref().child("posts/" + Date.now());
    await ref.put(file);
    imageUrl = await ref.getDownloadURL();
  }

  let songTitle = extra;
  let songEmbed = "";
  let songThumbnail = "";

  const userDoc = await db.collection("users").doc(user.uid).get();
  const username = userDoc.data().username;

  await db.collection("posts").add({
    text,
    type,
    extra,
    lyrics,
    imageUrl,
    songTitle,
    songEmbed,
    songThumbnail,
    uid: user.uid,
    username,
    createdAt: Date.now()
  });

  document.getElementById("postInput").value = "";
  document.getElementById("extraInput").value = "";
  if (document.getElementById("lyricsInput"))
    document.getElementById("lyricsInput").value = "";
}

// ==========================
// 📰 LOAD POSTS
// ==========================
function loadPosts() {
  db.collection("posts")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      const container = document.getElementById("postsContainer");
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const post = doc.data();
        const id = doc.id;

        let html = `
          <div class="card">
            <h4>@${post.username}</h4>
            <p>${post.text}</p>
        `;

        if (post.imageUrl) {
          html += `<img src="${post.imageUrl}">`;
        }

        if (post.type.includes("Song") && post.extra) {
          html += `
            <div class="music-card" onclick="openSongPage('${id}')">
              <p>🎧 ${post.extra}</p>
            </div>
          `;
        }

        html += `
          <div class="actions">
            <button onclick="followUser('${post.uid}')">Follow</button>
          </div>

          <div id="comments-${id}"></div>

          <input id="commentInput-${id}" placeholder="comment...">
          <button onclick="addComment('${id}')">Post</button>
        </div>
        `;

        container.innerHTML += html;

        loadComments(id);
      });
    });
}

// ==========================
// 💬 COMMENTS (HOME)
// ==========================
function addComment(postId) {
  const user = auth.currentUser;
  const text = document.getElementById(`commentInput-${postId}`).value;

  if (!text) return;

  db.collection("posts")
    .doc(postId)
    .collection("comments")
    .add({
      text,
      uid: user.uid,
      createdAt: Date.now()
    });

  document.getElementById(`commentInput-${postId}`).value = "";
}

function loadComments(postId) {
  db.collection("posts")
    .doc(postId)
    .collection("comments")
    .orderBy("createdAt")
    .onSnapshot(snapshot => {

      const container = document.getElementById(`comments-${postId}`);
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const c = doc.data();

        container.innerHTML += `
          <div class="comment">${c.text}</div>
        `;
      });
    });
}

// ==========================
// 🎧 SONG PAGE
// ==========================
function openSongPage(postId) {
  window.location.href = `song.html?id=${postId}`;
}

function loadSongPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  db.collection("posts").doc(id).get().then(doc => {
    const post = doc.data();

    document.getElementById("songPage").innerHTML = `
      <h2>🎧 Song of the Day</h2>
      <h3>${post.extra}</h3>

      <div class="lyrics-box">
        <p>${post.lyrics || "No lyrics added"}</p>
      </div>
    `;
  });

  loadSongComments(id);
}

function addSongComment() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  const text = document.getElementById("commentInput").value;

  if (!text) return;

  db.collection("posts")
    .doc(postId)
    .collection("comments")
    .add({
      text,
      createdAt: Date.now()
    });

  document.getElementById("commentInput").value = "";
}

function loadSongComments(postId) {
  db.collection("posts")
    .doc(postId)
    .collection("comments")
    .orderBy("createdAt")
    .onSnapshot(snapshot => {

      const container = document.getElementById("comments");
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const c = doc.data();
        container.innerHTML += `<div class="comment">${c.text}</div>`;
      });
    });
}

// ==========================
// 👥 FOLLOW
// ==========================
function followUser(targetUid) {
  const user = auth.currentUser;

  db.collection("users")
    .doc(targetUid)
    .collection("followers")
    .doc(user.uid)
    .set({ uid: user.uid });

  db.collection("users")
    .doc(targetUid)
    .collection("notifications")
    .add({
      text: "Someone followed you!",
      createdAt: Date.now()
    });
}

// ==========================
// ☕ CAFES SYSTEM
// ==========================
async function addCafe() {
  const name = document.getElementById("cafeName").value;
  const location = document.getElementById("cafeLocation").value;
  const file = document.getElementById("cafeImage").files[0];

  let imageUrl = "";

  if (file) {
    const ref = firebase.storage().ref().child("cafes/" + Date.now());
    await ref.put(file);
    imageUrl = await ref.getDownloadURL();
  }

  await db.collection("cafes").add({
    name,
    location,
    imageUrl,
    createdAt: Date.now(),
    rating: 0,
    ratingCount: 0
  });

  loadCafes();
}

function loadCafes() {
  db.collection("cafes")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      const container = document.getElementById("cafesContainer");
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const cafe = doc.data();
        const id = doc.id;

        container.innerHTML += `
          <div class="cafe-card">
            <h3>${cafe.name}</h3>

            <img src="${cafe.imageUrl}" class="cafe-img">

            <iframe src="${cafe.location}" width="100%" height="200"></iframe>

            <div class="rating">
              ⭐ ${cafe.rating ? cafe.rating.toFixed(1) : 0} (${cafe.ratingCount || 0})
              <button onclick="rateCafe('${id}', 5)">⭐</button>
              <button onclick="rateCafe('${id}', 4)">⭐</button>
              <button onclick="rateCafe('${id}', 3)">⭐</button>
            </div>

            <div id="cafeComments-${id}"></div>

            <input id="cafeInput-${id}" placeholder="your thoughts...">
            <button onclick="addCafeComment('${id}')">Post</button>
          </div>
        `;

        loadCafeComments(id);
      });
    });
}

function rateCafe(cafeId, value) {
  const ref = db.collection("cafes").doc(cafeId);

  db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    const data = doc.data();

    const newCount = (data.ratingCount || 0) + 1;
    const newRating = ((data.rating || 0) * (newCount - 1) + value) / newCount;

    t.update(ref, {
      rating: newRating,
      ratingCount: newCount
    });
  });
}

function addCafeComment(cafeId) {
  const text = document.getElementById(`cafeInput-${cafeId}`).value;

  db.collection("cafes")
    .doc(cafeId)
    .collection("comments")
    .add({
      text,
      createdAt: Date.now()
    });

  document.getElementById(`cafeInput-${cafeId}`).value = "";
}

function loadCafeComments(cafeId) {
  db.collection("cafes")
    .doc(cafeId)
    .collection("comments")
    .orderBy("createdAt")
    .onSnapshot(snapshot => {

      const container = document.getElementById(`cafeComments-${cafeId}`);
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const c = doc.data();
        container.innerHTML += `<div class="comment">${c.text}</div>`;
      });
    });
}

// 📍 LOCATION
function getNearbyCafes() {
  navigator.geolocation.getCurrentPosition(pos => {
    alert(`Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`);
  });
}

// ==========================
// 🚀 AUTO LOAD CAFES
// ==========================
if (window.location.pathname.includes("cafes.html")) {
  loadCafes();
}

// ==========================
// 🌙 DARK MODE
// ==========================
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

// ==========================
// 🚪 LOGOUT
// ==========================
function logout() {
  auth.signOut();
}

