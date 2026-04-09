const db   = firebase.firestore();
const auth = firebase.auth();

// ==========================
// MENU PANEL TOGGLE
// ==========================
function toggleMenuPanel() {
  const panel = document.getElementById('menuPanel');
  if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', e => {
  const panel = document.getElementById('menuPanel');
  const btn   = document.querySelector('.menu-icon-btn');
  if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
    panel.style.display = 'none';
  }
});

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
let currentUserId = null;

auth.onAuthStateChanged(user => {
  if (user) {
    currentUserId = user.uid;
    loadUserProfile(user);
    loadPosts();
    injectFloatingBtn();
    watchNotifBadge(user);
  } else {
    currentUserId = null;
    window.location.href = 'login.html';
  }
});

// ==========================
// USER PROFILE
// ==========================
function loadUserProfile(user) {
  db.collection('users').doc(user.uid).get().then(doc => {
    const data      = doc.exists ? doc.data() : {};
    const username  = data.username  || null;
    const onboarded = data.onboarded || false;
    if (!onboarded) {
      showOnboarding(user, username);
    } else {
      renderProfileBox(username);
      loadCountry();
    }
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
    <a href="books.html" style="${fabItemStyle()}">📖 write a story</a>
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
// CREATE POST (YAP)
// ==========================
async function createPost() {
  const user  = auth.currentUser;
  if (!user) return;

  const text   = document.getElementById('postInput').value.trim();
  const type   = document.getElementById('postType').value;
  const extra  = document.getElementById('extraInput').value.trim();
  const lyrics = document.getElementById('lyricsInput')?.value.trim() || '';
  const errEl  = document.getElementById('yapError');

  if (errEl) errEl.style.display = 'none';

  if (!text) {
    if (errEl) { errEl.textContent = 'write something first 🌸'; errEl.style.display = 'block'; }
    return;
  }

  const btn = document.querySelector('.create-post button[onclick="createPost()"]');
  if (btn) { btn.textContent = 'posting...'; btn.disabled = true; }

  try {
    let imageUrl = '';
    const file = document.getElementById('imageInput').files[0];
    if (file) {
      const ref = firebase.storage().ref().child('posts/' + Date.now() + '_' + file.name);
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
    document.getElementById('imageInput').value = '';
    if (document.getElementById('lyricsInput'))
      document.getElementById('lyricsInput').value = '';

    if (btn) { btn.textContent = 'Yap! ✨'; btn.disabled = false; }

  } catch(err) {
    console.error('Yap error:', err);
    if (errEl) { errEl.textContent = 'something went wrong 🌸 try again'; errEl.style.display = 'block'; }
    if (btn) { btn.textContent = 'Yap! ✨'; btn.disabled = false; }
  }
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
        container.innerHTML = `<div style="text-align:center;font-family:'Caveat',cursive;color:#b07858;font-size:1.2rem;padding:30px;">no yaps yet 🌸<br><span style="font-size:0.9rem;">be the first to yap something</span></div>`;
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
    container.innerHTML = `<div style="text-align:center;font-family:'Caveat',cursive;color:#b07858;font-size:1.2rem;padding:30px;">you're not following anyone yet 🌸<br><span style="font-size:0.9rem;">add friends to see their yaps here</span></div>`;
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
        container.innerHTML = `<div style="text-align:center;font-family:'Caveat',cursive;color:#b07858;font-size:1.2rem;padding:30px;">none of your people have yapped yet 🌸<br><span style="font-size:0.9rem;">check back soon</span></div>`;
        return;
      }
      snapshot.forEach(doc => renderPost(doc, container));
    });
}

// ==========================
// SEEDED CARD GRADIENTS
// ==========================
const CATEGORY_GRADIENTS = {
  gloomy:    { bg: 'linear-gradient(135deg,#2d2438,#3d2e4a)', emoji: '🌙' },
  soft:      { bg: 'linear-gradient(135deg,#f5e8d8,#e8d0b8)', emoji: '☕' },
  nostalgic: { bg: 'linear-gradient(135deg,#d8c4a8,#c4a888)', emoji: '📷' }
};

// ==========================
// RENDER A SINGLE POST
// ==========================
function renderPost(doc, container) {
  const post   = doc.data();
  const id     = doc.id;
  const isOwn  = currentUserId && currentUserId === post.uid;
  const seeded = post.isSeeded === true;

  const card = document.createElement('div');
  card.className = 'post-card';
  card.id = `postCard-${id}`;
  if (post.category) card.dataset.category = post.category;

  const gradient = seeded && post.category ? CATEGORY_GRADIENTS[post.category] : null;
  if (gradient) {
    card.style.background = gradient.bg;
    card.style.border = '0.5px solid rgba(180,120,70,0.2)';
  }

  const headerHtml = gradient ? `<div style="font-size:1.6rem;margin-bottom:8px;">${gradient.emoji}</div>` : '';
  const extraLabel = seeded && post.extra ? `<div data-extra-label="true" style="font-family:'Playfair Display',serif;font-style:italic;font-size:0.95rem;color:${gradient && post.category === 'gloomy' ? '#c8a8e8' : '#5c3317'};margin-bottom:6px;">${post.extra}</div>` : '';
  const btnColor   = gradient ? (post.category === 'gloomy' ? '#d4b8e8' : '#5c3317') : '#c8a888';
  const textColor  = gradient && post.category === 'gloomy' ? '#f0e8f8' : '#3d2010';
  const userColor  = gradient && post.category === 'gloomy' ? '#e8d0f8' : '#5c3317';

  card.innerHTML = `
    ${headerHtml}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <a href="profile.html?uid=${post.uid}" style="font-family:'Caveat',cursive;font-size:1.1rem;color:${userColor};text-decoration:none;">@${post.username || 'anonymous'}</a>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:0.75rem;color:${btnColor};font-family:'DM Sans',sans-serif;">${post.type || ''}</span>
        ${isOwn
          ? `<button onclick="startEditPost('${id}')" style="background:none;border:none;color:${btnColor};font-size:0.82rem;padding:2px 4px;cursor:pointer;box-shadow:none;" title="edit">✏️</button>
             <button onclick="deletePost('${id}')" style="background:none;border:none;color:${btnColor};font-size:0.82rem;padding:2px 4px;cursor:pointer;box-shadow:none;" title="delete">✕</button>`
          : `<div style="position:relative;display:inline-block;">
               <button onclick="togglePostMenu('${id}')" style="background:none;border:none;color:${btnColor};font-size:1.1rem;padding:2px 6px;cursor:pointer;box-shadow:none;line-height:1;" title="more">⋯</button>
               <div id="postMenu-${id}" style="display:none;position:absolute;right:0;top:24px;background:rgba(255,252,248,0.98);border-radius:14px;box-shadow:0 8px 24px rgba(120,70,30,0.14);border:1px solid rgba(210,175,140,0.4);min-width:150px;z-index:999;overflow:hidden;">
                 <div onclick="muteFromPost('${post.uid}','${post.username || 'anonymous'}','${id}')" style="padding:10px 16px;font-size:0.85rem;color:#7a4a2a;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;" onmouseover="this.style.background='#fdf0e6'" onmouseout="this.style.background=''">🔇 mute @${post.username || 'anonymous'}</div>
                 <div onclick="blockFromPost('${post.uid}','${post.username || 'anonymous'}','${id}')" style="padding:10px 16px;font-size:0.85rem;color:#c07060;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;border-top:1px solid #f5ede0;" onmouseover="this.style.background='#fff0ec'" onmouseout="this.style.background=''">🚫 block @${post.username || 'anonymous'}</div>
                 <div onclick="reportFromPost('${post.uid}','${post.username || 'anonymous'}','${id}')" style="padding:10px 16px;font-size:0.85rem;color:#c07060;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;border-top:1px solid #f5ede0;" onmouseover="this.style.background='#fff0ec'" onmouseout="this.style.background=''">⚑ report</div>
               </div>
             </div>`
        }
      </div>
    </div>
    ${extraLabel}
    <p id="postText-${id}" style="color:${textColor};font-size:0.92rem;line-height:1.65;">${post.text}</p>
    ${post.imageUrl ? `<img src="${post.imageUrl}" style="width:100%;border-radius:12px;margin-top:8px;">` : ''}
    ${post.lyrics ? `<div style="font-family:'Caveat',cursive;font-size:0.95rem;color:${gradient && post.category === 'gloomy' ? '#c8a8e8' : '#c8855c'};margin-top:6px;font-style:italic;">"${post.lyrics}"</div>` : ''}
    <div id="reactions-${id}" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:12px;"></div>
    <div class="post-actions" style="margin-top:10px;">
      <button onclick="toggleComments('${id}')">💬 comments</button>
      <button onclick="toggleSave('${id}')" id="saveBtn-${id}" style="background:none;border:none;color:#c8a888;box-shadow:none;font-size:0.85rem;padding:5px 8px;">🔖</button>
      ${!isOwn ? `<button onclick="followUser('${post.uid}')" style="font-size:0.8rem;padding:5px 12px;">+ follow</button>` : ''}
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
  loadReactions(id, post.uid, post.username || 'anonymous');
  applyBlockMuteToCard(card, post.uid);
  checkSaved(id);

  // make card clickable to open post detail
  card.style.cursor = 'pointer';
  card.addEventListener('click', e => {
    if (!e.target.closest('button') && !e.target.closest('input') && !e.target.closest('a') && !e.target.closest('[id^="postMenu"]')) {
      window.location.href = `post.html?id=${id}`;
    }
  });
}

// ==========================
// INLINE EDIT POST
// ==========================
function startEditPost(id) {
  const textEl  = document.getElementById(`postText-${id}`);
  const card    = document.getElementById(`postCard-${id}`);
  if (!textEl || !card) return;

  const extraEl = card.querySelector('[data-extra-label]');
  const currentText  = textEl.textContent;
  const currentExtra = extraEl ? extraEl.textContent : '';

  textEl.style.display = 'none';
  if (extraEl) extraEl.style.display = 'none';

  const wrapper = document.createElement('div');
  wrapper.id = `editWrapper-${id}`;

  const titleHtml = extraEl ? `
    <input id="editTitle-${id}" value="${currentExtra}"
      placeholder="title..."
      style="width:100%;padding:7px 12px;border-radius:10px;border:1.5px solid #c8855c;font-family:'Playfair Display',serif;font-style:italic;font-size:0.95rem;color:#5c3317;background:rgba(255,255,255,0.9);box-sizing:border-box;margin-bottom:6px;">
  ` : '';

  const textarea = document.createElement('div');
  textarea.innerHTML = `
    ${titleHtml}
    <textarea id="editBody-${id}" style="width:100%;padding:8px 12px;border-radius:10px;border:1.5px solid #c8855c;font-family:'DM Sans',sans-serif;font-size:0.92rem;color:#3d2010;background:rgba(255,255,255,0.9);resize:vertical;min-height:70px;box-sizing:border-box;">${currentText}</textarea>
  `;

  const btnRow = document.createElement('div');
  btnRow.style.cssText = `display:flex;gap:8px;margin-top:8px;`;

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'save ✨';
  saveBtn.style.cssText = `padding:6px 16px;font-size:0.82rem;`;
  saveBtn.onclick = async () => {
    const newText  = document.getElementById(`editBody-${id}`)?.value.trim();
    const newExtra = document.getElementById(`editTitle-${id}`)?.value.trim();
    if (!newText) return;

    const updates = { text: newText };
    if (newExtra !== undefined) updates.extra = newExtra;

    await db.collection('posts').doc(id).update(updates);

    textEl.textContent   = newText;
    textEl.style.display = '';
    if (extraEl && newExtra !== undefined) {
      extraEl.textContent  = newExtra;
      extraEl.style.display = '';
    }
    wrapper.remove();
    showToast('yap updated 🌼');
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'cancel';
  cancelBtn.style.cssText = `padding:6px 16px;font-size:0.82rem;background:rgba(255,255,255,0.8);color:#7a4a2a;border:1.5px solid #e0c8b0;`;
  cancelBtn.onclick = () => {
    textEl.style.display = '';
    if (extraEl) extraEl.style.display = '';
    wrapper.remove();
  };

  btnRow.appendChild(saveBtn);
  btnRow.appendChild(cancelBtn);
  wrapper.appendChild(textarea);
  wrapper.appendChild(btnRow);
  textEl.parentNode.insertBefore(wrapper, textEl.nextSibling);
  document.getElementById(`editBody-${id}`)?.focus();
}

// ==========================
// SOFT REACTIONS
// ==========================
const REACTIONS = ['🌸','🤍','✨','☕','🌙'];

function loadReactions(postId, postAuthorUid, postAuthorUsername) {
  const user = auth.currentUser;
  if (!user) return;

  db.collection('posts').doc(postId).collection('reactions').onSnapshot(snap => {
    const container = document.getElementById(`reactions-${postId}`);
    if (!container) return;

    const counts = {};
    let myReaction = null;
    snap.forEach(d => {
      const r = d.data().emoji;
      counts[r] = (counts[r] || 0) + 1;
      if (d.id === user.uid) myReaction = r;
    });

    container.innerHTML = '';
    REACTIONS.forEach(emoji => {
      const count    = counts[emoji] || 0;
      const isPicked = myReaction === emoji;
      const btn = document.createElement('button');
      btn.style.cssText = `
        background:${isPicked ? 'rgba(200,133,92,0.15)' : 'rgba(255,255,255,0.7)'};
        border:1.5px solid ${isPicked ? '#c8855c' : '#f0dfd0'};
        border-radius:24px;padding:3px 8px;font-size:0.75rem;
        cursor:pointer;display:inline-flex;align-items:center;gap:4px;
        font-family:'DM Sans',sans-serif;color:${isPicked ? '#7a4a2a' : '#c8a888'};
        transition:0.15s;box-shadow:none;
      `;
      btn.innerHTML = `${emoji}${count > 0 ? `<span style="font-size:0.75rem;">${count}</span>` : ''}`;
      btn.onclick = () => toggleReaction(postId, emoji, myReaction, postAuthorUid, postAuthorUsername);
      container.appendChild(btn);
    });
  });
}

async function toggleReaction(postId, emoji, currentReaction, postAuthorUid, postAuthorUsername) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = db.collection('posts').doc(postId).collection('reactions').doc(user.uid);
  if (currentReaction === emoji) { await ref.delete(); return; }
  const myDoc      = await db.collection('users').doc(user.uid).get();
  const myUsername = myDoc.exists ? (myDoc.data().username || 'someone') : 'someone';
  await ref.set({ emoji, uid: user.uid, username: myUsername, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  if (user.uid !== postAuthorUid) {
    await db.collection('users').doc(postAuthorUid).collection('notifications').add({
      text: `@${myUsername} reacted ${emoji} to your yap 🌸`,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
}

// ==========================
// DELETE POST
// ==========================
function deletePost(id) {
  const user = auth.currentUser;
  if (!user) return;
  if (!confirm('delete this yap? 🌸')) return;
  db.collection('posts').doc(id).delete().then(() => {
    document.getElementById(`postCard-${id}`)?.remove();
  }).catch(err => console.error('Delete error:', err));
}

// ==========================
// DELETE COMMENT
// ==========================
function deleteComment(postId, commentId) {
  const user = auth.currentUser;
  if (!user) return;
  db.collection('posts').doc(postId).collection('comments').doc(commentId).delete()
    .catch(err => console.error('Delete comment error:', err));
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
        const c     = doc.data();
        const isOwn = currentUserId && currentUserId === c.uid;
        const div   = document.createElement('div');
        div.className = 'comment';
        div.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px;';
        div.innerHTML = `
          <span style="flex:1;">${c.text}</span>
          ${isOwn ? `<button onclick="deleteComment('${postId}','${doc.id}')" style="background:none;border:none;color:#c8a888;font-size:0.75rem;cursor:pointer;box-shadow:none;padding:0;flex-shrink:0;" title="delete">✕</button>` : ''}
        `;
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

  const randomBtn = document.getElementById('randomBtn');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      const cards = document.querySelectorAll('.post-card');
      if (!cards.length) return;
      const r = cards[Math.floor(Math.random() * cards.length)];
      r.scrollIntoView({ behavior: 'smooth' });
    });
  }
});

function quickFilter(filter) {
  document.querySelectorAll('.mood-chip').forEach(b =>
    b.classList.toggle('active', b.textContent.toLowerCase().includes(filter) || filter === 'all')
  );
  document.querySelectorAll('.card[data-category], .post-card[data-category]').forEach(card => {
    card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
  });
  toggleMenuPanel();
}

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
  const link = `https://kalpanajoycedovari.github.io/My-Website/landing.html?ref=${user.uid}`;
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
      <input id="friendSearchInput" placeholder="type a username..."
        style="width:100%;padding:11px 16px;border-radius:14px;border:1.5px solid #e0c8b0;font-family:'DM Sans',sans-serif;font-size:0.9rem;color:#3d2010;background:rgba(255,255,255,0.85);box-sizing:border-box;margin-bottom:10px;"
        oninput="searchFriends(this.value)">
      <div id="friendResults" style="margin-bottom:12px;max-height:200px;overflow-y:auto;"></div>
      <button onclick="document.getElementById('addFriendOverlay').remove()" style="width:100%;padding:10px;background:rgba(255,255,255,0.8);color:#7a4a2a;border:1.5px solid #e0c8b0;">close</button>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('friendSearchInput')?.focus(), 100);
}

