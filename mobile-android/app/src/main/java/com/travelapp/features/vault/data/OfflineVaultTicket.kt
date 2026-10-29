package com.travelapp.features.vault.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "offline_vault_tickets")
data class OfflineVaultTicket(
    @PrimaryKey
    val pnr: String,
    val ticketType: String, // "FLIGHT" or "TRAIN"
    val eTicketNumber: String? = null,
    val travelerName: String,
    val routeSummary: String,
    val seatsOrBerths: String,
    val departureTime: Long,
    val barcodeDataUrl: String? = null,
    val cachedAt: Long = System.currentTimeMillis()
)
