const db   = firebase.firestore();
const auth = firebase.auth();

// ==========================
// DARK MODE (persistent)
// ==========================
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

// ==========================
// AUTH STATE
// ==========================
auth.onAuthStateChanged(user => {
  if (user) {
    loadUserProfile(user);
    loadPosts();
    injectFloatingBtn();
  } else {
    window.location.href = 'login.html';
  }
});

// ==========================
// USER PROFILE
// ==========================
function loadUserProfile(user) {
  db.collection('users').doc(user.uid).get().then(doc => {
    const data = doc.exists ? doc.data() : {};
    const name   = data.username || data.name || 'you';
    const photo  = data.photo || data.avatar || 'https://via.placeholder.com/40';

    document.getElementById('profileBox').innerHTML = `
      <a href="profile.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;justify-content:center;margin-top:6px;">
        <img src="${photo}" style="width:36px;height:36px;border-radius:50%;border:2px solid #a8d8a0;object-fit:cover;">
        <span style="color:#4a7c59;font-size:0.88rem;font-weight:500;">${name}</span>
      </a>
    `;

    document.getElementById('menuProfile').innerHTML = `
      <a href="profile.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;padding:10px 16px;border-bottom:1px solid #e2f4de;">
        <img src="${photo}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
        <span style="color:#4a7c59;font-weight:500;font-size:0.9rem;">${name}</span>
      </a>
    `;
  });
}

// ==========================
// FLOATING + BUTTON
// ==========================
function injectFloatingBtn() {
  if (document.getElementById('fabBtn')) return;

  const fab = document.createElement('div');
  fab.id = 'fabBtn';
  fab.innerHTML = '+';
  fab.style.cssText = `
    position:fixed;bottom:90px;right:24px;
    width:52px;height:52px;border-radius:50%;
    background:linear-gradient(135deg,#a8d8a0,#6dbf86);
    color:white;font-size:28px;line-height:52px;
    text-align:center;cursor:pointer;z-index:9999;
    box-shadow:0 6px 20px rgba(80,140,90,0.35);
    transition:transform 0.2s;user-select:none;
  `;
  fab.onmouseenter = () => fab.style.transform = 'scale(1.1)';
  fab.onmouseleave = () => fab.style.transform = 'scale(1)';
  fab.onclick      = toggleFabMenu;
  document.body.appendChild(fab);

  const menu = document.createElement('div');
  menu.id = 'fabMenu';
  menu.style.cssText = `
    position:fixed;bottom:152px;right:18px;
    display:none;flex-direction:column;gap:10px;
    z-index:9998;align-items:flex-end;
  `;
  menu.innerHTML = `
    <a href="stories.html" style="${fabItemStyle()}">📖 write a story</a>
    <a href="cafes.html"   style="${fabItemStyle()}">☕ add a café</a>
    <a href="music.html"   style="${fabItemStyle()}">🎧 share a song</a>
    <span onclick="scrollToPost()" style="${fabItemStyle()}cursor:pointer;">💬 yap something</span>
  `;
  document.body.appendChild(menu);
}

function fabItemStyle() {
  return `
    background:rgba(255,255,255,0.95);color:#4a7c59;
    padding:8px 16px;border-radius:24px;font-size:0.88rem;
    box-shadow:0 4px 14px rgba(80,140,90,0.15);
    text-decoration:none;white-space:nowrap;
    font-family:'DM Sans',sans-serif;
  `;
}

function toggleFabMenu() {
  const menu = document.getElementById('fabMenu');
  const fab  = document.getElementById('fabBtn');
  const open = menu.style.display === 'flex';
  menu.style.display = open ? 'none' : 'flex';
  fab.style.transform = open ? 'scale(1) rotate(0deg)' : 'scale(1.1) rotate(45deg)';
}

function scrollToPost() {
  toggleFabMenu();
  const el = document.getElementById('postInput');
  if (el) { el.scrollIntoView({ behavior: 'smooth' }); el.focus(); }
}

