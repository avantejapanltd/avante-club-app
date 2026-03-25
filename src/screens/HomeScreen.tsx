import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useSchedule } from '../context/ScheduleContext';
import Avatar from '../components/Avatar';

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

async function pickAvatar(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('許可が必要です', 'カメラロールへのアクセスを許可してください');
      return null;
    }
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

function AvatarEditModal({
  visible, onClose, name, avatarUri, primaryColor,
}: {
  visible: boolean; onClose: () => void;
  name: string; avatarUri: string | null; primaryColor: string;
}) {
  const { updateAvatar } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePick = async () => {
    setLoading(true);
    try {
      const uri = await pickAvatar();
      if (uri) updateAvatar(uri);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    updateAvatar(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={modal.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={modal.sheet}>
          <View style={modal.avatarRow}>
            <Avatar name={name} avatarUri={avatarUri} size={80} color={primaryColor} />
            <View style={modal.nameArea}>
              <Text style={modal.nameText}>{name}</Text>
              <Text style={modal.nameHint}>プロフィール写真を変更</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[modal.btn, { borderColor: primaryColor }]}
            onPress={handlePick}
            disabled={loading}>
            <Text style={[modal.btnText, { color: primaryColor }]}>
              {loading ? '読み込み中...' : '写真を選ぶ'}
            </Text>
          </TouchableOpacity>
          {avatarUri && (
            <TouchableOpacity style={[modal.btn, { borderColor: '#DC3545' }]} onPress={handleRemove}>
              <Text style={[modal.btnText, { color: '#DC3545' }]}>写真を削除（イニシャルに戻す）</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
            <Text style={modal.cancelText}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function HomeScreen({ onSignUp, onLogin }: Props) {
  const { user, logout } = useAuth();
  const { settings } = useTeam();
  const { schedules } = useSchedule();
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  const upcoming = schedules
    .filter(s => s.date >= today || s.date.toDateString() === today.toDateString())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 2);

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
            <Text style={styles.headerSub}>{user.group ?? user.role === 'manager' ? '管理者' : user.role === 'coach' ? '指導者' : ''}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Avatar
            name={user.name}
            avatarUri={user.avatarUri}
            size={36}
            color={settings.accentColor}
            onPress={() => setAvatarModalVisible(true)}
          />
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logoutBtn}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* プロフィールカード */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => setAvatarModalVisible(true)}
          activeOpacity={0.8}>
          <Avatar
            name={user.name}
            avatarUri={user.avatarUri}
            size={56}
            color={settings.primaryColor}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileRole}>
              {user.role === 'manager' ? '管理者' : user.role === 'coach' ? '指導者' : '会員'}
              {user.group ? ` · ${user.group}` : ''}
            </Text>
          </View>
          <Text style={styles.profileEditHint}>写真を変更</Text>
        </TouchableOpacity>

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

      <AvatarEditModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        name={user.name}
        avatarUri={user.avatarUri}
        primaryColor={settings.primaryColor}
      />
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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

  profileCard: {
    backgroundColor: SURFACE, borderRadius: 4, borderWidth: 1, borderColor: BORDER,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: TEXT, letterSpacing: 0.3 },
  profileRole: { fontSize: 12, color: TEXT2, marginTop: 3, letterSpacing: 0.5 },
  profileEditHint: { fontSize: 11, color: TEXT2, letterSpacing: 0.3 },

  heroCard: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 28,
    backgroundColor: SURFACE,
  },
  heroEyebrow: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 10, opacity: 0.75 },
  heroTitle: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 22, marginBottom: 28 },
  signUpBtn: { borderRadius: 4, paddingVertical: 16, alignItems: 'center' },
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

const modal = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SURFACE, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 24, gap: 12, paddingBottom: 36,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  nameArea: { flex: 1 },
  nameText: { fontSize: 17, fontWeight: '700', color: TEXT },
  nameHint: { fontSize: 12, color: TEXT2, marginTop: 4 },
  btn: {
    borderWidth: 1.5, borderRadius: 4,
    paddingVertical: 14, alignItems: 'center',
  },
  btnText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, color: TEXT2 },
});
