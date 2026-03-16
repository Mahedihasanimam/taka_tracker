import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
  FlexWidget,
  ImageWidget,
  OverlapWidget,
  TextWidget,
  registerWidgetTaskHandler,
  requestWidgetUpdate,
} from 'react-native-android-widget';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget';

export const ANDROID_BUDGET_WIDGET_NAME = 'BudgetStatusWidgetAndroid';
const SNAPSHOT_STORAGE_KEY = 'android_budget_widget_snapshot_v2';

type AndroidBudgetSnapshot = {
  title: string;
  subtitle: string;
  heroText: string;
  heroLabel: string;
  status: string;
  statusColor: string;
  insight: string;
  topLeftLabel: string;
  topLeftValue: string;
  topRightLabel: string;
  topRightValue: string;
  bottomLabel: string;
  bottomValue: string;
  hasData: boolean;
};

let isWidgetTaskRegistered = false;

const toColor = (value: string, fallback: ColorProp = '#6b7280'): ColorProp => {
  if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgba('))) {
    return value as ColorProp;
  }
  return fallback;
};

const getDefaultSnapshot = (): AndroidBudgetSnapshot => ({
  title: 'Money Master',
  subtitle: 'Nothing logged yet',
  heroText: '$0',
  heroLabel: 'Available balance',
  status: 'Quiet day',
  statusColor: '#99f6e4',
  insight: 'No activity yet. Add an expense or income entry from the app.',
  topLeftLabel: 'Spent today',
  topLeftValue: '$0',
  topRightLabel: 'Budget',
  topRightValue: 'Not set',
  bottomLabel: 'Entries today',
  bottomValue: '0',
  hasData: false,
});

const parseSnapshot = (raw: string | null): AndroidBudgetSnapshot => {
  if (!raw) return getDefaultSnapshot();

  try {
    const data = JSON.parse(raw) as Partial<AndroidBudgetSnapshot>;
    return {
      ...getDefaultSnapshot(),
      ...data,
      hasData: Boolean(data.hasData),
    };
  } catch {
    return getDefaultSnapshot();
  }
};

const buildMetricCard = (label: string, value: string) => (
  <FlexWidget
    style={{
      flex: 1,
      width: 'match_parent',
      paddingVertical: 9,
      paddingHorizontal: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      borderRadius: 14,
    }}
  >
    <TextWidget
      text={label}
      style={{ fontSize: 10, color: '#D7FFF8', fontWeight: '500' }}
    />
    <TextWidget
      text={value}
      style={{ marginTop: 4, fontSize: 14, color: '#FFFFFF', fontWeight: '700' }}
      maxLines={1}
      truncate="END"
    />
  </FlexWidget>
);

const buildAndroidBudgetWidget = (snapshot: AndroidBudgetSnapshot) => (
  <OverlapWidget
    style={{
      width: 'match_parent',
      height: 'match_parent',
      backgroundGradient: {
        from: '#3F3A8A',
        to: '#0F766E',
        orientation: 'TL_BR',
      },
      borderRadius: 24,
      overflow: 'hidden',
    }}
  >
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        paddingTop: 14,
        paddingLeft: 14,
        paddingRight: 14,
        paddingBottom: 12,
      }}
    >
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <FlexWidget style={{ flex: 1, marginRight: 8 }}>
          <TextWidget
            text={snapshot.title}
            style={{ fontSize: 14, color: '#E6FFFB', fontWeight: '700' }}
          />
          <TextWidget
            text={snapshot.subtitle}
            style={{ marginTop: 2, fontSize: 10, color: 'rgba(255, 255, 255, 0.72)' }}
            maxLines={1}
            truncate="END"
          />
        </FlexWidget>
        <FlexWidget
          style={{
            width: 'wrap_content',
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor: 'rgba(255, 255, 255, 0.16)',
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.12)',
          }}
        >
          <TextWidget
            text={snapshot.status}
            style={{ fontSize: 10, color: toColor(snapshot.statusColor, '#FFFFFF'), fontWeight: '700' }}
          />
        </FlexWidget>
      </FlexWidget>

      <TextWidget
        text={snapshot.heroText}
        style={{ marginTop: 12, fontSize: 30, color: '#FFFFFF', fontWeight: '800' }}
        maxLines={1}
        truncate="END"
      />
      <TextWidget
        text={snapshot.heroLabel}
        style={{ marginTop: 2, fontSize: 11, color: 'rgba(255, 255, 255, 0.72)' }}
      />

      <FlexWidget
        style={{
          width: 'match_parent',
          marginTop: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexGap: 8,
        }}
      >
        {buildMetricCard(snapshot.topLeftLabel, snapshot.topLeftValue)}
        {buildMetricCard(snapshot.topRightLabel, snapshot.topRightValue)}
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', marginTop: 8 }}>
        <FlexWidget
          style={{
            width: 'match_parent',
            paddingVertical: 9,
            paddingHorizontal: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            borderRadius: 14,
          }}
        >
          <TextWidget
            text={snapshot.bottomLabel}
            style={{ fontSize: 10, color: '#D7FFF8', fontWeight: '500' }}
          />
          <TextWidget
            text={snapshot.bottomValue}
            style={{ marginTop: 4, fontSize: 14, color: '#FFFFFF', fontWeight: '700' }}
            maxLines={1}
            truncate="END"
          />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          width: 'match_parent',
          marginTop: 10,
          paddingVertical: 9,
          paddingHorizontal: 12,
          backgroundColor: snapshot.hasData ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 209, 102, 0.16)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: snapshot.hasData ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 209, 102, 0.28)',
        }}
      >
        <TextWidget
          text={snapshot.insight}
          style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '500' }}
          maxLines={2}
          truncate="END"
        />
      </FlexWidget>
    </FlexWidget>

    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        paddingRight: 12,
        paddingBottom: 12,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
      }}
    >
      <FlexWidget
        style={{
          width: 42,
          height: 42,
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.18)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
        }}
      >
        <ImageWidget
          image={require('@/assets/images/cat.png')}
          imageWidth={30}
          imageHeight={30}
          radius={15}
        />
      </FlexWidget>
    </FlexWidget>
  </OverlapWidget>
);

const loadSnapshot = async (): Promise<AndroidBudgetSnapshot> => {
  const raw = await AsyncStorage.getItem(SNAPSHOT_STORAGE_KEY);
  return parseSnapshot(raw);
};

const persistSnapshot = async (snapshot: AndroidBudgetSnapshot): Promise<void> => {
  await AsyncStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
};

export const ensureAndroidWidgetTaskRegistered = () => {
  if (isWidgetTaskRegistered) return;
  isWidgetTaskRegistered = true;

  registerWidgetTaskHandler(async ({ widgetAction, renderWidget }: WidgetTaskHandlerProps) => {
    if (widgetAction === 'WIDGET_DELETED') {
      return;
    }
    const snapshot = await loadSnapshot();
    renderWidget(buildAndroidBudgetWidget(snapshot));
  });
};

export const syncAndroidBudgetWidget = async (snapshot: AndroidBudgetSnapshot) => {
  ensureAndroidWidgetTaskRegistered();
  await persistSnapshot(snapshot);
  await requestWidgetUpdate({
    widgetName: ANDROID_BUDGET_WIDGET_NAME,
    renderWidget: async () => buildAndroidBudgetWidget(snapshot),
  });
};

export const clearAndroidBudgetWidget = async () => {
  const snapshot = getDefaultSnapshot();
  await syncAndroidBudgetWidget(snapshot);
};
