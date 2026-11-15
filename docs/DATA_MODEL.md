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
Created by a dealer after scanning an `unused` QR and filling in the form.

| Field | Type |
|---|---|
| `qrId`, `companyId`, `dealerEmail` | string |
| `vehicle` | map: make, model, category, mfgYear, passingRto, registeredRto, vehicleSerialNo, chassisNo (5 digits), engineNo (5 digits) |
| `owner` | map: name, mobile |
| `imageUrls` | map: front, back, numberPlate, rc |
| `pdfUrl` | string |
| `createdAt` | timestamp |

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
