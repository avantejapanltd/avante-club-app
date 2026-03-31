import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useSchedule, AttendanceStatus, AttendanceResponse } from '../context/ScheduleContext';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';
const GREEN = '#28A745';
const RED = '#DC3545';
const YELLOW = '#FFC107';

const STATUS_COLOR: Record<string, string> = {
  present: GREEN,
  absent: RED,
  maybe: YELLOW,
};

function UserBadge({ response }: { response: AttendanceResponse }) {
  const color = STATUS_COLOR[response.status] ?? '#aaa';
  return (
    <View style={badgeStyles.wrap}>
      <View style={[badgeStyles.circle, { backgroundColor: color }]}>
        <Text style={badgeStyles.char}>{response.userName[0] ?? '?'}</Text>
      </View>
      <Text style={badgeStyles.name} numberOfLines={1}>{response.userName}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 44 },
  circle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  char: { color: '#fff', fontSize: 14, fontWeight: '700' },
  name: { fontSize: 9, color: TEXT2, marginTop: 3, textAlign: 'center' },
});

type Attendance = AttendanceStatus | null;

const ATTENDANCE_LABEL: Record<NonNullable<Attendance>, string> = {
  present: '参加',
  absent: '欠席',
  maybe: '未定',
};
const ATTENDANCE_COLOR: Record<NonNullable<Attendance>, string> = {
  present: GREEN,
  absent: RED,
  maybe: YELLOW,
};

