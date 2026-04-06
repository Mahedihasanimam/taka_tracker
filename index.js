import { Platform } from "react-native";
import "./polyfills";

import "expo-router/entry";

if (Platform.OS === "android") {
  try {
    const {
      ensureAndroidWidgetTaskRegistered,
    } = require("./widgets/androidBudgetWidget");
    ensureAndroidWidgetTaskRegistered();
  } catch (error) {
    console.warn("Android widget initialization skipped:", error);
  }
}