async function searchFriends(query) {
  const results = document.getElementById('friendResults');
  if (!results) return;
  results.innerHTML = '';

  const clean = query.replace('@', '').trim().toLowerCase();
  if (clean.length < 1) return;

  const user = auth.currentUser;
  if (!user) return;

  try {
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
      const data     = doc.data();
      const username = data.username || 'solite member';
      const isFriend = (await db.collection('users').doc(user.uid).collection('friends').doc(doc.id).get()).exists;
      const div = document.createElement('div');
      div.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,0.7);border:1px solid #f0dfd0;`;
      div.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#c8855c,#a05530);display:flex;align-items:center;justify-content:center;color:white;font-family:'Caveat',cursive;font-size:1.1rem;flex-shrink:0;">${username.charAt(0).toUpperCase()}</div>
          <span style="font-family:'Caveat',cursive;font-size:1.1rem;color:#5c3317;">@${username}</span>
        </div>
        <button id="addBtn-${doc.id}" onclick="addFriend('${doc.id}', '${username}')"
          style="font-size:0.8rem;padding:6px 14px;flex-shrink:0;${isFriend ? 'background:rgba(255,255,255,0.8);color:#7a4a2a;border:1.5px solid #e0c8b0;' : ''}">
          ${isFriend ? 'friends ✓' : '+ add friend'}
        </button>
      `;
      results.appendChild(div);
    }
  } catch(e) {
    results.innerHTML = `<div style="font-family:'Caveat',cursive;color:#b07858;font-size:1rem;padding:8px;text-align:center;">something went wrong 🌸</div>`;
    console.error('Search error:', e);
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
    db.collection('users').doc(user.uid).collection('friends').doc(targetUid).set({ uid: targetUid, username: targetUsername, addedAt: firebase.firestore.FieldValue.serverTimestamp() }),
    db.collection('users').doc(targetUid).collection('friends').doc(user.uid).set({ uid: user.uid, username: myUsername, addedAt: firebase.firestore.FieldValue.serverTimestamp() }),
    db.collection('users').doc(user.uid).collection('following').doc(targetUid).set({ uid: targetUid }),
    db.collection('users').doc(targetUid).collection('following').doc(user.uid).set({ uid: user.uid }),
    db.collection('users').doc(targetUid).collection('notifications').add({ text: `@${myUsername} added you as a friend 🌼`, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
  ]);

  if (btn) {
    btn.textContent = 'friends ✓'; btn.disabled = false;
    btn.style.background = 'rgba(255,255,255,0.8)'; btn.style.color = '#7a4a2a'; btn.style.border = '1.5px solid #e0c8b0';
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

function quickSearch(term) {
  const input = document.getElementById('searchInput');
  if (input) { input.value = term; input.dispatchEvent(new Event('input')); }
}

// ==========================
// NOTIFICATION BADGE
// ==========================
// NOTIFICATION BADGE + TOAST
// ==========================
let _lastNotifCount = null;

function watchNotifBadge(user) {
  db.collection('users').doc(user.uid).collection('notifications')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      // badge count
      const unread = snap.docs.filter(d => d.data().read !== true).length;
      const link = document.querySelector('a[href="notifications.html"]');
      if (link) {
        const existing = link.querySelector('.notif-badge');
        if (existing) existing.remove();
        if (unread > 0) {
          const badge = document.createElement('span');
          badge.className = 'notif-badge';
          badge.textContent = unread;
          badge.style.cssText = `background:#c8855c;color:white;border-radius:50%;font-size:0.65rem;padding:1px 5px;margin-left:4px;font-family:'DM Sans',sans-serif;`;
          link.appendChild(badge);
        }
      }

      // toast — only fire for genuinely new notifications
      if (_lastNotifCount === null) {
        _lastNotifCount = snap.docs.length;
        return;
      }

      if (snap.docs.length > _lastNotifCount) {
        const newest = snap.docs[0]?.data();
        if (newest && newest.read !== true) {
          showNotifToast(newest.text || 'new notification 🌸');
        }
      }
      _lastNotifCount = snap.docs.length;
    });
}

