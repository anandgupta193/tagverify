package com.anand.tagverify.data

import android.net.Uri
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.tasks.await

/** Everything the fitment form needs to know about the scanned sticker. */
data class QrContext(
    val qrId: String,
    val serial: Long,
    val companyId: String,
    val companyName: String,
    val state: String,
    val productType: String,
    val copNumber: String,
    val copValidity: com.google.firebase.Timestamp?,
)

sealed interface QrLookup {
    /** Not a TagVerify sticker (e.g. a payment QR or a random link). */
    data class NotTagVerify(val raw: String) : QrLookup
    /** Looks like ours but isn't in the database. */
    data class NotRegistered(val qrId: String) : QrLookup
    data class OtherCompany(val qrId: String) : QrLookup
    data class AlreadyCertified(val qrId: String, val publicUrl: String) : QrLookup
    data class Ready(val qr: QrContext) : QrLookup
    data class Error(val message: String) : QrLookup
}

object QrRepository {
    const val PUBLIC_BASE_URL = "https://tagverify-5f8b1.web.app"
    private val ID_PATTERN = Regex("^TV-\\d{6,}$", RegexOption.IGNORE_CASE)

    fun publicUrl(qrId: String) = "$PUBLIC_BASE_URL/c/$qrId"

    /** QR id from our sticker URL (".../c/TV-000201") or a bare id; null if not ours. */
    fun parseQrId(raw: String): String? {
        val text = raw.trim()
        if (ID_PATTERN.matches(text)) return text.uppercase()
        val uri = runCatching { Uri.parse(text) }.getOrNull() ?: return null
        val segs = uri.pathSegments
        val i = segs.indexOf("c")
        val candidate = if (i >= 0) segs.getOrNull(i + 1) else uri.getQueryParameter("id")
        return candidate?.uppercase()?.takeIf { ID_PATTERN.matches(it) }
    }

    /** [myCompanyId] null = admin (may certify any company's sticker). */
    suspend fun lookup(raw: String, myCompanyId: String?, db: FirebaseFirestore = FirebaseFirestore.getInstance()): QrLookup {
        val qrId = parseQrId(raw) ?: return QrLookup.NotTagVerify(raw)
        return try {
            val qr = db.collection(Collections.QR_CODES).document(qrId).get().await()
            if (!qr.exists()) return QrLookup.NotRegistered(qrId)
            val companyId = qr.getString("companyId").orEmpty()
            if (myCompanyId != null && companyId != myCompanyId) return QrLookup.OtherCompany(qrId)
            if (qr.getString("status") == "certified") return QrLookup.AlreadyCertified(qrId, publicUrl(qrId))

            val company = db.collection(Collections.COMPANIES).document(companyId).get().await()
            QrLookup.Ready(
                QrContext(
                    qrId = qrId,
                    serial = qr.getLong("serial") ?: 0,
                    companyId = companyId,
                    companyName = company.getString("name") ?: companyId,
                    state = company.getString("state")?.ifBlank { null } ?: "CG",
                    productType = qr.getString("productType").orEmpty(),
                    copNumber = company.getString("copNumber").orEmpty(),
                    copValidity = company.getTimestamp("copValidity"),
                )
            )
        } catch (e: FirebaseFirestoreException) {
            if (e.code == FirebaseFirestoreException.Code.PERMISSION_DENIED) QrLookup.OtherCompany(qrId)
            else QrLookup.Error("Couldn't check this QR. Check your internet and try again.")
        } catch (e: Exception) {
            QrLookup.Error("Couldn't check this QR. Check your internet and try again.")
        }
    }
}
