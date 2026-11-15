package com.anand.tagverify.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.anand.tagverify.auth.Dealer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(dealer: Dealer, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
        ) {
            listOf(
                "Name" to dealer.name,
                "Email" to dealer.email,
                "Mobile" to dealer.mobile,
                "Address" to dealer.address,
                "Company" to dealer.companyId,
                "Passing location" to dealer.passingLocation,
                "Registration location" to dealer.registrationLocation,
            ).forEach { (label, value) ->
                ListItem(
                    overlineContent = { Text(label) },
                    headlineContent = { Text(value.ifBlank { "—" }) },
                )
                HorizontalDivider()
            }
        }
    }
}
