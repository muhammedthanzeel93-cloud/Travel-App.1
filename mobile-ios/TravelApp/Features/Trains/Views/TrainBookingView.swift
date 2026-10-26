import SwiftUI

struct TrainBookingView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.04, blue: 0.09).ignoresSafeArea()
                
                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("12617 Mangala Superfast Express")
                            .font(.headline)
                            .fontWeight(.black)
                            .foregroundColor(.white)
                        Text("CLT (Kozhikode) → NZM (Nizamuddin Delhi)")
                            .font(.subheadline)
                            .foregroundColor(.purple)
                        Text("PRS Quota Engine: GN, Tatkal (TQ), Ladies (LD)")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .cornerRadius(16)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Railway Booking")
        }
    }
}
