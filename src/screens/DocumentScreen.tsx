import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDocuments } from '../context/DocumentContext';
import { useTeam } from '../context/TeamContext';

const BRAND_COLOR = '#1A3C5E';

const CATEGORY_COLORS: Record<string, string> = {
  申込: '#4A90D9', 規約: '#7B68EE', 同意書: '#28A745',
  注文: '#FD7E14', お知らせ: '#20C997',
};

export default function DocumentScreen() {
  const { documents, categories } = useDocuments();
  const { settings } = useTeam();
  const [selected, setSelected] = useState('すべて');

  const filtered = selected === 'すべて'
    ? documents
    : documents.filter(d => d.category === selected);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>書類</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

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
