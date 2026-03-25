import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Modal, TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTeam } from '../../context/TeamContext';
import { useSchedule, ScheduleItem } from '../../context/ScheduleContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const BRAND_COLOR = '#1A3C5E';
const ACCENT_COLOR = '#E8A020';



interface NewSchedule {
  group: string;
  date: Date;
  title: string;
  opponent: string;
  startTime: Date;
  endTime: Date;
  location: string;
  memo: string;
}

function formatDate(d: Date) {
  return `${d.getMonth() + 1}月${d.getDate()}日(${['日','月','火','水','木','金','土'][d.getDay()]})`;
}
function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type PickerMode = 'date' | 'startTime' | 'endTime' | null;

function makeTime(h: number, min: number) {
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d;
}

const makeEmptyForm = (firstCategory: string, firstGroup: string): NewSchedule => ({
  group: firstGroup, date: new Date(), title: firstCategory, opponent: '',
  startTime: makeTime(18, 0), endTime: makeTime(20, 0), location: '', memo: '',
});

export default function AdminScheduleScreen() {
  const { settings } = useTeam();
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedule();
  const [activeGroup, setActiveGroup] = useState('すべて');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const scheduleGroups = settings.scheduleGroups ?? [];
  const scheduleCategories = settings.scheduleCategories ?? [];
  const [form, setForm] = useState<NewSchedule>(() => makeEmptyForm(scheduleCategories[0] ?? '練習', scheduleGroups[0] ?? ''));

  const filtered = activeGroup === 'すべて'
    ? schedules
    : schedules.filter(s => s.group === activeGroup);

  const openAdd = () => {
    setEditingId(null);
    setForm(makeEmptyForm(scheduleCategories[0] ?? '練習', scheduleGroups[0] ?? ''));
    setModalVisible(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setForm({
      group: item.group, date: item.date, title: item.title, opponent: item.opponent,
      startTime: item.startTime, endTime: item.endTime, location: item.location, memo: item.memo,
    });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!form.location) {
      Alert.alert('入力エラー', '場所を入力してください');
      return;
    }
    if (editingId) {
      updateSchedule(editingId, form);
    } else {
      addSchedule(form);
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('削除確認', 'このスケジュールを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => deleteSchedule(id) },
    ]);
  };

  const unanswered = (s: ScheduleItem) =>
    s.totalMembers - s.presentCount - s.absentCount - s.maybeCount;

  const needsOpponent = form.title !== (settings.scheduleCategories[0] ?? '練習');

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>スケジュール管理</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: settings.accentColor }]} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ 追加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.groupBar} contentContainerStyle={styles.groupBarContent}>
        {['すべて', ...settings.scheduleGroups].map(g => (
          <TouchableOpacity key={g}
            style={[styles.groupTab, activeGroup === g && [styles.groupTabActive, { backgroundColor: settings.primaryColor }]]}
            onPress={() => setActiveGroup(g)}>
            <Text style={[styles.groupTabText, activeGroup === g && styles.groupTabTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.groupChip, { backgroundColor: settings.primaryColor }]}>
                <Text style={styles.groupChipText}>{item.group}</Text>
              </View>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openEdit(item)}>
                  <Text style={[styles.editBtn, { color: settings.primaryColor }]}>編集</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteBtn}>削除</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.title, { color: settings.primaryColor }]}>{item.title}{item.opponent ? ` vs ${item.opponent}` : ''}</Text>
            <Text style={styles.detail}>{formatTime(item.startTime)}〜{formatTime(item.endTime)} | {item.location}</Text>
            {item.memo !== '' && (
              <View style={styles.memoBox}>
                <Text style={styles.memoText}>📝 {item.memo}</Text>
              </View>
            )}

            <View style={styles.attendanceSummary}>
              <View style={[styles.attendanceBox, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.attendanceNum, { color: '#28A745' }]}>{item.presentCount}</Text>
                <Text style={styles.attendanceLabel}>参加</Text>
              </View>
              <View style={[styles.attendanceBox, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.attendanceNum, { color: '#DC3545' }]}>{item.absentCount}</Text>
                <Text style={styles.attendanceLabel}>欠席</Text>
              </View>
              <View style={[styles.attendanceBox, { backgroundColor: '#FFF8E1' }]}>
                <Text style={[styles.attendanceNum, { color: '#FFC107' }]}>{item.maybeCount}</Text>
                <Text style={styles.attendanceLabel}>未定</Text>
              </View>
              <View style={[styles.attendanceBox, { backgroundColor: '#F5F5F5' }]}>
                <Text style={[styles.attendanceNum, { color: '#999' }]}>{unanswered(item)}</Text>
                <Text style={styles.attendanceLabel}>未回答</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 追加 / 編集モーダル */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'スケジュール編集' : 'スケジュール追加'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtn}>閉じる</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>

            {/* グループ */}
            <Text style={styles.label}>グループ</Text>
            <View style={styles.chipGrid}>
              {settings.scheduleGroups.map(g => (
                <TouchableOpacity key={g}
                  style={[styles.chip, form.group === g && [styles.chipActive, { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor }]]}
                  onPress={() => setForm(p => ({ ...p, group: g }))}>
                  <Text style={[styles.chipText, form.group === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 日付 */}
            <Text style={styles.label}>日付</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={webInputStyle}
                value={form.date.toISOString().split('T')[0]}
                onChange={e => {
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime())) setForm(p => ({ ...p, date: d }));
                }}
              />
            ) : (
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerMode('date')}>
                <Text style={styles.pickerBtnText}>{formatDate(form.date)}</Text>
              </TouchableOpacity>
            )}

            {/* タイトル */}
            <Text style={styles.label}>種別</Text>
            <View style={styles.chipGrid}>
              {settings.scheduleCategories.map(t => (
                <TouchableOpacity key={t}
                  style={[styles.chip, form.title === t && [styles.chipActive, { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor }]]}
                  onPress={() => setForm(p => ({ ...p, title: t }))}>
                  <Text style={[styles.chipText, form.title === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 対戦相手（練習以外） */}
            {needsOpponent && (
              <>
                <Text style={styles.label}>対戦相手</Text>
                <TextInput style={styles.input} value={form.opponent}
                  onChangeText={v => setForm(p => ({ ...p, opponent: v }))}
                  placeholder="例: ○○FC" />
              </>
            )}

            {/* 開始時間 */}
            <Text style={styles.label}>開始時間</Text>
            {Platform.OS === 'web' ? (
              <input
                type="time"
                style={webInputStyle}
                value={formatTime(form.startTime)}
                onChange={e => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  setForm(p => ({ ...p, startTime: makeTime(h, m) }));
                }}
              />
            ) : (
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerMode('startTime')}>
                <Text style={styles.pickerBtnText}>{formatTime(form.startTime)}</Text>
              </TouchableOpacity>
            )}

            {/* 終了時間 */}
            <Text style={styles.label}>終了時間</Text>
            {Platform.OS === 'web' ? (
              <input
                type="time"
                style={webInputStyle}
                value={formatTime(form.endTime)}
                onChange={e => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  setForm(p => ({ ...p, endTime: makeTime(h, m) }));
                }}
              />
            ) : (
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerMode('endTime')}>
                <Text style={styles.pickerBtnText}>{formatTime(form.endTime)}</Text>
              </TouchableOpacity>
            )}

            {/* 場所 */}
            <Text style={styles.label}>場所</Text>
            <TextInput style={styles.input} value={form.location}
              onChangeText={v => setForm(p => ({ ...p, location: v }))}
              placeholder="例: ○○スポーツセンター" />

            {/* メモ */}
            <Text style={styles.label}>メモ</Text>
            <TextInput style={[styles.input, styles.memoInput]} value={form.memo}
              onChangeText={v => setForm(p => ({ ...p, memo: v }))}
              placeholder="例: 雨天中止の場合は前日連絡"
              multiline
              numberOfLines={3} />

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: settings.primaryColor }]} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>{editingId ? '変更を保存する' : '追加する'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>

        {/* ネイティブ用 DateTimePicker */}
        {pickerMode !== null && Platform.OS !== 'web' && (
          <DateTimePicker
            value={
              pickerMode === 'date' ? form.date
              : pickerMode === 'startTime' ? form.startTime
              : form.endTime
            }
            mode={pickerMode === 'date' ? 'date' : 'time'}
            display={pickerMode === 'date' ? 'calendar' : 'spinner'}
            minuteInterval={15}
            onChange={(_, selected) => {
              if (selected) {
                if (pickerMode === 'date') setForm(p => ({ ...p, date: selected }));
                else if (pickerMode === 'startTime') setForm(p => ({ ...p, startTime: selected }));
                else setForm(p => ({ ...p, endTime: selected }));
              }
              setPickerMode(null);
            }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

// Web用インラインスタイル
const webInputStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid #DDE2E8',
  borderRadius: 10,
  padding: 14,
  fontSize: 15,
  width: '100%',
  boxSizing: 'border-box' as const,
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
  groupBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8EDF2', flexShrink: 0 },
  groupBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' },
  groupTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F2F5' },
  groupTabActive: { backgroundColor: BRAND_COLOR },
  groupTabText: { fontSize: 13, color: '#555', fontWeight: '600' },
  groupTabTextActive: { color: '#fff' },
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  groupChip: { backgroundColor: BRAND_COLOR, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  groupChipText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  date: { flex: 1, fontSize: 13, color: '#888' },
  cardActions: { flexDirection: 'row', gap: 12 },
  editBtn: { color: BRAND_COLOR, fontSize: 13, fontWeight: '600' },
  deleteBtn: { color: '#DC3545', fontSize: 13 },
  title: { fontSize: 17, fontWeight: '700', color: BRAND_COLOR, marginBottom: 4 },
  detail: { fontSize: 13, color: '#555', marginBottom: 6 },
  memoBox: {
    backgroundColor: '#FFFBEA', borderLeftWidth: 3, borderLeftColor: '#FFC107',
    borderRadius: 6, padding: 10, marginBottom: 10,
  },
  memoText: { fontSize: 13, color: '#555' },
  attendanceSummary: { flexDirection: 'row', gap: 8, marginTop: 4 },
  attendanceBox: { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  attendanceNum: { fontSize: 20, fontWeight: 'bold' },
  attendanceLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  modal: { flex: 1, backgroundColor: '#F5F7FA' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: BRAND_COLOR },
  closeBtn: { color: '#888', fontSize: 15 },
  modalContent: { padding: 20, gap: 8 },
  label: { fontSize: 13, color: '#555', fontWeight: '600', marginTop: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    borderWidth: 1.5, borderColor: '#DDE2E8', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
  },
  chipActive: { borderColor: BRAND_COLOR, backgroundColor: BRAND_COLOR },
  chipText: { fontSize: 14, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  pickerBtn: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#DDE2E8', padding: 14,
  },
  pickerBtnText: { fontSize: 15, color: '#222' },
  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#DDE2E8', padding: 14, fontSize: 15,
  },
  memoInput: { height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: BRAND_COLOR, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
