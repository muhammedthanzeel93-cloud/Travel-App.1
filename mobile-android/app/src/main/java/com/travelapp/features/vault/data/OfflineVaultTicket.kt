package com.travelapp.features.vault.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Feature: 4-Hour Offline Vault
 * Cached IATA electronic boarding pass & IRCTC rail ERS ticket.
 */
@Entity(tableName = "offline_vault_tickets")
data class OfflineVaultTicket(
    @PrimaryKey
    val pnr: String,
    val ticketType: String,
    val carrierName: String,
    val sector: String,
    val passengerName: String,
    val seatOrBerth: String,
    val eTicketNumber: String,
    val departureTimeEpoch: Long,
    val bcbpBarcodePayload: String,
    val status: String,
    val cachedTimestamp: Long = System.currentTimeMillis(),
    val offlineValidityHours: Int = 4
)
