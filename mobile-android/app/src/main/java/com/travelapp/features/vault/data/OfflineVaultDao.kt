package com.travelapp.features.vault.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface OfflineVaultDao {
    @Query("SELECT * FROM offline_vault_tickets ORDER BY departureTimeEpoch ASC")
    fun getAllOfflineTickets(): Flow<List<OfflineVaultTicket>>

    @Query("SELECT * FROM offline_vault_tickets WHERE pnr = :pnr LIMIT 1")
    suspend fun getTicketByPnr(pnr: String): OfflineVaultTicket?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(ticket: OfflineVaultTicket)

    @Query("DELETE FROM offline_vault_tickets WHERE pnr = :pnr")
    suspend fun deleteTicket(pnr: String)
}
