import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Image, Platform, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

// 実際のGoogleスプレッドシートURLに差し替えてください
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit';

const BRAND_COLOR = '#1A3C5E';
const ACCENT_COLOR = '#E8A020';
const GREEN = '#28A745';

const CATEGORIES = ['交通費', '会場費', '消耗品費', '通信費', '会議費', '指導費', '審判費', 'その他'];
const CATEGORY_COLORS: Record<string, string> = {
  交通費: '#4A90D9', 会場費: '#28A745', 消耗品費: '#FD7E14',
  通信費: '#7B68EE', 会議費: '#20C997', 指導費: '#E8A020', 審判費: '#DC3545', その他: '#888',
};

type Status = 'pending' | 'synced' | 'approved';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  receiptUri: string | null;
  status: Status;
  submittedAt: string;
}

const INITIAL_EXPENSES: Expense[] = [
  { id: '1', date: '2026/03/20', category: '交通費', description: '練習会場への交通費', amount: 1240, receiptUri: null, status: 'approved', submittedAt: '2026/03/20 18:30' },
  { id: '2', date: '2026/03/18', category: '消耗品費', description: 'マーカーコーン購入', amount: 3300, receiptUri: null, status: 'synced', submittedAt: '2026/03/18 20:15' },
  { id: '3', date: '2026/03/15', category: '会場費', description: '体育館追加使用料', amount: 5500, receiptUri: null, status: 'pending', submittedAt: '2026/03/15 21:00' },
];

const STATUS_LABEL: Record<Status, string> = { pending: '未反映', synced: 'シート反映済', approved: '承認済' };
const STATUS_COLOR: Record<Status, string> = { pending: '#FFC107', synced: '#4A90D9', approved: GREEN };

// Google Sheets API 送信モック
async function syncToGoogleSheets(expenses: Expense[]): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 1500));
}

interface NewExpense {
  date: string;
  category: string;
  description: string;
  amount: string;
  receiptUri: string | null;
}

import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';

