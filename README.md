# TagVerify

Anti-counterfeit QR certificates for genuine radium (reflective) stickers on trucks and vehicles.

## Why this exists

We sell original radium stickers that are fitted to trucks and other vehicles across India. Other suppliers sell cheaper copies under our name, and customers can't tell them apart.

TagVerify puts a **unique QR code on every genuine radium**. When anyone scans it with any phone camera, they get a **certificate (PDF)** showing that this sticker is original and which company it belongs to. A competitor can't fake that, because every QR is registered in our database and certified by an authorised dealer.

## How it works

1. **Admin (web panel)** onboards companies and adds dealers by email (each dealer belongs to one company). The admin also generates QR codes in bulk (500–1,000 at a time) for a company. Each QR gets a sequential ID, creation time and creator. The admin hands printed batches to dealers and records which serial range went to which dealer (for example 200–1,000 → dealer X). A torn sticker can be reprinted for the same dealer with the same QR ID.
2. **Dealer (Android app)** sticks a QR on a vehicle, signs in (Google or email/password), and scans it. The app shows the company and serial from the QR, and the dealer fills in the vehicle and owner form and submits.
3. On submit, a **certificate PDF** is generated and stored in Firebase Storage, and the QR is marked *certified*.
4. **Anyone, publicly** scans the same QR later with any app, and the certificate PDF opens in the browser. No app or login is needed.

### Roles and access

- Every signed-in user has a **role**: `admin` or `dealer`, stored in `users/{email}`.
- Only emails the admin has added can sign in, with Google or email/password. Anyone else sees: *"You are not a dealer. Please contact the admin, Vikas Agarwal."*
- A dealer can only certify QR codes of **their own company**.

Keep features simple: this is an MVP for a demo on **17 Nov 2026**.

## Repository

| Folder | What | Status |
|---|---|---|
| [`android/`](android/) | Dealer app: Kotlin + Jetpack Compose + Material 3 | MVP in progress |
| [`webapp-admin/`](webapp-admin/) | Admin panel: web app on the same Firebase project | Next |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | **Shared Firestore schema and permissions** that both apps follow | |

Both apps share one Firebase project (Auth, Firestore, Storage). There is no separate backend. Code is organised by feature (`auth/`, `scan/`, `data/`, `ui/`), so new features slot in without touching unrelated code.

## Android app: getting started

1. Open `android/` in Android Studio.
2. **Firebase config:** download `google-services.json` from Firebase Console → Project settings → Your apps → *TagVerify*, and put it at `android/app/google-services.json`. It is git-ignored on purpose, so each machine needs its own copy.
3. Run on a phone or emulator.

### Google sign-in setup (one time)

1. Get your debug key's SHA-1 and SHA-256:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android
   ```
   (or run `./gradlew signingReport` inside `android/`).
2. In Firebase: Project settings → Your apps → TagVerify → **Add fingerprint**, then add both values.
3. In Firebase: Authentication → Sign-in method, enable **Google** and **Email/Password**.
4. Download `google-services.json` **again** (it now contains the OAuth client) into `android/app/`.

For the release APK, add the release keystore's SHA-1 and SHA-256 the same way. Always sign shared APKs with that same keystore.

### Building from the terminal

```bash
cd android && ./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. If Gradle times out while downloading on your network, run `export JAVA_TOOL_OPTIONS=-Djava.net.preferIPv4Stack=true` first.

### Firestore security rules

[`android/firestore.rules`](android/firestore.rules) is the source of truth. Paste it into Firebase Console → Firestore → Rules → Publish.

## MVP checklist

**Dealer app**
- [x] Firebase project, Android app registered
- [x] Project skeleton: Compose, Material 3, Firebase, navigation
- [x] Login: Google + email/password, role-based allow-list (`users/{email}`)
- [x] QR scanner (CameraX + ML Kit) that shows the scanned contents
- [ ] Scan → look up QR → form / certificate / "not your company"
- [ ] Certificate form, validation, 4 photo captures, preview
- [ ] PDF generation, upload to Storage, public link
- [ ] My Certificates list

**Admin panel**
- [ ] Login (admin role only)
- [ ] Companies: add/list
- [ ] Dealers: add/list/deactivate (writes `users/{email}` with role `dealer`)
- [ ] QR batches: generate N sequential QR codes for a company, assign to a dealer, download a printable PDF sheet
- [ ] QR lookup and reprint a single QR
- [ ] Certificates: list, edit, delete (delete resets the QR to `unused`)
