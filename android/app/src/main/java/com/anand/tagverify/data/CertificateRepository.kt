package com.anand.tagverify.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import com.anand.tagverify.fitment.FitmentForm
import com.anand.tagverify.fitment.FitmentLocation
import com.anand.tagverify.fitment.PhotoSlot
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageMetadata
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object CertificateRepository {
    private const val MAX_PHOTO_PX = 1600
    private const val JPEG_QUALITY = 80

    /** e.g. CG2611150000073K7QX — state + yyMMdd + serial + random suffix. */
    private fun certificateNumber(state: String, serial: Long): String {
        val date = SimpleDateFormat("yyMMdd", Locale.US).format(Date())
        val rand = (1..4).map { "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".random() }.joinToString("")
        return "$state$date${serial.toString().padStart(7, '0')}$rand"
    }

    /**
     * Uploads the 4 photos, then in ONE batch: creates certificates/{id},
     * marks the QR certified and writes the public view. [onProgress] goes 0..1.
     */
    suspend fun submit(
        context: Context,
        qr: QrContext,
        form: FitmentForm,
        location: FitmentLocation,
        dealerEmail: String,
        dealerName: String,
        onProgress: (Float) -> Unit,
        db: FirebaseFirestore = FirebaseFirestore.getInstance(),
        storage: FirebaseStorage = FirebaseStorage.getInstance(),
    ): String {
        val urls = mutableMapOf<String, String>()
        PhotoSlot.entries.forEachIndexed { i, slot ->
            val uri = form.photos.getValue(slot)
            val bytes = withContext(Dispatchers.IO) { compress(context, uri) }
            val ref = storage.reference.child("certificates/${qr.qrId}/${slot.key}.jpg")
            ref.putBytes(bytes, StorageMetadata.Builder().setContentType("image/jpeg").build()).await()
            urls[slot.key] = ref.downloadUrl.await().toString()
            onProgress((i + 1f) / (PhotoSlot.entries.size + 1))
        }

        val certRef = db.collection(Collections.CERTIFICATES).document()
        val certNo = certificateNumber(qr.state, qr.serial)
        val now = Timestamp.now()
        val validTill = Timestamp(Calendar.getInstance().apply { add(Calendar.YEAR, 1) }.time)

        val vehicle = mapOf(
            "make" to form.vehicleMake,
            "category" to form.vehicleCategory,
            "fuelType" to form.fuelType,
            "passingRto" to form.passingRto,
            "registrationRto" to form.registrationRto,
            "series" to form.series.uppercase(),
            "vehicleNumber" to form.vehicleNumber,
            "mfgYear" to form.mfgYear,
            "chassisNo" to form.chassisNo.uppercase(),
            "engineNo" to form.engineNo.uppercase(),
        )
        val generatedAt = mapOf("address" to location.address, "lat" to location.lat, "lng" to location.lng)

        db.batch().apply {
            set(
                certRef,
                mapOf(
                    "certificateNo" to certNo,
                    "qrId" to qr.qrId,
                    "qrSerial" to qr.serial,
                    "companyId" to qr.companyId,
                    "companyName" to qr.companyName,
                    "state" to qr.state,
                    "productType" to qr.productType,
                    "dealerEmail" to dealerEmail,
                    "dealerName" to dealerName,
                    "vehicle" to vehicle,
                    "owner" to mapOf("name" to form.ownerName.trim(), "mobile" to form.ownerMobile),
                    "generatedAt" to generatedAt,
                    "imageUrls" to urls,
                    "copNumber" to qr.copNumber,
                    "copValidity" to qr.copValidity,
                    "validFrom" to now,
                    "validTill" to validTill,
                    "pdfUrl" to "",
                    "createdAt" to FieldValue.serverTimestamp(),
                ),
            )
            update(
                db.collection(Collections.QR_CODES).document(qr.qrId),
                mapOf("status" to "certified", "certificateId" to certRef.id),
            )
            // Public view behind the sticker URL — owner mobile is masked.
            set(
                db.collection(Collections.PUBLIC_CERTIFICATES).document(qr.qrId),
                mapOf(
                    "qrId" to qr.qrId,
                    "qrSerial" to qr.serial,
                    "certificateNo" to certNo,
                    "companyName" to qr.companyName,
                    "state" to qr.state,
                    "productType" to qr.productType,
                    "copNumber" to qr.copNumber,
                    "copValidity" to qr.copValidity,
                    "vehicle" to vehicle,
                    "ownerName" to form.ownerName.trim(),
                    "ownerMobileMasked" to "******" + form.ownerMobile.takeLast(4),
                    "generatedAt" to generatedAt,
                    "imageUrls" to urls,
                    "certifiedAt" to now,
                    "validFrom" to now,
                    "validTill" to validTill,
                    "pdfUrl" to "",
                ),
            )
        }.commit().await()
        onProgress(1f)
        return certNo
    }

    /** Downscale to MAX_PHOTO_PX, fix camera rotation, JPEG at 80%. */
    private fun compress(context: Context, uri: Uri): ByteArray {
        val resolver = context.contentResolver
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri).use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (bounds.outWidth / (sample * 2) >= MAX_PHOTO_PX || bounds.outHeight / (sample * 2) >= MAX_PHOTO_PX) sample *= 2
        val decoded = resolver.openInputStream(uri).use {
            BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
        } ?: error("Couldn't read photo")

        val rotation = resolver.openInputStream(uri).use { stream ->
            when (stream?.let { ExifInterface(it) }?.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                else -> 0f
            }
        }
        val scale = minOf(1f, MAX_PHOTO_PX.toFloat() / maxOf(decoded.width, decoded.height))
        val matrix = Matrix().apply { postScale(scale, scale); postRotate(rotation) }
        val bitmap = Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
        return ByteArrayOutputStream().use { out ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, out)
            out.toByteArray()
        }
    }
}
