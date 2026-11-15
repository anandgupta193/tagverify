package com.anand.tagverify.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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
    /** Checking the saved session or the dealer record. */
    data object Loading : AuthState
    data class SignedOut(val message: String? = null, val busy: Boolean = false) : AuthState
    data class SignedIn(val dealer: Dealer) : AuthState
}

/**
 * Android version of the web app's useAuth hook: listens to Firebase auth state
 * and exposes it to the UI. On top of that, every signed-in account must have an
 * active document in dealers/{email}; anyone else is signed straight back out.
 * That check is what stops a random Gmail account from getting in via Google.
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
            verifyJob = viewModelScope.launch { verifyDealer(user) }
        }
    }

    init {
        auth.addAuthStateListener(listener)
    }

    private suspend fun verifyDealer(user: FirebaseUser) {
        val email = user.email?.trim()?.lowercase()
        if (email.isNullOrEmpty()) {
            rejectAndSignOut("This account has no email address.")
            return
        }
        try {
            val doc = db.collection("dealers").document(email).get().await()
            when {
                !doc.exists() -> rejectAndSignOut(
                    "$email is not registered as a dealer. Ask your admin to add you."
                )
                doc.getBoolean("active") != true -> rejectAndSignOut(
                    "Your dealer account is inactive. Contact your admin."
                )
                else -> _state.value = AuthState.SignedIn(Dealer.from(doc))
            }
        } catch (e: Exception) {
            rejectAndSignOut("Couldn't verify your dealer account. Check your internet and try again.")
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
