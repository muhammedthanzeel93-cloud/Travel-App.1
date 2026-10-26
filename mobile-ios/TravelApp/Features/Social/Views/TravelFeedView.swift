import SwiftUI

struct TravelFeedView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.02, green: 0.04, blue: 0.09).ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Aisha Al-Falasi (@aisha_dubai)")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            Text("Burj Khalifa Level 148 golden hour vibes 🌅✨ #DubaiDiary")
                                .font(.caption)
                                .foregroundColor(.gray)
                            HStack {
                                Image(systemName: "heart.fill")
                                    .foregroundColor(.pink)
                                Text("1,420 likes")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .cornerRadius(16)
                    }
                    .padding()
                }
            }
            .navigationTitle("Travel Feed")
        }
    }
}
