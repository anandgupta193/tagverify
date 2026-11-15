package com.anand.tagverify.fitment

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil3.compose.AsyncImage
import com.anand.tagverify.ui.theme.Palette

/** Read-only summary + confirmation before generating the certificate. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VerifyScreen(
    viewModel: FitmentViewModel,
    dealer: com.anand.tagverify.auth.AppUser,
    onEdit: () -> Unit,
    onDone: () -> Unit,
) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val qr = s.qr ?: return
    val f = s.form
    val colors = MaterialTheme.colorScheme
    val uploading = s.submit as? SubmitStatus.Uploading
    val done = s.submit as? SubmitStatus.Done

    if (done != null) {
        CertificateDone(qrId = qr.qrId, certificateNo = done.certificateNo, vehicleNumber = f.vehicleNumber, onDone = onDone)
        return
    }

    Scaffold(
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = { Text("Verify Details") },
                navigationIcon = { IconButton(onClick = onEdit, enabled = uploading == null) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = colors.background),
            )
        },
        bottomBar = {
            Surface(shadowElevation = 12.dp, color = colors.surface) {
                Column(Modifier.navigationBarsPadding().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Confirmation
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .clip(MaterialTheme.shapes.medium)
                            .border(1.5.dp, if (s.confirmed) colors.primary else colors.outline, MaterialTheme.shapes.medium)
                            .clickable(enabled = uploading == null) { viewModel.setConfirmed(!s.confirmed) }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Checkbox(checked = s.confirmed, onCheckedChange = { viewModel.setConfirmed(it) }, enabled = uploading == null)
                        Column {
                            Text("I confirm that all information entered is correct.", style = MaterialTheme.typography.bodyMedium, color = colors.onSurface)
                            Text("मैंने विवरणों की जाँच कर ली है और पुष्टि करता हूँ कि वे सही हैं।", style = MaterialTheme.typography.bodySmall, color = colors.onSurfaceVariant)
                        }
                    }
                    AnimatedVisibility(uploading != null) {
                        Column {
                            LinearProgressIndicator(progress = { uploading?.progress ?: 0f }, modifier = Modifier.fillMaxWidth().clip(CircleShape))
                            Text("Uploading photos and generating certificate…", style = MaterialTheme.typography.bodySmall, color = colors.onSurfaceVariant, modifier = Modifier.padding(top = 6.dp))
                        }
                    }
                    (s.submit as? SubmitStatus.Failed)?.let {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Outlined.ErrorOutline, null, tint = colors.error, modifier = Modifier.size(18.dp))
                            Text(it.message, style = MaterialTheme.typography.bodySmall, color = colors.error)
                        }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(
                            onClick = onEdit,
                            enabled = uploading == null,
                            shape = MaterialTheme.shapes.small,
                            modifier = Modifier.weight(1f).height(52.dp),
                        ) {
                            Icon(Icons.Outlined.Edit, null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.size(8.dp))
                            Text("Edit details")
                        }
                        Button(
                            onClick = { viewModel.clearSubmitError(); viewModel.generate(dealer) },
                            enabled = s.confirmed && uploading == null,
                            shape = MaterialTheme.shapes.small,
                            colors = ButtonDefaults.buttonColors(containerColor = colors.primary),
                            modifier = Modifier.weight(1f).height(52.dp),
                        ) {
                            if (uploading != null) CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(18.dp), color = colors.onPrimary)
                            else {
                                Icon(Icons.Outlined.VerifiedUser, null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.size(8.dp))
                                Text("Generate")
                            }
                        }
                    }
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

            FormSection("Vehicle Details", "वाहन की सूची") {
                SummaryRow("Vehicle Number", f.vehicleNumber, highlight = true)
                SummaryRow("Vehicle Make", f.vehicleMake)
                SummaryRow("Vehicle Category", f.vehicleCategory)
                SummaryRow("Fuel Type", f.fuelType)
                SummaryRow("Passing RTO", f.passingRto)
                SummaryRow("Registration RTO", f.registrationRto)
                SummaryRow("Manufacturing Year", f.mfgYear)
                SummaryRow("Chassis No", f.chassisNo)
                SummaryRow("Engine No", f.engineNo, last = true)
            }

            FormSection("Owner Details", "वाहन मालिक का विवरण") {
                SummaryRow("Owner Name", f.ownerName)
                SummaryRow("Owner Contact", f.ownerMobile)
                SummaryRow("Location", s.locationValue?.display.orEmpty(), last = true)
            }

            FormSection("Fitment Photos", "फिटमेंट की तस्वीरें") {
                PhotoSlot.entries.chunked(2).forEach { pair ->
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        pair.forEach { slot ->
                            Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                                AsyncImage(
                                    model = f.photos[slot],
                                    contentDescription = slot.label,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxWidth().aspectRatio(1f).clip(MaterialTheme.shapes.medium).background(colors.surfaceVariant),
                                )
                                Text(slot.label, style = MaterialTheme.typography.labelMedium, color = colors.onSurfaceVariant, modifier = Modifier.padding(top = 6.dp))
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String, highlight: Boolean = false, last: Boolean = false) {
    val colors = MaterialTheme.colorScheme
    Column {
        Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.Top) {
            Text(label, style = MaterialTheme.typography.bodyMedium, color = colors.onSurfaceVariant, modifier = Modifier.weight(0.45f))
            Text(
                value.ifBlank { "—" },
                style = if (highlight) MaterialTheme.typography.titleMedium else MaterialTheme.typography.titleSmall,
                color = if (highlight) colors.primary else colors.onSurface,
                textAlign = TextAlign.End,
                modifier = Modifier.weight(0.55f),
            )
        }
        if (!last) HorizontalDivider(color = colors.outlineVariant, modifier = Modifier.padding(top = 8.dp))
    }
}

/** Success screen after the certificate is generated. */
@Composable
private fun CertificateDone(qrId: String, certificateNo: String, vehicleNumber: String, onDone: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    Box(Modifier.fillMaxSize().background(colors.background).padding(24.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.size(96.dp).clip(CircleShape).background(Palette.SuccessSoft), contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.CheckCircle, null, tint = Palette.Success, modifier = Modifier.size(64.dp))
            }
            Spacer(Modifier.height(20.dp))
            Text("Certificate generated", style = MaterialTheme.typography.headlineMedium, color = colors.onSurface)
            Spacer(Modifier.height(6.dp))
            Text(vehicleNumber, style = MaterialTheme.typography.titleLarge, color = colors.primary)
            Spacer(Modifier.height(16.dp))
            Column(
                Modifier.fillMaxWidth().clip(MaterialTheme.shapes.medium).background(colors.surface).border(1.dp, colors.outlineVariant, MaterialTheme.shapes.medium).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text("Certificate number", style = MaterialTheme.typography.labelMedium, color = colors.onSurfaceVariant)
                Text(certificateNo, style = MaterialTheme.typography.titleMedium, color = colors.onSurface)
                Text("QR $qrId", style = MaterialTheme.typography.bodySmall, color = colors.onSurfaceVariant)
            }
            Spacer(Modifier.height(12.dp))
            Text(
                "Anyone who scans this sticker will now see the certificate.",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(24.dp))
            val context = androidx.compose.ui.platform.LocalContext.current
            Button(
                onClick = {
                    runCatching {
                        context.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(com.anand.tagverify.data.QrRepository.publicUrl(qrId))))
                    }
                },
                shape = MaterialTheme.shapes.small,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) { Text("View certificate") }
            Spacer(Modifier.height(10.dp))
            OutlinedButton(onClick = onDone, shape = MaterialTheme.shapes.small, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Back to home") }
        }
    }
}
