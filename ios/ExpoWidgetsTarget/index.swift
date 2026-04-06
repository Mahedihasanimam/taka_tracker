import WidgetKit
import SwiftUI

struct PlaceholderEntry: TimelineEntry {
  let date: Date
}

struct PlaceholderProvider: TimelineProvider {
  func placeholder(in context: Context) -> PlaceholderEntry {
    PlaceholderEntry(date: Date())
  }

  func getSnapshot(in context: Context, completion: @escaping (PlaceholderEntry) -> Void) {
    completion(PlaceholderEntry(date: Date()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PlaceholderEntry>) -> Void) {
    let entry = PlaceholderEntry(date: Date())
    completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(60 * 30))))
  }
}

struct PlaceholderWidgetView: View {
  var entry: PlaceholderProvider.Entry

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("MoneyMaster")
        .font(.headline)
      Text("iOS widget placeholder")
        .font(.caption)
        .foregroundStyle(.secondary)
      Text(entry.date, style: .time)
        .font(.caption2)
    }
    .padding()
  }
}

struct PlaceholderWidget: Widget {
  let kind: String = "PlaceholderWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PlaceholderProvider()) { entry in
      PlaceholderWidgetView(entry: entry)
    }
    .configurationDisplayName("MoneyMaster")
    .description("Placeholder widget for iOS builds.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct ExportWidgets0: WidgetBundle {
  var body: some Widget {
    PlaceholderWidget()
  }
}