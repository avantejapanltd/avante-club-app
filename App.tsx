import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DocumentProvider } from './src/context/DocumentContext';
import { TeamProvider, useTeam } from './src/context/TeamContext';
import { MemberProfileProvider } from './src/context/MemberProfileContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import PaymentSetupScreen from './src/screens/auth/PaymentSetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import DocumentScreen from './src/screens/DocumentScreen';
import ShopScreen from './src/screens/ShopScreen';
import AdminScheduleScreen from './src/screens/admin/AdminScheduleScreen';
import AdminDocumentScreen from './src/screens/admin/AdminDocumentScreen';
import AdminPaymentScreen from './src/screens/admin/AdminPaymentScreen';
import ExpenseScreen from './src/screens/expense/ExpenseScreen';
import ManagerSheetsScreen from './src/screens/manager/ManagerSheetsScreen';
import TeamSettingsScreen from './src/screens/manager/TeamSettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  ホーム: '○',
  スケジュール: '≡',
  月謝: '¥',
  書類: '□',
  ショップ: '◇',
  経費精算: '△',
  管理シート: '⊞',
  月謝管理: '¥',
  設定: '⚙',
};

function makeTabOptions(primaryColor: string, bottomInset: number) {
  return ({ route }: { route: { name: string } }) => ({
    headerShown: false,
    tabBarActiveTintColor: primaryColor,
    tabBarInactiveTintColor: '#AAAABB',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopColor: '#E2E6EA',
      borderTopWidth: 1,
      height: 60 + bottomInset,
      paddingTop: 8,
      paddingBottom: bottomInset + 10,
    },
    tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.3 },
    tabBarIconStyle: { marginBottom: 2 },
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <Text style={{ fontSize: 16, color: focused ? primaryColor : '#AAAABB', fontWeight: '700' }}>
        {TAB_ICONS[route.name] ?? '·'}
      </Text>
    ),
  });
}

// 会員タブ
function MemberTabs() {
  const { settings } = useTeam();
  const { bottom } = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={makeTabOptions(settings.primaryColor, bottom)}>
      <Tab.Screen name="ホーム" component={HomeScreen} />
      <Tab.Screen name="スケジュール" component={ScheduleScreen} />
      <Tab.Screen name="月謝" component={PaymentScreen} />
      <Tab.Screen name="ショップ" component={ShopScreen} />
      <Tab.Screen name="書類" component={DocumentScreen} />
    </Tab.Navigator>
  );
}

// 指導者タブ
function CoachTabs() {
  const { settings } = useTeam();
  const { bottom } = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={makeTabOptions(settings.primaryColor, bottom)}>
      <Tab.Screen name="ホーム" component={HomeScreen} />
      <Tab.Screen name="スケジュール" component={AdminScheduleScreen} />
      <Tab.Screen name="経費精算" component={ExpenseScreen} />
      <Tab.Screen name="書類" component={AdminDocumentScreen} />
    </Tab.Navigator>
  );
}

// 管理者タブ
function ManagerTabs() {
  const { settings } = useTeam();
  const { bottom } = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={makeTabOptions(settings.primaryColor, bottom)}>
      <Tab.Screen name="ホーム" component={HomeScreen} />
      <Tab.Screen name="経費精算" component={ExpenseScreen} />
      <Tab.Screen name="管理シート" component={ManagerSheetsScreen} />
      <Tab.Screen name="月謝管理" component={AdminPaymentScreen} />
      <Tab.Screen name="書類" component={AdminDocumentScreen} />
      <Tab.Screen name="設定" component={TeamSettingsScreen} />
    </Tab.Navigator>
  );
}

type AuthScreen = 'home' | 'login' | 'signup';

function AppNavigator() {
  const { user } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('home');

  if (!user) {
    if (authScreen === 'signup') return <SignUpScreen onBack={() => setAuthScreen('home')} />;
    if (authScreen === 'login') return <LoginScreen onSignUp={() => setAuthScreen('signup')} />;
    return (
      <HomeScreen
        onSignUp={() => setAuthScreen('signup')}
        onLogin={() => setAuthScreen('login')}
      />
    );
  }

  if (user.role === 'member' && !user.paymentSetup) return <PaymentSetupScreen />;

  if (user.role === 'manager') return <ManagerTabs />;
  if (user.role === 'coach')   return <CoachTabs />;
  return <MemberTabs />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TeamProvider>
        <MemberProfileProvider>
          <AuthProvider>
            <DocumentProvider>
              <NavigationContainer>
                <StatusBar style="light" />
                <AppNavigator />
              </NavigationContainer>
            </DocumentProvider>
          </AuthProvider>
        </MemberProfileProvider>
      </TeamProvider>
    </SafeAreaProvider>
  );
}
