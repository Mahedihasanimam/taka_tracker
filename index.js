import { Platform } from "react-native";
import "./polyfills";

if (Platform.OS === "android") {
  const {
    ensureAndroidWidgetTaskRegistered,
  } = require("./widgets/androidBudgetWidget");
  ensureAndroidWidgetTaskRegistered();
}

import "expo-router/entry";
