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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
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
import com.anand.tagverify.auth.AppUser
import com.anand.tagverify.auth.GoogleSignIn
import com.anand.tagverify.scan.ScanResult
import com.anand.tagverify.scan.ScanOutcomeScreen
import com.anand.tagverify.fitment.FitmentFormScreen
import com.anand.tagverify.fitment.FitmentViewModel
import com.anand.tagverify.fitment.VerifyScreen
import com.anand.tagverify.scan.ScannerScreen
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
        is AuthState.SignedIn -> SignedInNav(s.user, authViewModel)
    }
}

@Composable
private fun SignedInNav(user: AppUser, authViewModel: AuthViewModel) {
    val nav = rememberNavController()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    // Last scanned QR, kept across the scanner -> result hop and rotation.
    var lastScan by rememberSaveable(stateSaver = scanResultSaver) { mutableStateOf<ScanResult?>(null) }
    // One fitment form at a time, shared by the form and verify screens.
    val fitmentViewModel: FitmentViewModel = viewModel()
    NavHost(navController = nav, startDestination = "home") {
        composable("home") {
            HomeScreen(
                user = user,
                onScan = { nav.navigate("scan") },
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
            ProfileScreen(user = user, onBack = { nav.popBackStack() })
        }
        composable("scan") {
            ScannerScreen(
                onScanned = { result ->
                    lastScan = result
                    nav.navigate("result") { popUpTo("scan") { inclusive = true } }
                },
                onBack = { nav.popBackStack() },
            )
        }
        // Scan → look up the QR → fitment form / "already certified" / "not yours".
        composable("result") {
            val result = lastScan
            if (result == null) {
                LaunchedEffect(Unit) { nav.popBackStack("home", inclusive = false) }
            } else {
                ScanOutcomeScreen(
                    scan = result,
                    myCompanyId = if (user.role == com.anand.tagverify.auth.Role.ADMIN) null else user.companyId,
                    onReady = { qr ->
                        fitmentViewModel.start(qr)
                        nav.navigate("fitment") { popUpTo("result") { inclusive = true } }
                    },
                    onScanAgain = { nav.navigate("scan") { popUpTo("result") { inclusive = true } } },
                    onHome = { nav.popBackStack("home", inclusive = false) },
                )
            }
        }
        composable("fitment") {
            FitmentFormScreen(
                viewModel = fitmentViewModel,
                onBack = { nav.popBackStack("home", inclusive = false) },
                onReview = { nav.navigate("verify") },
            )
        }
        composable("verify") {
            VerifyScreen(
                viewModel = fitmentViewModel,
                dealerEmail = user.email,
                dealerName = user.name,
                onEdit = { nav.popBackStack() },
                onDone = { nav.popBackStack("home", inclusive = false) },
            )
        }
    }
}

private val scanResultSaver = listSaver<ScanResult?, String?>(
    save = { r -> if (r == null) emptyList() else listOf(r.rawValue, r.type, r.url) },
    restore = { l -> if (l.isEmpty()) null else ScanResult(l[0].orEmpty(), l[1].orEmpty(), l[2]) },
)
