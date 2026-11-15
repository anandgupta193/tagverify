# Dealer flow and certificate (reference)

This is taken from screen recordings of a similar app (SmartVahan) that the business shared, and it's the target behaviour for TagVerify. Our app uses **email** login instead of phone + password.

## Sticker
A printed sticker shows:
- the company/state code (for example `CG-SYN-CT`)
- the QR code
- a large serial number (`55073`)
- a batch line, `YYYYMMDD-BATCH-(n/500)`
- a tagline ("Sadak Suraksha Jeevan Raksha")

Any phone camera that scans it opens the public verify page.

## Dealer app
1. **Home:** a greeting with the dealer's name, the current location, a big **Scan QR Code** card, and "Today's overview" counts per product.
2. **Scan QR:**
   - "Align QR inside the frame", with corner brackets and an animated scan line
   - a **Torch** button
   - the hint "Hold steady, scanner detects QR automatically"
3. **Location is mandatory:** if location is off, show a *Location Required* dialog ("Location is mandatory for tracking where the certificate is generated") with *Open Settings / Retry / Back*.
4. **Fitment form:**
   - **Header chips (read-only, from the QR):** State · OEM (company) · QR serial · Product
   - **Red note:** "Kindly fill below details as per RC / Form 28, 29 / Form 20"
   - **Vehicle details:**
     - Vehicle Make (dropdown)
     - Vehicle Category (dropdown)
     - Fuel Type (dropdown)
     - Passing RTO and Registration RTO (dropdowns, e.g. `CG07 - RTO/ATS Durg`)
     - Series: only the part after the RTO code, e.g. `AS9879`
     - Vehicle Number: generated automatically as registration RTO code + series (`CG07AS9879`), read-only
     - Manufacturing Year
     - Chassis No and Engine No (last 5 characters)
   - **Owner details:** Owner Name, Owner Contact (10-digit mobile), and Location, filled automatically as "City, State, PIN | lat, lng"
   - **Fitment photos (camera):** Front Left, Back Right, Number Plate, RC Copy
   - Labels are bilingual (English / हिन्दी).
5. **Verify details:**
   - a read-only summary of everything, with a photo grid
   - the checkbox "I confirm that all information entered is correct / मैंने विवरणों की जाँच कर ली है और पुष्टि करता हूँ कि वे सही हैं।"
   - **Edit Details** and **GENERATE** buttons; GENERATE stays disabled until the box is ticked
6. After Generate, the dealer goes back to Home.

## Public verify page
- **Not certified:** "Verification Result: Certificate not generated", plus the QR serial, state, brand, product and batch.
- **Certified:** an **Installation Certificate** page with a *Download PDF* link. Its contents:
  - **Header:** issuer logo, "INSTALLATION CERTIFICATE", app name, vehicle number, brand logo
  - **Validity note:** "This installation certificate is only valid in the state of Chhattisgarh"
  - **Certificate fields:**
    - COP and COP validity
    - certificate number
    - QR code serial number
    - date of generation
    - generated at (location + lat/lng)
    - valid from and valid till (+1 year)
    - vehicle number
  - **Material details:** brand, product, quantity (e.g. "Set of 2")
  - **Vehicle details:** owner name and phone, vehicle make and category, chassis number, engine number, year of manufacturing
  - **Fitment photographs:** the 4 photos
  - a QR code ("Scan to verify")
