package com.anand.tagverify.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.EditNote
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.QrCode2
import androidx.compose.material.icons.outlined.Verified
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.anand.tagverify.auth.AppUser
import com.anand.tagverify.ui.components.Overline
import com.anand.tagverify.ui.components.SurfaceCard
import com.anand.tagverify.ui.theme.Palette
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    user: AppUser,
    onScan: () -> Unit,
    onProfile: () -> Unit,
    onLogout: () -> Unit,
) {
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val colors = MaterialTheme.colorScheme
    fun comingSoon(what: String) {
        scope.launch { snackbar.showSnackbar("$what is coming in the next build.") }
    }
    val firstName = user.name.substringBefore(' ').ifBlank { "there" }

    Scaffold(
        containerColor = colors.background,
        snackbarHost = { SnackbarHost(snackbar) },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onScan,
                icon = { Icon(Icons.Filled.QrCodeScanner, contentDescription = null) },
                text = { Text("Scan QR", style = MaterialTheme.typography.labelLarge) },
                containerColor = colors.primary,
                contentColor = colors.onPrimary,
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier.navigationBarsPadding(),
            )
        },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(bottom = padding.calculateBottomPadding() + 88.dp),
        ) {
            // ── Hero ─────────────────────────────────────────────────────────
            Box(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
                    .background(Palette.BrandGradient)
                    .statusBarsPadding()
                    .padding(start = 20.dp, end = 8.dp, top = 8.dp, bottom = 72.dp),
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("TagVerify", style = MaterialTheme.typography.titleMedium, color = Color.White, modifier = Modifier.weight(1f))
                        IconButton(onClick = onLogout) {
                            Icon(Icons.AutoMirrored.Outlined.Logout, contentDescription = "Log out", tint = Color.White)
                        }
                    }
                    Spacer(Modifier.height(20.dp))
                    Overline("Dealer", color = Color.White.copy(alpha = 0.75f))
                    Text("Hello, $firstName", style = MaterialTheme.typography.headlineLarge, color = Color.White)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Every sticker you certify protects a genuine radium.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.85f),
                    )
                }
            }

            // ── Primary action card (overlaps the hero) ──────────────────────
            Column(Modifier.offset(y = (-48).dp).padding(horizontal = 16.dp)) {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .shadow(16.dp, MaterialTheme.shapes.large, ambientColor = Palette.Primary500.copy(alpha = .25f), spotColor = Palette.Primary500.copy(alpha = .25f))
                        .clip(MaterialTheme.shapes.large)
                        .background(colors.surface)
                        .clickable(onClick = onScan)
                        .padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Box(
                        Modifier.size(56.dp).clip(RoundedCornerShape(16.dp)).background(Palette.BrandGradient),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Filled.QrCodeScanner, contentDescription = null, tint = Color.White, modifier = Modifier.size(30.dp))
                    }
                    Column(Modifier.weight(1f)) {
                        Text("Scan a QR sticker", style = MaterialTheme.typography.titleLarge, color = colors.onSurface)
                        Text(
                            "Open the camera and point it at the code on the radium",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.onSurfaceVariant,
                        )
                    }
                    Box(Modifier.size(36.dp).clip(CircleShape).background(colors.secondaryContainer), contentAlignment = Alignment.Center) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowForward, contentDescription = null, tint = colors.primary, modifier = Modifier.size(18.dp))
                    }
                }

                Spacer(Modifier.height(16.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    QuickTile(
                        icon = Icons.Outlined.Description,
                        title = "My certificates",
                        subtitle = "Issued by you",
                        tint = Palette.Success,
                        onClick = { comingSoon("My certificates") },
                        modifier = Modifier.weight(1f),
                    )
                    QuickTile(
                        icon = Icons.Outlined.Person,
                        title = "Profile",
                        subtitle = user.companyId.ifBlank { user.email },
                        tint = Palette.Primary500,
                        onClick = onProfile,
                        modifier = Modifier.weight(1f),
                    )
                }

                Spacer(Modifier.height(28.dp))
                Overline("How it works", color = colors.onSurfaceVariant)
                Spacer(Modifier.height(12.dp))
                SurfaceCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(vertical = 8.dp)) {
                        Step(1, Icons.Outlined.QrCode2, "Stick & scan", "Fix the QR sticker on the radium and scan it.")
                        Step(2, Icons.Outlined.EditNote, "Fill the details", "Vehicle, owner and four photos.")
                        Step(3, Icons.Outlined.Verified, "Certificate issued", "Anyone can scan the QR to verify it's genuine.")
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickTile(
    icon: ImageVector,
    title: String,
    subtitle: String,
    tint: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    SurfaceCard(modifier.clickable(onClick = onClick)) {
        Column(Modifier.padding(16.dp)) {
            Box(Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(tint.copy(alpha = 0.12f)), contentAlignment = Alignment.Center) {
                Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.height(12.dp))
            Text(title, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onSurface)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun Step(n: Int, icon: ImageVector, title: String, text: String) {
    val colors = MaterialTheme.colorScheme
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(36.dp).clip(CircleShape).background(colors.secondaryContainer), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, tint = colors.primary, modifier = Modifier.size(18.dp))
        }
        Spacer(Modifier.size(14.dp))
        Column(Modifier.weight(1f)) {
            Text("$n. $title", style = MaterialTheme.typography.titleSmall, color = colors.onSurface)
            Text(text, style = MaterialTheme.typography.bodySmall, color = colors.onSurfaceVariant)
        }
    }
}
