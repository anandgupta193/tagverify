package com.anand.tagverify.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.anand.tagverify.R

/**
 * TagVerify palette — the single source of colour for the app.
 * Mirrors docs/DESIGN_SYSTEM.md and the admin web app (constants/theme.ts).
 */
object Palette {
    val Primary50 = Color(0xFFEEF2FF)
    val Primary100 = Color(0xFFE0E7FF)
    val Primary200 = Color(0xFFC7D2FE)
    val Primary300 = Color(0xFFA5B4FC)
    val Primary400 = Color(0xFF818CF8)
    val Primary500 = Color(0xFF6366F1)
    val Primary600 = Color(0xFF4F46E5)
    val Primary700 = Color(0xFF4338CA)
    val Primary900 = Color(0xFF312E81)

    // Neutrals tinted toward indigo (never pure grey)
    val Neutral0 = Color(0xFFFFFFFF)
    val Neutral50 = Color(0xFFF4F5FA)
    val Neutral100 = Color(0xFFECEEF6)
    val Neutral200 = Color(0xFFE1E4EF)
    val Neutral400 = Color(0xFF9DA3BA)
    val Neutral500 = Color(0xFF6E7491)
    val Neutral700 = Color(0xFF353A54)
    val Neutral800 = Color(0xFF23263B)
    val Neutral900 = Color(0xFF14162A)
    val Neutral950 = Color(0xFF0B0C18)

    val Success = Color(0xFF10B981)
    val SuccessSoft = Color(0xFFECFDF5)
    val Warning = Color(0xFFF59E0B)
    val WarningSoft = Color(0xFFFFFBEB)
    val Error = Color(0xFFEF4444)
    val ErrorSoft = Color(0xFFFEF2F2)

    val BrandGradient = Brush.linearGradient(listOf(Primary500, Primary400))
}

private val LightColors = lightColorScheme(
    primary = Palette.Primary500,
    onPrimary = Palette.Neutral0,
    primaryContainer = Palette.Primary100,
    onPrimaryContainer = Palette.Primary900,
    secondary = Palette.Primary400,
    onSecondary = Palette.Neutral0,
    secondaryContainer = Palette.Primary50,
    onSecondaryContainer = Palette.Primary700,
    tertiary = Palette.Success,
    tertiaryContainer = Palette.SuccessSoft,
    onTertiaryContainer = Color(0xFF065F46),
    error = Palette.Error,
    errorContainer = Palette.ErrorSoft,
    background = Palette.Neutral50,
    onBackground = Palette.Neutral900,
    surface = Palette.Neutral0,
    onSurface = Palette.Neutral900,
    surfaceVariant = Palette.Neutral100,
    onSurfaceVariant = Palette.Neutral500,
    surfaceContainerLowest = Palette.Neutral0,
    surfaceContainerLow = Palette.Neutral50,
    surfaceContainer = Palette.Neutral100,
    outline = Palette.Neutral200,
    outlineVariant = Palette.Neutral100,
)

private val DarkColors = darkColorScheme(
    primary = Palette.Primary400,
    onPrimary = Palette.Neutral950,
    primaryContainer = Palette.Primary700,
    onPrimaryContainer = Palette.Primary100,
    secondary = Palette.Primary300,
    secondaryContainer = Palette.Primary900,
    onSecondaryContainer = Palette.Primary100,
    tertiary = Palette.Success,
    error = Palette.Error,
    background = Palette.Neutral950,
    onBackground = Palette.Neutral100,
    surface = Palette.Neutral900,
    onSurface = Palette.Neutral100,
    surfaceVariant = Palette.Neutral800,
    onSurfaceVariant = Palette.Neutral400,
    outline = Palette.Neutral700,
    outlineVariant = Palette.Neutral800,
)

private fun outfit(weight: Int) = Font(
    R.font.outfit_variable,
    weight = FontWeight(weight),
    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

/** Outfit — same font as the admin web app and expense-manager. */
val Outfit = FontFamily(outfit(400), outfit(500), outfit(600), outfit(700))

private fun style(size: Int, line: Int, weight: Int, tracking: Double = 0.0) = TextStyle(
    fontFamily = Outfit,
    fontSize = size.sp,
    lineHeight = line.sp,
    fontWeight = FontWeight(weight),
    letterSpacing = tracking.em,
)

/** Type scale from docs/DESIGN_SYSTEM.md (display / H1 / H2 / title / body / caption / overline). */
private val AppTypography = Typography(
    displaySmall = style(32, 38, 700, -0.02),
    headlineLarge = style(30, 36, 700, -0.02),
    headlineMedium = style(26, 32, 700, -0.015),
    headlineSmall = style(22, 28, 700, -0.01),
    titleLarge = style(20, 28, 600, -0.01),
    titleMedium = style(16, 24, 600),
    titleSmall = style(14, 20, 600),
    bodyLarge = style(16, 24, 400),
    bodyMedium = style(14, 22, 400),
    bodySmall = style(12, 16, 400),
    labelLarge = style(15, 20, 600),
    labelMedium = style(12, 16, 500, 0.01),
    labelSmall = style(11, 16, 600, 0.08),
)

private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

@Composable
fun TagVerifyTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}
