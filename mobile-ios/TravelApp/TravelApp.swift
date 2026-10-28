import SwiftUI

@main
struct TravelPlatformApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                TravelFeedView()
                    .navigationTitle("Travel Buddy")
                    .navigationBarTitleDisplayMode(.inline)
            }
            .preferredColorScheme(.dark)
        }
    }
}
