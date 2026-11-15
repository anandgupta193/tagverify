package com.anand.tagverify.scan

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.automirrored.outlined.HelpOutline
import androidx.compose.material.icons.outlined.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.anand.tagverify.config.AppConfig
import com.anand.tagverify.data.QrContext
import com.anand.tagverify.data.QrLookup
import com.anand.tagverify.data.QrRepository
import com.anand.tagverify.ui.theme.Palette

/**
 * After a scan: looks the QR up and either hands off to the fitment form
 * ([onReady]) or explains why it can't be certified.
 */
@Composable
fun ScanOutcomeScreen(
    scan: ScanResult,
    myCompanyId: String?,
    onReady: (QrContext) -> Unit,
    onScanAgain: () -> Unit,
    onHome: () -> Unit,
) {
    var attempt by remember { mutableIntStateOf(0) }
    val result by produceState<QrLookup?>(null, scan.rawValue, attempt) {
        value = null
        value = QrRepository.lookup(scan.rawValue, myCompanyId)
    }
    LaunchedEffect(result) { (result as? QrLookup.Ready)?.let { onReady(it.qr) } }

    when (val r = result) {
        null, is QrLookup.Ready -> Loading()
        is QrLookup.NotTagVerify -> ScanResultScreen(result = scan, onScanAgain = onScanAgain, onDone = onHome, notice = "This isn't a TagVerify sticker. Here's what it contains:")
        is QrLookup.AlreadyCertified -> {
            val context = LocalContext.current
            Outcome(
                icon = Icons.Outlined.Verified, tint = Palette.Success, tintSoft = Palette.SuccessSoft,
                title = "Already certified", subtitle = "${r.qrId} already has a certificate. Each sticker can be certified only once.",
                primary = "View certificate" to { runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(r.publicUrl))) } },
                secondary = "Scan another" to onScanAgain,
            )
        }
        is QrLookup.OtherCompany -> Outcome(
            icon = Icons.Outlined.Block, tint = Palette.Error, tintSoft = Palette.ErrorSoft,
            title = "Not your company's QR", subtitle = "${r.qrId} isn't registered to your company. You can only certify your own company's stickers.",
            primary = "Scan another" to onScanAgain, secondary = "Home" to onHome,
        )
        is QrLookup.NotRegistered -> Outcome(
            icon = Icons.AutoMirrored.Outlined.HelpOutline, tint = Palette.Warning, tintSoft = Palette.WarningSoft,
            title = "QR not registered", subtitle = "${r.qrId} isn't in TagVerify. Please contact the admin, ${AppConfig.ADMIN_NAME}.",
            primary = "Scan another" to onScanAgain, secondary = "Home" to onHome,
        )
        is QrLookup.Error -> Outcome(
            icon = Icons.Outlined.CloudOff, tint = Palette.Warning, tintSoft = Palette.WarningSoft,
            title = "Couldn't check this QR", subtitle = r.message,
            primary = "Try again" to { attempt++ }, secondary = "Scan another" to onScanAgain,
        )
    }
}

@Composable
private fun Loading() {
    Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(Modifier.height(16.dp))
            Text("Checking sticker…", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun Outcome(
    icon: ImageVector,
    tint: Color,
    tintSoft: Color,
    title: String,
    subtitle: String,
    primary: Pair<String, () -> Unit>,
    secondary: Pair<String, () -> Unit>,
) {
    val colors = MaterialTheme.colorScheme
    Box(Modifier.fillMaxSize().background(colors.background).padding(24.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.size(88.dp).clip(CircleShape).background(tintSoft), contentAlignment = Alignment.Center) {
                Icon(icon, null, tint = tint, modifier = Modifier.size(48.dp))
            }
            Text(title, style = MaterialTheme.typography.headlineSmall, color = colors.onSurface, textAlign = TextAlign.Center)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = colors.onSurfaceVariant, textAlign = TextAlign.Center)
            Spacer(Modifier.height(12.dp))
            Button(onClick = primary.second, shape = MaterialTheme.shapes.small, modifier = Modifier.fillMaxWidth().height(52.dp)) {
                if (primary.first.startsWith("Scan")) { Icon(Icons.Filled.QrCodeScanner, null); Spacer(Modifier.size(8.dp)) }
                Text(primary.first)
            }
            OutlinedButton(onClick = secondary.second, shape = MaterialTheme.shapes.small, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(secondary.first) }
        }
    }
}
