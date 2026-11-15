package com.anand.tagverify.auth

import com.google.firebase.firestore.DocumentSnapshot

/** A dealer profile from Firestore: dealers/{email in lowercase}. */
data class Dealer(
    val email: String,
    val name: String,
    val address: String,
    val mobile: String,
    val companyId: String,
    val passingLocation: String,
    val registrationLocation: String,
    val active: Boolean,
) {
    companion object {
        fun from(doc: DocumentSnapshot) = Dealer(
            email = doc.id,
            name = doc.getString("name").orEmpty(),
            address = doc.getString("address").orEmpty(),
            mobile = doc.getString("mobile").orEmpty(),
            companyId = doc.getString("companyId").orEmpty(),
            passingLocation = doc.getString("passingLocation").orEmpty(),
            registrationLocation = doc.getString("registrationLocation").orEmpty(),
            active = doc.getBoolean("active") ?: false,
        )
    }
}
