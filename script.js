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
    if (!username) { showUsernamePrompt(user); return; }
    renderProfileBox(username);
  });
}

function renderProfileBox(username) {
  const profileBox  = document.getElementById('profileBox');
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
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(60,20,5,0.55);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(6px);`;
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
  const input    = document.getElementById('usernameInput');
  const raw      = input ? input.value.trim() : '';
  const username = raw.replace(/[^a-zA-Z0-9_.]/g, '') || 'solite_friend';
  db.collection('users').doc(uid).set({ username, usernameLower: username.toLowerCase() }, { merge: true }).then(() => {
    document.getElementById('usernameOverlay')?.remove();
    renderProfileBox(username);
  });
}

function skipUsername(uid) {
  const username = 'solite_friend';
  db.collection('users').doc(uid).set({ username, usernameLower: username.toLowerCase() }, { merge: true }).then(() => {
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
    background:linear-gradient(135deg,#c8855c,#a05530);
    color:white;font-size:28px;line-height:52px;
    text-align:center;cursor:pointer;z-index:9999;
    box-shadow:0 6px 20px rgba(160,85,48,0.35);
    transition:transform 0.2s;user-select:none;
  `;
  fab.onmouseenter = () => fab.style.transform = 'scale(1.1)';
  fab.onmouseleave = () => fab.style.transform = 'scale(1)';
  fab.onclick      = toggleFabMenu;
  document.body.appendChild(fab);

  const menu = document.createElement('div');
  menu.id = 'fabMenu';
  menu.style.cssText = `position:fixed;bottom:152px;right:18px;display:none;flex-direction:column;gap:10px;z-index:9998;align-items:flex-end;`;
  menu.innerHTML = `
    <a href="stories.html" style="${fabItemStyle()}">📖 write a story</a>
    <a href="cafes.html"   style="${fabItemStyle()}">☕ add a café</a>
    <a href="music.html"   style="${fabItemStyle()}">🎧 share a song</a>
    <span onclick="scrollToPost()" style="${fabItemStyle()}cursor:pointer;">💬 yap something</span>
    <span onclick="showAddFriend()" style="${fabItemStyle()}cursor:pointer;">🤍 find someone</span>
  `;
  document.body.appendChild(menu);
}

function fabItemStyle() {
  return `background:rgba(255,255,255,0.95);color:#5c3317;padding:8px 16px;border-radius:24px;font-size:0.88rem;box-shadow:0 4px 14px rgba(160,85,48,0.15);text-decoration:none;white-space:nowrap;font-family:'DM Sans',sans-serif;`;
}

function toggleFabMenu() {
  const menu = document.getElementById('fabMenu');
  const fab  = document.getElementById('fabBtn');
  const open = menu.style.display === 'flex';
  menu.style.display  = open ? 'none' : 'flex';
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
  const username = userDoc.exists ? (userDoc.data().username || 'anonymous') : 'anonymous';

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
// FEED SWITCHING
// ==========================
let currentFeed  = 'everyone';
let feedListener = null;

function switchFeed(type) {
  currentFeed = type;
  document.getElementById('tabEveryone')?.classList.toggle('active', type === 'everyone');
  document.getElementById('tabFollowing')?.classList.toggle('active', type === 'following');
  if (feedListener) { feedListener(); feedListener = null; }
  if (type === 'everyone') { loadPosts(); } else { loadFollowingFeed(); }
}

// ==========================
// LOAD POSTS (everyone)
// ==========================
function loadPosts() {
  if (feedListener) { feedListener(); feedListener = null; }

  feedListener = db.collection('posts')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const container = document.getElementById('postsContainer');
      container.innerHTML = '';

      if (snapshot.empty) {
        container.innerHTML = `<div style="text-align:center;font-family:'Caveat',cursive;color:#b07858;font-size:1.2rem;padding:30px;">no posts yet 🌸<br><span style="font-size:0.9rem;">be the first to yap something</span></div>`;
        return;
      }

      snapshot.forEach(doc => renderPost(doc, container));
    });
}

