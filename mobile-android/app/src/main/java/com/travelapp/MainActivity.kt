package com.travelapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import com.travelapp.features.social.ui.TravelFeedScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TravelPlatformApp()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TravelPlatformApp() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Travel Buddy", color = Color.White) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F172A))
            )
        }
    ) { padding ->
        TravelFeedScreen()
    }
}
