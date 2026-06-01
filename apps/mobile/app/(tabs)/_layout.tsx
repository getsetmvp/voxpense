// Bottom tab navigator. Floating glass tab bar pixel-matched to
// `~/Productivity/hustle/voxpense/mockups/index.html` (HomeScreen frame, screen 06).
//
// Order: Home / Expenses / Ask / Insights / Settings (5 tabs).
// Icons: lucide-react-native (matches mockup).
// Shell: floating rounded-2xl card, BlurView background (intensity 40), inset 12px
// from horizontal edges and 12px above the bottom safe area.

import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, List, MessageCircle, PieChart, Settings } from 'lucide-react-native';

const BAR_HEIGHT = 64;
const SIDE_INSET = 12;
const BOTTOM_EXTRA = 12;

export default function TabsLayout() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  const activeColor = isDark ? '#60A5FA' : '#3B82F6';
  const inactiveColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <Tabs
      screenOptions={() => ({
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          position: 'absolute',
          left: SIDE_INSET,
          right: SIDE_INSET,
          bottom: bottomInset + BOTTOM_EXTRA - 12,
          height: BAR_HEIGHT,
          borderRadius: 16,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.30)',
          backgroundColor: 'transparent',
          elevation: 0,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 8,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            intensity={40}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isDark
                ? 'rgba(17,24,39,0.55)'
                : 'rgba(255,255,255,0.55)',
            }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={22} strokeWidth={focused ? 2.4 : 2} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <LabelText color={color} focused={focused}>Home</LabelText>
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, focused }) => (
            <List color={color} size={22} strokeWidth={focused ? 2.4 : 2} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <LabelText color={color} focused={focused}>Expenses</LabelText>
          ),
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle color={color} size={22} strokeWidth={focused ? 2.4 : 2} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <LabelText color={color} focused={focused}>Ask</LabelText>
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <PieChart color={color} size={22} strokeWidth={focused ? 2.4 : 2} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <LabelText color={color} focused={focused}>Insights</LabelText>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings color={color} size={22} strokeWidth={focused ? 2.4 : 2} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <LabelText color={color} focused={focused}>Settings</LabelText>
          ),
        }}
      />
    </Tabs>
  );
}

function LabelText({
  color,
  focused,
  children,
}: {
  color: string;
  focused: boolean;
  children: string;
}) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: focused ? '600' : '500',
        color,
        marginTop: 2,
      }}
    >
      {children}
    </Text>
  );
}
