package com.anand.tagverify.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.anand.tagverify.config.AppConfig
import com.anand.tagverify.data.Collections
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

sealed interface AuthState {
    /** Checking the saved session or the user's profile. */
    data object Loading : AuthState
    data class SignedOut(val message: String? = null, val busy: Boolean = false) : AuthState
    data class SignedIn(val user: AppUser) : AuthState
}

/**
 * Listens to Firebase auth state and exposes it to the UI. Every signed-in
 * account must have an active users/{email} doc with a role (admin or dealer);
 * anyone else is signed straight back out. That allow-list is what stops a
 * random Gmail account from getting in via Google.
 */
class AuthViewModel(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance(),
) : ViewModel() {

    private val _state = MutableStateFlow<AuthState>(AuthState.Loading)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    /** Shown on the login screen after we force a sign-out. */
    private var pendingMessage: String? = null
    private var verifyJob: Job? = null

    private val listener = FirebaseAuth.AuthStateListener { fa ->
        val user = fa.currentUser
        verifyJob?.cancel()
        if (user == null) {
            _state.value = AuthState.SignedOut(pendingMessage)
            pendingMessage = null
        } else {
            _state.value = AuthState.Loading
            verifyJob = viewModelScope.launch { verifyUser(user) }
        }
    }

    init {
        auth.addAuthStateListener(listener)
    }

    private suspend fun verifyUser(user: FirebaseUser) {
        val email = user.email?.trim()?.lowercase()
        if (email.isNullOrEmpty()) {
            rejectAndSignOut("This account has no email address.")
            return
        }
        try {
            val doc = db.collection(Collections.USERS).document(email).get().await()
            val profile = if (doc.exists()) AppUser.from(doc) else null
            when {
                profile == null -> rejectAndSignOut(
                    "You are not a dealer. Please contact the admin, ${AppConfig.ADMIN_NAME}.\n($email)"
                )
                !profile.active -> rejectAndSignOut(
                    "Your account is inactive. Please contact the admin, ${AppConfig.ADMIN_NAME}."
                )
                else -> _state.value = AuthState.SignedIn(profile)
            }
        } catch (e: Exception) {
            rejectAndSignOut("Couldn't verify your account. Check your internet and try again.")
        }
    }

    private fun rejectAndSignOut(message: String) {
        pendingMessage = message
        auth.signOut() // listener fires with null and shows the message
    }

    fun signInWithEmail(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _state.value = AuthState.SignedOut("Enter your email and password.")
            return
        }
        setBusy()
        viewModelScope.launch {
            try {
                auth.signInWithEmailAndPassword(email.trim(), password).await()
            } catch (e: FirebaseAuthInvalidCredentialsException) {
                showError("Wrong email or password.")
            } catch (e: FirebaseAuthInvalidUserException) {
                showError("No account found for this email.")
            } catch (e: Exception) {
                showError(e.localizedMessage ?: "Sign-in failed.")
            }
        }
    }

    /** Called by the UI after Credential Manager returns a Google ID token. */
    fun signInWithCredential(credential: AuthCredential) {
        setBusy()
        viewModelScope.launch {
            try {
                auth.signInWithCredential(credential).await()
            } catch (e: Exception) {
                showError(e.localizedMessage ?: "Google sign-in failed.")
            }
        }
    }

    fun sendPasswordReset(email: String) {
        if (email.isBlank()) {
            showError("Enter your email first, then tap Forgot password.")
            return
        }
        viewModelScope.launch {
            try {
                auth.sendPasswordResetEmail(email.trim()).await()
                showError("Password reset link sent to ${email.trim()}.")
            } catch (e: Exception) {
                showError(e.localizedMessage ?: "Couldn't send reset email.")
            }
        }
    }

    fun showError(message: String) {
        _state.update { if (it is AuthState.SignedOut) AuthState.SignedOut(message) else it }
    }

    private fun setBusy() {
        _state.update { if (it is AuthState.SignedOut) AuthState.SignedOut(busy = true) else it }
    }

    fun signOut() {
        auth.signOut()
    }

    override fun onCleared() {
        auth.removeAuthStateListener(listener)
    }
}
