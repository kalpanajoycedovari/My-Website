
//  FIREBASE INIT
const db = firebase.firestore();
const auth = firebase.auth();

// ==========================
//  AUTH STATE
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
//  CREATING POST
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

  // 🎧 Spotify Auto Fetch
  let songTitle = extra;
  let songEmbed = "";
  let songThumbnail = "";

  if (type.includes("Song") && extra) {
    try {
      const res = await fetch(`https://api.spotify.com/v1/search?q=${extra}&type=track&limit=1`, {
        headers: {
          Authorization: "Bearer YOUR_SPOTIFY_TOKEN"
        }
      });

      const data = await res.json();
      const track = data.tracks.items[0];

      if (track) {
        songTitle = track.name;
        songEmbed = track.external_urls.spotify;
        songThumbnail = track.album.images[0].url;
      }
    } catch (e) {
      console.log("Spotify fetch failed");
    }
  }

  // 👤 get username
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

        // 🎧 MUSIC CARD CLICKABLE
        if (post.type.includes("Song") && post.songEmbed) {
          html += `
            <div class="music-card" onclick="openSongPage('${id}')">
              <img src="${post.songThumbnail}" class="music-thumb">
              <p>${post.songTitle}</p>
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
          <div class="comment">
            <p>${c.text}</p>
          </div>
        `;
      });
    });
}

// ==========================
// 🎧 SONG PAGE NAVIGATION
// ==========================
function openSongPage(postId) {
  window.location.href = `song.html?id=${postId}`;
}

function goBack() {
  window.history.back();
}

// ==========================
// 🎵 LOAD SONG PAGE
// ==========================
function loadSongPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  db.collection("posts").doc(id).get().then(doc => {
    const post = doc.data();

    document.getElementById("songPage").innerHTML = `
      <h2>🎧 Song of the Day</h2>
      <h3>${post.songTitle}</h3>

      <img src="${post.songThumbnail}" style="width:200px">

      <iframe src="${post.songEmbed.replace("open.spotify.com","open.spotify.com/embed")}"
        width="100%" height="80"></iframe>

      <div class="lyrics-box">
        <h4>✨ Lyrics / Feelings</h4>
        <p>${post.lyrics || "No lyrics added yet"}</p>
      </div>
    `;
  });

  loadSongComments(id);
}

// ==========================
// 💬 SONG COMMENTS
// ==========================
function addSongComment() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  const user = auth.currentUser;
  const text = document.getElementById("commentInput").value;

  if (!text) return;

  db.collection("posts")
    .doc(postId)
    .collection("comments")
    .add({
      text,
      uid: user.uid,
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

        container.innerHTML += `
          <div class="comment">
            <p>${c.text}</p>
          </div>
        `;
      });
    });
}

// ==========================
// 👥 FOLLOW SYSTEM
// ==========================
function followUser(targetUid) {
  const user = auth.currentUser;

  db.collection("users")
    .doc(targetUid)
    .collection("followers")
    .doc(user.uid)
    .set({
      uid: user.uid
    });

  // 🔔 Notification
  db.collection("users")
    .doc(targetUid)
    .collection("notifications")
    .add({
      text: "Someone followed you!",
      createdAt: Date.now()
    });
}

// ==========================
// 🚪 LOGOUT
// ==========================
function logout() {
  auth.signOut();
}

// ==========================
// 🌙 DARK MODE
// ==========================
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

// ==========================
// 🎵 FLOATING PLAYER (basic)
// ==========================
function playSong(title, img) {
  document.getElementById("playerTitle").innerText = title;
  document.getElementById("playerImg").src = img;
}

// ==========================
// 🚀 AUTO LOAD SONG PAGE
// ==========================
if (window.location.pathname.includes("song.html")) {
  auth.onAuthStateChanged(user => {
    if (user) loadSongPage();
  });
}
