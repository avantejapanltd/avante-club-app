import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTeam } from '../../context/TeamContext';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';

interface PaymentRecord {
  email: string;
  name: string;
  month: string;
  amount: string;
  status: '成功' | '失敗' | string;
  emailSent?: boolean;
}

type SendState = 'idle' | 'sending' | 'done';

const MAX_CSV_ROWS = 500;
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// CSVインジェクション対策: 数式として解釈される文字で始まる値を無害化
function sanitizeCSVValue(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value;
  }
  return value;
}

function parseCSV(text: string): { records: PaymentRecord[]; error?: string } {
  const lines = text.trim().split('\n');

  if (lines.length > MAX_CSV_ROWS + 1) {
    return { records: [], error: `CSVの行数が上限（${MAX_CSV_ROWS}件）を超えています` };
  }

  const records: PaymentRecord[] = [];

  // BOMを除去
  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const header = firstLine.split(',').map(h => h.trim());

  const idx = {
    email: header.findIndex(h => h === 'メールアドレス' || h === 'email'),
    name: header.findIndex(h => h === '会員名' || h === '氏名' || h === 'name'),
    month: header.findIndex(h => h === '対象月' || h === '月' || h === 'month'),
    amount: header.findIndex(h => h === '金額' || h === 'amount'),
    status: header.findIndex(h => h === 'ステータス' || h === '結果' || h === 'status'),
  };

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 2 || !cols[0]) continue;

    const rawEmail = idx.email >= 0 ? cols[idx.email] ?? '' : cols[0] ?? '';

    // メールアドレス形式チェック
    if (rawEmail && !EMAIL_REGEX.test(rawEmail)) continue;

    records.push({
      email: rawEmail,
      name: sanitizeCSVValue(idx.name >= 0 ? cols[idx.name] ?? '' : cols[1] ?? ''),
      month: sanitizeCSVValue(idx.month >= 0 ? cols[idx.month] ?? '' : cols[2] ?? ''),
      amount: idx.amount >= 0 ? cols[idx.amount] ?? '' : cols[3] ?? '',
      status: sanitizeCSVValue(idx.status >= 0 ? cols[idx.status] ?? '' : cols[4] ?? ''),
    });
  }
  return { records };
}

