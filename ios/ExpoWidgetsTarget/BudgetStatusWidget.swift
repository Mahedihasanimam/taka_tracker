import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct BudgetStatusWidget: Widget {
  let name: String = "BudgetStatusWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Budget Snapshot")
    .description("Minimal monthly budget status with spent and remaining amounts.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}