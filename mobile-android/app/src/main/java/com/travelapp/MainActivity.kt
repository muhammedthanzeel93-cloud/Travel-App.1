package com.travelapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ConfirmationNumber
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import com.travelapp.features.admin.ui.MobileTicketingDeskScreen
import com.travelapp.features.vault.ui.MobileOfflineVaultScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TravelPlatformApp()
        }
    }
}

@Composable
fun TravelPlatformApp() {
    var currentTab by remember { mutableStateOf(0) }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF0F172A)) {
                NavigationBarItem(
                    selected = currentTab == 0,
                    onClick = { currentTab = 0 },
                    icon = { Icon(Icons.Default.Shield, contentDescription = "Admin Desk") },
                    label = { Text("Admin Desk") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFF59E0B),
                        selectedTextColor = Color(0xFFF59E0B),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B),
                        indicatorColor = Color(0xFF1E293B)
                    )
                )

                NavigationBarItem(
                    selected = currentTab == 1,
                    onClick = { currentTab = 1 },
                    icon = { Icon(Icons.Default.ConfirmationNumber, contentDescription = "Offline Vault") },
                    label = { Text("4H Vault") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF10B981),
                        selectedTextColor = Color(0xFF10B981),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B),
                        indicatorColor = Color(0xFF1E293B)
                    )
                )
            }
        }
    ) { padding ->
        when (currentTab) {
            0 -> MobileTicketingDeskScreen()
            1 -> MobileOfflineVaultScreen()
        }
    }
}
