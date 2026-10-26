package com.travelapp.features.trains.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrainBookingScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Railway Booking (PRS)", color = Color.White, fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F172A))
            )
        },
        containerColor = Color(0xFF020617)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("12617 Mangala Superfast Express", color = Color.White, fontWeight = FontWeight.Black, fontSize = 16.sp)
                    Text("CLT (Kozhikode) → NZM (Nizamuddin)", color = Color(0xFF818CF8), fontSize = 13.sp)
                    Text("Quotas: GN, Tatkal (TQ), Ladies (LD), Senior Citizen (SS)", color = Color(0xFFF59E0B), fontSize = 11.sp)
                    Button(
                        onClick = { },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                    ) {
                        Text("Reserve 3A Berth (₹2,315)", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
