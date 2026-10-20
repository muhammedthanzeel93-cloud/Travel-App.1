import SwiftUI
import SwiftData

@main
struct TravelPlatformApp: App {
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            OfflineTicket.self,
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)

        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            TabView {
                MobileTicketingDeskView()
                    .tabItem {
                        Label("Admin Desk", systemImage: "shield.fill")
                    }

                MobileOfflineVaultView()
                    .tabItem {
                        Label("4H Vault", systemImage: "ticket.fill")
                    }
            }
            .tint(.orange)
            .preferredColorScheme(.dark)
        }
        .modelContainer(sharedModelContainer)
    }
}
