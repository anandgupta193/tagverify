package com.anand.tagverify.scan

import com.google.mlkit.vision.barcode.common.Barcode

/** What we read from a QR code, kept as plain strings so it survives navigation. */
data class ScanResult(
    val rawValue: String,
    val type: String,
    /** Set when the QR holds a web link. */
    val url: String? = null,
) {
    companion object {
        fun from(barcode: Barcode): ScanResult {
            val raw = barcode.rawValue.orEmpty()
            val type = when (barcode.valueType) {
                Barcode.TYPE_URL -> "Link"
                Barcode.TYPE_TEXT -> "Text"
                Barcode.TYPE_WIFI -> "Wi-Fi"
                Barcode.TYPE_CONTACT_INFO -> "Contact"
                Barcode.TYPE_EMAIL -> "Email"
                Barcode.TYPE_PHONE -> "Phone"
                Barcode.TYPE_SMS -> "SMS"
                Barcode.TYPE_GEO -> "Location"
                Barcode.TYPE_CALENDAR_EVENT -> "Calendar event"
                else -> "Other"
            }
            val url = barcode.url?.url
                ?: raw.takeIf { it.startsWith("http://") || it.startsWith("https://") }
            return ScanResult(rawValue = raw, type = type, url = url)
        }
    }
}
