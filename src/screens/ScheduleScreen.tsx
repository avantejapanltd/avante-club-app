import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useSchedule } from '../context/ScheduleContext';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';

type Attendance = 'present' | 'absent' | 'maybe' | null;

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

function formatDate(d: Date) {
  return `${d.getMonth() + 1}月${d.getDate()}日(${['日','月','火','水','木','金','土'][d.getDay()]})`;
}
function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ScheduleScreen() {
  const { user } = useAuth();
  const { settings } = useTeam();
  const { schedules } = useSchedule();
  const groups = settings.scheduleGroups ?? [];
  const defaultGroup = user?.group && groups.includes(user.group) ? user.group : groups[0] ?? '';
  const [activeGroup, setActiveGroup] = useState(defaultGroup);
  const [attendances, setAttendances] = useState<Record<string, Attendance>>({});

  const filtered = schedules.filter(s => s.group === activeGroup);

  const handleAttendance = (id: string, value: Attendance) => {
    setAttendances(prev => ({ ...prev, [id]: value }));
    Alert.alert('回答しました', `「${value ? ATTENDANCE_LABEL[value] : ''}」で送信しました`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>スケジュール・出欠</Text>
      </View>

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
          filtered.map(item => {
            const attendance = attendances[item.id] ?? null;
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                  {attendance && (
                    <View style={[styles.badge, { borderColor: ATTENDANCE_COLOR[attendance] }]}>
                      <Text style={[styles.badgeText, { color: ATTENDANCE_COLOR[attendance] }]}>
                        {ATTENDANCE_LABEL[attendance]}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.title}>{item.title}{item.opponent ? ` vs ${item.opponent}` : ''}</Text>
                <Text style={styles.detail}>{formatTime(item.startTime)}〜{formatTime(item.endTime)}</Text>
                <Text style={styles.detail}>{item.location}</Text>
                {item.memo !== '' && <Text style={styles.memo}>📝 {item.memo}</Text>}

                {attendance === null && (
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
                {attendance !== null && (
                  <TouchableOpacity onPress={() => setAttendances(prev => ({ ...prev, [item.id]: null }))}>
                    <Text style={styles.changeLink}>回答を変更する</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  groupBar: { backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER, flexShrink: 0 },
  groupBarContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  groupTab: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4,
    borderWidth: 1, borderColor: BORDER,
  },
  groupTabText: { fontSize: 12, color: TEXT2, fontWeight: '600', letterSpacing: 0.5 },
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
  memo: { fontSize: 12, color: '#888', marginTop: 4, lineHeight: 18 },
  badge: { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 4, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  changeLink: { color: TEXT2, fontSize: 12, marginTop: 12, letterSpacing: 0.5 },
});
