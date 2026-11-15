package com.anand.tagverify.auth

import com.anand.tagverify.data.UserFields
import com.google.firebase.firestore.DocumentSnapshot

enum class Role {
    ADMIN, DEALER;

    companion object {
        fun from(value: String?): Role? = when (value?.trim()?.lowercase()) {
            "admin" -> ADMIN
            "dealer" -> DEALER
            else -> null
        }
    }
}

/** A signed-in person's profile from users/{email}. */
data class AppUser(
    val email: String,
    val name: String,
    val role: Role,
    val active: Boolean,
    val companyId: String,
    val mobile: String = "",
    val address: String = "",
    val passingLocation: String = "",
    val registrationLocation: String = "",
) {
    companion object {
        /** Returns null when the doc has no valid role. */
        fun from(doc: DocumentSnapshot): AppUser? {
            val role = Role.from(doc.getString(UserFields.ROLE)) ?: return null
            return AppUser(
                email = doc.id,
                name = doc.getString(UserFields.NAME).orEmpty(),
                role = role,
                active = doc.getBoolean(UserFields.ACTIVE) ?: false,
                companyId = doc.getString(UserFields.COMPANY_ID).orEmpty(),
                mobile = doc.getString(UserFields.MOBILE).orEmpty(),
                address = doc.getString(UserFields.ADDRESS).orEmpty(),
                passingLocation = doc.getString(UserFields.PASSING_LOCATION).orEmpty(),
                registrationLocation = doc.getString(UserFields.REGISTRATION_LOCATION).orEmpty(),
            )
        }
    }
}
