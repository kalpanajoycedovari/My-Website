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
      loadNotifications();
    }
  });

  // PROFILE
  async function loadProfile(uid) {
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return;

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

  // CREATE POST
  window.createPost = async function () {
    const text = document.getElementById("postInput").value;
    const type = document.getElementById("postType").value;
    const extra = document.getElementById("extraInput").value;
    const file = document.getElementById("imageInput").files[0];

    if (!text) return alert("Write something!");

    const userDoc = await db.collection("users").doc(currentUser.uid).get();
    const userData = userDoc.data();

    let imageUrl = "";

    if (file) {
      const ref = storage.ref("posts/" + Date.now());
      await ref.put(file);
      imageUrl = await ref.getDownloadURL();
    }

    await db.collection("posts").add({
      uid: currentUser.uid,
      username: userData.name,
      avatar: userData.avatar || "",
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

              <div class="post-header">
                <h4 onclick="goToProfile('${post.uid}')">
                  <img src="${post.avatar || 'https://via.placeholder.com/30'}" class="avatar">
                  ${post.username || "User"}
                </h4>

                ${currentUser.uid === post.uid ? `
                  <div>
                    <button onclick="editPost('${id}','${post.text}')">✏️</button>
                    <button onclick="deletePost('${id}')">🗑</button>
                  </div>
                ` : ""}

                ${currentUser.uid !== post.uid ? `
                  <button onclick="followUser('${post.uid}')">Follow</button>
                ` : ""}
              </div>

              <p>${post.type}</p>
              <p>${post.text}</p>

              ${post.image ? `<img src="${post.image}" class="post-img">` : ""}

              <small>${post.extra || ""}</small>

              <div class="post-actions">
                <span onclick="toggleLike('${id}')">
                  ${liked ? "❤️" : "🤍"} ${post.likes?.length || 0}
                </span>

                <span onclick="toggleComments('${id}'); loadComments('${id}')">
                  💬 Comment
                </span>
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

});


// ❤️ LIKE
function toggleLike(postId) {
  const user = firebase.auth().currentUser;
  const ref = firebase.firestore().collection("posts").doc(postId);

  ref.get().then(doc => {
    let likes = doc.data().likes || [];

    if (likes.includes(user.uid)) {
      likes = likes.filter(id => id !== user.uid);
    } else {
      likes.push(user.uid);
    }

    ref.update({ likes });
  });
}


// 💬 COMMENTS LOAD
function loadComments(postId) {
  const user = firebase.auth().currentUser;

  firebase.firestore()
    .collection("posts")
    .doc(postId)
    .collection("comments")
    .orderBy("createdAt", "asc")
    .onSnapshot(snapshot => {

      const list = document.getElementById("list-" + postId);
      list.innerHTML = "";

      snapshot.forEach(doc => {
        const c = doc.data();
        const id = doc.id;

        list.innerHTML += `
          <div class="comment">
            <span><b>${c.user}</b>: ${c.text}</span>

            ${c.uid === user.uid ? 
              `<button onclick="deleteComment('${postId}','${id}')">🗑</button>` 
              : ""
            }
          </div>
        `;
      });
    });
}


// 💬 ADD COMMENT
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
      uid: user.uid,
      createdAt: new Date()
    });

  e.target.value = "";
}


// 🗑 DELETE COMMENT
function deleteComment(postId, commentId) {
  if (!confirm("Delete this comment?")) return;

  firebase.firestore()
    .collection("posts")
    .doc(postId)
    .collection("comments")
    .doc(commentId)
    .delete();
}


// ✏️ EDIT POST
function editPost(id, oldText) {
  const newText = prompt("Edit your post:", oldText);
  if (!newText) return;

  firebase.firestore()
    .collection("posts")
    .doc(id)
    .update({ text: newText });
}


// 🗑 DELETE POST
function deletePost(postId) {
  if (!confirm("Delete this post?")) return;

  firebase.firestore()
    .collection("posts")
    .doc(postId)
    .delete();
}


// 👥 FOLLOW
function followUser(uid) {
  const user = firebase.auth().currentUser;

  firebase.firestore()
    .collection("users")
    .doc(uid)
    .collection("followers")
    .doc(user.uid)
    .set({ uid: user.uid });

  firebase.firestore()
    .collection("notifications")
    .add({
      to: uid,
      from: user.uid,
      type: "follow",
      createdAt: new Date()
    });
}


// 🔔 NOTIFICATIONS
function loadNotifications() {
  const user = firebase.auth().currentUser;

  firebase.firestore()
    .collection("notifications")
    .where("to", "==", user.uid)
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      const box = document.getElementById("notificationsBox");
      if (!box) return;

      box.innerHTML = "";

      snapshot.forEach(doc => {
        box.innerHTML += `<div class="notif">🔔 New follower</div>`;
      });
    });
}


// 👤 PROFILE NAV
function goToProfile(uid) {
  window.location.href = "profile.html?uid=" + uid;
}


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