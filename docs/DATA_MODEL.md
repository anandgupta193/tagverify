# TagVerify data model (shared)

The dealer Android app (`android/`) and the admin web panel (`webapp-admin/`) use **one Firebase project** (`tagverify-5f8b1`) and must follow this schema. If you change a field here, update both apps and `android/firestore.rules`.

All emails used as document IDs are **lowercase**.

## Collections

### `users/{email}`
Everyone who can sign in. A user who has no doc here, or whose doc has `active: false`, is signed out with *"You are not a dealer. Please contact the admin, Vikas Agarwal."*

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `email` | string | same as the doc ID |
| `role` | string | `admin` or `dealer` |
| `active` | boolean | `false` blocks login without deleting the user |
| `companyId` | string | dealers only: the company whose QR codes they can certify |
| `mobile`, `address` | string | optional |
| `passingLocation`, `registrationLocation` | string | dealers only, optional |
| `createdAt` | timestamp | |
| `createdBy` | string | admin's email |

### `companies/{companyId}`
| Field | Type |
|---|---|
| `name` | string |
| `logoUrl` | string |
| `copNumber` | string |
| `copValidity` | timestamp |
| `createdAt`, `createdBy` | timestamp, string |

### `qrBatches/{batchId}`
One admin "generate N QR codes" action.

| Field | Type | Notes |
|---|---|---|
| `companyId` | string | |
| `productType` | string | |
| `quantity` | number | |
| `fromSerial`, `toSerial` | number | inclusive range of `qrCodes.serial` |
| `dealerEmail` | string | dealer the printed batch was handed to (optional) |
| `createdAt`, `createdBy` | timestamp, string | |

### `qrCodes/{qrId}`
One printed sticker. `qrId` is the human code, for example `TV-000201`. The QR image encodes the public URL `https://<public-host>/c/{qrId}`, so any phone camera can open it.

| Field | Type | Notes |
|---|---|---|
| `serial` | number | sequential across the whole system |
| `companyId` | string | |
| `productType` | string | |
| `batchId` | string | |
| `dealerEmail` | string | who holds the sticker (from the batch, can be re-assigned) |
| `status` | string | `unused` or `certified` |
| `certificateId` | string | set when certified |
| `createdAt`, `createdBy` | timestamp, string | |

To reprint a torn sticker, regenerate the image for the same `qrId`. Nothing in the database changes.

### `certificates/{certificateId}`
Created by a dealer (or admin) after scanning an `unused` QR and submitting the fitment form. The same batch write also sets the QR to `certified` and writes `publicCertificates/{qrId}`.

| Field | Type |
|---|---|
| `certificateNo` | string, e.g. `CG2611150000005K7QX` (state + yyMMdd + serial + random) |
| `qrId`, `qrSerial`, `companyId`, `companyName`, `state`, `productType` | |
| `dealerEmail`, `dealerName` | string |
| `vehicle` | map: make, category, fuelType, passingRto, registrationRto, series, vehicleNumber (regRto + series), mfgYear, chassisNo (5 characters), engineNo (5 characters) |
| `owner` | map: name, mobile |
| `generatedAt` | map: address, lat, lng (GPS, mandatory) |
| `imageUrls` | map: frontLeft, backRight, numberPlate, rcCopy (Storage download URLs) |
| `copNumber`, `copValidity` | copied from the company |
| `validFrom`, `validTill` | timestamp (+1 year) |
| `pdfUrl` | string (empty until PDF generation is added) |
| `createdAt` | server timestamp |

Photos are stored at `certificates/{qrId}/{slot}.jpg` in Firebase Storage (rules: `android/storage.rules`). Each is compressed to at most 1600 px, JPEG 80%.

### `publicCertificates/{qrId}`
The **public** view shown when anyone scans a sticker (`/c/{qrId}` on the web app). Everyone can read it, so the owner's mobile number is masked.

| Field | Type |
|---|---|
| `qrId`, `qrSerial`, `certificateNo`, `companyName`, `state`, `productType` | |
| `copNumber`, `copValidity` | |
| `vehicle` | same map as on the certificate |
| `ownerName`, `ownerMobileMasked` (`******0809`) | string |
| `generatedAt` | map: address, lat, lng |
| `imageUrls` | map of the 4 photo URLs |
| `certifiedAt`, `validFrom`, `validTill` | timestamp |
| `pdfUrl` | string |

### `counters/qrSerial`
`{ next: number }`. The admin panel reads and increments it in a transaction when generating a batch, so serials never repeat.

### `masters/dropdowns`
Arrays: `makes`, `categories`, `mfgYears`, `rtos`, `productTypes`.

## Who can do what (enforced in `android/firestore.rules`)

| | admin | dealer |
|---|---|---|
| users | read/write all | read own doc |
| companies | read/write | read own company |
| qrBatches, counters | read/write | none |
| qrCodes | read/write | read own company's; mark `unused` as `certified` |
| certificates | read/write | read own company's; create as self |
| masters | read/write | read |
