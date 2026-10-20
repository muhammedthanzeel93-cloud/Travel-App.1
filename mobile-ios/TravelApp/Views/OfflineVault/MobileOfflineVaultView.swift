import SwiftUI
import CoreImage.CIFilterBuiltins

struct MobileOfflineVaultView: View {
    @State private var activePnr = "EK89XQ"
    let context = CIContext()
    let filter = CIFilter.qrCodeGenerator()
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.04, blue: 0.09).ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // Offline notice
                        HStack(spacing: 8) {
                            Image(systemName: "wifi.slash")
                                .foregroundColor(.green)
                            Text("SwiftData Encrypted Vault: Valid for > 4 Hours Offline")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.green)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Color.green.opacity(0.15))
                        .cornerRadius(12)
                        
                        // Boarding pass card
                        VStack(spacing: 16) {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text("EMIRATES EK 562")
                                        .font(.subheadline)
                                        .fontWeight(.black)
                                        .foregroundColor(.blue)
                                    Text("IATA E-Ticket: 176-2894109382")
                                        .font(.system(size: 10, design: .monospaced))
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                                Text("EK89XQ")
                                    .font(.system(.title3, design: .monospaced))
                                    .fontWeight(.heavy)
                                    .foregroundColor(.orange)
                            }
                            
                            Divider().background(Color.gray.opacity(0.3))
                            
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("PASSENGER").font(.system(size: 9, weight: .bold)).foregroundColor(.gray)
                                    Text("John Doe").font(.headline).fontWeight(.black).foregroundColor(.white)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 4) {
                                    Text("SEAT").font(.system(size: 9, weight: .bold)).foregroundColor(.gray)
                                    Text("14A (Window)").font(.headline).fontWeight(.black).foregroundColor(.orange)
                                }
                            }
                            
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("SECTOR").font(.system(size: 9, weight: .bold)).foregroundColor(.gray)
                                    Text("CCJ → DXB").font(.subheadline).fontWeight(.bold).foregroundColor(.white)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 4) {
                                    Text("GATE").font(.system(size: 9, weight: .bold)).foregroundColor(.gray)
                                    Text("B12 • Seq 042").font(.subheadline).fontWeight(.bold).foregroundColor(.green)
                                }
                            }
                            
                            // 2D Barcode representation
                            VStack(spacing: 8) {
                                Image(systemName: "qrcode")
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                                    .frame(width: 140, height: 140)
                                    .foregroundColor(.black)
                                    .padding()
                                    .background(Color.white)
                                    .cornerRadius(12)
                                
                                Text("IATA 2D BCBP Gate Scannable Offline")
                                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                                    .foregroundColor(.gray)
                            }
                            .padding(.top, 8)
                        }
                        .padding(20)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .cornerRadius(20)
                    }
                    .padding()
                }
            }
            .navigationTitle("4H Offline Vault")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
