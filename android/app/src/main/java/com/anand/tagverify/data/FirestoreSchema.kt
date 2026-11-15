package com.anand.tagverify.data

/**
 * Firestore collection and field names, shared with the admin web panel.
 * Keep in sync with docs/DATA_MODEL.md.
 */
object Collections {
    const val USERS = "users"
    const val COMPANIES = "companies"
    const val QR_BATCHES = "qrBatches"
    const val QR_CODES = "qrCodes"
    const val CERTIFICATES = "certificates"
    const val MASTERS = "masters"
    const val COUNTERS = "counters"
    const val PUBLIC_CERTIFICATES = "publicCertificates"
}

object UserFields {
    const val NAME = "name"
    const val EMAIL = "email"
    const val ROLE = "role"
    const val ACTIVE = "active"
    const val COMPANY_ID = "companyId"
    const val MOBILE = "mobile"
    const val ADDRESS = "address"
    const val PASSING_LOCATION = "passingLocation"
    const val REGISTRATION_LOCATION = "registrationLocation"
}