function showNotifToast(message) {
  // remove any existing toast
  document.getElementById('notifToast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'notifToast';
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: rgba(253,245,236,0.98);
    border: 1.5px solid rgba(200,133,92,0.4);
    border-radius: 24px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    color: #5c3317;
    box-shadow: 0 8px 28px rgba(120,70,30,0.18);
    z-index: 999999;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    cursor: pointer;
    max-width: 320px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;

  toast.innerHTML = `
    <span style="font-size:1.1rem;flex-shrink:0;">🔔</span>
    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;">${message}</span>
    <a href="notifications.html" style="color:#c8855c;font-size:0.8rem;text-decoration:none;flex-shrink:0;font-weight:500;">see all</a>
  `;

  toast.onclick = () => window.location.href = 'notifications.html';
  document.body.appendChild(toast);

  // animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  // animate out after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================
// POST MENU (3-dot)
// ==========================
document.addEventListener('click', e => {
  if (!e.target.closest('[id^="postMenu-"]') && !e.target.closest('button[onclick^="togglePostMenu"]')) {
    document.querySelectorAll('[id^="postMenu-"]').forEach(m => m.style.display = 'none');
  }
});

function togglePostMenu(id) {
  const menu = document.getElementById(`postMenu-${id}`);
  if (!menu) return;
  const isOpen = menu.style.display === 'block';
  document.querySelectorAll('[id^="postMenu-"]').forEach(m => m.style.display = 'none');
  menu.style.display = isOpen ? 'none' : 'block';
}

// ==========================
// BLOCK / MUTE / REPORT
// ==========================
async function applyBlockMuteToCard(card, authorUid) {
  const user = auth.currentUser;
  if (!user || user.uid === authorUid) return;
  const [blockedDoc, mutedDoc] = await Promise.all([
    db.collection('users').doc(user.uid).collection('blocked').doc(authorUid).get(),
    db.collection('users').doc(user.uid).collection('muted').doc(authorUid).get()
  ]);
  if (mutedDoc.exists) {
    card.style.display = 'none';
  } else if (blockedDoc.exists) {
    card.style.opacity = '0.35'; card.style.filter = 'grayscale(0.6)'; card.style.pointerEvents = 'none';
    const notice = document.createElement('div');
    notice.style.cssText = `font-family:'Caveat',cursive;font-size:0.88rem;color:#c8a888;text-align:center;padding:4px 0 8px;`;
    notice.textContent = "you've blocked this person";
    card.prepend(notice);
  }
}

async function muteFromPost(targetUid, username, postId) {
  document.getElementById(`postMenu-${postId}`)?.style && (document.getElementById(`postMenu-${postId}`).style.display = 'none');
  const user = auth.currentUser;
  if (!user) return;
  await db.collection('users').doc(user.uid).collection('muted').doc(targetUid).set({ uid: targetUid, mutedAt: firebase.firestore.FieldValue.serverTimestamp() });
  document.querySelectorAll('.post-card').forEach(card => {
    if (card.querySelector(`a[href="profile.html?uid=${targetUid}"]`)) card.style.display = 'none';
  });
  showToast(`@${username} muted 🌸`);
}

async function blockFromPost(targetUid, username, postId) {
  document.getElementById(`postMenu-${postId}`)?.style && (document.getElementById(`postMenu-${postId}`).style.display = 'none');
  const user = auth.currentUser;
  if (!user) return;
  if (!confirm(`block @${username}? their posts will appear greyed out.`)) return;
  await db.collection('users').doc(user.uid).collection('blocked').doc(targetUid).set({ uid: targetUid, blockedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await Promise.all([
    db.collection('users').doc(user.uid).collection('friends').doc(targetUid).delete(),
    db.collection('users').doc(targetUid).collection('friends').doc(user.uid).delete()
  ]);
  document.querySelectorAll('.post-card').forEach(card => {
    if (card.querySelector(`a[href="profile.html?uid=${targetUid}"]`)) {
      card.style.opacity = '0.35'; card.style.filter = 'grayscale(0.6)'; card.style.pointerEvents = 'none';
    }
  });
  showToast(`@${username} blocked 🌸`);
}

async function reportFromPost(targetUid, username, postId) {
  document.getElementById(`postMenu-${postId}`)?.style && (document.getElementById(`postMenu-${postId}`).style.display = 'none');
  const user = auth.currentUser;
  if (!user) return;
  const reasons = ['spam or fake account','harassment or bullying','inappropriate content','something else'];
  const reason  = prompt(`report @${username}\n\nReason:\n${reasons.map((r,i) => `${i+1}. ${r}`).join('\n')}\n\nType the number:`);
  if (!reason) return;
  const picked = reasons[parseInt(reason) - 1] || 'something else';
  await db.collection('reports').add({ reportedUid: targetUid, reportedUsername: username, reporterUid: user.uid, reason: picked, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  showToast('report sent 🌸 thank you for keeping solite safe');
}

// ==========================
// SAVE POST
// ==========================
async function toggleSave(postId) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = db.collection('users').doc(user.uid).collection('saved').doc(postId);
  const btn = document.getElementById(`saveBtn-${postId}`);
  const exists = (await ref.get()).exists;
  if (exists) {
    await ref.delete();
    if (btn) btn.style.color = '#c8a888';
    showToast('removed from saved 🌸');
  } else {
    await ref.set({ savedAt: firebase.firestore.FieldValue.serverTimestamp() });
    if (btn) btn.style.color = '#c8855c';
    showToast('saved 🌸');
  }
}

async function checkSaved(postId) {
  const user = auth.currentUser;
  if (!user) return;
  const exists = (await db.collection('users').doc(user.uid).collection('saved').doc(postId).get()).exists;
  const btn = document.getElementById(`saveBtn-${postId}`);
  if (btn && exists) btn.style.color = '#c8855c';
}

// ==========================
// ONBOARDING
// ==========================
function showOnboarding(user, existingUsername) {
  if (document.getElementById('onboardingOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'onboardingOverlay';
  overlay.style.cssText = `position:fixed;inset:0;background:linear-gradient(160deg,#fdf5ec,#f5e8d8);display:flex;align-items:center;justify-content:center;z-index:999999;overflow:hidden;`;
  overlay.innerHTML = `
    <div id="ob-daisies" style="position:absolute;inset:0;pointer-events:none;overflow:hidden;"></div>
    <div style="background:rgba(255,255,255,0.88);border-radius:28px;padding:40px 32px;max-width:420px;width:92%;text-align:center;border:1px solid rgba(210,175,140,0.35);box-shadow:0 20px 60px rgba(100,50,10,0.14);position:relative;z-index:1;">
      <div id="ob-dots" style="display:flex;justify-content:center;gap:8px;margin-bottom:28px;">
        <div class="ob-dot active"></div><div class="ob-dot"></div><div class="ob-dot"></div>
      </div>
      <div id="ob-content"></div>
      <div id="ob-nav" style="margin-top:28px;display:flex;flex-direction:column;gap:10px;"></div>
    </div>
    <style>
      .ob-dot{width:8px;height:8px;border-radius:50%;background:#e0c8b0;transition:0.3s;}
      .ob-dot.active{background:#c8855c;transform:scale(1.2);}
      .ob-step-title{font-family:'Playfair Display',serif;font-style:italic;font-size:1.6rem;color:#5c3317;margin-bottom:12px;line-height:1.3;}
      .ob-step-body{font-family:'Caveat',cursive;font-size:1.1rem;color:#b07858;line-height:1.7;margin-bottom:6px;}
      .ob-btn-primary{width:100%;padding:13px;background:linear-gradient(135deg,#c8855c,#a05530);color:white;border:none;border-radius:24px;font-family:'DM Sans',sans-serif;font-size:0.95rem;cursor:pointer;transition:0.2s;}
      .ob-btn-primary:hover{transform:scale(1.02);}
      .ob-btn-secondary{width:100%;padding:11px;background:rgba(255,255,255,0.8);color:#7a4a2a;border:1.5px solid #e0c8b0;border-radius:24px;font-family:'DM Sans',sans-serif;font-size:0.88rem;cursor:pointer;}
      .ob-input{width:100%;padding:12px 16px;border-radius:14px;border:1.5px solid #e0c8b0;font-family:'DM Sans',sans-serif;font-size:0.95rem;color:#3d2010;background:rgba(255,255,255,0.85);box-sizing:border-box;margin-bottom:8px;text-align:center;}
      .ob-input:focus{outline:none;border-color:#c8855c;}
      .ob-feature{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.7);border:1px solid #f0dfd0;border-radius:14px;padding:10px 14px;margin-bottom:8px;text-align:left;}
      .ob-feature-icon{font-size:1.3rem;flex-shrink:0;}
      .ob-feature-text{font-family:'DM Sans',sans-serif;font-size:0.85rem;color:#7a4a2a;line-height:1.4;}
      .ob-feature-text strong{color:#5c3317;display:block;font-size:0.88rem;}
    </style>
  `;
  document.body.appendChild(overlay);
  spawnObDaisies();
  renderObStep(1, user, existingUsername);
}

function renderObStep(step, user, existingUsername) {
  const content = document.getElementById('ob-content');
  const nav     = document.getElementById('ob-nav');
  const dots    = document.querySelectorAll('.ob-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === step - 1));
  content.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.3s,transform 0.3s;';
  setTimeout(() => { content.style.opacity = '1'; content.style.transform = 'translateY(0)'; }, 50);
  nav.innerHTML = '';

  if (step === 1) {
    content.innerHTML = `
      <div style="font-size:2.4rem;margin-bottom:16px;">🌼</div>
      <div class="ob-step-title">you found your way here</div>
      <div class="ob-step-body">Solite is a small, quiet corner of the internet —<br>no ads, no algorithm, no noise.<br><br>just people who get the vibe,<br>sharing little pieces of their world.</div>
      <div style="font-family:'Caveat',cursive;font-size:0.9rem;color:#c8a888;margin-top:10px;">you were invited here. that means something. ✦</div>
    `;
    const btn = document.createElement('button');
    btn.className = 'ob-btn-primary'; btn.textContent = "i'm ready 🌸";
    btn.onclick = () => renderObStep(2, user, existingUsername);
    nav.appendChild(btn);

  } else if (step === 2) {
    content.innerHTML = `
      <div style="font-size:2rem;margin-bottom:12px;">✦</div>
      <div class="ob-step-title">what shall we call you?</div>
      <div class="ob-step-body" style="margin-bottom:18px;">pick a name, a nickname, anything —<br>this is how people will know you here.</div>
      <input class="ob-input" id="ob-username-input" placeholder="your name here..." value="${existingUsername || ''}" maxlength="30">
      <div style="font-size:0.75rem;color:#c8a888;font-family:'DM Sans',sans-serif;">letters, numbers, underscores only</div>
    `;
    setTimeout(() => document.getElementById('ob-username-input')?.focus(), 100);
    const btn = document.createElement('button');
    btn.className = 'ob-btn-primary'; btn.textContent = "that's me ✨";
    btn.onclick = async () => {
      const raw = document.getElementById('ob-username-input').value.trim();
      const username = raw.replace(/[^a-zA-Z0-9_.]/g, '') || 'solite_friend';
      await db.collection('users').doc(user.uid).set({ username, usernameLower: username.toLowerCase() }, { merge: true });
      renderProfileBox(username);
      renderObStep(3, user, username);
    };
    nav.appendChild(btn);
    const skip = document.createElement('button');
    skip.className = 'ob-btn-secondary'; skip.textContent = 'decide later';
    skip.onclick = () => renderObStep(3, user, existingUsername || 'solite_friend');
    nav.appendChild(skip);

  } else if (step === 3) {
    content.innerHTML = `
      <div style="font-size:1.8rem;margin-bottom:14px;">🌸</div>
      <div class="ob-step-title">your corner is ready</div>
      <div class="ob-step-body" style="margin-bottom:18px;">here's what lives here —</div>
      <div class="ob-feature"><div class="ob-feature-icon">💬</div><div class="ob-feature-text"><strong>yap</strong>share thoughts, songs, books, café finds</div></div>
      <div class="ob-feature"><div class="ob-feature-icon">🤍</div><div class="ob-feature-text"><strong>find friends</strong>search by username and connect quietly</div></div>
      <div class="ob-feature"><div class="ob-feature-icon">🎧</div><div class="ob-feature-text"><strong>music & books & cafés</strong>little collections, all yours</div></div>
      <div class="ob-feature"><div class="ob-feature-icon">🌼</div><div class="ob-feature-text"><strong>stay small</strong>this place will never have more than 1000 people</div></div>
    `;
    const btn = document.createElement('button');
    btn.className = 'ob-btn-primary'; btn.textContent = 'start exploring 🌼';
    btn.onclick = async () => {
      await db.collection('users').doc(user.uid).set({ onboarded: true }, { merge: true });
      const ov = document.getElementById('onboardingOverlay');
      if (ov) { ov.style.opacity = '0'; ov.style.transition = 'opacity 0.5s'; setTimeout(() => ov.remove(), 500); }
    };
    nav.appendChild(btn);
  }
}

function spawnObDaisies() {
  const container = document.getElementById('ob-daisies');
  if (!container) return;
  function makeDaisy(size) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', size*2.6); svg.setAttribute('height', size*2.6); svg.setAttribute('viewBox', '-20 -20 40 40');
    [0,45,90,135,180,225,270,315].forEach(a => {
      const el = document.createElementNS(ns, 'ellipse');
      el.setAttribute('cx',0); el.setAttribute('cy',-size); el.setAttribute('rx',size*0.44); el.setAttribute('ry',size*0.77);
      el.setAttribute('fill','#fffef0'); el.setAttribute('transform',`rotate(${a})`); svg.appendChild(el);
    });
    const c1 = document.createElementNS(ns,'circle'); c1.setAttribute('r',size*0.55); c1.setAttribute('fill','#f5d76e'); svg.appendChild(c1);
    const c2 = document.createElementNS(ns,'circle'); c2.setAttribute('r',size*0.28); c2.setAttribute('fill','#e8c94a'); svg.appendChild(c2);
    return svg;
  }
  for (let i = 0; i < 16; i++) {
    const w = document.createElement('div'); w.classList.add('daisy');
    const size = 5+Math.random()*8;
    const opHigh = (0.2+Math.random()*0.3).toFixed(2);
    const opLow  = (parseFloat(opHigh)*0.3).toFixed(2);
    w.style.cssText = `position:absolute;left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;--op-high:${opHigh};--op-low:${opLow};animation-duration:${(3+Math.random()*5).toFixed(1)}s;animation-delay:-${(Math.random()*6).toFixed(1)}s;`;
    w.appendChild(makeDaisy(size)); container.appendChild(w);
  }
}
// ==========================
// COUNTRY SELECTOR
// ==========================
function setCountry(country) {
  localStorage.setItem('soliteCountry', country);
  document.querySelectorAll('.country-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === country);
  });
  const label = document.getElementById('currentCountryLabel');
  if (label) label.textContent = `currently: ${country}`;
  showToast(`country set to ${country} 🌸`);
  toggleMenuPanel();
}

function loadCountry() {
  const saved = localStorage.getItem('soliteCountry');
  if (!saved) return;
  document.querySelectorAll('.country-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === saved);
  });
  const label = document.getElementById('currentCountryLabel');
  if (label) label.textContent = `currently: ${saved}`;
}