// 🌙 DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("darkMode", "on");
  } else {
    localStorage.setItem("darkMode", "off");
  }
}

if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark");
}

// 🚪 LOGOUT
function logout() {
  firebase.auth().signOut().then(() => {
    alert("Logged out!");
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
}

// 📡 LOAD POSTS
function loadPosts() {
  firebase.firestore().collection("posts")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      const container = document.getElementById("postsContainer");
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const post = doc.data();

        container.innerHTML += `
          <div class="card">
            <h3>${post.type}</h3>
            <p>${post.text}</p>
            <small>${post.extra || ""}</small>
          </div>
        `;
      });
    });
}

loadPosts();

// 👤 PROFILE
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    document.getElementById("menuProfile").innerHTML = `
      <img src="https://via.placeholder.com/40">
      <span>${user.email}</span>
    `;
  }
});