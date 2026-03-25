import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';
const ACCENT = '#1A3C5E';

// 開発用テスト認証情報（Supabase接続後に削除）
// UIには表示しない
const TEST_ACCOUNTS: Record<string, { password: string; role: UserRole; name: string }> = {
  'player123@avante.jp': { password: 'player123', role: 'member',  name: 'テスト会員' },
  'coach@avante.jp':     { password: 'coach123',  role: 'coach',   name: '指導者' },
  'manager@avante.jp':   { password: 'manager123',role: 'manager', name: '管理者' },
};

type Tab = 'member' | 'coach' | 'manager';

interface Props {
  onSignUp?: () => void;
}

export default function LoginScreen({ onSignUp }: Props) {
  const { login, recordLoginFailure, resetLoginAttempts, getLoginLockStatus } = useAuth();
  const { settings } = useTeam();
  const [tab, setTab] = useState<Tab>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    // ロックアウト確認
    const lockStatus = getLoginLockStatus(trimmedEmail);
    if (lockStatus.locked) {
      setError(`ログイン試行回数が上限を超えました。${lockStatus.remainingSeconds}秒後に再試行してください`);
      return;
    }

    if (tab === 'member') {
      const account = TEST_ACCOUNTS[trimmedEmail];
      if (account && account.role === 'member') {
        if (account.password !== password) {
          recordLoginFailure(trimmedEmail);
          const newLock = getLoginLockStatus(trimmedEmail);
          setError(newLock.locked
            ? `ログイン試行回数が上限を超えました。${newLock.remainingSeconds}秒後に再試行してください`
            : 'メールアドレスまたはパスワードが間違っています'
          );
          return;
        }
        resetLoginAttempts(trimmedEmail);
        login('member', account.name, trimmedEmail);
        return;
      }
      // テストアカウント以外は最低長チェックのみ
      if (password.length < 6) {
        setError('パスワードを入力してください');
        return;
      }
      login('member', trimmedEmail.split('@')[0], trimmedEmail);
      resetLoginAttempts(trimmedEmail);
      return;
    }

    const account = TEST_ACCOUNTS[trimmedEmail];
    if (!account || account.password !== password || account.role !== tab) {
      recordLoginFailure(trimmedEmail);
      const newLock = getLoginLockStatus(trimmedEmail);
      if (newLock.locked) {
        setError(`ログイン試行回数が上限を超えました。${newLock.remainingSeconds}秒後に再試行してください`);
      } else {
        setError('メールアドレスまたはパスワードが間違っています');
      }
      return;
    }

    resetLoginAttempts(trimmedEmail);
    login(account.role, account.name, trimmedEmail);
  };

  const switchTab = (t: Tab) => { setTab(t); setError(''); setEmail(''); setPassword(''); };

  const placeholder: Record<Tab, string> = {
    member:  'example@email.com',
    coach:   'coach@avante.jp',
    manager: 'manager@avante.jp',
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>{settings.teamName}</Text>
            <Text style={[styles.logoSub, { color: settings.primaryColor }]}>MEMBER LOGIN</Text>
          </View>

          {/* 3タブ */}
          <View style={styles.tabRow}>
            {(['member', 'coach', 'manager'] as Tab[]).map(t => (
              <TouchableOpacity key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => switchTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === 'member' ? '会員' : t === 'coach' ? '指導者' : '管理者'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>メールアドレス</Text>
            <TextInput style={styles.input} value={email}
              onChangeText={v => { setEmail(v); setError(''); }}
              placeholder={placeholder[tab]}
              placeholderTextColor={TEXT2}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>パスワード</Text>
            <TextInput style={styles.input} value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
              placeholder="パスワード"
              placeholderTextColor={TEXT2}
              secureTextEntry
              autoCorrect={false}
            />

            {error !== '' && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={[styles.loginBtn, { backgroundColor: settings.primaryColor }]} onPress={handleLogin}>
              <Text style={styles.loginBtnText}>ログイン</Text>
            </TouchableOpacity>

            {tab === 'member' && onSignUp && (
              <TouchableOpacity onPress={onSignUp} style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={styles.hint}>
                  アカウントをお持ちでない方は
                  <Text style={{ color: settings.primaryColor }}>  新規登録</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 28, flexGrow: 1 },
  logoArea: { alignItems: 'center', marginVertical: 48 },
  logoText: { fontSize: 26, fontWeight: '800', color: TEXT, letterSpacing: 4 },
  logoSub: { fontSize: 11, color: ACCENT, marginTop: 8, letterSpacing: 3, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row', borderWidth: 1, borderColor: BORDER,
    borderRadius: 4, marginBottom: 28, overflow: 'hidden',
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { backgroundColor: SURFACE },
  tabText: { fontSize: 13, color: TEXT2, letterSpacing: 0.5 },
  tabTextActive: { color: TEXT, fontWeight: '700' },
  form: { gap: 8 },
  label: { fontSize: 10, color: TEXT2, fontWeight: '700', marginTop: 12, letterSpacing: 2 },
  input: {
    backgroundColor: SURFACE, borderRadius: 4, borderWidth: 1,
    borderColor: BORDER, padding: 16, fontSize: 15, color: TEXT,
  },
  errorText: { color: '#F87171', fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  loginBtn: {
    backgroundColor: ACCENT, borderRadius: 4, paddingVertical: 16,
    alignItems: 'center', marginTop: 20,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  hint: { textAlign: 'center', color: TEXT2, fontSize: 12, marginTop: 8, letterSpacing: 0.3 },
});
