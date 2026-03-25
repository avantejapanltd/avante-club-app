import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTeam } from '../../context/TeamContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useDocuments } from '../../context/DocumentContext';

const BRAND_COLOR = '#1A3C5E';
const ACCENT_COLOR = '#E8A020';
const RED = '#DC3545';

const CATEGORY_COLORS: Record<string, string> = {
  申込: '#4A90D9', 規約: '#7B68EE', 同意書: '#28A745',
  注文: '#FD7E14', お知らせ: '#20C997',
};


export default function AdminDocumentScreen() {
  const { settings } = useTeam();
  const { documents, categories, addDocument, deleteDocument, addCategory, deleteCategory } = useDocuments();
  const [filterCat, setFilterCat] = useState('すべて');
  const [uploadModal, setUploadModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newDoc, setNewDoc] = useState({
    title: '', category: categories[0] ?? '申込',
    targetGroups: [] as string[], fileUri: null as string | null, size: '',
  });
  const [error, setError] = useState('');

  const filtered = filterCat === 'すべて'
    ? documents
    : documents.filter(d => d.category === filterCat);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const sizeKB = asset.size ? Math.round(asset.size / 1024) : 0;
        const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)}MB` : `${sizeKB}KB`;
        setNewDoc(p => ({ ...p, fileUri: asset.uri, size: sizeStr, title: p.title || (asset.name ?? '') }));
      }
    } catch {
      Alert.alert('エラー', 'ファイルの選択に失敗しました');
    }
  };

  const toggleGroup = (g: string) => {
    if (g === 'すべて') { setNewDoc(p => ({ ...p, targetGroups: [] })); return; }
    setNewDoc(p => ({
      ...p,
      targetGroups: p.targetGroups.includes(g)
        ? p.targetGroups.filter(x => x !== g)
        : [...p.targetGroups, g],
    }));
  };

  const handleUpload = () => {
    setError('');
    if (!newDoc.title) { setError('タイトルを入力してください'); return; }
    if (!newDoc.category) { setError('カテゴリを選択してください'); return; }
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    addDocument({
      title: newDoc.title,
      category: newDoc.category,
      updatedAt: dateStr,
      size: newDoc.size || '—',
      fileUri: newDoc.fileUri,
      uploadedBy: '指導者',
      targetGroups: newDoc.targetGroups,
    });
    setUploadModal(false);
    setNewDoc({ title: '', category: categories[0] ?? '申込', targetGroups: [], fileUri: null, size: '' });
    Alert.alert('アップロード完了', '会員の書類ページに反映されました');
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('削除確認', `「${title}」を削除しますか？\n会員ページからも削除されます。`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => deleteDocument(id) },
    ]);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) { return; }
    addCategory(newCatName.trim());
    setNewCatName('');
    setCatModal(false);
  };

  const handleDeleteCategory = (cat: string) => {
    if (documents.some(d => d.category === cat)) {
      Alert.alert('削除できません', `「${cat}」カテゴリの書類が存在します。先に書類を削除してください。`);
      return;
    }
    Alert.alert('削除確認', `カテゴリ「${cat}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => deleteCategory(cat) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>書類管理</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={[styles.catBtn, { borderColor: 'rgba(255,255,255,0.5)' }]} onPress={() => setCatModal(true)}>
            <Text style={styles.catBtnText}>カテゴリ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: settings.accentColor }]} onPress={() => setUploadModal(true)}>
            <Text style={styles.uploadBtnText}>+ アップロード</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* カテゴリフィルター */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {['すべて', ...categories].map(cat => (
          <TouchableOpacity key={cat}
            style={[styles.filterBtn, filterCat === cat && [styles.filterBtnActive, { backgroundColor: settings.primaryColor }]]}
            onPress={() => setFilterCat(cat)}>
            <Text style={[styles.filterText, filterCat === cat && styles.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>書類がありません</Text></View>
        ) : (
          filtered.map(doc => (
            <View key={doc.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.left}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.catBadge, { backgroundColor: CATEGORY_COLORS[doc.category] ?? '#888' }]}>
                      <Text style={styles.catText}>{doc.category}</Text>
                    </View>
                    {doc.targetGroups.length > 0 && (
                      <View style={styles.groupBadge}>
                        <Text style={styles.groupBadgeText}>{doc.targetGroups.join(' · ')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.meta}>{doc.updatedAt} · {doc.size} · {doc.uploadedBy}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(doc.id, doc.title)}>
                  <Text style={styles.deleteBtnText}>削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* アップロードモーダル */}
      <Modal visible={uploadModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>書類をアップロード</Text>
            <TouchableOpacity onPress={() => setUploadModal(false)}>
              <Text style={styles.closeBtnText}>閉じる</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>

            {/* ファイル選択 */}
            <Text style={styles.label}>ファイル</Text>
            <TouchableOpacity style={styles.filePickerBtn} onPress={pickFile}>
              {newDoc.fileUri ? (
                <Text style={styles.filePickerSelected}>✓ ファイル選択済 ({newDoc.size})</Text>
              ) : (
                <Text style={styles.filePickerPlaceholder}>📎 PDFまたは画像を選択</Text>
              )}
            </TouchableOpacity>

            {/* タイトル */}
            <Text style={styles.label}>タイトル</Text>
            <TextInput style={styles.input} value={newDoc.title}
              onChangeText={v => { setNewDoc(p => ({ ...p, title: v })); setError(''); }}
              placeholder="例: 2026年度 入会申込書" />

            {/* カテゴリ */}
            <Text style={styles.label}>カテゴリ</Text>
            <View style={styles.chipGrid}>
              {categories.map(c => (
                <TouchableOpacity key={c}
                  style={[styles.chip, newDoc.category === c && [styles.chipActive, { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor }]]}
                  onPress={() => setNewDoc(p => ({ ...p, category: c }))}>
                  <Text style={[styles.chipText, newDoc.category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 対象グループ */}
            <Text style={styles.label}>公開対象グループ</Text>
            <View style={styles.chipGrid}>
              {['すべて', ...settings.scheduleGroups].map(g => {
                const isAll = g === 'すべて';
                const active = isAll ? newDoc.targetGroups.length === 0 : newDoc.targetGroups.includes(g);
                return (
                  <TouchableOpacity key={g}
                    style={[styles.chip, active && [styles.chipActive, { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor }]]}
                    onPress={() => toggleGroup(g)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {error !== '' && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: settings.primaryColor }]} onPress={handleUpload}>
              <Text style={styles.submitBtnText}>アップロードして公開</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* カテゴリ管理モーダル */}
      <Modal visible={catModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>カテゴリ管理</Text>
            <TouchableOpacity onPress={() => setCatModal(false)}>
              <Text style={styles.closeBtnText}>閉じる</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.label}>新しいカテゴリを追加</Text>
            <View style={styles.addCatRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={newCatName}
                onChangeText={setNewCatName} placeholder="例: 大会要項" />
              <TouchableOpacity style={[styles.addCatBtn, { backgroundColor: settings.primaryColor }]} onPress={handleAddCategory}>
                <Text style={styles.addCatBtnText}>追加</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 20 }]}>現在のカテゴリ</Text>
            {categories.map(cat => (
              <View key={cat} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[cat] ?? '#888' }]} />
                <Text style={styles.catRowText}>{cat}</Text>
                <TouchableOpacity onPress={() => handleDeleteCategory(cat)}>
                  <Text style={styles.catDeleteText}>削除</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: BRAND_COLOR, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerBtns: { flexDirection: 'row', gap: 8 },
  catBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  catBtnText: { color: '#fff', fontSize: 13 },
  uploadBtn: { backgroundColor: ACCENT_COLOR, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  uploadBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  filterBar: { maxHeight: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#F0F2F5' },
  filterBtnActive: { backgroundColor: BRAND_COLOR },
  filterText: { fontSize: 13, color: '#555' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  content: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#aaa', fontSize: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flex: 1 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  catText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  groupBadge: { backgroundColor: '#F0F2F5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  groupBadgeText: { color: '#555', fontSize: 11 },
  docTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 4 },
  meta: { fontSize: 12, color: '#999' },
  deleteBtn: { marginLeft: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: RED },
  deleteBtnText: { color: RED, fontSize: 13, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: '#F5F7FA' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: BRAND_COLOR },
  closeBtnText: { color: '#888', fontSize: 15 },
  modalContent: { padding: 20, gap: 8 },
  label: { fontSize: 13, color: '#555', fontWeight: '600', marginTop: 12 },
  filePickerBtn: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 2,
    borderColor: '#DDE2E8', borderStyle: 'dashed', paddingVertical: 20, alignItems: 'center',
  },
  filePickerSelected: { fontSize: 14, color: '#28A745', fontWeight: '600' },
  filePickerPlaceholder: { fontSize: 14, color: '#aaa' },
  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#DDE2E8', padding: 14, fontSize: 15,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    borderWidth: 1.5, borderColor: '#DDE2E8', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff',
  },
  chipActive: { borderColor: BRAND_COLOR, backgroundColor: BRAND_COLOR },
  chipText: { fontSize: 13, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  errorText: { color: RED, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  submitBtn: { backgroundColor: BRAND_COLOR, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  addCatRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addCatBtn: { backgroundColor: BRAND_COLOR, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 14 },
  addCatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#E8EDF2',
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catRowText: { flex: 1, fontSize: 15, color: '#333' },
  catDeleteText: { color: RED, fontSize: 13 },
});
