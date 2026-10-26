package com.travelapp.features.admin.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class AdminQueueItem(
    val pnr: String,
    val type: String,
    val carrier: String,
    val sector: String,
    val passenger: String,
    val departureHoursLeft: Double,
    var status: String = "PENDING"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MobileTicketingDeskScreen() {
    var queueItems by remember {
        mutableStateOf(
            listOf(
                AdminQueueItem("EK89XQ", "FLIGHT", "Emirates EK 562", "CCJ → DXB", "John Doe (14A)", 5.5),
                AdminQueueItem("4219876543", "TRAIN", "Mangala Superfast", "CLT → NZM", "Mohammed Ashraf (B3-42)", 14.2),
                AdminQueueItem("IX7721", "FLIGHT", "Air India Express", "CCJ → DXB", "Anjali Menon (07F)", 11.0)
            )
        )
    }

    var actionMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Super Admin Ticketing Desk",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Text(
                            text = "Feature: Operations Desk • 1-Tap Issuance",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF94A3B8)
                        )
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
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F172A), RoundedCornerShape(16.dp))
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "Awaiting Action", color = Color(0xFFF59E0B), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text(
                        text = "${queueItems.count { it.status == "PENDING" }} Orders",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black
                    )
                }
                Column {
                    Text(text = "Issued Today", color = Color(0xFF10B981), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text(
                        text = "${142 + queueItems.count { it.status == "ISSUED" }}",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black
                    )
                }
                Column {
                    Text(text = "Active PNRs", color = Color(0xFF38BDF8), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text(text = "890", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                }
            }

            actionMessage?.let { msg ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF064E3B)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = msg,
                        color = Color(0xFF6EE7B7),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            Text(
                text = "Live Order Queue (Swipe Right to Quick-Issue)",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )

            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(queueItems) { item ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(
                                        imageVector = if (item.type == "FLIGHT") Icons.Default.Flight else Icons.Default.Train,
                                        contentDescription = null,
                                        tint = if (item.type == "FLIGHT") Color(0xFF38BDF8) else Color(0xFF818CF8)
                                    )
                                    Text(
                                        text = item.pnr,
                                        color = Color(0xFFF59E0B),
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 16.sp
                                    )
                                }
                                SuggestionChip(
                                    onClick = { },
                                    label = { Text(item.status, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                                    colors = SuggestionChipDefaults.suggestionChipColors(
                                        containerColor = if (item.status == "ISSUED") Color(0xFF064E3B) else Color(0xFF451A03),
                                        labelColor = if (item.status == "ISSUED") Color(0xFF34D399) else Color(0xFFFBBF24)
                                    )
                                )
                            }

                            Text(text = item.sector, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(text = "${item.carrier} • ${item.passenger}", color = Color(0xFF94A3B8), fontSize = 12.sp)

                            Row(
                                modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = {
                                        queueItems = queueItems.map {
                                            if (it.pnr == item.pnr) it.copy(status = "ISSUED") else it
                                        }
                                        actionMessage = "✓ PNR ${item.pnr} issued! 13-digit ticket & 2D BCBP barcode pushed to user vault."
                                    },
                                    enabled = item.status != "ISSUED",
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(
                                        text = if (item.status == "ISSUED") "Ticket Issued" else "Quick-Issue Ticket",
                                        color = Color(0xFF020617),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp
                                    )
                                }

                                OutlinedButton(
                                    onClick = {
                                        actionMessage = "Emergency Disruption Alert broadcasted for ${item.carrier}!"
                                    },
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFF59E0B)),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
