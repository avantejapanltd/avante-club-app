import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClub } from '../../context/ClubContext';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';
const ACCENT = '#1A3C5E';

const TEST_CLUBS = [
  {
    id: 'AVANTE-001',
    name: 'AVANTE JAPAN',
    sport: 'サッカー',
    color: '#1A3C5E',
    accounts: [
      { role: '会員', email: 'player@avante.jp', password: 'player123' },
      { role: '指導者', email: 'coach@avante.jp', password: 'coach123' },
      { role: '管理者', email: 'manager@avante.jp', password: 'manager123' },
    ],
  },
  {
    id: 'SAKURA-002',
    name: 'スポーツクラブ桜',
    sport: 'バスケットボール',
    color: '#7F0000',
    accounts: [
      { role: '会員', email: 'player@sakura.jp', password: 'player123' },
      { role: '指導者', email: 'coach@sakura.jp', password: 'coach123' },
      { role: '管理者', email: 'manager@sakura.jp', password: 'manager123' },
    ],
  },
  {
    id: 'HOKUSEI-003',
    name: 'アカデミー北星',
    sport: '総合スポーツ',
    color: '#1B5E20',
    accounts: [
      { role: '会員', email: 'player@hokusei.jp', password: 'player123' },
      { role: '指導者', email: 'coach@hokusei.jp', password: 'coach123' },
      { role: '管理者', email: 'manager@hokusei.jp', password: 'manager123' },
    ],
  },
];

interface Props {
  onEnter: () => void;
}

export default function ClubSelectScreen({ onEnter }: Props) {
  const { selectClub } = useClub();
  const [clubId, setClubId] = useState('');
  const [error, setError] = useState('');
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  const handleEnter = () => {
    setError('');
    const ok = selectClub(clubId.trim());
    if (!ok) {
      setError('クラブIDが見つかりません。正しいIDを入力してください');
      return;
    }
    onEnter();
  };

  const handleQuickSelect = (id: string) => {
    setClubId(id);
    setError('');
    const ok = selectClub(id);
    if (ok) onEnter();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>CLUB APP</Text>
            <Text style={styles.logoSub}>SPORTS CLUB MANAGEMENT</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>クラブIDを入力</Text>
            <Text style={styles.cardDesc}>
              所属するクラブのIDを入力してログインしてください
            </Text>
            <TextInput
              style={styles.input}
              value={clubId}
              onChangeText={v => { setClubId(v.toUpperCase()); setError(''); }}
              placeholder="例: AVANTE-001"
              placeholderTextColor={TEXT2}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleEnter}
            />
            {error !== '' && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity
              style={[styles.enterBtn, { backgroundColor: ACCENT }]}
              onPress={handleEnter}>
              <Text style={styles.enterBtnText}>ログイン画面へ</Text>
            </TouchableOpacity>
          </View>

          {/* テスト用クラブ一覧 */}
          <View style={styles.testSection}>
            <Text style={styles.testSectionTitle}>テスト用クラブ</Text>
            <Text style={styles.testSectionDesc}>開発・デモ用のクラブIDです。タップして選択できます。</Text>

            {TEST_CLUBS.map(club => (
              <View key={club.id} style={styles.testClubCard}>
                <TouchableOpacity
                  style={styles.testClubHeader}
                  onPress={() => setExpandedClub(expandedClub === club.id ? null : club.id)}>
                  <View style={[styles.testClubColorDot, { backgroundColor: club.color }]} />
                  <View style={styles.testClubInfo}>
                    <Text style={styles.testClubName}>{club.name}</Text>
                    <Text style={styles.testClubMeta}>{club.sport}　ID: {club.id}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.quickSelectBtn, { borderColor: club.color }]}
                    onPress={() => handleQuickSelect(club.id)}>
                    <Text style={[styles.quickSelectBtnText, { color: club.color }]}>選択</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                {expandedClub === club.id && (
                  <View style={styles.accountList}>
                    <Text style={styles.accountListTitle}>テストアカウント</Text>
                    {club.accounts.map((acc, i) => (
                      <View key={i} style={styles.accountRow}>
                        <Text style={styles.accountRole}>{acc.role}</Text>
                        <View style={styles.accountCredentials}>
                          <Text style={styles.accountEmail}>{acc.email}</Text>
                          <Text style={styles.accountPassword}>PW: {acc.password}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 28, flexGrow: 1 },
  logoArea: { alignItems: 'center', marginVertical: 40 },
  logoText: { fontSize: 28, fontWeight: '800', color: TEXT, letterSpacing: 4 },
  logoSub: { fontSize: 10, color: TEXT2, marginTop: 8, letterSpacing: 3, fontWeight: '600' },

  card: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 24,
    borderWidth: 1, borderColor: BORDER, gap: 12, marginBottom: 32,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: TEXT, letterSpacing: 1 },
  cardDesc: { fontSize: 13, color: TEXT2, lineHeight: 20 },
  input: {
    backgroundColor: BG, borderRadius: 4, borderWidth: 1,
    borderColor: BORDER, padding: 16, fontSize: 18,
    color: TEXT, fontWeight: '700', letterSpacing: 2,
  },
  errorText: { color: '#F87171', fontSize: 13, fontWeight: '600' },
  enterBtn: {
    borderRadius: 4, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  enterBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  testSection: { gap: 12 },
  testSectionTitle: { fontSize: 11, color: TEXT2, fontWeight: '700', letterSpacing: 2 },
  testSectionDesc: { fontSize: 12, color: TEXT2, lineHeight: 18 },

  testClubCard: {
    backgroundColor: SURFACE, borderRadius: 4,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  testClubHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  testClubColorDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  testClubInfo: { flex: 1 },
  testClubName: { fontSize: 14, fontWeight: '700', color: TEXT },
  testClubMeta: { fontSize: 11, color: TEXT2, marginTop: 2, letterSpacing: 0.5 },
  quickSelectBtn: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  quickSelectBtnText: { fontSize: 12, fontWeight: '700' },

  accountList: {
    backgroundColor: BG, borderTopWidth: 1, borderTopColor: BORDER,
    padding: 16, gap: 8,
  },
  accountListTitle: { fontSize: 10, color: TEXT2, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  accountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: SURFACE, borderRadius: 4, borderWidth: 1,
    borderColor: BORDER, padding: 10,
  },
  accountRole: {
    fontSize: 11, fontWeight: '700', color: TEXT2,
    width: 44, letterSpacing: 0.5,
  },
  accountCredentials: { flex: 1 },
  accountEmail: { fontSize: 12, color: TEXT, fontWeight: '600' },
  accountPassword: { fontSize: 11, color: TEXT2, marginTop: 2 },
});
