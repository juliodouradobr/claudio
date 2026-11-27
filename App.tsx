import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { Platform, StyleSheet } from 'react-native';
import { StoreProvider, useStore } from './src/store';
import { useTheme, FONT } from './src/theme';
import { Ionicons, IconName } from './src/components/ui';
import TopBar from './src/components/TopBar';
import Overlays from './src/components/Overlays';
import Onboarding from './src/screens/Onboarding';
import Today from './src/screens/Today';
import Workouts from './src/screens/Workouts';
import Run from './src/screens/Run';
import Basketball from './src/screens/Basketball';
import Profile from './src/screens/Profile';
import { setupNotifications } from './src/services/notifications';

setupNotifications();
const Tab = createBottomTabNavigator();
const ICONS: Record<string, [IconName, IconName]> = {
  Hoje: ['today', 'today-outline'], Treinos: ['barbell', 'barbell-outline'], Corrida: ['walk', 'walk-outline'], Basquete: ['basketball', 'basketball-outline'], Perfil: ['person-circle', 'person-circle-outline'],
};

function Main() {
  const t = useTheme();
  const nav = { ...(t.dark ? DarkTheme : DefaultTheme), colors: { ...(t.dark ? DarkTheme : DefaultTheme).colors, background: t.bg, card: t.bg, border: t.border, primary: t.accent, text: t.text } };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TopBar />
      <NavigationContainer theme={nav}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: t.accent,
            tabBarInactiveTintColor: t.sub,
            tabBarLabelStyle: { fontFamily: FONT.bold, fontSize: 11 },
            tabBarStyle: { position: 'absolute', left: 14, right: 14, bottom: 14, height: 68, borderRadius: 28, borderTopWidth: 0, borderWidth: 1, borderColor: t.border, backgroundColor: Platform.OS === 'ios' ? 'transparent' : t.cardSolid, overflow: 'hidden', paddingTop: 6, paddingBottom: 8, elevation: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16 },
            tabBarBackground: () => (Platform.OS === 'ios' ? <BlurView intensity={50} tint={t.blur} style={StyleSheet.absoluteFill} /> : null),
            tabBarIcon: ({ focused, color }) => <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={focused ? 26 : 23} color={color} />,
          })}
        >
          <Tab.Screen name="Hoje" component={Today} />
          <Tab.Screen name="Treinos" component={Workouts} />
          <Tab.Screen name="Corrida" component={Run} />
          <Tab.Screen name="Basquete" component={Basketball} />
          <Tab.Screen name="Perfil" component={Profile} />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

function Root() {
  const { s } = useStore();
  const t = useTheme();
  if (!s.loaded) return <View style={{ flex: 1, backgroundColor: '#0F1115', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#FF6B1A" size="large" /></View>;
  return (
    <>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      {s.onboarded ? <Main /> : <Onboarding />}
      <Overlays />
    </>
  );
}

export default function App() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_900Black });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: '#0F1115' }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