// ==========================
// LOAD FOLLOWING FEED
// ==========================
async function loadFollowingFeed() {
  const user = auth.currentUser;
  if (!user) return;

  const container = document.getElementById('postsContainer');
  container.innerHTML = `<div style="text-align:center;font-family:'Caveat',cursive;color:#b07858;font-size:1.1rem;padding:20px;">loading... 🌼</div>`;

  const followingSnap = await db.collection('users').doc(user.uid).collection('following').get();

  if (followingSnap.empty) {
    container.innerHTML = `<div style="text-align:center;font-family:'Caveat',cursive;color:#b07858;font-size:1.2rem;padding:30px;">you're not following anyone yet 🌸<br><span style="font-size:0.9rem;">follow people to see their posts here</span></div>`;
    return;
  }

  const followingUids = followingSnap.docs.map(d => d.id);

  if (feedListener) { feedListener(); feedListener = null; }

  feedListener = db.collection('posts')
    .where('uid', 'in', followingUids.slice(0, 10))
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      container.innerHTML = '';
      if (snapshot.empty) {
        container.innerHTML = `<div style="text-align:center;font-family:'Caveat',cursive;color:#b07858;font-size:1.2rem;padding:30px;">none of your people have posted yet 🌸<br><span style="font-size:0.9rem;">check back soon</span></div>`;
        return;
      }
      snapshot.forEach(doc => renderPost(doc, container));
    });
}

// ==========================
// RENDER A SINGLE POST
// ==========================
function renderPost(doc, container) {
  const post  = doc.data();
  const id    = doc.id;
  const user  = auth.currentUser;
  const liked = user && post.likes && post.likes.includes(user.uid);

  const card = document.createElement('div');
  card.className = 'post-card';
  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <a href="profile.html?uid=${post.uid}" style="font-family:'Caveat',cursive;font-size:1.1rem;color:#5c3317;text-decoration:none;">@${post.username || 'anonymous'}</a>
      <span style="font-size:0.75rem;color:#c8a888;font-family:'DM Sans',sans-serif;">${post.type || ''}</span>
    </div>
    <p style="color:#3d2010;font-size:0.92rem;line-height:1.65;">${post.text}</p>
    ${post.imageUrl ? `<img src="${post.imageUrl}" style="width:100%;border-radius:12px;margin-top:8px;">` : ''}
    ${post.extra && post.type && post.type.includes('Song') ? `<div class="music-card"><p>🎧 ${post.extra}</p></div>` : ''}
    <div class="post-actions" style="margin-top:10px;">
      <button class="like-btn ${liked ? 'liked' : ''}" onclick="toggleLike('${id}', ${liked})">
        ${liked ? '❤️' : '🤍'} <span id="likeCount-${id}">${post.likes ? post.likes.length : 0}</span>
      </button>
      <button onclick="toggleComments('${id}')">💬 comments</button>
      ${user && user.uid !== post.uid ? `<button onclick="followUser('${post.uid}')" style="font-size:0.8rem;padding:5px 12px;">+ follow</button>` : ''}
    </div>
    <div id="commentBox-${id}" style="display:none;margin-top:10px;">
      <div id="comments-${id}"></div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <input id="commentInput-${id}" placeholder="say something..." style="flex:1;padding:7px 10px;border-radius:10px;border:1.5px solid #e0c8b0;font-family:'DM Sans',sans-serif;background:rgba(255,255,255,0.85);color:#3d2010;">
        <button onclick="addComment('${id}')">send</button>
      </div>
    </div>
  `;
  container.appendChild(card);
  loadComments(id);
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
        const c   = doc.data();
        const div = document.createElement('div');
        div.className   = 'comment';
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
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(60,20,5,0.55);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(6px);`;
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
    setTimeout(() => { const i = document.getElementById('editUsernameInput'); if (i) { i.focus(); i.select(); } }, 100);
  });
}

