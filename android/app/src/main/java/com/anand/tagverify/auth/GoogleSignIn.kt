package com.anand.tagverify.auth

import android.content.Context
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.GoogleAuthProvider

sealed interface GoogleResult {
    data class Success(val credential: AuthCredential) : GoogleResult
    data object Cancelled : GoogleResult
    data class Error(val message: String) : GoogleResult
}

/**
 * Google sign-in through Android's Credential Manager (the Android
 * replacement for the web popup). Needs an Activity context.
 */
object GoogleSignIn {

    /**
     * The web client ID that the google-services plugin generates from
     * google-services.json. It's looked up at runtime so the app still builds
     * before Google sign-in is enabled in Firebase.
     */
    private fun webClientId(context: Context): String? {
        val id = context.resources.getIdentifier("default_web_client_id", "string", context.packageName)
        return if (id == 0) null else context.getString(id)
    }

    suspend fun signIn(activityContext: Context): GoogleResult {
        val clientId = webClientId(activityContext)
            ?: return GoogleResult.Error(
                "Google sign-in isn't set up yet. Enable Google in Firebase Authentication, " +
                    "then download google-services.json again into the app folder."
            )
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(GetSignInWithGoogleOption.Builder(clientId).build())
            .build()
        return try {
            val credential = CredentialManager.create(activityContext)
                .getCredential(activityContext, request)
                .credential
            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val idToken = GoogleIdTokenCredential.createFrom(credential.data).idToken
                GoogleResult.Success(GoogleAuthProvider.getCredential(idToken, null))
            } else {
                GoogleResult.Error("Unexpected credential type.")
            }
        } catch (e: GetCredentialCancellationException) {
            GoogleResult.Cancelled
        } catch (e: GetCredentialException) {
            GoogleResult.Error(e.message ?: "Google sign-in failed.")
        }
    }

    /** Clears the remembered Google account so the picker shows next time. */
    suspend fun clear(context: Context) {
        runCatching { CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest()) }
    }
}
