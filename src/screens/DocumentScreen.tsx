import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDocuments } from '../context/DocumentContext';
import { useTeam } from '../context/TeamContext';

const BRAND_COLOR = '#1A3C5E';
const ACCENT_COLOR = '#E8A020';

// 実際のGoogleフォームURLに差し替えてください
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform';

const FORM_FIELDS = [
  '名前', 'フリガナ', '学年', '学校名',
  '緊急連絡先（名前）', '緊急連絡先（電話番号）', 'アレルギー', '肖像権同意（はい・いいえ）',
];

const CATEGORY_COLORS: Record<string, string> = {
  申込: '#4A90D9', 規約: '#7B68EE', 同意書: '#28A745',
  注文: '#FD7E14', お知らせ: '#20C997',
};

export default function DocumentScreen() {
  const { documents, categories } = useDocuments();
  const { settings } = useTeam();
  const [selected, setSelected] = useState('すべて');
  const [formExpanded, setFormExpanded] = useState(false);

  const filtered = selected === 'すべて'
    ? documents
    : documents.filter(d => d.category === selected);

  const openForm = () => {
    Linking.openURL(GOOGLE_FORM_URL).catch(() =>
      Alert.alert('エラー', 'フォームを開けませんでした。URLを確認してください。')
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>書類・申込フォーム</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* 入会申込フォームカード */}
        <View style={[styles.formCard, { borderColor: settings.accentColor }]}>
          <View style={styles.formCardTop}>
            <View style={styles.formCardLeft}>
              <Text style={styles.formCardIcon}>📋</Text>
              <View>
                <Text style={styles.formCardTitle}>入会申込フォーム</Text>
                <Text style={styles.formCardSub}>Googleフォーム · スプレッドシートに自動反映</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setFormExpanded(v => !v)}>
              <Text style={styles.formExpandBtn}>{formExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          </View>

          {formExpanded && (
            <View style={styles.formFields}>
              {FORM_FIELDS.map(f => (
                <View key={f} style={styles.fieldRow}>
                  <Text style={[styles.fieldDot, { color: settings.accentColor }]}>•</Text>
                  <Text style={styles.fieldText}>{f}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={[styles.openFormBtn, { backgroundColor: settings.primaryColor }]} onPress={openForm}>
            <Text style={styles.openFormBtnText}>フォームを開いて記入する</Text>
          </TouchableOpacity>
        </View>

        {/* カテゴリフィルター */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.filterBar} contentContainerStyle={styles.filterContent}>
          {['すべて', ...categories].map(cat => (
            <TouchableOpacity key={cat}
              style={[styles.filterBtn, selected === cat && [styles.filterBtnActive, { backgroundColor: settings.primaryColor }]]}
              onPress={() => setSelected(cat)}>
              <Text style={[styles.filterText, selected === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 書類一覧 */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>書類はありません</Text>
          </View>
        ) : (
          filtered.map(doc => (
            <View key={doc.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.left}>
                  <View style={[styles.catBadge, { backgroundColor: CATEGORY_COLORS[doc.category] ?? '#888' }]}>
                    <Text style={styles.catText}>{doc.category}</Text>
                  </View>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.meta}>{doc.updatedAt} · {doc.size}</Text>
                </View>
                <TouchableOpacity style={[styles.dlBtn, { backgroundColor: settings.primaryColor }]}
                  onPress={() => Alert.alert('ダウンロード', `「${doc.title}」をダウンロードします`)}>
                  <Text style={styles.dlBtnText}>DL</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: BRAND_COLOR, paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16, gap: 12 },
  formCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    borderWidth: 2, borderColor: ACCENT_COLOR,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  formCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  formCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  formCardIcon: { fontSize: 32 },
  formCardTitle: { fontSize: 15, fontWeight: 'bold', color: BRAND_COLOR },
  formCardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  formExpandBtn: { fontSize: 16, color: '#aaa', paddingHorizontal: 8 },
  formFields: {
    backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12, marginBottom: 12, gap: 6,
  },
  fieldRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  fieldDot: { color: ACCENT_COLOR, fontWeight: 'bold', fontSize: 16 },
  fieldText: { fontSize: 13, color: '#444' },
  openFormBtn: {
    backgroundColor: BRAND_COLOR, borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  openFormBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  filterBar: { maxHeight: 52, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E8EDF2' },
  filterContent: { paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
  filterBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#F0F2F5' },
  filterBtnActive: { backgroundColor: BRAND_COLOR },
  filterText: { fontSize: 13, color: '#555' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#aaa', fontSize: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flex: 1 },
  catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6 },
  catText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  docTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 4 },
  meta: { fontSize: 12, color: '#999' },
  dlBtn: { backgroundColor: BRAND_COLOR, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginLeft: 12 },
  dlBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
