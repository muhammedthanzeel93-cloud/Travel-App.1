package com.travelapp.ui.vault

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Flight
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MobileOfflineVaultScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "4-Hour Offline Vault",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Icon(Icons.Default.WifiOff, contentDescription = null, tint = Color(0xFF34D399), modifier = Modifier.size(16.dp))
                    }
                },
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
            // Offline Status Notice
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF064E3B)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.WifiOff, contentDescription = null, tint = Color(0xFF34D399))
                    Text(
                        text = "Airplane Mode Ready: Room DB has pre-cached your boarding pass. Valid offline for > 4 hours.",
                        color = Color(0xFF6EE7B7),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Boarding Pass Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = "EMIRATES EK 562", color = Color(0xFF38BDF8), fontWeight = FontWeight.Black, fontSize = 14.sp)
                            Text(text = "IATA E-Ticket: 176-2894109382", color = Color(0xFF94A3B8), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        }
                        Text(
                            text = "EK89XQ",
                            color = Color(0xFFF59E0B),
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Black,
                            fontSize = 18.sp
                        )
                    }

                    Divider(color = Color(0xFF1E293B))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(text = "PASSENGER", color = Color(0xFF64748B), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text(text = "John Doe", color = Color.White, fontWeight = FontWeight.Black, fontSize = 15.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "SEAT", color = Color(0xFF64748B), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text(text = "14A (Window)", color = Color(0xFFF59E0B), fontWeight = FontWeight.Black, fontSize = 15.sp)
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(text = "SECTOR", color = Color(0xFF64748B), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text(text = "CCJ → DXB", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "GATE / BOARDING", color = Color(0xFF64748B), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text(text = "B12 • Seq 042", color = Color(0xFF34D399), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }

                    // 2D Barcode Area
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(160.dp)
                            .background(Color.White, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.QrCode2,
                                contentDescription = "2D BCBP Barcode",
                                tint = Color.Black,
                                modifier = Modifier.size(110.dp)
                            )
                            Text(
                                text = "M1DOE/JOHN EEK89XQ CCJDXBEK 0562",
                                color = Color.Black,
                                fontSize = 9.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
