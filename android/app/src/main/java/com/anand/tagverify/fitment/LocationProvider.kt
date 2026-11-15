package com.anand.tagverify.fitment

import android.annotation.SuppressLint
import android.content.Context
import android.location.Address
import android.location.Geocoder
import android.location.LocationManager
import android.os.Build
import androidx.core.location.LocationManagerCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.Locale
import kotlin.coroutines.resume

/** Current GPS position + human-readable address for the certificate. */
object LocationProvider {

    fun isLocationOn(context: Context): Boolean {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return LocationManagerCompat.isLocationEnabled(lm)
    }

    /** Requires location permission to be granted already. Returns null if no fix. */
    @SuppressLint("MissingPermission")
    suspend fun current(context: Context): FitmentLocation? {
        val client = LocationServices.getFusedLocationProviderClient(context)
        val loc = runCatching {
            client.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, CancellationTokenSource().token).await()
        }.getOrNull() ?: runCatching { client.lastLocation.await() }.getOrNull() ?: return null
        val address = reverseGeocode(context, loc.latitude, loc.longitude)
        return FitmentLocation(loc.latitude, loc.longitude, address ?: "Unknown area", accuracyM = loc.accuracy, capturedAt = loc.time)
    }

    /** "Korba, Chhattisgarh, 495450" or null when the geocoder isn't available. */
    private suspend fun reverseGeocode(context: Context, lat: Double, lng: Double): String? {
        if (!Geocoder.isPresent()) return null
        val geocoder = Geocoder(context, Locale.ENGLISH)
        val address: Address? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            suspendCancellableCoroutine { cont ->
                geocoder.getFromLocation(lat, lng, 1, object : Geocoder.GeocodeListener {
                    override fun onGeocode(addresses: MutableList<Address>) = cont.resume(addresses.firstOrNull())
                    override fun onError(errorMessage: String?) = cont.resume(null)
                })
            }
        } else {
            withContext(Dispatchers.IO) {
                @Suppress("DEPRECATION")
                runCatching { geocoder.getFromLocation(lat, lng, 1)?.firstOrNull() }.getOrNull()
            }
        }
        address ?: return null
        val city = address.locality ?: address.subAdminArea ?: address.subLocality
        return listOfNotNull(city, address.adminArea, address.postalCode).joinToString(", ").ifBlank { null }
    }
}
