import SwiftUI

struct MobileQueueItem: Identifiable {
    let id = UUID()
    let pnr: String
    let type: String
    let carrier: String
    let sector: String
    let passenger: String
    let hoursLeft: Double
    var isIssued: Bool = false
}

struct MobileTicketingDeskView: View {
    @State private var items = [
        MobileQueueItem(pnr: "EK89XQ", type: "FLIGHT", carrier: "Emirates EK 562", sector: "CCJ → DXB", passenger: "John Doe (14A)", hoursLeft: 5.5),
        MobileQueueItem(pnr: "4219876543", type: "TRAIN", carrier: "Mangala Superfast", sector: "CLT → NZM", passenger: "Mohammed Ashraf (B3-42)", hoursLeft: 14.2),
        MobileQueueItem(pnr: "IX7721", type: "FLIGHT", carrier: "Air India Express", sector: "CCJ → DXB", passenger: "Anjali Menon (07F)", hoursLeft: 11.0)
    ]
    
    @State private var bannerMessage: String?
    @State private var showingDisruptionSheet = false
    @State private var selectedItem: MobileQueueItem?
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.04, blue: 0.09).ignoresSafeArea()
                
                VStack(spacing: 16) {
                    HStack(spacing: 12) {
                        metricCard(title: "Awaiting", value: "\(items.filter { !$0.isIssued }.count)", color: .orange)
                        metricCard(title: "Issued Today", value: "\(142 + items.filter { $0.isIssued }.count)", color: .green)
                        metricCard(title: "Active PNRs", value: "890", color: .blue)
                    }
                    .padding(.horizontal)
                    
                    if let msg = bannerMessage {
                        Text(msg)
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 14)
                            .background(Color.green.opacity(0.15))
                            .cornerRadius(10)
                            .padding(.horizontal)
                    }
                    
                    List {
                        ForEach($items) { $item in
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Image(systemName: item.type == "FLIGHT" ? "airplane" : "tram.fill")
                                        .foregroundColor(item.type == "FLIGHT" ? .blue : .purple)
                                    Text(item.pnr)
                                        .font(.system(.headline, design: .monospaced))
                                        .fontWeight(.heavy)
                                        .foregroundColor(.orange)
                                    Spacer()
                                    Text(item.isIssued ? "ISSUED" : "PENDING")
                                        .font(.system(size: 10, weight: .bold))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(item.isIssued ? Color.green.opacity(0.2) : Color.orange.opacity(0.2))
                                        .foregroundColor(item.isIssued ? .green : .orange)
                                        .cornerRadius(8)
                                }
                                
                                Text(item.sector)
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                
                                HStack {
                                    Text("\(item.carrier) • \(item.passenger)")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                    Spacer()
                                    Text("Dep in \(String(format: "%.1f", item.hoursLeft))h")
                                        .font(.caption2)
                                        .foregroundColor(.orange)
                                }
                            }
                            .padding(.vertical, 6)
                            .listRowBackground(Color(red: 0.06, green: 0.09, blue: 0.16))
                            .swipeActions(edge: .leading) {
                                Button {
                                    item.isIssued = true
                                    bannerMessage = "✓ PNR \(item.pnr) issued with 13-digit e-ticket!"
                                } label: {
                                    Label("Quick Issue", systemImage: "checkmark.circle.fill")
                                }
                                .tint(.green)
                            }
                            .swipeActions(edge: .trailing) {
                                Button {
                                    selectedItem = item
                                    showingDisruptionSheet = true
                                } label: {
                                    Label("Disruption", systemImage: "exclamationmark.triangle.fill")
                                }
                                .tint(.orange)
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("Admin Ticketing Desk")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingDisruptionSheet) {
                if let sel = selectedItem {
                    VStack(spacing: 20) {
                        Text("Broadcast Disruption: \(sel.carrier)")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        Text("Send emergency push alert to all passengers on manifest.")
                            .font(.caption)
                            .foregroundColor(.gray)
                        
                        Button("Confirm Broadcast (+45m Delay)") {
                            showingDisruptionSheet = false
                            bannerMessage = "Disruption Alert broadcasted to passengers on \(sel.pnr)."
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.orange)
                    }
                    .padding()
                    .presentationDetents([.medium])
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                }
            }
        }
    }
    
    private func metricCard(title: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title.uppercased())
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(color)
            Text(value)
                .font(.title3)
                .fontWeight(.black)
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
        .cornerRadius(12)
    }
}
