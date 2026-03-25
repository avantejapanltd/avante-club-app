import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useSchedule } from '../context/ScheduleContext';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';

interface Props {
  onSignUp?: () => void;
  onLogin?: () => void;
}

function formatDate(d: Date) {
  return `${d.getMonth() + 1}月${d.getDate()}日(${['日','月','火','水','木','金','土'][d.getDay()]})`;
}
function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function HomeScreen({ onSignUp, onLogin }: Props) {
  const { user, logout } = useAuth();
  const { settings } = useTeam();
  const { schedules } = useSchedule();
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // 今後のスケジュール（上位2件）
  const upcoming = schedules
    .filter(s => s.date >= today || s.date.toDateString() === today.toDateString())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 2);

  // 未回答数（totalMembers - 回答済み）
  const unanswered = schedules.reduce((sum, s) => {
    return sum + Math.max(0, s.totalMembers - s.presentCount - s.absentCount - s.maybeCount);
  }, 0);

  const LogoMark = () => (
    <View style={[styles.logoMark, { backgroundColor: settings.accentColor }]}>
      {settings.logoType === 'initials'
        ? <Text style={styles.logoMarkText}>{settings.logoValue || '??'}</Text>
        : <Text style={styles.logoMarkEmoji}>{settings.logoValue || '⚽'}</Text>
      }
    </View>
  );

  // 未ログイン時
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
          <View style={styles.headerLeft}>
            <LogoMark />
            <View>
              <Text style={styles.headerTitle}>{settings.teamName}</Text>
              {settings.tagline ? <Text style={styles.headerDate}>{settings.tagline}</Text> : null}
            </View>
          </View>
          <Text style={styles.headerDate}>{dateStr}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.heroCard, { backgroundColor: settings.primaryColor }]}>
            <Text style={styles.heroEyebrow}>{settings.tagline.toUpperCase() || 'SPORTS CLUB'}</Text>
            <Text style={styles.heroTitle}>会員アプリ</Text>
            <Text style={styles.heroSub}>月謝管理・スケジュール・{'\n'}ユニフォーム購入を一元管理</Text>
            <TouchableOpacity style={[styles.signUpBtn, { backgroundColor: settings.accentColor }]} onPress={onSignUp}>
              <Text style={styles.signUpBtnText}>新規登録（無料）</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginLinkBtn} onPress={onLogin}>
              <Text style={styles.loginLinkText}>ログインはこちら</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ログイン済み
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <View style={styles.headerLeft}>
          <LogoMark />
          <View>
            <Text style={styles.headerTitle}>{settings.teamName}</Text>
            <Text style={styles.headerSub}>{user.group ?? '管理者'} · {user.name}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutBtn}>ログアウト</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>お知らせ</Text>
          <Text style={styles.cardBody}>今月の月謝引き落とし日: 27日</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>直近のスケジュール</Text>
          {upcoming.length === 0 ? (
            <Text style={styles.cardBody}>予定はありません</Text>
          ) : (
            upcoming.map(s => (
              <Text key={s.id} style={styles.cardBody}>
                {formatDate(s.date)} {s.title}{s.opponent ? ` vs ${s.opponent}` : ''} {formatTime(s.startTime)}〜
              </Text>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>未回答の出欠</Text>
          <Text style={styles.accentNum}>{unanswered}<Text style={styles.accentUnit}> 件</Text></Text>
        </View>

        {user.paymentMethod && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>決済方法</Text>
            <Text style={styles.cardBody}>
              {user.paymentMethod === 'card' ? 'クレジットカード引き落とし' : 'リンク決済（請求書払い）'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 38, height: 38, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  logoMarkText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  logoMarkEmoji: { fontSize: 20 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  headerDate: { color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 0.5 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  logoutBtn: { color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 0.5 },
  content: { padding: 20, gap: 12 },
  heroCard: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 28,
    backgroundColor: SURFACE,
  },
  heroEyebrow: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 10, opacity: 0.75 },
  heroTitle: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 22, marginBottom: 28 },
  signUpBtn: {
    borderRadius: 4, paddingVertical: 16, alignItems: 'center',
  },
  signUpBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  loginLinkBtn: { alignItems: 'center', marginTop: 16 },
  loginLinkText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, letterSpacing: 0.5 },
  card: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 20,
    borderWidth: 1, borderColor: BORDER,
  },
  cardLabel: { fontSize: 10, fontWeight: '700', color: TEXT2, marginBottom: 10, letterSpacing: 2 },
  cardBody: { fontSize: 14, color: TEXT, marginBottom: 4, letterSpacing: 0.3 },
  accentNum: { fontSize: 40, fontWeight: '800', color: '#1A3C5E', letterSpacing: -1 },
  accentUnit: { fontSize: 16, fontWeight: '400', color: TEXT2 },
});
