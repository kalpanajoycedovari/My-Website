# 🌸 Solite

> *a small, invite-only corner of the internet — built for quiet people who like good things*

[![Live](https://img.shields.io/badge/Live-GitHub%20Pages-c8a064?style=flat-square)](https://kalpanajoycedovari.github.io/My-Website/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-f5a623?style=flat-square)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-7ba89c?style=flat-square)](#)

---

## What is Solite?

Solite is a cozy, invite-only social platform designed as an antidote to the noise of the mainstream internet. It's a space where members share thoughts, music, stories, and little moments — with no follower counts, no algorithmic feed, no public metrics. Just people, and what they want to say.

Built entirely from scratch as a full-stack solo project: real-time database, authentication, user profiles, social graph, messaging, safety tools, and a custom admin system — all hosted on GitHub Pages with a Firebase backend.

---

## Features

### 🔐 Access & Identity
- Invite-only registration — members share personal invite links
- Email/password authentication via Firebase Auth
- Member capacity cap (auto-pauses signups at 900 members)
- Admin-controlled signup toggle

### 👤 Profiles
- Display name, bio, and profile photo (base64 upload, no CORS issues)
- Inline bio editing
- Quick post ("yap") directly from profile
- Post history visible on profile

### 🌿 Feed & Posts
- Real-time post feed powered by Firestore
- Mood-tagged posts with filter system
- Soft reactions (no public like counts)
- Save posts to a personal saved collection
- Clickable post cards opening full post view

### 💌 Social
- Private messaging (DMs) between members
- Thread-based inbox with unread indicators
- Follow system with following/followers tracking

### 🛡️ Safety
- Block, mute, and report users
- Reports routed to admin dashboard for review
- Banned user system

### ⚙️ Admin Dashboard
- Password-gated, Joy-only access (via secret keyboard shortcut)
- Live stats: member count, weekly joins, open reports, total posts
- Recent joins panel with ban controls
- Reports queue with delete post / ban user / dismiss actions
- Capacity bar and signup toggle

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Fonts | Playfair Display, DM Sans, Caveat (Google Fonts) |
| Backend | Firebase Firestore (NoSQL real-time database) |
| Auth | Firebase Authentication |
| Storage | Base64 encoding → Firestore (no Firebase Storage) |
| Hosting | GitHub Pages |
| Version Control | Git / GitHub |

---

## Data Architecture

Firestore collections:

```
users/          — uid → { username, bio, photoBase64, joinedAt, banned }
posts/          — postId → { uid, content, mood, createdAt, reactions }
threads/        — threadId → { members[], lastMsg, lastAt, unread{} }
messages/       — threadId/messages/ → { senderId, text, sentAt }
reports/        — reportId → { targetId, postId, reason, type, status }
invites/        — inviteId → { createdBy, usedBy, createdAt }
meta/stats      — { memberCount }
meta/settings   — { signupsOpen }
```

---

## Project Structure

```
My-Website/
├── index.html          # Main feed
├── profile.html        # User profile
├── post.html           # Single post view
├── messages.html       # DMs / inbox
├── notifications.html  # Activity notifications
├── saved.html          # Saved posts
├── invite.html         # Invite link landing
├── landing.html        # Public landing page
├── login.html          # Auth (login + signup)
├── admin.html          # Admin dashboard (password protected)
├── script.js           # Core app logic
├── style.css           # Global styles
└── firebase-config.js  # Firebase init (gitignored)
```

---

## Design Philosophy

Solite intentionally avoids the patterns that make most social media feel exhausting:

- **No public like/follower counts** — reactions exist, numbers don't
- **No algorithmic feed** — chronological only
- **Invite-only** — trust is built in from the architecture, not retrofitted
- **Cozy aesthetic** — warm tones, serif typography, no harsh UI elements

The visual identity uses a soft dark palette (`#1a1410` base), gold accents (`#c8a064`), muted rose (`#c47b7b`), and sage (`#7ba89c`) — with Playfair Display for headings and DM Sans for body text.

---

## What I Built & Learned

This project pushed me across the full stack as a solo developer:

- Designed and implemented a **NoSQL data model** for a social platform from scratch, including a denormalised thread structure for real-time messaging
- Solved **CORS and Firebase Storage limitations** by encoding profile photos as base64 strings stored directly in Firestore
- Built a **real-time admin monitoring system** pulling live aggregates across multiple Firestore collections
- Implemented a **safety and moderation pipeline** — report ingestion, admin review queue, ban enforcement — without any server-side code
- Managed the full **auth lifecycle**: signup caps, invite validation, banned user enforcement, and admin access control

---

## Live Demo

🌸 [kalpanajoycedovari.github.io/My-Website](https://kalpanajoycedovari.github.io/My-Website/)

*Solite is invite-only — reach out if you'd like access.*

---

## Author

**Kalpana Joyce Dovari** — MSc Artificial Intelligence, Northumbria University London  
[GitHub](https://github.com/kalpanajoycedovari) · [Portfolio](https://kalpanajoycedovari.github.io)