function updateUsername(uid) {
  const input    = document.getElementById('editUsernameInput');
  const raw      = input ? input.value.trim() : '';
  const username = raw.replace(/[^a-zA-Z0-9_.]/g, '');
  if (!username) { input.style.borderColor = '#c8855c'; input.placeholder = 'please enter something 🌼'; return; }

  db.collection('users').doc(uid).set({ username, usernameLower: username.toLowerCase() }, { merge: true }).then(() => {
    document.getElementById('editUsernameOverlay')?.remove();
    renderProfileBox(username);
    const notice = document.createElement('div');
    notice.style.cssText = `position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#fdf5ec;border:1px solid #e0c8b0;border-radius:24px;padding:10px 24px;font-family:'Caveat',cursive;font-size:1.1rem;color:#5c3317;box-shadow:0 6px 20px rgba(100,50,10,0.15);z-index:99999;`;
    notice.textContent = `you're now @${username} 🌼`;
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 3000);
  });
}

// ==========================
// MUSIC PLAYER
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

// ==========================
// INVITE SYSTEM
// ==========================
function showInviteLink() {
  const user = auth.currentUser;
  if (!user) return;
  const link = `https://kalpanajoycedovari.github.io/My-Website/invite.html?ref=${user.uid}`;
  if (document.getElementById('inviteOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'inviteOverlay';
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(60,20,5,0.55);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(6px);`;
  overlay.innerHTML = `
    <div style="background:#fdf5ec;border-radius:24px;padding:32px 28px;max-width:380px;width:90%;text-align:center;border:1px solid #e0c8b0;box-shadow:0 20px 60px rgba(100,50,10,0.2);">
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:1.4rem;color:#5c3317;margin-bottom:6px;">invite someone 🌼</div>
      <div style="font-family:'Caveat',cursive;font-size:1rem;color:#b07858;margin-bottom:20px;">share this link with someone who gets the vibe</div>
      <div style="background:rgba(255,255,255,0.85);border:1.5px solid #e0c8b0;border-radius:14px;padding:12px 16px;font-family:'DM Sans',sans-serif;font-size:0.78rem;color:#7a4a2a;word-break:break-all;margin-bottom:16px;text-align:left;">${link}</div>
      <div style="display:flex;gap:10px;">
        <button onclick="copyInviteLink('${link}')" id="copyInviteBtn" style="flex:1;padding:11px;">copy link ✨</button>
        <button onclick="document.getElementById('inviteOverlay').remove()" style="flex:1;padding:11px;background:rgba(255,255,255,0.8);color:#7a4a2a;border:1.5px solid #e0c8b0;">close</button>
      </div>
      <div id="copiedMsg" style="font-family:'Caveat',cursive;font-size:1rem;color:#c8855c;margin-top:10px;display:none;">copied! now share it 🌸</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function copyInviteLink(link) {
  navigator.clipboard.writeText(link).then(() => {
    document.getElementById('copiedMsg').style.display = 'block';
    document.getElementById('copyInviteBtn').textContent = 'copied ✓';
  });
}

// ==========================
// FRIENDS SYSTEM
// ==========================
function showAddFriend() {
  if (document.getElementById('addFriendOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'addFriendOverlay';
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(60,20,5,0.55);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(6px);`;
  overlay.innerHTML = `
    <div style="background:#fdf5ec;border-radius:24px;padding:28px;max-width:360px;width:90%;border:1px solid #e0c8b0;box-shadow:0 20px 60px rgba(100,50,10,0.2);">
      <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:1.4rem;color:#5c3317;margin-bottom:4px;text-align:center;">find someone 🌼</div>
      <div style="font-family:'Caveat',cursive;font-size:1rem;color:#b07858;margin-bottom:16px;text-align:center;">search by username</div>
      <input id="friendSearchInput" placeholder="@username..."
        style="width:100%;padding:11px 16px;border-radius:14px;border:1.5px solid #e0c8b0;font-family:'DM Sans',sans-serif;font-size:0.9rem;color:#3d2010;background:rgba(255,255,255,0.85);box-sizing:border-box;margin-bottom:10px;"
        oninput="searchFriends(this.value)">
      <div id="friendResults" style="margin-bottom:12px;"></div>
      <button onclick="document.getElementById('addFriendOverlay').remove()" style="width:100%;padding:10px;background:rgba(255,255,255,0.8);color:#7a4a2a;border:1.5px solid #e0c8b0;">close</button>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('friendSearchInput')?.focus(), 100);
}

async function searchFriends(query) {
  const results = document.getElementById('friendResults');
  results.innerHTML = '';
  if (!query || query.replace('@','').length < 2) return;

  const clean = query.replace('@', '').toLowerCase();
  const user  = auth.currentUser;

  const snap = await db.collection('users')
    .where('usernameLower', '>=', clean)
    .where('usernameLower', '<=', clean + '\uf8ff')
    .limit(8).get();

  if (snap.empty) {
    results.innerHTML = `<div style="font-family:'Caveat',cursive;color:#b07858;font-size:1rem;padding:8px;text-align:center;">no one found 🌸</div>`;
    return;
  }

  for (const doc of snap.docs) {
    if (doc.id === user.uid) continue;

    const username = doc.data().username || 'solite member';
    const isFriend = (await db.collection('users').doc(user.uid)
      .collection('friends').doc(doc.id).get()).exists;

    const div = document.createElement('div');
    div.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,0.7);border:1px solid #f0dfd0;`;
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#c8855c,#a05530);display:flex;align-items:center;justify-content:center;color:white;font-family:'Caveat',cursive;font-size:1.1rem;">
          ${username.charAt(0).toUpperCase()}
        </div>
        <a href="profile.html?uid=${doc.id}" style="font-family:'Caveat',cursive;font-size:1.1rem;color:#5c3317;text-decoration:none;">@${username}</a>
      </div>
      <button id="addBtn-${doc.id}" onclick="addFriend('${doc.id}', '${username}')"
        style="font-size:0.8rem;padding:6px 14px;${isFriend ? 'background:rgba(255,255,255,0.8);color:#7a4a2a;border:1.5px solid #e0c8b0;' : ''}">
        ${isFriend ? 'friends ✓' : '+ add friend'}
      </button>
    `;
    results.appendChild(div);
  }
}

async function addFriend(targetUid, targetUsername) {
  const user = auth.currentUser;
  if (!user) return;

  const btn = document.getElementById(`addBtn-${targetUid}`);
  if (btn) { btn.textContent = 'adding...'; btn.disabled = true; }

  const myDoc      = await db.collection('users').doc(user.uid).get();
  const myUsername = myDoc.exists ? (myDoc.data().username || 'someone') : 'someone';

  await Promise.all([
    db.collection('users').doc(user.uid).collection('friends').doc(targetUid).set({
      uid: targetUid, username: targetUsername,
      addedAt: firebase.firestore.FieldValue.serverTimestamp()
    }),
    db.collection('users').doc(targetUid).collection('friends').doc(user.uid).set({
      uid: user.uid, username: myUsername,
      addedAt: firebase.firestore.FieldValue.serverTimestamp()
    }),
    db.collection('users').doc(user.uid).collection('following').doc(targetUid).set({ uid: targetUid }),
    db.collection('users').doc(targetUid).collection('following').doc(user.uid).set({ uid: user.uid }),
    db.collection('users').doc(targetUid).collection('notifications').add({
      text: `@${myUsername} added you as a friend 🌼`,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
  ]);

  if (btn) {
    btn.textContent      = 'friends ✓';
    btn.disabled         = false;
    btn.style.background = 'rgba(255,255,255,0.8)';
    btn.style.color      = '#7a4a2a';
    btn.style.border     = '1.5px solid #e0c8b0';
  }

  showToast(`you and @${targetUsername} are now friends 🌼`);
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#fdf5ec;border:1px solid #e0c8b0;border-radius:24px;padding:10px 24px;font-family:'Caveat',cursive;font-size:1.1rem;color:#5c3317;box-shadow:0 6px 20px rgba(100,50,10,0.15);z-index:99999;white-space:nowrap;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}