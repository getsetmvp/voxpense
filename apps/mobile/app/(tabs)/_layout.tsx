// Bottom tab navigator. MVP flat style (no glass, no blur, no floating card).
// 5 tabs: Home / Expenses / Ask / Insights / Settings.

import { Tabs } from 'expo-router';
import { BarChart3, Home, List, MessageCircle, Settings } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function TabsLayout() {
  const { tokens } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tokens.surface,
          borderTopColor: tokens.border,
          height: 76,
          paddingTop: 8,
          paddingBottom: 16,
        },
        tabBarActiveTintColor: tokens.brand,
        tabBarInactiveTintColor: tokens.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <List size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <BarChart3 size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
