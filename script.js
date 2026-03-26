// ==========================
// 🔥 FIREBASE INIT
// ==========================
const db = firebase.firestore();
const storage = firebase.storage();

// ==========================
// 👤 AUTH STATE
// ==========================
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    loadUserData(user);
    loadPosts();
  } else {
    window.location.href = "login.html";
  }
});

// ==========================
// 👤 LOAD USER DATA
// ==========================
function loadUserData(user) {
  db.collection("users").doc(user.uid).get().then(doc => {
    const data = doc.data();

    document.getElementById("profileBox").innerHTML = `
      <div onclick="goToProfile('${user.uid}')">
        <img src="${data.avatar || 'https://via.placeholder.com/40'}">
        <span>${data.name}</span>
      </div>
    `;

    document.getElementById("menuProfile").innerHTML = `
      <img src="${data.avatar || 'https://via.placeholder.com/40'}">
      <span>${data.name}</span>
    `;
  });
}

// ==========================
// ➕ CREATE POST
// ==========================
async function createPost() {
  const user = firebase.auth().currentUser;

  const text = document.getElementById("postInput").value;
  const type = document.getElementById("postType").value;
  const extra = document.getElementById("extraInput").value;
  const file = document.getElementById("imageInput").files[0];

  if (!text) return alert("Write something!");

  let imageUrl = "";

  if (file) {
    const ref = storage.ref("posts/" + Date.now());
    await ref.put(file);
    imageUrl = await ref.getDownloadURL();
  }

  const userDoc = await db.collection("users").doc(user.uid).get();

  await db.collection("posts").add({
    uid: user.uid,
    username: userDoc.data().name,
    text,
    type,
    extra,
    imageUrl,
    createdAt: Date.now()
  });

  document.getElementById("postInput").value = "";
  document.getElementById("extraInput").value = "";
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
        const user = firebase.auth().currentUser;

        container.innerHTML += `
          <div class="card">
            
            <div class="post-header">
              <strong onclick="goToProfile('${post.uid}')">
                ${post.username}
              </strong>
            </div>

            ${post.imageUrl ? `<img src="${post.imageUrl}">` : ""}

            <div class="card-content">
              <p>${post.text}</p>
              <small>${post.type} • ${post.extra}</small>

              <div class="post-actions">

                ${
                  user.uid === post.uid
                    ? `
                    <button onclick="deletePost('${id}')">🗑 Delete</button>
                    <button onclick="editPost('${id}', \`${post.text}\`)">✏ Edit</button>
                  `
                    : ""
                }

                <button onclick="openComments('${id}')">💬</button>

              </div>
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
  if (confirm("Delete this post?")) {
    db.collection("posts").doc(id).delete();
  }
}

// ==========================
// ✏ EDIT POST
// ==========================
function editPost(id, oldText) {
  const newText = prompt("Edit your post:", oldText);
  if (!newText) return;

  db.collection("posts").doc(id).update({
    text: newText
  });
}

// ==========================
// 💬 COMMENTS
// ==========================
function openComments(postId) {
  const text = prompt("Write a comment:");
  if (!text) return;

  const user = firebase.auth().currentUser;

  db.collection("posts")
    .doc(postId)
    .collection("comments")
    .add({
      uid: user.uid,
      text,
      createdAt: Date.now()
    });
}

// ==========================
// ❌ DELETE COMMENT
// ==========================
function deleteComment(postId, commentId) {
  db.collection("posts")
    .doc(postId)
    .collection("comments")
    .doc(commentId)
    .delete();
}

// ==========================
// ❤️ FOLLOW SYSTEM
// ==========================
async function followUser(targetUid) {
  const user = firebase.auth().currentUser;

  await db.collection("users")
    .doc(targetUid)
    .collection("followers")
    .doc(user.uid)
    .set({});

  await db.collection("users")
    .doc(user.uid)
    .collection("following")
    .doc(targetUid)
    .set({});

  addNotification(targetUid, "started following you");
}

// ==========================
// 🔔 NOTIFICATIONS
// ==========================
function addNotification(uid, text) {
  db.collection("users")
    .doc(uid)
    .collection("notifications")
    .add({
      text,
      time: Date.now()
    });
}

// ==========================
// 👤 PROFILE NAVIGATION
// ==========================
function goToProfile(uid) {
  window.location.href = `profile.html?uid=${uid}`;
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
  firebase.auth().signOut();
}

// ==========================
// 👤 PROFILE PAGE LOAD
// ==========================
function loadUserProfile() {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get("uid");

  if (!uid) return;

  db.collection("users").doc(uid).get().then(doc => {
    const data = doc.data();

    document.getElementById("profileHeader").innerHTML = `
      <img src="${data.avatar || 'https://via.placeholder.com/100'}">
      <h2>${data.name}</h2>
      <p>${data.bio || ""}</p>
    `;
  });

  db.collection("posts")
    .where("uid", "==", uid)
    .onSnapshot(snapshot => {

      const container = document.getElementById("userPosts");
      container.innerHTML = "";

      document.getElementById("postCount").innerText = snapshot.size;

      snapshot.forEach(doc => {
        const post = doc.data();

        container.innerHTML += `
          <div class="card">
            ${post.imageUrl ? `<img src="${post.imageUrl}">` : ""}
            <p>${post.text}</p>
          </div>
        `;
      });
    });
}

// AUTO LOAD PROFILE PAGE
if (window.location.pathname.includes("profile.html")) {
  firebase.auth().onAuthStateChanged(user => {
    if (user) loadUserProfile();
  });
}