// ==========================
// CREATE POST
// ==========================
async function createPost() {
  const user   = auth.currentUser;
  const text   = document.getElementById('postInput').value.trim();
  const type   = document.getElementById('postType').value;
  const extra  = document.getElementById('extraInput').value.trim();
  const lyrics = document.getElementById('lyricsInput')?.value.trim() || '';

  if (!text) return;

  let imageUrl = '';
  const file = document.getElementById('imageInput').files[0];
  if (file) {
    const ref = firebase.storage().ref().child('posts/' + Date.now());
    await ref.put(file);
    imageUrl = await ref.getDownloadURL();
  }

  const userDoc  = await db.collection('users').doc(user.uid).get();
  const username = userDoc.exists ? (userDoc.data().username || userDoc.data().name || 'anonymous') : 'anonymous';

  await db.collection('posts').add({
    text, type, extra, lyrics, imageUrl,
    uid: user.uid, username,
    likes: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  document.getElementById('postInput').value  = '';
  document.getElementById('extraInput').value = '';
  if (document.getElementById('lyricsInput'))
    document.getElementById('lyricsInput').value = '';
  document.getElementById('imageInput').value = '';
}

// ==========================
// LOAD POSTS
// ==========================
function loadPosts() {
  db.collection('posts')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const container = document.getElementById('postsContainer');
      container.innerHTML = '';

      snapshot.forEach(doc => {
        const post = doc.data();
        const id   = doc.id;
        const user = auth.currentUser;
        const liked = user && post.likes && post.likes.includes(user.uid);

        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <a href="profile.html?uid=${post.uid}" style="font-weight:500;color:#4a7c59;font-size:0.88rem;text-decoration:none;">@${post.username}</a>
            <span style="font-size:0.75rem;color:#b0ccb3;">${post.type || ''}</span>
          </div>
          <p style="color:#2e3d2f;font-size:0.92rem;line-height:1.6;">${post.text}</p>
          ${post.imageUrl ? `<img src="${post.imageUrl}" style="width:100%;border-radius:12px;margin-top:8px;">` : ''}
          ${post.extra && post.type && post.type.includes('Song') ? `<div class="music-card"><p>🎧 ${post.extra}</p></div>` : ''}
          <div class="post-actions" style="margin-top:10px;">
            <button class="like-btn ${liked ? 'liked' : ''}" onclick="toggleLike('${id}', ${liked})">
              ${liked ? '❤️' : '🤍'} <span id="likeCount-${id}">${post.likes ? post.likes.length : 0}</span>
            </button>
            <button onclick="toggleComments('${id}')">💬 comments</button>
            <button onclick="followUser('${post.uid}')" style="font-size:0.8rem;padding:5px 10px;">+ follow</button>
          </div>
          <div id="commentBox-${id}" style="display:none;margin-top:10px;">
            <div id="comments-${id}"></div>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <input id="commentInput-${id}" placeholder="say something..." style="flex:1;padding:7px 10px;border-radius:10px;border:1px solid #c5e0bc;font-family:'DM Sans',sans-serif;">
              <button onclick="addComment('${id}')">send</button>
            </div>
          </div>
        `;
        container.appendChild(card);
        loadComments(id);
      });
    });
}

// ==========================
// LIKES
// ==========================
function toggleLike(id, liked) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = db.collection('posts').doc(id);
  if (liked) {
    ref.update({ likes: firebase.firestore.FieldValue.arrayRemove(user.uid) });
  } else {
    ref.update({ likes: firebase.firestore.FieldValue.arrayUnion(user.uid) });
  }
}

// ==========================
// COMMENTS
// ==========================
function toggleComments(id) {
  const box = document.getElementById(`commentBox-${id}`);
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
  if (box.style.display === 'block') loadComments(id);
}

function addComment(postId) {
  const user = auth.currentUser;
  const text = document.getElementById(`commentInput-${postId}`).value.trim();
  if (!text) return;
  db.collection('posts').doc(postId).collection('comments').add({
    text, uid: user.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById(`commentInput-${postId}`).value = '';
}

function loadComments(postId) {
  db.collection('posts').doc(postId).collection('comments')
    .orderBy('createdAt')
    .onSnapshot(snapshot => {
      const container = document.getElementById(`comments-${postId}`);
      if (!container) return;
      container.innerHTML = '';
      snapshot.forEach(doc => {
        const c = doc.data();
        const div = document.createElement('div');
        div.className = 'comment';
        div.textContent = c.text;
        container.appendChild(div);
      });
    });
}

// ==========================
// FOLLOW
// ==========================
function followUser(targetUid) {
  const user = auth.currentUser;
  if (!user || user.uid === targetUid) return;
  db.collection('users').doc(targetUid).collection('followers').doc(user.uid).set({ uid: user.uid });
  db.collection('users').doc(user.uid).collection('following').doc(targetUid).set({ uid: targetUid });
  db.collection('users').doc(targetUid).collection('notifications').add({
    text: 'Someone followed you! 🌸',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ==========================
// SEARCH + FILTER
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.post-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  document.querySelectorAll('.filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      document.querySelectorAll('.card[data-category]').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });

  const randomBtn = document.getElementById('randomBtn');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      const cards = document.querySelectorAll('.card[data-category]');
      if (!cards.length) return;
      const r = cards[Math.floor(Math.random() * cards.length)];
      r.scrollIntoView({ behavior: 'smooth' });
    });
  }
});

// ==========================
// LOGOUT
// ==========================
function logout() {
  auth.signOut().then(() => window.location.href = 'login.html');
}