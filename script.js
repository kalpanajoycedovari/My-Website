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
    const username = data.username || null;

    if (!username) {
      showUsernamePrompt(user);
      return;
    }

    renderProfileBox(username);
  });
}

function renderProfileBox(username) {
  const profileBox = document.getElementById('profileBox');
  const menuProfile = document.getElementById('menuProfile');

  if (profileBox) {
    profileBox.innerHTML = `
      <a href="profile.html" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;justify-content:center;margin-top:8px;background:rgba(255,255,255,0.7);border:1.5px solid #e0c8b0;border-radius:24px;padding:6px 16px;">
        <span style="color:#5c3317;font-family:'Caveat',cursive;font-size:1.1rem;">@${username}</span>
      </a>
    `;
  }

  if (menuProfile) {
    menuProfile.innerHTML = `
      <a href="profile.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;padding:12px 18px;border-bottom:1px solid #f0dfd0;">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#c8855c,#a05530);display:flex;align-items:center;justify-content:center;color:white;font-family:'Caveat',cursive;font-size:1.1rem;font-weight:600;">
          ${username.charAt(0).toUpperCase()}
        </div>
        <span style="color:#5c3317;font-weight:500;font-size:0.9rem;">@${username}</span>
      </a>
    `;
  }
}

function showUsernamePrompt(user) {
  if (document.getElementById('usernameOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'usernameOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(60,20,5,0.55);
    display:flex;align-items:center;justify-content:center;
    z-index:99999;backdrop-filter:blur(6px);
  `;

  overlay.innerHTML = `
    <div style="background:#fdf5ec;border-radius:24px;padding:32px 28px;max-width:340px;width:90%;text-align:center;border:1px solid #e0c8b0;box-shadow:0 20px 60px rgba(100,50,10,0.2);">
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:1.5rem;color:#5c3317;margin-bottom:6px;">welcome to Solite 🌼</div>
      <div style="font-family:'Caveat',cursive;font-size:1rem;color:#b07858;margin-bottom:20px;">what would you like to be called?</div>
      <input id="usernameInput" placeholder="your name, nickname, anything..."
        style="width:100%;padding:12px 16px;border-radius:14px;border:1.5px solid #e0c8b0;font-family:'DM Sans',sans-serif;font-size:0.95rem;color:#3d2010;background:rgba(255,255,255,0.85);box-sizing:border-box;margin-bottom:8px;">
      <div style="font-size:0.75rem;color:#b07858;font-family:'DM Sans',sans-serif;margin-bottom:16px;">letters, numbers, underscores — or just leave it for now</div>
      <div style="display:flex;gap:10px;">
        <button onclick="saveUsername('${user.uid}')" style="flex:1;padding:11px;">save ✨</button>
        <button onclick="skipUsername('${user.uid}')" style="flex:1;padding:11px;background:rgba(255,255,255,0.8);color:#7a4a2a;border:1.5px solid #e0c8b0;">skip for now</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('usernameInput')?.focus(), 100);
}

function saveUsername(uid) {
  const input = document.getElementById('usernameInput');
  const raw   = input ? input.value.trim() : '';
  const username = raw.replace(/[^a-zA-Z0-9_.]/g, '') || 'solite_friend';

  db.collection('users').doc(uid).set({ username }, { merge: true }).then(() => {
    document.getElementById('usernameOverlay')?.remove();
    renderProfileBox(username);
  });
}

function skipUsername(uid) {
  const username = 'solite_friend';
  db.collection('users').doc(uid).set({ username }, { merge: true }).then(() => {
    document.getElementById('usernameOverlay')?.remove();
    renderProfileBox(username);
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

// ==========================
// EDIT USERNAME
// ==========================
function showEditUsername() {
  const user = auth.currentUser;
  if (!user) return;

  if (document.getElementById('editUsernameOverlay')) return;

  db.collection('users').doc(user.uid).get().then(doc => {
    const current = doc.exists ? (doc.data().username || '') : '';

    const overlay = document.createElement('div');
    overlay.id = 'editUsernameOverlay';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(60,20,5,0.55);
      display:flex;align-items:center;justify-content:center;
      z-index:99999;backdrop-filter:blur(6px);
    `;

    overlay.innerHTML = `
      <div style="background:#fdf5ec;border-radius:24px;padding:32px 28px;max-width:340px;width:90%;text-align:center;border:1px solid #e0c8b0;box-shadow:0 20px 60px rgba(100,50,10,0.2);">
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:1.4rem;color:#5c3317;margin-bottom:6px;">change your name 🌼</div>
        <div style="font-family:'Caveat',cursive;font-size:1rem;color:#b07858;margin-bottom:20px;">what would you like to go by?</div>
        <input id="editUsernameInput" value="${current}" placeholder="your name, nickname, anything..."
          style="width:100%;padding:12px 16px;border-radius:14px;border:1.5px solid #e0c8b0;font-family:'DM Sans',sans-serif;font-size:0.95rem;color:#3d2010;background:rgba(255,255,255,0.85);box-sizing:border-box;margin-bottom:8px;">
        <div style="font-size:0.75rem;color:#b07858;font-family:'DM Sans',sans-serif;margin-bottom:16px;">letters, numbers, underscores only</div>
        <div style="display:flex;gap:10px;">
          <button onclick="updateUsername('${user.uid}')" style="flex:1;padding:11px;">save ✨</button>
          <button onclick="document.getElementById('editUsernameOverlay').remove()" style="flex:1;padding:11px;background:rgba(255,255,255,0.8);color:#7a4a2a;border:1.5px solid #e0c8b0;">cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => {
      const input = document.getElementById('editUsernameInput');
      if (input) { input.focus(); input.select(); }
    }, 100);
  });
}

function updateUsername(uid) {
  const input = document.getElementById('editUsernameInput');
  const raw   = input ? input.value.trim() : '';
  const username = raw.replace(/[^a-zA-Z0-9_.]/g, '');

  if (!username) {
    input.style.borderColor = '#c8855c';
    input.placeholder = 'please enter something 🌼';
    return;
  }

  db.collection('users').doc(uid).set({ username }, { merge: true }).then(() => {
    document.getElementById('editUsernameOverlay')?.remove();
    renderProfileBox(username);

    const notice = document.createElement('div');
    notice.style.cssText = `
      position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
      background:#fdf5ec;border:1px solid #e0c8b0;border-radius:24px;
      padding:10px 24px;font-family:'Caveat',cursive;font-size:1.1rem;
      color:#5c3317;box-shadow:0 6px 20px rgba(100,50,10,0.15);
      z-index:99999;animation:fadeInPage 0.3s ease;
    `;
    notice.textContent = `you're now @${username} 🌼`;
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 3000);
  });
}

// ==========================
// MUSIC PLAYER (hide when empty)
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  const player = document.getElementById('musicPlayer');
  if (player) player.style.display = 'none';
});

function showMusicPlayer(title, imgSrc) {
  const player = document.getElementById('musicPlayer');
  if (!player) return;
  document.getElementById('playerTitle').textContent = title || 'Now playing';
  document.getElementById('playerImg').src = imgSrc || '';
  player.style.display = 'flex';
}