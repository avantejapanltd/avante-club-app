import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTeam } from '../../context/TeamContext';

const BRAND_COLOR = '#1A3C5E';

// 実際のURLに差し替えてください
const SHEETS = [
  {
    id: 'expense',
    icon: '🧾',
    title: '経費精算シート',
    description: '指導者から送信された経費・領収書の一覧',
    url: 'https://docs.google.com/spreadsheets/d/YOUR_EXPENSE_SHEET_ID/edit',
    color: '#1DB954',
  },
  {
    id: 'members',
    icon: '👥',
    title: '顧客管理シート',
    description: '入会申込フォームの回答一覧（名前・学年・緊急連絡先・アレルギー等）',
    url: 'https://docs.google.com/spreadsheets/d/YOUR_MEMBERS_SHEET_ID/edit',
    color: '#4A90D9',
  },
  {
    id: 'payment',
    icon: '💴',
    title: '月謝支払い管理シート',
    description: '会員ごとの月謝支払い状況・引き落とし履歴',
    url: 'https://docs.google.com/spreadsheets/d/YOUR_PAYMENT_SHEET_ID/edit',
    color: '#E8A020',
  },
];

export default function ManagerSheetsScreen() {
  const { settings } = useTeam();
  const openSheet = (url: string, title: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('エラー', `「${title}」を開けませんでした。URLを確認してください。`)
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>管理シート</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            🔒 このページは管理者のみ閲覧できます。{'\n'}
            各シートはGoogleログイン後に開きます。
          </Text>
        </View>

        {SHEETS.map(sheet => (
          <TouchableOpacity key={sheet.id} style={styles.card}
            onPress={() => openSheet(sheet.url, sheet.title)}>
            <View style={[styles.iconBox, { backgroundColor: sheet.color }]}>
              <Text style={styles.icon}>{sheet.icon}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{sheet.title}</Text>
              <Text style={styles.desc}>{sheet.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.urlNote}>
          <Text style={styles.urlNoteTitle}>URLの設定方法</Text>
          <Text style={styles.urlNoteText}>
            各スプレッドシートを作成後、{'\n'}
            <Text style={styles.code}>src/screens/manager/ManagerSheetsScreen.tsx</Text>{'\n'}
            の各URLを実際のシートのURLに差し替えてください。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: BRAND_COLOR, paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16, gap: 14 },
  notice: {
    backgroundColor: '#EEF3F9', borderRadius: 12, padding: 14,
    borderLeftWidth: 4, borderLeftColor: BRAND_COLOR,
  },
  noticeText: { fontSize: 13, color: '#445', lineHeight: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 26 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  desc: { fontSize: 12, color: '#777', lineHeight: 18 },
  arrow: { fontSize: 24, color: '#bbb' },
  urlNote: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E8EDF2', gap: 8,
  },
  urlNoteTitle: { fontSize: 13, fontWeight: 'bold', color: '#555' },
  urlNoteText: { fontSize: 12, color: '#777', lineHeight: 20 },
  code: { fontFamily: 'monospace', backgroundColor: '#F0F0F0', fontSize: 11 },
});