function formatDate(d: Date) {
  return `${d.getMonth() + 1}月${d.getDate()}日(${['日','月','火','水','木','金','土'][d.getDay()]})`;
}
function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function ScheduleScreen() {
  const { user } = useAuth();
  const { settings } = useTeam();
  const {
    schedules,
    setCarpoolEntry, removeCarpoolEntry, getCarpoolForSchedule,
    addCarpoolPost, deleteCarpoolPost, getCarpoolPostsForSchedule,
    setAttendanceResponse, removeAttendanceResponse, getAttendanceForSchedule,
  } = useSchedule();

  const groups = settings.scheduleGroups ?? [];
  const defaultGroup = user?.group && groups.includes(user.group) ? user.group : groups[0] ?? '';
  const [activeGroup, setActiveGroup] = useState(defaultGroup);
  // For driver: capacity input and "show driver input" toggle
  const [showDriverInput, setShowDriverInput] = useState<Record<string, boolean>>({});
  const [capacities, setCapacities] = useState<Record<string, string>>({});
  // For driver posts
  const [showPostForm, setShowPostForm] = useState<Record<string, boolean>>({});
  const [postTime, setPostTime] = useState<Record<string, string>>({});
  const [postLocation, setPostLocation] = useState<Record<string, string>>({});

  const filtered = schedules.filter(s => s.group === activeGroup);
  const email = user?.email ?? '';
  const name = user?.name ?? '';

  const getMyAttendance = (scheduleId: string): Attendance => {
    const responses = getAttendanceForSchedule(scheduleId);
    return (responses.find(r => r.userEmail === email)?.status ?? null) as Attendance;
  };

  const handleAttendance = (id: string, value: Attendance) => {
    if (value === null) {
      removeAttendanceResponse(id, email);
      removeCarpoolEntry(id, email);
      setShowDriverInput(prev => ({ ...prev, [id]: false }));
    } else {
      setAttendanceResponse({
        scheduleId: id,
        userEmail: email,
        userName: name,
        userRole: (user?.role === 'coach' ? 'coach' : 'member'),
        status: value,
      });
      if (value !== 'present') {
        removeCarpoolEntry(id, email);
        setShowDriverInput(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  const handleSelectRider = (scheduleId: string) => {
    setCarpoolEntry({ scheduleId, userEmail: email, userName: name, type: 'rider' });
    setShowDriverInput(prev => ({ ...prev, [scheduleId]: false }));
  };

  const handleSelectDirect = (scheduleId: string) => {
    setCarpoolEntry({ scheduleId, userEmail: email, userName: name, type: 'direct' });
    setShowDriverInput(prev => ({ ...prev, [scheduleId]: false }));
  };

  const handleSelectDriver = (scheduleId: string) => {
    setShowDriverInput(prev => ({ ...prev, [scheduleId]: true }));
  };

  const handleRegisterDriver = (scheduleId: string) => {
    const cap = parseInt(capacities[scheduleId] ?? '', 10);
    if (!cap || cap < 1) {
      showAlert('エラー', '乗せられる人数を1以上で入力してください');
      return;
    }
    setCarpoolEntry({ scheduleId, userEmail: email, userName: name, type: 'driver', capacity: cap });
    setShowDriverInput(prev => ({ ...prev, [scheduleId]: false }));
  };

  const handlePost = (scheduleId: string) => {
    const time = (postTime[scheduleId] ?? '').trim();
    const loc = (postLocation[scheduleId] ?? '').trim();
    if (!time || !loc) {
      showAlert('エラー', '時間と場所を入力してください');
      return;
    }
    addCarpoolPost({ scheduleId, driverEmail: email, driverName: name, pickupTime: time, pickupLocation: loc });
    setShowPostForm(prev => ({ ...prev, [scheduleId]: false }));
    setPostTime(prev => ({ ...prev, [scheduleId]: '' }));
    setPostLocation(prev => ({ ...prev, [scheduleId]: '' }));
  };

  const TRANSPORT_LABELS = {
    driver: '車出し可能',
    rider: '乗り合わせ希望',
    direct: '現地集合',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>スケジュール・出欠</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.groupBar} contentContainerStyle={styles.groupBarContent}>
        {groups.map(g => (
          <TouchableOpacity key={g}
            style={[styles.groupTab, activeGroup === g && { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor + '15' }]}
            onPress={() => setActiveGroup(g)}>
            <Text style={[styles.groupTabText, activeGroup === g && { color: settings.primaryColor }]}>{g}</Text>
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
            const attendance = getMyAttendance(item.id);
            const allResponses = getAttendanceForSchedule(item.id);
            const presentList = allResponses.filter(r => r.status === 'present');
            const absentList  = allResponses.filter(r => r.status === 'absent');
            const maybeList   = allResponses.filter(r => r.status === 'maybe');
            const { entries, assignments } = getCarpoolForSchedule(item.id);
            const myEntry = entries.find(e => e.userEmail === email);
            const posts = getCarpoolPostsForSchedule(item.id);
            const myPosts = posts.filter(p => p.driverEmail === email);
            const totalCapacity = assignments.reduce((sum, a) => sum + a.capacity, 0);
            const riderCount = entries.filter(e => e.type === 'rider').length;
            const directMembers = entries.filter(e => e.type === 'direct');

            return (
              <View key={item.id} style={styles.card}>
                {/* Schedule info */}
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
                {item.fileUri && (
                  <TouchableOpacity style={styles.fileChip} onPress={() => Linking.openURL(item.fileUri!)}>
                    <Text style={styles.fileChipText}>📄 {item.fileName ?? '試合要項'} を開く</Text>
                  </TouchableOpacity>
                )}

                {/* Attendance */}
                {attendance === null ? (
                  <View style={styles.buttons}>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: GREEN }]}
                      onPress={() => handleAttendance(item.id, 'present')}>
                      <Text style={styles.btnText}>参加</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: RED }]}
                      onPress={() => handleAttendance(item.id, 'absent')}>
                      <Text style={styles.btnText}>欠席</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: YELLOW }]}
                      onPress={() => handleAttendance(item.id, 'maybe')}>
                      <Text style={styles.btnText}>未定</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => handleAttendance(item.id, null)}>
                    <Text style={styles.changeLink}>回答を変更する</Text>
                  </TouchableOpacity>
                )}

                {/* 出欠詳細（全員分のバッジ） */}
                {allResponses.length > 0 && (
                  <View style={styles.attendanceDetail}>
                    <View style={styles.attendanceCountRow}>
                      <View style={[styles.countBox, { backgroundColor: '#E8F5E9' }]}>
                        <Text style={[styles.countNum, { color: GREEN }]}>{presentList.length}</Text>
                        <Text style={styles.countLabel}>参加</Text>
                      </View>
                      <View style={[styles.countBox, { backgroundColor: '#FFEBEE' }]}>
                        <Text style={[styles.countNum, { color: RED }]}>{absentList.length}</Text>
                        <Text style={styles.countLabel}>欠席</Text>
                      </View>
                      <View style={[styles.countBox, { backgroundColor: '#FFF8E1' }]}>
                        <Text style={[styles.countNum, { color: YELLOW }]}>{maybeList.length}</Text>
                        <Text style={styles.countLabel}>未定</Text>
                      </View>
                    </View>
                    {presentList.length > 0 && (
                      <View style={styles.badgeRow}>
                        <View style={[styles.badgeLabel, { backgroundColor: '#E8F5E9' }]}>
                          <Text style={[styles.badgeLabelText, { color: GREEN }]}>参加</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeList}>
                          {presentList.map(r => <UserBadge key={r.userEmail} response={r} />)}
                        </ScrollView>
                      </View>
                    )}
                    {absentList.length > 0 && (
                      <View style={styles.badgeRow}>
                        <View style={[styles.badgeLabel, { backgroundColor: '#FFEBEE' }]}>
                          <Text style={[styles.badgeLabelText, { color: RED }]}>欠席</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeList}>
                          {absentList.map(r => <UserBadge key={r.userEmail} response={r} />)}
                        </ScrollView>
                      </View>
                    )}
                    {maybeList.length > 0 && (
                      <View style={styles.badgeRow}>
                        <View style={[styles.badgeLabel, { backgroundColor: '#FFF8E1' }]}>
                          <Text style={[styles.badgeLabelText, { color: YELLOW }]}>未定</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeList}>
                          {maybeList.map(r => <UserBadge key={r.userEmail} response={r} />)}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}

                {/* Transport section — only when attending and not 練習 */}
                {attendance === 'present' && item.title !== '練習' && (
                  <View style={styles.transportSection}>
                    <View style={styles.transportHeader}>
                      <Text style={styles.transportTitle}>移動手段</Text>
                      {myEntry && (
                        <View style={[styles.myEntryBadge, { backgroundColor: settings.primaryColor + '20', borderColor: settings.primaryColor }]}>
                          <Text style={[styles.myEntryBadgeText, { color: settings.primaryColor }]}>
                            {TRANSPORT_LABELS[myEntry.type]}
                            {myEntry.type === 'driver' ? `（${myEntry.capacity}人）` : ''}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 3 transport choice buttons */}
                    <View style={styles.transportButtons}>
                      <TouchableOpacity
                        style={[styles.transportBtn, myEntry?.type === 'driver' && { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor + '15' }]}
                        onPress={() => handleSelectDriver(item.id)}>
                        <Text style={[styles.transportIcon]}>🚗</Text>
                        <Text style={[styles.transportBtnText, myEntry?.type === 'driver' && { color: settings.primaryColor, fontWeight: '700' }]}>
                          車出し可能
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.transportBtn, myEntry?.type === 'rider' && { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor + '15' }]}
                        onPress={() => handleSelectRider(item.id)}>
                        <Text style={styles.transportIcon}>🤝</Text>
                        <Text style={[styles.transportBtnText, myEntry?.type === 'rider' && { color: settings.primaryColor, fontWeight: '700' }]}>
                          乗り合わせ希望
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.transportBtn, myEntry?.type === 'direct' && { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor + '15' }]}
                        onPress={() => handleSelectDirect(item.id)}>
                        <Text style={styles.transportIcon}>📍</Text>
                        <Text style={[styles.transportBtnText, myEntry?.type === 'direct' && { color: settings.primaryColor, fontWeight: '700' }]}>
                          現地集合
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Driver capacity input (shown when tapping 車出し可能) */}
                    {showDriverInput[item.id] && (
                      <View style={styles.capacityRow}>
                        <Text style={styles.capacityLabel}>乗せられる人数：</Text>
                        <TextInput
                          style={styles.capacityInput}
                          value={capacities[item.id] ?? ''}
                          onChangeText={v => setCapacities(prev => ({ ...prev, [item.id]: v.replace(/[^0-9]/g, '') }))}
                          placeholder="人数"
                          placeholderTextColor={TEXT2}
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                        <Text style={styles.capacityUnit}>人</Text>
                        <TouchableOpacity
                          style={[styles.capacitySubmit, { backgroundColor: settings.primaryColor }]}
                          onPress={() => handleRegisterDriver(item.id)}>
                          <Text style={styles.capacitySubmitText}>登録</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Auto-assigned carpool results */}
                    {(assignments.length > 0 || directMembers.length > 0) && (
                      <View style={styles.assignmentsSection}>
                        <Text style={styles.assignmentsTitle}>乗り合わせ振り分け</Text>

                        {assignments.map((a, i) => (
                          <View key={i} style={styles.assignmentCard}>
                            <Text style={styles.assignmentDriver}>
                              🚗 {a.driverName}（空き {a.capacity - a.passengers.length}/{a.capacity}席）
                            </Text>
                            {a.passengers.length === 0 ? (
                              <Text style={styles.noPassengers}>乗客なし</Text>
                            ) : (
                              a.passengers.map((p, j) => (
                                <Text key={j} style={styles.passenger}>  └ {p.name}</Text>
                              ))
                            )}
                          </View>
                        ))}

                        {riderCount > totalCapacity && (
                          <View style={styles.warningBox}>
                            <Text style={styles.warningText}>
                              ⚠️ 車が不足しています（乗り合わせ希望 {riderCount}人 / 定員 {totalCapacity}人）
                            </Text>
                          </View>
                        )}

                        {directMembers.length > 0 && (
                          <Text style={styles.directText}>
                            📍 現地集合：{directMembers.map(e => e.userName).join('、')}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Driver post feature */}
                    {myEntry?.type === 'driver' && (
                      <View style={styles.postSection}>
                        <Text style={styles.postSectionTitle}>迎えの情報を投稿</Text>

                        {myPosts.map(p => (
                          <View key={p.id} style={styles.postCard}>
                            <View style={styles.postCardContent}>
                              <Text style={styles.postCardText}>
                                🕐 {p.pickupTime}　📍 {p.pickupLocation}で迎えに行きます
                              </Text>
                            </View>
                            <TouchableOpacity onPress={() => deleteCarpoolPost(p.id)}>
                              <Text style={styles.postDeleteBtn}>削除</Text>
                            </TouchableOpacity>
                          </View>
                        ))}

                        {!showPostForm[item.id] ? (
                          <TouchableOpacity
                            style={[styles.postToggleBtn, { borderColor: settings.primaryColor }]}
                            onPress={() => setShowPostForm(prev => ({ ...prev, [item.id]: true }))}>
                            <Text style={[styles.postToggleBtnText, { color: settings.primaryColor }]}>
                              + 迎えに行く時間・場所を投稿する
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.postForm}>
                            <Text style={styles.postFormLabel}>迎えに行く時間</Text>
                            <TextInput
                              style={styles.postInput}
                              value={postTime[item.id] ?? ''}
                              onChangeText={v => setPostTime(prev => ({ ...prev, [item.id]: v }))}
                              placeholder="例: 09:30"
                              placeholderTextColor={TEXT2}
                            />
                            <Text style={styles.postFormLabel}>迎えに行く場所</Text>
                            <TextInput
                              style={styles.postInput}
                              value={postLocation[item.id] ?? ''}
                              onChangeText={v => setPostLocation(prev => ({ ...prev, [item.id]: v }))}
                              placeholder="例: ○○公園前"
                              placeholderTextColor={TEXT2}
                            />
                            <View style={styles.postFormButtons}>
                              <TouchableOpacity
                                style={[styles.postCancelBtn]}
                                onPress={() => setShowPostForm(prev => ({ ...prev, [item.id]: false }))}>
                                <Text style={styles.postCancelBtnText}>キャンセル</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.postSubmitBtn, { backgroundColor: settings.primaryColor }]}
                                onPress={() => handlePost(item.id)}>
                                <Text style={styles.postSubmitBtnText}>投稿する</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Riders see driver posts */}
                    {myEntry?.type === 'rider' && posts.length > 0 && (
                      <View style={styles.riderPostsSection}>
                        <Text style={styles.riderPostsTitle}>ドライバーからのお知らせ</Text>
                        {posts.map(p => (
                          <View key={p.id} style={styles.riderPostCard}>
                            <Text style={styles.riderPostDriver}>{p.driverName}</Text>
                            <Text style={styles.riderPostText}>
                              🕐 {p.pickupTime}　📍 {p.pickupLocation}で迎えに行きます
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
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
  groupTab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: BORDER },
  groupTabText: { fontSize: 12, color: TEXT2, fontWeight: '600', letterSpacing: 0.5 },
  content: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: TEXT2, fontSize: 15, letterSpacing: 1 },
  card: { backgroundColor: SURFACE, borderRadius: 4, padding: 18, borderWidth: 1, borderColor: BORDER },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 11, color: TEXT2, letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 6, letterSpacing: 0.3 },
  detail: { fontSize: 12, color: TEXT2, marginBottom: 2, letterSpacing: 0.5 },
  memo: { fontSize: 12, color: '#888', marginTop: 4, lineHeight: 18 },
  fileChip: {
    flexDirection: 'row', alignSelf: 'flex-start',
    backgroundColor: '#EEF3F9', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#C8D8EC', marginTop: 8,
  },
  fileChipText: { fontSize: 12, color: '#1A3C5E', fontWeight: '600' },
  badge: { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 4, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  changeLink: { color: TEXT2, fontSize: 12, marginTop: 12, letterSpacing: 0.5 },
  attendanceDetail: {
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: BORDER, gap: 10,
  },
  attendanceCountRow: { flexDirection: 'row', gap: 8 },
  countBox: { flex: 1, borderRadius: 6, padding: 8, alignItems: 'center' },
  countNum: { fontSize: 20, fontWeight: '800' },
  countLabel: { fontSize: 10, color: TEXT2, marginTop: 2, letterSpacing: 0.5 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeLabel: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, minWidth: 38, alignItems: 'center' },
  badgeLabelText: { fontSize: 11, fontWeight: '700' },
  badgeList: { flexDirection: 'row', gap: 8, paddingVertical: 2 },

  // Transport section
  transportSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 12,
  },
  transportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  transportTitle: { fontSize: 11, color: TEXT2, fontWeight: '700', letterSpacing: 2 },
  myEntryBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  myEntryBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  transportButtons: { flexDirection: 'row', gap: 8 },
  transportBtn: {
    flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 4,
    paddingVertical: 10, alignItems: 'center', gap: 4,
  },
  transportIcon: { fontSize: 16 },
  transportBtnText: { fontSize: 11, color: TEXT2, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },

  // Capacity input
  capacityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BG, borderRadius: 4, padding: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  capacityLabel: { fontSize: 12, color: TEXT, fontWeight: '600' },
  capacityInput: {
    width: 56, borderWidth: 1, borderColor: BORDER, borderRadius: 4,
    backgroundColor: SURFACE, padding: 8, fontSize: 16, color: TEXT, textAlign: 'center',
  },
  capacityUnit: { fontSize: 13, color: TEXT },
  capacitySubmit: { marginLeft: 'auto', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },
  capacitySubmitText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Assignments
  assignmentsSection: {
    backgroundColor: BG, borderRadius: 4, padding: 12,
    borderWidth: 1, borderColor: BORDER, gap: 8,
  },
  assignmentsTitle: { fontSize: 11, color: TEXT2, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  assignmentCard: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  assignmentDriver: { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 4 },
  noPassengers: { fontSize: 12, color: TEXT2, marginLeft: 8 },
  passenger: { fontSize: 12, color: TEXT2, marginTop: 2 },
  warningBox: {
    backgroundColor: '#FFF3CD', borderRadius: 4, padding: 10,
    borderWidth: 1, borderColor: '#FFEAA7',
  },
  warningText: { fontSize: 12, color: '#856404', lineHeight: 18 },
  directText: { fontSize: 12, color: TEXT2, marginTop: 4 },

  // Driver post
  postSection: {
    backgroundColor: '#F0F7FF', borderRadius: 4, padding: 12,
    borderWidth: 1, borderColor: '#C8E1FF', gap: 10,
  },
  postSectionTitle: { fontSize: 11, color: '#1A3C5E', fontWeight: '700', letterSpacing: 2 },
  postCard: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 10,
    borderWidth: 1, borderColor: BORDER,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  postCardContent: { flex: 1 },
  postCardText: { fontSize: 13, color: TEXT, lineHeight: 18 },
  postDeleteBtn: { fontSize: 12, color: RED, fontWeight: '600', marginLeft: 8 },
  postToggleBtn: {
    borderWidth: 1, borderRadius: 4, borderStyle: 'dashed',
    paddingVertical: 10, alignItems: 'center',
  },
  postToggleBtnText: { fontSize: 13, fontWeight: '600' },
  postForm: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 12,
    borderWidth: 1, borderColor: BORDER, gap: 8,
  },
  postFormLabel: { fontSize: 10, color: TEXT2, fontWeight: '700', letterSpacing: 2 },
  postInput: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 4,
    padding: 10, fontSize: 14, color: TEXT, backgroundColor: BG,
  },
  postFormButtons: { flexDirection: 'row', gap: 8, marginTop: 4 },
  postCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 4,
    paddingVertical: 10, alignItems: 'center',
  },
  postCancelBtnText: { fontSize: 13, color: TEXT2, fontWeight: '600' },
  postSubmitBtn: { flex: 1, borderRadius: 4, paddingVertical: 10, alignItems: 'center' },
  postSubmitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Rider sees driver posts
  riderPostsSection: {
    backgroundColor: '#F0FFF4', borderRadius: 4, padding: 12,
    borderWidth: 1, borderColor: '#A8D5B5', gap: 8,
  },
  riderPostsTitle: { fontSize: 11, color: '#1A5C30', fontWeight: '700', letterSpacing: 2 },
  riderPostCard: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  riderPostDriver: { fontSize: 11, color: TEXT2, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
  riderPostText: { fontSize: 13, color: TEXT, lineHeight: 18 },
});
