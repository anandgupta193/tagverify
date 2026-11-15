package com.anand.tagverify.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.anand.tagverify.R
import com.anand.tagverify.auth.AuthState
import com.anand.tagverify.auth.AuthViewModel
import com.anand.tagverify.auth.GoogleResult
import com.anand.tagverify.auth.GoogleSignIn
import com.anand.tagverify.ui.components.BrandMark
import com.anand.tagverify.ui.components.MeshBackground
import com.anand.tagverify.ui.components.Overline
import com.anand.tagverify.ui.theme.Palette
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(state: AuthState.SignedOut, viewModel: AuthViewModel) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    val busy = state.busy
    val colors = MaterialTheme.colorScheme

    val fieldColors = OutlinedTextFieldDefaults.colors(
        unfocusedBorderColor = colors.outline,
        focusedBorderColor = colors.primary,
        unfocusedContainerColor = colors.surface,
        focusedContainerColor = colors.surface,
    )

    MeshBackground {
        Column(
            Modifier
                .align(Alignment.Center)
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .navigationBarsPadding()
                .imePadding()
                .padding(20.dp)
                .widthIn(max = 420.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Card
            Column(
                Modifier
                    .fillMaxWidth()
                    .shadow(24.dp, MaterialTheme.shapes.large, ambientColor = Palette.Neutral900.copy(alpha = .10f), spotColor = Palette.Neutral900.copy(alpha = .14f))
                    .clip(MaterialTheme.shapes.large)
                    .background(colors.surface),
            ) {
                Box(Modifier.fillMaxWidth().height(4.dp).background(Palette.BrandGradient))
                Column(
                    Modifier.padding(horizontal = 24.dp, vertical = 28.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    BrandMark(size = 56.dp)
                    Spacer(Modifier.height(20.dp))
                    Overline("Dealer app")
                    Spacer(Modifier.height(4.dp))
                    Text("TagVerify", style = MaterialTheme.typography.headlineMedium, color = colors.onSurface)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Certify genuine radium in seconds",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )

                    Spacer(Modifier.height(28.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email") },
                        leadingIcon = { Icon(Icons.Outlined.Email, null) },
                        singleLine = true,
                        enabled = !busy,
                        shape = MaterialTheme.shapes.small,
                        colors = fieldColors,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        leadingIcon = { Icon(Icons.Outlined.Lock, null) },
                        singleLine = true,
                        enabled = !busy,
                        shape = MaterialTheme.shapes.small,
                        colors = fieldColors,
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    if (showPassword) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                                    contentDescription = if (showPassword) "Hide password" else "Show password",
                                )
                            }
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { viewModel.signInWithEmail(email, password) }),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        TextButton(onClick = { viewModel.sendPasswordReset(email) }, enabled = !busy) {
                            Text("Forgot password?", style = MaterialTheme.typography.labelMedium)
                        }
                    }

                    Button(
                        onClick = { viewModel.signInWithEmail(email, password) },
                        enabled = !busy,
                        shape = MaterialTheme.shapes.small,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.primary),
                        elevation = ButtonDefaults.buttonElevation(defaultElevation = 6.dp, pressedElevation = 2.dp),
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                    ) {
                        if (busy) {
                            CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(20.dp), color = colors.onPrimary)
                        } else {
                            Text("Sign in", style = MaterialTheme.typography.labelLarge)
                        }
                    }

                    Spacer(Modifier.height(24.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        HorizontalDivider(Modifier.weight(1f), color = colors.outline)
                        Text(
                            "  or continue with  ",
                            style = MaterialTheme.typography.labelMedium,
                            color = colors.onSurfaceVariant,
                        )
                        HorizontalDivider(Modifier.weight(1f), color = colors.outline)
                    }
                    Spacer(Modifier.height(16.dp))

                    OutlinedIconButton(
                        onClick = {
                            scope.launch {
                                when (val r = GoogleSignIn.signIn(context)) {
                                    is GoogleResult.Success -> viewModel.signInWithCredential(r.credential)
                                    is GoogleResult.Error -> viewModel.showError(r.message)
                                    GoogleResult.Cancelled -> Unit
                                }
                            }
                        },
                        enabled = !busy,
                        shape = CircleShape,
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.outline),
                        modifier = Modifier.size(56.dp),
                    ) {
                        Image(
                            painter = painterResource(R.drawable.ic_google),
                            contentDescription = "Sign in with Google",
                            modifier = Modifier.size(24.dp),
                        )
                    }
                }
            }

            AnimatedVisibility(
                visible = state.message != null,
                enter = fadeIn() + slideInVertically { it / 3 },
            ) {
                Row(
                    Modifier
                        .padding(top = 16.dp)
                        .fillMaxWidth()
                        .clip(MaterialTheme.shapes.medium)
                        .background(colors.secondaryContainer)
                        .padding(16.dp),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Icon(Icons.Outlined.Info, null, tint = colors.primary)
                    Text(
                        state.message.orEmpty(),
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.onSecondaryContainer,
                    )
                }
            }

            Spacer(Modifier.height(16.dp))
            Text(
                "Only dealers added by your admin can sign in",
                style = MaterialTheme.typography.bodySmall,
                color = colors.onSurfaceVariant,
            )
        }
    }
}
