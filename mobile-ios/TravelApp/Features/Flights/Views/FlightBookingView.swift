import SwiftUI

struct FlightBookingView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.04, blue: 0.09).ignoresSafeArea()
                
                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Calicut (CCJ) → Dubai (DXB)")
                            .font(.headline)
                            .fontWeight(.black)
                            .foregroundColor(.white)
                        Text("Emirates EK 562 • 04:30 AM")
                            .font(.subheadline)
                            .foregroundColor(.blue)
                        Text("APIS Passport Validation Required (≥6M)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .cornerRadius(16)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Flight Booking")
        }
    }
}
