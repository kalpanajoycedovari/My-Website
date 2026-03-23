document.addEventListener("DOMContentLoaded", () => {

  // ✅ AUTH
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      loadProfile(user.uid);
      loadPosts();
      loadPlaylist();
    }
  });

  // ✅ PROFILE LOAD
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

  // ❤️ SAVE POSTS
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
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? "block" : "none";
      });
    });
  }

  // 🎯 FILTER
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

  // 🎲 RANDOM MOOD
  const moods = ["sad", "calm", "love"];
  document.getElementById("randomBtn").onclick = () => {
    const mood = moods[Math.floor(Math.random() * moods.length)];
    recommendMood(mood);
  };

});


// 🌙 DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode",
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


// ==========================
// 🎧 SPOTIFY FEATURES
// ==========================

// 🎧 Extract ID
function getSpotifyTrackId(url) {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// 🎧 Fetch song data
async function fetchSpotifyData(trackId) {
  const res = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`);
  return await res.json();
}


// ==========================
// ✍️ CREATE POST
// ==========================
async function createPost() {
  const text = document.getElementById("postInput").value;
  const type = document.getElementById("postType").value;
  const extra = document.getElementById("extraInput").value;

  const user = firebase.auth().currentUser;
  if (!user) return alert("Login first!");

  let songData = null;

  if (extra.includes("spotify")) {
    const id = getSpotifyTrackId(extra);
    if (id) {
      songData = await fetchSpotifyData(id);
    }
  }

  firebase.firestore().collection("posts").add({
    uid: user.uid,
    text,
    type,
    extra,
    songTitle: songData?.title || "",
    songThumbnail: songData?.thumbnail_url || "",
    songEmbed: extra || "",
    createdAt: new Date()
  });

  document.getElementById("postInput").value = "";
  document.getElementById("extraInput").value = "";
}


// ==========================
// 📡 LOAD POSTS
// ==========================
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
          <div class="card">

            <div class="card-content">

              <h3>${post.type}</h3>
              <p>${post.text}</p>

              ${post.songEmbed ? `
                <div onclick="playSong('${post.songTitle}','${post.songThumbnail}')">
                  <img src="${post.songThumbnail}" style="width:100%">
                  <p>${post.songTitle}</p>
                  <iframe src="${post.songEmbed.replace("open.spotify.com","open.spotify.com/embed")}" width="100%" height="80"></iframe>
                </div>
              ` : ""}

              <button onclick="saveToPlaylist(${JSON.stringify(post)})">➕ Playlist</button>

              <button onclick="deletePost('${id}')">🗑 Delete</button>

            </div>
          </div>
        `;
      });
    });
}


// ==========================
// 🗑 DELETE POST
// ==========================
function deletePost(id) {
  firebase.firestore().collection("posts").doc(id).delete();
}


// ==========================
// 🎵 FLOATING PLAYER
// ==========================
function playSong(title, img) {
  document.getElementById("playerTitle").innerText = title;
  document.getElementById("playerImg").src = img;
}


// ==========================
// 📀 PLAYLIST SYSTEM
// ==========================
function saveToPlaylist(post) {
  const user = firebase.auth().currentUser;

  firebase.firestore()
    .collection("users")
    .doc(user.uid)
    .collection("playlist")
    .add(post);
}

function loadPlaylist() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  firebase.firestore()
    .collection("users")
    .doc(user.uid)
    .collection("playlist")
    .onSnapshot(() => {});
}


// ==========================
// 🌈 MOOD RECOMMENDATION
// ==========================
function recommendMood(mood) {
  firebase.firestore().collection("posts").get().then(snapshot => {
    const songs = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.songTitle) songs.push(data);
    });

    const match = songs.find(s =>
      s.text.toLowerCase().includes(mood)
    );

    alert("🎧 Try: " + (match?.songTitle || "No match found"));
  });
}