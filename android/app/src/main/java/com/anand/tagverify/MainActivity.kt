package com.anand.tagverify

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.anand.tagverify.auth.AuthState
import com.anand.tagverify.auth.AuthViewModel
import com.anand.tagverify.auth.Dealer
import com.anand.tagverify.auth.GoogleSignIn
import com.anand.tagverify.ui.screens.HomeScreen
import com.anand.tagverify.ui.screens.LoginScreen
import com.anand.tagverify.ui.screens.ProfileScreen
import com.anand.tagverify.ui.theme.TagVerifyTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            TagVerifyTheme {
                Surface(Modifier.fillMaxSize()) {
                    TagVerifyApp()
                }
            }
        }
    }
}

/** Switches between login and the signed-in app based on auth state. */
@Composable
fun TagVerifyApp(authViewModel: AuthViewModel = viewModel()) {
    val state by authViewModel.state.collectAsStateWithLifecycle()
    when (val s = state) {
        AuthState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        is AuthState.SignedOut -> LoginScreen(s, authViewModel)
        is AuthState.SignedIn -> SignedInNav(s.dealer, authViewModel)
    }
}

@Composable
private fun SignedInNav(dealer: Dealer, authViewModel: AuthViewModel) {
    val nav = rememberNavController()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    NavHost(navController = nav, startDestination = "home") {
        composable("home") {
            HomeScreen(
                dealer = dealer,
                onProfile = { nav.navigate("profile") },
                onLogout = {
                    scope.launch {
                        GoogleSignIn.clear(context)
                        authViewModel.signOut()
                    }
                },
            )
        }
        composable("profile") {
            ProfileScreen(dealer = dealer, onBack = { nav.popBackStack() })
        }
    }
}
