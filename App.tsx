import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import { ClubProvider, useClub } from './src/context/ClubContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DocumentProvider } from './src/context/DocumentContext';
import { TeamProvider, useTeam } from './src/context/TeamContext';
import { MemberProfileProvider } from './src/context/MemberProfileContext';
import { ScheduleProvider } from './src/context/ScheduleContext';
import ClubSelectScreen from './src/screens/auth/ClubSelectScreen';
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
  引落結果照会: '¥',
  設定: '⚙',
};

function makeTabOptions(primaryColor: string) {
  return ({ route }: { route: { name: string } }) => ({
    headerShown: false,
    tabBarActiveTintColor: primaryColor,
    tabBarInactiveTintColor: '#AAAABB',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopColor: '#E2E6EA',
      borderTopWidth: 1,
      height: 75,
      paddingTop: 10,
      paddingBottom: 18,
    },
    tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.3 },
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <Text style={{ fontSize: 16, color: focused ? primaryColor : '#AAAABB', fontWeight: '700' }}>
        {TAB_ICONS[route.name] ?? '·'}
      </Text>
    ),
  });
}

function MemberTabs() {
  const { settings } = useTeam();
  return (
    <Tab.Navigator screenOptions={makeTabOptions(settings.primaryColor)}>
      <Tab.Screen name="ホーム" component={HomeScreen} />
      <Tab.Screen name="スケジュール" component={ScheduleScreen} />
      <Tab.Screen name="月謝" component={PaymentScreen} />
      <Tab.Screen name="ショップ" component={ShopScreen} />
      <Tab.Screen name="書類" component={DocumentScreen} />
    </Tab.Navigator>
  );
}

function CoachTabs() {
  const { settings } = useTeam();
  return (
    <Tab.Navigator screenOptions={makeTabOptions(settings.primaryColor)}>
      <Tab.Screen name="ホーム" component={HomeScreen} />
      <Tab.Screen name="スケジュール" component={AdminScheduleScreen} />
      <Tab.Screen name="経費精算" component={ExpenseScreen} />
      <Tab.Screen name="書類" component={AdminDocumentScreen} />
    </Tab.Navigator>
  );
}

function ManagerTabs() {
  const { settings } = useTeam();
  return (
    <Tab.Navigator screenOptions={makeTabOptions(settings.primaryColor)}>
      <Tab.Screen name="ホーム" component={HomeScreen} />
      <Tab.Screen name="経費精算" component={ExpenseScreen} />
      <Tab.Screen name="引落結果照会" component={AdminPaymentScreen} />
      <Tab.Screen name="管理シート" component={ManagerSheetsScreen} />
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

/**
 * Club-scoped app: keyed by clubId so all state resets when club changes.
 * All providers below re-mount on club switch → complete data isolation.
 */
function ClubScopedApp({ clubId }: { clubId: string }) {
  return (
    <TeamProvider>
      <ScheduleProvider>
        <MemberProfileProvider>
          <AuthProvider>
            <DocumentProvider>
              <NavigationContainer key={clubId}>
                <StatusBar style="light" />
                <AppNavigator />
              </NavigationContainer>
            </DocumentProvider>
          </AuthProvider>
        </MemberProfileProvider>
      </ScheduleProvider>
    </TeamProvider>
  );
}

/**
 * Routes between club selection and the main app.
 * Must be rendered inside ClubProvider.
 */
function ClubRouter() {
  const { currentClubId } = useClub();
  const [clubSelected, setClubSelected] = useState(false);

  if (!currentClubId || !clubSelected) {
    return <ClubSelectScreen onEnter={() => setClubSelected(true)} />;
  }

  return <ClubScopedApp key={currentClubId} clubId={currentClubId} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ClubProvider>
        <ClubRouter />
      </ClubProvider>
    </SafeAreaProvider>
  );
}