export default function ExpenseScreen() {
  const { user } = useAuth();
  const { settings } = useTeam();
  const isManager = user?.role === 'manager';
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [modalVisible, setModalVisible] = useState(false);
  const [newExp, setNewExp] = useState<NewExpense>({
    date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
    category: '交通費',
    description: '',
    amount: '',
    receiptUri: null,
  });
  const [error, setError] = useState('');

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'pending').length;

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // Web: file input経由
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setNewExp(p => ({ ...p, receiptUri: url }));
        }
      };
      input.click();
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('許可が必要です', 'カメラロールへのアクセスを許可してください'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setNewExp(p => ({ ...p, receiptUri: result.assets[0].uri }));
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') { Alert.alert('カメラ', 'Webではカメラ撮影は利用できません。ファイルから選択してください'); return; }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('許可が必要です', 'カメラへのアクセスを許可してください'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setNewExp(p => ({ ...p, receiptUri: result.assets[0].uri }));
    }
  };

  const handleAdd = () => {
    setError('');
    if (!newExp.date) { setError('日付を入力してください'); return; }
    if (!newExp.description) { setError('内容を入力してください'); return; }
    const amount = parseInt(newExp.amount.replace(/,/g, ''), 10);
    if (isNaN(amount) || amount <= 0) { setError('金額を正しく入力してください'); return; }

    const item: Expense = {
      id: String(Date.now()),
      date: newExp.date,
      category: newExp.category,
      description: newExp.description,
      amount,
      receiptUri: newExp.receiptUri,
      status: 'pending',
      submittedAt: new Date().toLocaleString('ja-JP'),
    };
    setExpenses(prev => [item, ...prev]);
    setModalVisible(false);
    setNewExp({ date: new Date().toISOString().split('T')[0].replace(/-/g, '/'), category: '交通費', description: '', amount: '', receiptUri: null });
  };

  const handleSync = async () => {
    const pendingItems = expenses.filter(e => e.status === 'pending');
    if (pendingItems.length === 0) { Alert.alert('対象なし', '未反映の経費はありません'); return; }
    // 経費データをシートに反映（送信）
    setExpenses(prev => prev.map(e => e.status === 'pending' ? { ...e, status: 'synced' } : e));
    Alert.alert('送信完了', `${pendingItems.length}件を送信しました。管理者の承認をお待ちください。`);
  };

  const handleOpenSheet = async () => {
    try {
      await Linking.openURL(SPREADSHEET_URL);
    } catch {
      Alert.alert('エラー', 'スプレッドシートを開けませんでした。URLを確認してください。');
    }
  };

  const handleApprove = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>経費精算</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: settings.accentColor }]} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ 追加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* サマリーカード */}
        <View style={[styles.summaryCard, { backgroundColor: settings.primaryColor }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>今月合計</Text>
              <Text style={styles.summaryAmount}>¥{total.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>未反映</Text>
              <Text style={[styles.summaryAmount, { color: pendingCount > 0 ? '#FFC107' : GREEN }]}>
                {pendingCount}件
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>承認済み</Text>
              <Text style={[styles.summaryAmount, { color: GREEN }]}>
                {expenses.filter(e => e.status === 'approved').length}件
              </Text>
            </View>
          </View>
        </View>

        {/* 指導者：送信ボタン */}
        {!isManager && (
          <TouchableOpacity style={styles.syncBtn} onPress={handleSync}>
            <Text style={styles.syncBtnText}>📤  経費を送信する（{pendingCount}件）</Text>
          </TouchableOpacity>
        )}

        {/* 管理者：スプレッドシート確認ボタン */}
        {isManager && (
          <TouchableOpacity style={styles.sheetBtn} onPress={handleOpenSheet}>
            <Text style={styles.sheetBtnText}>📊  スプレッドシートで確認する</Text>
          </TouchableOpacity>
        )}

        {/* 経費一覧 */}
        <Text style={styles.sectionTitle}>経費一覧</Text>
        {expenses.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.catBadge, { backgroundColor: CATEGORY_COLORS[item.category] ?? '#888' }]}>
                <Text style={styles.catText}>{item.category}</Text>
              </View>
              <Text style={styles.expDate}>{item.date}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] }]}>
                <Text style={styles.statusText}>{STATUS_LABEL[item.status]}</Text>
              </View>
            </View>
            <View style={styles.cardMain}>
              <View style={{ flex: 1 }}>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.submittedAt}>提出: {item.submittedAt}</Text>
              </View>
              <Text style={[styles.amount, { color: settings.primaryColor }]}>¥{item.amount.toLocaleString()}</Text>
            </View>
            {item.receiptUri && (
              <Image source={{ uri: item.receiptUri }} style={styles.receiptThumb} resizeMode="cover" />
            )}
            {!item.receiptUri && (
              <Text style={styles.noReceipt}>領収書: 未添付</Text>
            )}
            {isManager && item.status === 'synced' && (
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                <Text style={styles.approveBtnText}>承認する</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* 経費追加モーダル */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>経費を追加</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtn}>閉じる</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>

            {/* 領収書撮影 */}
            <Text style={styles.label}>領収書</Text>
            {newExp.receiptUri ? (
              <View style={styles.previewArea}>
                <Image source={{ uri: newExp.receiptUri }} style={styles.preview} resizeMode="contain" />
                <TouchableOpacity style={styles.removeImg} onPress={() => setNewExp(p => ({ ...p, receiptUri: null }))}>
                  <Text style={styles.removeImgText}>削除</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                  <Text style={styles.photoBtnIcon}>📷</Text>
                  <Text style={styles.photoBtnText}>撮影する</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                  <Text style={styles.photoBtnIcon}>🖼️</Text>
                  <Text style={styles.photoBtnText}>ファイルから選択</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 日付 */}
            <Text style={styles.label}>日付</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={webInputStyle}
                value={newExp.date.replace(/\//g, '-')}
                onChange={e => setNewExp(p => ({ ...p, date: e.target.value.replace(/-/g, '/') }))}
              />
            ) : (
              <TextInput style={styles.input} value={newExp.date}
                onChangeText={v => setNewExp(p => ({ ...p, date: v }))} placeholder="2026/03/25" />
            )}

            {/* カテゴリ */}
            <Text style={styles.label}>カテゴリ</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c}
                  style={[styles.chip, newExp.category === c && [styles.chipActive, { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor }]]}
                  onPress={() => setNewExp(p => ({ ...p, category: c }))}>
                  <Text style={[styles.chipText, newExp.category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 内容 */}
            <Text style={styles.label}>内容</Text>
            <TextInput style={styles.input} value={newExp.description}
              onChangeText={v => { setNewExp(p => ({ ...p, description: v })); setError(''); }}
              placeholder="例: 練習会場への交通費" />

            {/* 金額 */}
            <Text style={styles.label}>金額（円）</Text>
            <TextInput style={styles.input} value={newExp.amount}
              onChangeText={v => { setNewExp(p => ({ ...p, amount: v.replace(/[^0-9]/g, '') })); setError(''); }}
              placeholder="例: 1240" keyboardType="numeric" />

            {error !== '' && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: settings.primaryColor }]} onPress={handleAdd}>
              <Text style={styles.submitBtnText}>経費を申請する</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const webInputStyle: React.CSSProperties = {
  backgroundColor: '#fff', border: '1px solid #DDE2E8',
  borderRadius: 10, padding: 14, fontSize: 15, width: '100%', boxSizing: 'border-box' as const,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: BRAND_COLOR, paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addBtn: { backgroundColor: ACCENT_COLOR, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  content: { padding: 16, gap: 12 },
  summaryCard: {
    backgroundColor: BRAND_COLOR, borderRadius: 14, padding: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: '#aac', fontSize: 12, marginBottom: 4 },
  summaryAmount: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  syncBtn: {
    backgroundColor: '#1DB954', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  syncBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sheetBtn: {
    backgroundColor: '#0F9D58', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center',
  },
  sheetBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  approveBtn: {
    backgroundColor: '#28A745', borderRadius: 8, paddingVertical: 10,
    alignItems: 'center', marginTop: 8,
  },
  approveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  expDate: { flex: 1, fontSize: 13, color: '#888' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start' },
  description: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 2 },
  submittedAt: { fontSize: 11, color: '#aaa' },
  amount: { fontSize: 18, fontWeight: 'bold', color: BRAND_COLOR },
  receiptThumb: { width: '100%', height: 120, borderRadius: 8 },
  noReceipt: { fontSize: 12, color: '#bbb' },
  modal: { flex: 1, backgroundColor: '#F5F7FA' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: BRAND_COLOR },
  closeBtn: { color: '#888', fontSize: 15 },
  modalContent: { padding: 20, gap: 8 },
  label: { fontSize: 13, color: '#555', fontWeight: '600', marginTop: 12 },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2,
    borderColor: '#DDE2E8', borderStyle: 'dashed', paddingVertical: 20,
    alignItems: 'center', gap: 6,
  },
  photoBtnIcon: { fontSize: 28 },
  photoBtnText: { fontSize: 13, color: '#555' },
  previewArea: { position: 'relative' },
  preview: { width: '100%', height: 200, borderRadius: 12 },
  removeImg: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  removeImgText: { color: '#fff', fontSize: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    borderWidth: 1.5, borderColor: '#DDE2E8', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff',
  },
  chipActive: { borderColor: BRAND_COLOR, backgroundColor: BRAND_COLOR },
  chipText: { fontSize: 13, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#DDE2E8', padding: 14, fontSize: 15,
  },
  errorText: { color: '#DC3545', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  submitBtn: { backgroundColor: BRAND_COLOR, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
