package com.anand.tagverify.fitment

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.AddAPhoto
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.anand.tagverify.data.QrContext
import com.anand.tagverify.ui.components.SurfaceCard
import com.anand.tagverify.ui.theme.Palette

/** Card with a gradient title strip ("Vehicle Details / वाहन की सूची"). */
@Composable
fun FormSection(title: String, titleHi: String, content: @Composable ColumnScope.() -> Unit) {
    SurfaceCard(Modifier.fillMaxWidth()) {
        Column {
            Column(
                Modifier.fillMaxWidth().background(Palette.BrandGradient).padding(vertical = 14.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = Color.White)
                Text(titleHi, style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = .85f))
            }
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp), content = content)
        }
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
    focusedBorderColor = MaterialTheme.colorScheme.primary,
    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
    focusedContainerColor = MaterialTheme.colorScheme.surface,
)

/** Bilingual label, e.g. "Vehicle Make / वाहन निर्माता". */
@Composable
private fun BiLabel(en: String, hi: String) = Text("$en / $hi")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DropdownField(
    label: String,
    labelHi: String,
    value: String,
    options: List<String>,
    onSelect: (String) -> Unit,
    error: String?,
    display: (String) -> String = { it },
) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
        OutlinedTextField(
            value = if (value.isBlank()) "" else display(value),
            onValueChange = {},
            readOnly = true,
            label = { BiLabel(label, labelHi) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            isError = error != null,
            supportingText = error?.let { { Text(it) } },
            shape = MaterialTheme.shapes.small,
            colors = fieldColors(),
            singleLine = true,
            modifier = Modifier.fillMaxWidth().menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { opt ->
                DropdownMenuItem(
                    text = { Text(display(opt)) },
                    onClick = { onSelect(opt); expanded = false },
                    contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding,
                )
            }
        }
    }
}

@Composable
fun TextField(
    label: String,
    labelHi: String,
    value: String,
    onChange: (String) -> Unit,
    error: String?,
    keyboardType: KeyboardType = KeyboardType.Text,
    capitalization: KeyboardCapitalization = KeyboardCapitalization.None,
    maxLength: Int = 60,
    hint: String? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = { if (it.length <= maxLength) onChange(it) },
        label = { BiLabel(label, labelHi) },
        isError = error != null,
        supportingText = (error ?: hint)?.let { msg -> { Text(msg, color = if (error != null) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant) } },
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType, capitalization = capitalization),
        shape = MaterialTheme.shapes.small,
        colors = fieldColors(),
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
    )
}

/** Greyed, non-editable value (e.g. auto-generated vehicle number, GPS location). */
@Composable
fun ReadOnlyField(label: String, labelHi: String, value: String, placeholder: String = "—") {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.small)
            .background(MaterialTheme.colorScheme.secondaryContainer)
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("$label / $labelHi", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSecondaryContainer, modifier = Modifier.weight(1f))
            Icon(Icons.Outlined.Lock, null, tint = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = .6f), modifier = Modifier.size(14.dp))
        }
        Spacer(Modifier.height(2.dp))
        Text(
            value.ifBlank { placeholder },
            style = MaterialTheme.typography.titleMedium.copy(fontFamily = if (value.isNotBlank()) FontFamily.Monospace else null),
            color = if (value.isBlank()) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
        )
    }
}

/** State · OEM · QR serial · Product — read from the sticker. */
@Composable
fun QrHeaderChips(qr: QrContext) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            InfoChip("State", qr.state, Modifier.weight(1f))
            InfoChip("OEM", qr.companyName, Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            InfoChip("QR Serial", qr.qrId, Modifier.weight(1f))
            InfoChip("Product", qr.productType.ifBlank { "—" }, Modifier.weight(1f))
        }
    }
}

@Composable
private fun InfoChip(label: String, value: String, modifier: Modifier) {
    Column(
        modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Palette.BrandGradient)
            .padding(horizontal = 14.dp, vertical = 10.dp),
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = Color.White.copy(alpha = .8f))
        Text(value, style = MaterialTheme.typography.titleSmall, color = Color.White, maxLines = 1)
    }
}

/** One photo tile: thumbnail (or placeholder) + camera button. */
@Composable
fun PhotoTile(slot: PhotoSlot, uri: Uri?, error: String?, onCapture: () -> Unit, modifier: Modifier = Modifier) {
    val colors = MaterialTheme.colorScheme
    Column(modifier) {
        Box(
            Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(MaterialTheme.shapes.medium)
                .background(colors.surfaceVariant)
                .border(1.dp, if (error != null) colors.error else colors.outline, MaterialTheme.shapes.medium)
                .clickable(onClick = onCapture),
            contentAlignment = Alignment.Center,
        ) {
            if (uri != null) {
                AsyncImage(model = uri, contentDescription = slot.label, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                Box(Modifier.align(Alignment.TopEnd).padding(8.dp).size(26.dp).clip(CircleShape).background(Color.White), contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.CheckCircle, null, tint = Palette.Success, modifier = Modifier.size(24.dp))
                }
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Outlined.AddAPhoto, null, tint = colors.primary, modifier = Modifier.size(30.dp))
                    Spacer(Modifier.height(6.dp))
                    Text("Tap to capture", style = MaterialTheme.typography.labelMedium, color = colors.onSurfaceVariant)
                }
            }
        }
        Spacer(Modifier.height(6.dp))
        Text(slot.label, style = MaterialTheme.typography.titleSmall, color = colors.onSurface)
        Text(if (uri != null) "Tap to retake" else slot.labelHi, style = MaterialTheme.typography.bodySmall, color = if (error != null && uri == null) colors.error else colors.onSurfaceVariant)
    }
}
