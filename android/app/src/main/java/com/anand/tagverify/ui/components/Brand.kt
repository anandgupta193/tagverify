package com.anand.tagverify.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.anand.tagverify.ui.theme.Palette

/** Logo tile: QR corner marks + check on the brand gradient (same as the web app). */
@Composable
fun BrandMark(size: Dp = 40.dp, modifier: Modifier = Modifier) {
    Box(
        modifier
            .size(size)
            .shadow(size / 4, RoundedCornerShape(size * 0.28f), ambientColor = Palette.Primary500, spotColor = Palette.Primary500)
            .clip(RoundedCornerShape(size * 0.28f))
            .background(Palette.BrandGradient),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.size(size * 0.6f)) {
            val s = this.size.width
            val w = s * 0.09f
            val l = s * 0.28f
            val p = s * 0.08f
            val q = s - p
            val stroke = Stroke(width = w, cap = StrokeCap.Round, join = StrokeJoin.Round)
            listOf(
                Triple(Offset(p, p), 1f, 1f), Triple(Offset(q, p), -1f, 1f),
                Triple(Offset(q, q), -1f, -1f), Triple(Offset(p, q), 1f, -1f),
            ).forEach { (o, dx, dy) ->
                val path = Path().apply {
                    moveTo(o.x, o.y + dy * l); lineTo(o.x, o.y); lineTo(o.x + dx * l, o.y)
                }
                drawPath(path, Color.White, style = stroke)
            }
            val check = Path().apply {
                moveTo(s * 0.30f, s * 0.52f); lineTo(s * 0.44f, s * 0.65f); lineTo(s * 0.72f, s * 0.36f)
            }
            drawPath(check, Color.White, style = Stroke(width = w * 1.15f, cap = StrokeCap.Round, join = StrokeJoin.Round))
        }
    }
}

/** Soft indigo gradient-mesh backdrop (expense-manager / QuillBot style). */
@Composable
fun MeshBackground(modifier: Modifier = Modifier, content: @Composable BoxScope.() -> Unit) {
    val bg = MaterialTheme.colorScheme.background
    val primary = MaterialTheme.colorScheme.primary
    Box(
        modifier
            .fillMaxSize()
            .background(bg)
            .background(
                Brush.radialGradient(
                    listOf(primary.copy(alpha = 0.16f), Color.Transparent),
                    center = Offset(150f, 500f), radius = 900f,
                )
            )
            .background(
                Brush.radialGradient(
                    listOf(Palette.Primary400.copy(alpha = 0.12f), Color.Transparent),
                    center = Offset(1000f, 120f), radius = 800f,
                )
            ),
        content = content,
    )
}

/** Small uppercase label above titles. */
@Composable
fun Overline(text: String, color: Color = MaterialTheme.colorScheme.primary, modifier: Modifier = Modifier) {
    Text(text.uppercase(), style = MaterialTheme.typography.labelSmall, color = color, modifier = modifier)
}

/** Rounded pill chip for statuses ("Active", "Link", …). */
@Composable
fun Pill(text: String, container: Color, content: Color, modifier: Modifier = Modifier) {
    Text(
        text,
        style = MaterialTheme.typography.labelMedium,
        color = content,
        modifier = modifier
            .clip(RoundedCornerShape(50))
            .background(container)
            .padding(horizontal = 10.dp, vertical = 4.dp),
    )
}

/** White rounded card with a hairline border — the default surface. */
@Composable
fun SurfaceCard(modifier: Modifier = Modifier, content: @Composable BoxScope.() -> Unit) {
    Box(
        modifier
            .shadow(2.dp, MaterialTheme.shapes.medium, ambientColor = Palette.Neutral900.copy(alpha = 0.08f), spotColor = Palette.Neutral900.copy(alpha = 0.08f))
            .clip(MaterialTheme.shapes.medium)
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.outlineVariant, MaterialTheme.shapes.medium),
        content = content,
    )
}
