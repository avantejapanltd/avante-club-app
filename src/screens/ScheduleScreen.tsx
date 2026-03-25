import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';
const ACCENT = '#1A3C5E';


type Attendance = 'present' | 'absent' | 'maybe' | null;

interface ScheduleItem {
  id: string;
  group: string;
  date: string;
  title: string;
  time: string;
  location: string;
  attendance: Attendance;
}

const INITIAL_SCHEDULES: ScheduleItem[] = [
  { id: '1', group: '1年園児', date: '3月25日(火)', title: '練習', time: '15:00〜16:00', location: '○○体育館', attendance: null },
  { id: '2', group: '1年園児', date: '3月29日(土)', title: '体験会', time: '10:00〜11:00', location: '○○体育館', attendance: null },
  { id: '3', group: '2年', date: '3月25日(火)', title: '練習', time: '16:00〜17:30', location: '○○体育館', attendance: null },
  { id: '4', group: '2年', date: '4月2日(水)', title: '練習', time: '16:00〜17:30', location: '○○体育館', attendance: 'present' },
  { id: '5', group: '3年', date: '3月25日(火)', title: '練習', time: '17:30〜19:00', location: '○○スポーツセンター', attendance: null },
  { id: '6', group: '3年', date: '3月29日(土)', title: '試合', time: '10:00〜15:00', location: '△△グラウンド', attendance: null },
  { id: '7', group: '4年', date: '3月26日(水)', title: '練習', time: '17:30〜19:00', location: '○○スポーツセンター', attendance: null },
  { id: '8', group: '4年', date: '3月30日(日)', title: '練習試合', time: '9:00〜12:00', location: '□□競技場', attendance: null },
  { id: '9', group: 'サテライト', date: '3月27日(木)', title: '練習', time: '18:00〜20:00', location: '△△アリーナ', attendance: null },
  { id: '10', group: 'サテライト', date: '4月3日(木)', title: '練習', time: '18:00〜20:00', location: '△△アリーナ', attendance: null },
  { id: '11', group: 'トップ', date: '3月25日(火)', title: '練習', time: '19:00〜21:00', location: '○○スポーツセンター', attendance: null },
  { id: '12', group: 'トップ', date: '3月29日(土)', title: '公式戦', time: '13:00〜', location: '□□競技場', attendance: null },
];

const ATTENDANCE_LABEL: Record<NonNullable<Attendance>, string> = {
  present: '参加',
  absent: '欠席',
  maybe: '未定',
};
const ATTENDANCE_COLOR: Record<NonNullable<Attendance>, string> = {
  present: '#28A745',
  absent: '#DC3545',
  maybe: '#FFC107',
};

export default function ScheduleScreen() {
  const { user } = useAuth();
  const { settings } = useTeam();
  const groups = settings.scheduleGroups ?? [];
  const defaultGroup = user?.group && groups.includes(user.group) ? user.group : groups[0] ?? '';
  const [activeGroup, setActiveGroup] = useState(defaultGroup);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);

  const filtered = schedules.filter(s => s.group === activeGroup);

  const handleAttendance = (id: string, value: Attendance) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, attendance: value } : s));
    Alert.alert('回答しました', `「${value ? ATTENDANCE_LABEL[value] : ''}」で送信しました`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>スケジュール・出欠</Text>
      </View>

      {/* グループタブ */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.groupBar} contentContainerStyle={styles.groupBarContent}>
        {groups.map(g => (
          <TouchableOpacity
            key={g}
            style={[styles.groupTab, activeGroup === g && { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor + '15' }]}
            onPress={() => setActiveGroup(g)}
          >
            <Text style={[styles.groupTabText, activeGroup === g && { color: settings.primaryColor }]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>スケジュールはありません</Text>
          </View>
        ) : (
          filtered.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.date}>{item.date}</Text>
                {item.attendance && (
                  <View style={[styles.badge, { borderColor: ATTENDANCE_COLOR[item.attendance] }]}>
                    <Text style={[styles.badgeText, { color: ATTENDANCE_COLOR[item.attendance] }]}>
                      {ATTENDANCE_LABEL[item.attendance]}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.detail}>{item.time}</Text>
              <Text style={styles.detail}>{item.location}</Text>

              {item.attendance === null && (
                <View style={styles.buttons}>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: '#28A745' }]}
                    onPress={() => handleAttendance(item.id, 'present')}>
                    <Text style={styles.btnText}>参加</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: '#DC3545' }]}
                    onPress={() => handleAttendance(item.id, 'absent')}>
                    <Text style={styles.btnText}>欠席</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: '#FFC107' }]}
                    onPress={() => handleAttendance(item.id, 'maybe')}>
                    <Text style={styles.btnText}>未定</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.attendance !== null && (
                <TouchableOpacity onPress={() =>
                  setSchedules(prev => prev.map(s => s.id === item.id ? { ...s, attendance: null } : s))
                }>
                  <Text style={styles.changeLink}>回答を変更する</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { color: TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  groupBar: { backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER, flexShrink: 0 },
  groupBarContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  groupTab: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4,
    borderWidth: 1, borderColor: BORDER,
  },
  groupTabActive: { borderColor: BORDER },
  groupTabText: { fontSize: 12, color: TEXT2, fontWeight: '600', letterSpacing: 0.5 },
  groupTabTextActive: { color: TEXT },
  content: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: TEXT2, fontSize: 15, letterSpacing: 1 },
  card: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 18,
    borderWidth: 1, borderColor: BORDER,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 11, color: TEXT2, letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 6, letterSpacing: 0.3 },
  detail: { fontSize: 12, color: TEXT2, marginBottom: 2, letterSpacing: 0.5 },
  badge: { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 4, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  changeLink: { color: TEXT2, fontSize: 12, marginTop: 12, letterSpacing: 0.5 },
});
