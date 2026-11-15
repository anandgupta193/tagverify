package com.anand.tagverify.fitment

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.MyLocation
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.anand.tagverify.ui.theme.Palette
import java.io.File

private fun photoUri(context: Context, qrId: String, slot: PhotoSlot): Uri {
    val dir = File(context.cacheDir, "fitment").apply { mkdirs() }
    // New file name per capture so the thumbnail refreshes on retake.
    val file = File(dir, "${qrId}_${slot.key}_${System.currentTimeMillis()}.jpg")
    return FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
}

private fun hasLocationPermission(context: Context) =
    ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FitmentFormScreen(viewModel: FitmentViewModel, onBack: () -> Unit, onReview: () -> Unit) {
    val context = LocalContext.current
    val s by viewModel.state.collectAsStateWithLifecycle()
    val qr = s.qr ?: return
    val form = s.form
    val err = if (s.showErrors) s.errors else emptyMap()
    val colors = MaterialTheme.colorScheme

    // ── Location (mandatory) ────────────────────────────────────────────────
    val locationPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { granted ->
        if (granted.values.any { it }) viewModel.refreshLocation() else viewModel.setLocationStatus(LocationStatus.NeedsPermission)
    }
    fun requestLocation() {
        if (hasLocationPermission(context)) viewModel.refreshLocation()
        else locationPermission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
    }
    LaunchedEffect(qr.qrId) { if (s.locationValue == null) requestLocation() }

    // ── Camera ──────────────────────────────────────────────────────────────
    var pending by rememberSaveable { mutableStateOf<Pair<String, String>?>(null) } // slot key -> uri
    val takePicture = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        val p = pending
        if (ok && p != null) PhotoSlot.entries.firstOrNull { it.key == p.first }?.let { viewModel.setPhoto(it, Uri.parse(p.second)) }
        pending = null
    }
    var cameraDenied by remember { mutableStateOf(false) }
    var queuedSlot by remember { mutableStateOf<PhotoSlot?>(null) }
    fun launchCamera(slot: PhotoSlot) {
        val uri = photoUri(context, qr.qrId, slot)
        pending = slot.key to uri.toString()
        takePicture.launch(uri)
    }
    val cameraPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val slot = queuedSlot
        queuedSlot = null
        if (granted && slot != null) launchCamera(slot) else if (!granted) cameraDenied = true
    }
    fun capture(slot: PhotoSlot) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED) launchCamera(slot)
        else { queuedSlot = slot; cameraPermission.launch(Manifest.permission.CAMERA) }
    }

    Scaffold(
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = { Text("Fitment Form") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = colors.background),
            )
        },
        bottomBar = {
            Surface(shadowElevation = 12.dp, color = colors.surface) {
                Column(Modifier.navigationBarsPadding().padding(16.dp)) {
                    if (s.showErrors && s.errors.isNotEmpty()) {
                        Text(
                            "${s.errors.size} thing${if (s.errors.size == 1) "" else "s"} left to fill — see the highlighted fields",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.error,
                            modifier = Modifier.padding(bottom = 8.dp),
                        )
                    }
                    Button(
                        onClick = { if (viewModel.validateForReview()) onReview() },
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                    ) { Text("Review details", style = MaterialTheme.typography.labelLarge) }
                }
            }
        },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            QrHeaderChips(qr)
            Text(
                "Kindly fill below details as per RC / Form 28, 29 / Form 20",
                style = MaterialTheme.typography.labelMedium,
                color = Palette.Error,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )

            FormSection("Vehicle Details", "वाहन की सूची") {
                DropdownField("Vehicle Make", "वाहन निर्माता", form.vehicleMake, s.masters.makes, { v -> viewModel.edit { copy(vehicleMake = v) } }, err["vehicleMake"])
                DropdownField("Vehicle Category", "वाहन श्रेणी", form.vehicleCategory, s.masters.categories, { v -> viewModel.edit { copy(vehicleCategory = v) } }, err["vehicleCategory"])
                DropdownField("Fuel Type", "ईंधन का प्रकार", form.fuelType, s.masters.fuelTypes, { v -> viewModel.edit { copy(fuelType = v) } }, err["fuelType"])
                val rtoLabel = { code: String -> s.masters.rtos.firstOrNull { it.code == code }?.label ?: code }
                DropdownField("Passing RTO", "पासिंग आर.टी.ओ.", form.passingRto, s.masters.rtos.map { it.code }, { v -> viewModel.edit { copy(passingRto = v) } }, err["passingRto"], rtoLabel)
                DropdownField("Registration RTO", "पंजीकरण आर.टी.ओ.", form.registrationRto, s.masters.rtos.map { it.code }, { v -> viewModel.edit { copy(registrationRto = v) } }, err["registrationRto"], rtoLabel)
                TextField(
                    "Series", "श्रृंखला", form.series, { v -> viewModel.edit { copy(series = v.uppercase().filter { it.isLetterOrDigit() }) } }, err["series"],
                    capitalization = KeyboardCapitalization.Characters, maxLength = 7,
                    hint = "Only the part after the registration RTO, e.g. AS9879",
                )
                ReadOnlyField("Vehicle Number", "वाहन संख्या (auto)", if (form.registrationRto.isNotBlank()) form.vehicleNumber else "", placeholder = "Select RTO and enter series")
                DropdownField("Manufacturing Year", "निर्माण वर्ष", form.mfgYear, s.masters.mfgYears, { v -> viewModel.edit { copy(mfgYear = v) } }, err["mfgYear"])
                TextField("Chassis No", "चेसिस नंबर", form.chassisNo, { v -> viewModel.edit { copy(chassisNo = v.uppercase().filter { it.isLetterOrDigit() }) } }, err["chassisNo"], capitalization = KeyboardCapitalization.Characters, maxLength = 5, hint = "Last 5 characters")
                TextField("Engine No", "इंजन नंबर", form.engineNo, { v -> viewModel.edit { copy(engineNo = v.uppercase().filter { it.isLetterOrDigit() }) } }, err["engineNo"], capitalization = KeyboardCapitalization.Characters, maxLength = 5, hint = "Last 5 characters")
            }

            FormSection("Owner Details", "वाहन मालिक का विवरण") {
                TextField("Owner Name", "मालिक का नाम", form.ownerName, { v -> viewModel.edit { copy(ownerName = v) } }, err["ownerName"], capitalization = KeyboardCapitalization.Words)
                TextField("Owner Contact", "मालिक का संपर्क", form.ownerMobile, { v -> viewModel.edit { copy(ownerMobile = v.filter { it.isDigit() }) } }, err["ownerMobile"], keyboardType = KeyboardType.Phone, maxLength = 10)
                LocationRow(s.location, err["location"] != null, onRetry = { requestLocation() })
            }

            FormSection("Fitment Photos", "फिटमेंट की तस्वीरें") {
                PhotoSlot.entries.chunked(2).forEach { pair ->
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        pair.forEach { slot ->
                            PhotoTile(slot, form.photos[slot], err["photo_${slot.key}"], onCapture = { capture(slot) }, modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }

    // "Location Required" — same behaviour as the reference app.
    if (s.location is LocationStatus.ServicesOff || s.location is LocationStatus.NeedsPermission) {
        val off = s.location is LocationStatus.ServicesOff
        AlertDialog(
            onDismissRequest = {},
            icon = { Icon(Icons.Outlined.LocationOn, null, tint = colors.primary) },
            title = { Text("Location required") },
            text = { Text("Please enable location to generate certificates. Location is mandatory for tracking where the certificate is generated.") },
            confirmButton = {
                TextButton(onClick = {
                    val intent = if (off) Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)
                    else Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", context.packageName, null))
                    context.startActivity(intent)
                }) { Text("Open settings") }
            },
            dismissButton = {
                Row {
                    TextButton(onClick = onBack) { Text("Back") }
                    TextButton(onClick = { requestLocation() }) { Text("Retry") }
                }
            },
        )
    }
    if (cameraDenied) {
        AlertDialog(
            onDismissRequest = { cameraDenied = false },
            title = { Text("Camera needed") },
            text = { Text("Allow camera access to take the fitment photos.") },
            confirmButton = { TextButton(onClick = { cameraDenied = false }) { Text("OK") } },
        )
    }
}

@Composable
private fun LocationRow(status: LocationStatus, isError: Boolean, onRetry: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    Row(
        Modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.small)
            .background(if (isError) colors.errorContainer else colors.secondaryContainer)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(Modifier.size(36.dp).clip(MaterialTheme.shapes.small).background(colors.surface), contentAlignment = Alignment.Center) {
            if (status is LocationStatus.Fetching) CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
            else Icon(Icons.Outlined.MyLocation, null, tint = colors.primary, modifier = Modifier.size(20.dp))
        }
        Column(Modifier.weight(1f)) {
            Text("Location / स्थान", style = MaterialTheme.typography.labelMedium, color = colors.onSecondaryContainer)
            Text(
                when (status) {
                    is LocationStatus.Ready -> status.location.display
                    LocationStatus.Fetching -> "Detecting location…"
                    LocationStatus.Failed -> "Couldn't get a GPS fix — tap Retry"
                    else -> "Location needed"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = colors.onSurface,
            )
        }
        if (status !is LocationStatus.Ready && status !is LocationStatus.Fetching) {
            TextButton(onClick = onRetry) { Text("Retry") }
        } else if (status is LocationStatus.Ready) {
            TextButton(onClick = onRetry) { Text("Refresh", color = colors.primary) }
        }
    }
}