export default function AdminPaymentScreen() {
  const { settings } = useTeam();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sendState, setSendState] = useState<SendState>('idle');
  const [parseError, setParseError] = useState<string | null>(null);

  const handlePickCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      // ファイルサイズチェック
      if (asset.size && asset.size > MAX_FILE_SIZE_BYTES) {
        setParseError('ファイルサイズが1MBを超えています。ファイルを分割してください。');
        return;
      }

      const content = await FileSystem.readAsStringAsync(asset.uri);
      const { records: parsed, error: parseErr } = parseCSV(content);

      if (parseErr) {
        setParseError(parseErr);
        setRecords([]);
        setFileName(null);
        return;
      }

      if (parsed.length === 0) {
        setParseError('有効なデータが見つかりません。CSVの形式またはメールアドレスの形式を確認してください。');
        setRecords([]);
        setFileName(null);
        return;
      }

      setParseError(null);
      setRecords(parsed);
      setFileName(asset.name);
      setSendState('idle');
    } catch {
      Alert.alert('エラー', 'ファイルの読み込みに失敗しました。');
    }
  };

  const handleSendEmails = () => {
    if (records.length === 0) return;

    Alert.alert(
      'メール送信確認',
      `${records.length}件の会員にメールを送信します。よろしいですか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '送信する',
          onPress: async () => {
            setSendState('sending');
            // メール送信処理のシミュレーション（実際はバックエンドAPIを呼び出す）
            await new Promise(resolve => setTimeout(resolve, 1500));
            setRecords(prev => prev.map(r => ({ ...r, emailSent: true })));
            setSendState('done');
          },
        },
      ]
    );
  };

  const successCount = records.filter(r => r.status === '成功').length;
  const failCount = records.filter(r => r.status === '失敗').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>月謝支払い結果管理</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* CSV形式ガイド */}
        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>CSVファイルの形式</Text>
          <Text style={styles.guideText}>
            決済代行業者から受け取ったCSVファイルを読み込んでください。{'\n'}
            以下のヘッダー行が必要です：
          </Text>
          <Text style={styles.guideCode}>
            メールアドレス,会員名,対象月,金額,ステータス
          </Text>
          <Text style={styles.guideNote}>
            ※ ステータス列には「成功」または「失敗」を入力
          </Text>
        </View>

        {/* ファイル選択ボタン */}
        <TouchableOpacity
          style={[styles.pickBtn, { borderColor: settings.primaryColor }]}
          onPress={handlePickCSV}
        >
          <Text style={[styles.pickBtnText, { color: settings.primaryColor }]}>
            CSVファイルを選択
          </Text>
        </TouchableOpacity>

        {parseError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{parseError}</Text>
          </View>
        )}

        {/* 読み込み結果プレビュー */}
        {records.length > 0 && (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryCount}>{records.length}</Text>
                <Text style={styles.summaryLabel}>総件数</Text>
              </View>
              <View style={[styles.summaryItem, styles.summaryDivider]}>
                <Text style={[styles.summaryCount, { color: '#28A745' }]}>{successCount}</Text>
                <Text style={styles.summaryLabel}>成功</Text>
              </View>
              <View style={[styles.summaryItem, styles.summaryDivider]}>
                <Text style={[styles.summaryCount, { color: '#DC3545' }]}>{failCount}</Text>
                <Text style={styles.summaryLabel}>失敗</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              読み込み結果: {fileName}
            </Text>

            {records.map((r, i) => (
              <View key={i} style={styles.recordCard}>
                <View style={styles.recordTop}>
                  <Text style={styles.recordName}>{r.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    { borderColor: r.status === '成功' ? '#28A745' : '#DC3545' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: r.status === '成功' ? '#28A745' : '#DC3545' }
                    ]}>
                      {r.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recordEmail}>{r.email}</Text>
                <View style={styles.recordBottom}>
                  <Text style={styles.recordDetail}>{r.month}</Text>
                  {r.amount !== '' && (
                    <Text style={styles.recordDetail}>
                      ¥{Number(r.amount).toLocaleString() || r.amount}
                    </Text>
                  )}
                  {r.emailSent && (
                    <Text style={styles.sentMark}>メール送信済み</Text>
                  )}
                </View>
              </View>
            ))}

            {/* メール送信ボタン */}
            {sendState !== 'done' && (
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: settings.primaryColor }]}
                onPress={handleSendEmails}
                disabled={sendState === 'sending'}
              >
                {sendState === 'sending' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sendBtnText}>
                    全会員に支払い結果メールを送信する ({records.length}件)
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {sendState === 'done' && (
              <View style={styles.doneBox}>
                <Text style={styles.doneText}>
                  {records.length}件のメール送信が完了しました
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  content: { padding: 16, gap: 12 },
  guideBox: {
    backgroundColor: '#EEF3F9', borderRadius: 8, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#1A3C5E',
  },
  guideTitle: { fontSize: 12, fontWeight: '700', color: '#1A3C5E', marginBottom: 8, letterSpacing: 1 },
  guideText: { fontSize: 12, color: '#445', lineHeight: 18, marginBottom: 8 },
  guideCode: {
    fontFamily: 'monospace', fontSize: 11, color: '#1A3C5E',
    backgroundColor: '#fff', padding: 8, borderRadius: 4,
    borderWidth: 1, borderColor: '#C8D8EC',
  },
  guideNote: { fontSize: 11, color: TEXT2, marginTop: 6 },
  pickBtn: {
    borderWidth: 2, borderRadius: 4, paddingVertical: 14,
    alignItems: 'center', borderStyle: 'dashed',
  },
  pickBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  errorBox: {
    backgroundColor: '#FFF0F0', borderRadius: 4, padding: 12,
    borderWidth: 1, borderColor: '#DC3545',
  },
  errorText: { color: '#DC3545', fontSize: 13 },
  summaryRow: {
    flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 4,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  summaryDivider: { borderLeftWidth: 1, borderLeftColor: BORDER },
  summaryCount: { fontSize: 24, fontWeight: '800', color: TEXT },
  summaryLabel: { fontSize: 10, color: TEXT2, marginTop: 4, letterSpacing: 1 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: TEXT2, letterSpacing: 2 },
  recordCard: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 14,
    borderWidth: 1, borderColor: BORDER,
  },
  recordTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  recordName: { fontSize: 14, fontWeight: '700', color: TEXT },
  statusBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  recordEmail: { fontSize: 11, color: TEXT2, marginBottom: 6 },
  recordBottom: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  recordDetail: { fontSize: 12, color: TEXT2 },
  sentMark: { fontSize: 11, color: '#28A745', fontWeight: '600', marginLeft: 'auto' },
  sendBtn: {
    borderRadius: 4, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  doneBox: {
    backgroundColor: '#F0FFF4', borderRadius: 4, padding: 16,
    borderWidth: 1, borderColor: '#28A745', alignItems: 'center', marginTop: 8,
  },
  doneText: { color: '#28A745', fontSize: 14, fontWeight: '700' },
});
