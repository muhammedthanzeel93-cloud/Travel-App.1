import Foundation
import SwiftData

/**
 * Feature: 4-Hour Offline Vault Model
 * Stores official IATA flight boarding passes and IRCTC rail ERS slips with full offline resilience.
 */
@Model
final class OfflineTicket {
    @Attribute(.unique) var pnr: String
    var ticketType: String
    var carrier: String
    var sector: String
    var passengerName: String
    var seatOrBerth: String
    var eTicketNumber: String
    var departureDate: Date
    var bcbpBarcodePayload: String
    var cachedAt: Date
    var offlineValidityHours: Int
    
    init(
        pnr: String,
        ticketType: String,
        carrier: String,
        sector: String,
        passengerName: String,
        seatOrBerth: String,
        eTicketNumber: String,
        departureDate: Date,
        bcbpBarcodePayload: String,
        cachedAt: Date = Date(),
        offlineValidityHours: Int = 4
    ) {
        self.pnr = pnr
        self.ticketType = ticketType
        self.carrier = carrier
        self.sector = sector
        self.passengerName = passengerName
        self.seatOrBerth = seatOrBerth
        self.eTicketNumber = eTicketNumber
        self.departureDate = departureDate
        self.bcbpBarcodePayload = bcbpBarcodePayload
        self.cachedAt = cachedAt
        self.offlineValidityHours = offlineValidityHours
    }
}
