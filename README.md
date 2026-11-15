# TagVerify

QR-tag based vehicle certification. Dealers scan a QR sticker on a vehicle, fill a form, and a certificate PDF is generated. Scanning the same QR later opens the certificate.

| Folder | What | Status |
|---|---|---|
| [`android/`](android/) | Dealer app: Kotlin + Jetpack Compose + Material 3 | MVP in progress |
| [`webapp-admin/`](webapp-admin/) | Admin portal: Next.js | Planned (after the dealer MVP) |

Both apps share one Firebase project (Auth, Firestore, Storage). There is no separate backend.

## Android app: getting started

1. Open `android/` in Android Studio.
2. **Firebase config:** download `google-services.json` from Firebase Console → Project settings → Your apps → *TagVerify Dealer*, and put it at `android/app/google-services.json`. It is git-ignored on purpose, so each machine needs its own copy.
3. Run on a phone or emulator.

### Google sign-in setup (one time)

1. Get your debug key's SHA-1 and SHA-256:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android
   ```
   (or run `./gradlew signingReport` inside `android/`).
2. In Firebase: Project settings → Your apps → TagVerify Dealer → **Add fingerprint**, then add both values.
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

### Firestore data the app expects

- `dealers/{email-lowercase}`: `name`, `address`, `mobile`, `companyId`, `passingLocation`, `registrationLocation` (strings), and `active` (boolean, `true`).
  Only emails that have an active dealer doc can sign in, whether they use Google or email/password.
- `companies/{companyId}`: `name`, `copNumber`, `copValidity`, `logoUrl`.
- `masters/dropdowns`: arrays `makes`, `categories`, `mfgYears`, `rtos`, `productTypes`.

## MVP build order (dealer side)

- [x] Firebase project, Android app registered
- [x] Project skeleton: Compose, Material 3, Firebase, navigation
- [x] Login: Google + email/password, dealer allow-list check
- [ ] QR scanner (CameraX + ML Kit) and the three-way result (form / certificate / not your company)
- [ ] Certificate form, validation, 4 photo captures, preview
- [ ] PDF generation on the phone, upload to Storage, viewer
- [ ] My Certificates list
- [ ] Firestore and Storage security rules, signed release APK
