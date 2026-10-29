package com.travelapp.features.vault.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface OfflineVaultDao {
    @Query("SELECT * FROM offline_vault_tickets ORDER BY departureTime ASC")
    fun getAllTickets(): Flow<List<OfflineVaultTicket>>

    @Query("SELECT * FROM offline_vault_tickets WHERE pnr = :pnr LIMIT 1")
    suspend fun getTicketByPnr(pnr: String): OfflineVaultTicket?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateTicket(ticket: OfflineVaultTicket)

    @Delete
    suspend fun deleteTicket(ticket: OfflineVaultTicket)

    @Query("DELETE FROM offline_vault_tickets WHERE pnr = :pnr")
    suspend fun deleteTicketByPnr(pnr: String)
}
