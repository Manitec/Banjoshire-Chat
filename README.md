# 🪕 Banjoshire

> A Discord-style real-time chat platform — public rooms, private rooms, DMs, emoji reactions, and Stripe-gated premium tiers. Built by [Manitec](https://github.com/Manitec).

**Live:** [banjo.joesfaves.com](https://banjo.joesfaves.com)  
**Repo:** [github.com/Manitec/Banjoshire-Chat](https://github.com/Manitec/Banjoshire-Chat)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (Pages Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| State | Redux Toolkit |
| Auth | Firebase Authentication (Google + email/password) |
| Database | Firebase Firestore + Realtime Database |
| Payments | Stripe (subscriptions + webhooks) |
| Hosting | Vercel |

---

## Features

- **Auth** — Google OAuth or email/password via FirebaseUI
- **Public Rooms** — browse, join, and chat in open rooms
- **Private Rooms** — password-protected rooms, invite-only
- **Direct Messages** — 1-on-1 DMs between users
- **Real-Time** — Firestore listeners for live message updates
- **Message Actions** — send, edit, delete
- **Emoji Reactions** — react to messages with an emoji picker
- **Notifications** — unread message counts for joined rooms
- **Profile Customization** — change avatar and banner
- **TierGate** — premium feature gating component
- **Upgrade Page** — Stripe-powered Pro and Agency subscription tiers

---

## Project Structure

```
src/
├── pages/
│   ├── index.tsx          # Root — redirects to chat or login
│   ├── upgrade.tsx        # Stripe subscription/upgrade page
│   ├── chats/             # Public + private room views
│   ├── dm/                # Direct message views
│   └── api/               # Next.js API routes (Stripe webhooks, etc.)
├── components/            # Reusable UI components
├── sections/              # Page-level layout sections
├── collections/           # Firestore collection helpers
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Firebase init, Stripe client init
├── services/              # Business logic / data services
├── types/                 # TypeScript interfaces
├── utils/                 # Shared utilities
├── styles/                # Global CSS
└── assets/                # Static assets
```

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/Manitec/Banjoshire-Chat.git
cd Banjoshire-Chat
npm install
```

### 2. Configure environment

```bash
cp .env.template .env.local
```

Fill in your values:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_AGENCY_PRICE_ID=
```

> ⚠️ Never commit `.env.local` — it's in `.gitignore`. Use `.env.template` as the source of truth for required keys.

### 3. Run dev server

```bash
npm run dev
# → http://localhost:3000
```

---

## Deployment

Hosted on Vercel, connected to `main` branch. Auto-deploys on push.

> Builds are skipped for docs-only changes (`README.md`, `.md` files, `.env.template`) via `vercel.json` `ignoreCommand`.

### Required Environment Variables (Vercel)

Set all variables from `.env.template` in **Vercel → Project Settings → Environment Variables** for Production, Preview, and Development.

---

## Demo Account

For testing without creating an account:

```
Email:    user@gmail.com
Password: 123123
```

---

## Stripe Tiers

| Tier | Price ID Env Var | Description |
|---|---|---|
| Pro | `STRIPE_PRO_PRICE_ID` | Unlock private rooms + DMs |
| Agency | `STRIPE_AGENCY_PRICE_ID` | Full access + higher limits |

Webhook endpoint: `/api/stripe-webhook` — configure in your Stripe dashboard.

---

## Related Projects

| Project | Description | URL |
|---|---|---|
| **ManiBot** | AI chat assistant (Groq + Neon) | [chat.manitec.pw](https://chat.manitec.pw) |
| **HexBot** | Internal ops AI | private |
| **Command Hub** | Manitec project dashboard | [joesfaves.com/my-projects](https://joesfaves.com/my-projects) |
| **Joe's Faves** | Personal hub / portfolio | [joesfaves.com](https://joesfaves.com) |

---

*Built by [Manitec](https://github.com/Manitec) — part of the growing empire. 🏴*
