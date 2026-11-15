package com.anand.tagverify.fitment

import android.net.Uri

/** The four fitment photos, in the order shown on the form and certificate. */
enum class PhotoSlot(val key: String, val label: String, val labelHi: String) {
    FRONT_LEFT("frontLeft", "Front Left", "आगे बाएँ"),
    BACK_RIGHT("backRight", "Back Right", "पीछे दाएँ"),
    NUMBER_PLATE("numberPlate", "Number Plate", "नंबर प्लेट"),
    RC_COPY("rcCopy", "RC Copy", "आरसी कॉपी"),
}

/** Where the certificate is generated (mandatory). */
data class FitmentLocation(
    val lat: Double,
    val lng: Double,
    val address: String,
    /** GPS accuracy radius in metres (for future geofencing). */
    val accuracyM: Float = 0f,
    /** When the fix was taken (epoch ms). */
    val capturedAt: Long = System.currentTimeMillis(),
) {
    /** "Korba, Chhattisgarh, 495450 | 22.40455, 82.68012" */
    val display: String get() = "$address | ${"%.5f".format(lat)}, ${"%.5f".format(lng)}"
}

/** Everything the dealer types or captures on the fitment form. */
data class FitmentForm(
    val vehicleMake: String = "",
    val vehicleCategory: String = "",
    val fuelType: String = "",
    val passingRto: String = "",
    val registrationRto: String = "",
    val series: String = "",
    val mfgYear: String = "",
    val chassisNo: String = "",
    val engineNo: String = "",
    val ownerName: String = "",
    val ownerMobile: String = "",
    val photos: Map<PhotoSlot, Uri> = emptyMap(),
) {
    /** Registration RTO code + series, e.g. CG07 + AS9879 = CG07AS9879. */
    val vehicleNumber: String get() = (registrationRto + series).uppercase()
}

/** Field-level validation; returns field -> message for anything wrong. */
fun FitmentForm.errors(location: FitmentLocation?): Map<String, String> = buildMap {
    if (vehicleMake.isBlank()) put("vehicleMake", "Select the vehicle make")
    if (vehicleCategory.isBlank()) put("vehicleCategory", "Select the category")
    if (fuelType.isBlank()) put("fuelType", "Select the fuel type")
    if (passingRto.isBlank()) put("passingRto", "Select the passing RTO")
    if (registrationRto.isBlank()) put("registrationRto", "Select the registration RTO")
    if (!Regex("^[A-Z]{0,3}\\d{1,4}$").matches(series.uppercase())) put("series", "Enter only the part after the RTO code, e.g. AS9879")
    if (mfgYear.isBlank()) put("mfgYear", "Select the manufacturing year")
    if (!Regex("^[A-Za-z0-9]{5}$").matches(chassisNo)) put("chassisNo", "Enter the last 5 characters")
    if (!Regex("^[A-Za-z0-9]{5}$").matches(engineNo)) put("engineNo", "Enter the last 5 characters")
    if (ownerName.trim().length < 2) put("ownerName", "Enter the owner's name")
    if (!Regex("^[6-9]\\d{9}$").matches(ownerMobile)) put("ownerMobile", "Enter a valid 10-digit mobile number")
    if (location == null) put("location", "Location is required")
    PhotoSlot.entries.filter { it !in photos }.forEach { put("photo_${it.key}", "Take the ${it.label} photo") }
}
