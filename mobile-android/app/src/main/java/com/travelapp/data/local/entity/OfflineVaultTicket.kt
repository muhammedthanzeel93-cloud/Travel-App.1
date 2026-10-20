package com.travelapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Entity representing an IATA electronic boarding pass or PRS rail ERS ticket
 * stored in local Room database for 4+ hours offline resilience.
 */
@Entity(tableName = "offline_vault_tickets")
data class OfflineVaultTicket(
    @PrimaryKey
    val pnr: String, // 6-char flight PNR or 10-digit rail PNR
    val ticketType: String, // "FLIGHT" or "TRAIN"
    val carrierName: String, // e.g. "Emirates (EK 562)"
    val sector: String, // e.g. "CCJ -> DXB"
    val passengerName: String,
    val seatOrBerth: String, // "14A" or "B3 - 42 MB"
    val eTicketNumber: String, // "176-2894109382"
    val departureTimeEpoch: Long,
    val bcbpBarcodePayload: String, // IATA Resolution 792 string
    val status: String, // "ISSUED", "CONFIRMED"
    val cachedTimestamp: Long = System.currentTimeMillis(),
    val offlineValidityHours: Int = 4
)
