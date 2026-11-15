# TagVerify Admin Panel

A web app for admins. It uses the same Firebase project and schema as the dealer app: see [`../docs/DATA_MODEL.md`](../docs/DATA_MODEL.md).

## Run locally

```bash
cd webapp-admin
cp .env.example .env.local   # fill in the Web app config from Firebase Console
npm install
npm run dev                  # http://localhost:5173
```

Sign in with an account whose `users/{email}` doc has `role: "admin"` and `active: true`.

## What it does (MVP)

- **Companies:** add and list.
- **Dealers:** add a dealer by email. This puts them on the allow-list, so they can sign in to the Android app with Google, or with a password if you set one. You can also list dealers and activate or deactivate them.
- **QR codes:**
  - Generate a batch of sequential QR codes for a company (`TV-000001`, `TV-000002`, …), optionally handed to a dealer.
  - Download a printable A4 sticker sheet (24 per page).
  - Reassign a batch to another dealer.
  - Find one QR, see its status, reassign it, and reprint it.
- **Public page** `/c/<qrId>`: what anyone sees after scanning a sticker. It shows "Genuine radium" with a certificate link, or "Certificate not available".

Every QR encodes `VITE_PUBLIC_BASE_URL/c/<qrId>`, which defaults to `https://tagverify-5f8b1.web.app`. That page only works for people outside your machine after the app is deployed to Firebase Hosting.

## Code layout

- `src/lib/`: Firebase setup, shared schema (`schema.ts`), auth, QR and PDF helpers
- `src/services/`: Firestore reads and writes, one file per collection
- `src/components/`: shared UI kit and layout
- `src/pages/`: one file per screen
