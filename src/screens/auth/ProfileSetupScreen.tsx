import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';
import Avatar from '../../components/Avatar';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';

async function requestPermissionAndPick(): Promise<string | null> {
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
    base64: false,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export default function ProfileSetupScreen() {
  const { user, updateAvatar, completeProfileSetup } = useAuth();
  const { settings } = useTeam();
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    setLoading(true);
    try {
      const uri = await requestPermissionAndPick();
      if (uri) setLocalUri(uri);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    updateAvatar(localUri);
    completeProfileSetup();
  };

  const handleSkip = () => {
    completeProfileSetup();
  };

  const name = user?.name ?? '';
  const AVATAR_SIZE = 120;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>プロフィール写真</Text>
        <Text style={styles.subtitle}>
          アプリ内で表示されるプロフィール写真を設定してください。{'\n'}
          設定しない場合はお名前のイニシャルが表示されます。
        </Text>

        {/* Avatar preview */}
        <View style={styles.avatarArea}>
          <Avatar
            name={name}
            avatarUri={localUri}
            size={AVATAR_SIZE}
            color={settings.primaryColor}
          />

          {localUri ? (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setLocalUri(null)}>
              <Text style={styles.removeBtnText}>写真を削除</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.initialsHint}>
              <Text style={styles.initialsHintText}>現在: イニシャル表示</Text>
            </View>
          )}
        </View>

        {/* Pick button */}
        <TouchableOpacity
          style={[styles.pickBtn, { borderColor: settings.primaryColor }]}
          onPress={handlePickImage}
          disabled={loading}>
          <Text style={[styles.pickBtnText, { color: settings.primaryColor }]}>
            {loading ? '読み込み中...' : '写真を選ぶ'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          正方形にトリミングされます。{'\n'}JPEG・PNG・HEIFに対応しています。
        </Text>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: settings.primaryColor }]}
          onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {localUri ? '写真を設定して次へ' : 'イニシャルで次へ'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>スキップ（後で設定する）</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: {
    flexGrow: 1, padding: 32,
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: TEXT,
    letterSpacing: 1, textAlign: 'center',
  },
  subtitle: {
    fontSize: 13, color: TEXT2, textAlign: 'center',
    lineHeight: 20, letterSpacing: 0.3, marginBottom: 8,
  },
  avatarArea: { alignItems: 'center', gap: 12, marginVertical: 8 },
  initialsHint: {
    backgroundColor: SURFACE, borderRadius: 4, borderWidth: 1,
    borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 6,
  },
  initialsHintText: { fontSize: 12, color: TEXT2 },
  removeBtn: {
    borderRadius: 4, borderWidth: 1, borderColor: '#DC3545',
    paddingHorizontal: 14, paddingVertical: 6,
  },
  removeBtnText: { fontSize: 12, color: '#DC3545', fontWeight: '600' },
  pickBtn: {
    borderWidth: 1.5, borderRadius: 4, width: '100%',
    paddingVertical: 14, alignItems: 'center',
  },
  pickBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  hint: {
    fontSize: 11, color: TEXT2, textAlign: 'center',
    lineHeight: 18, letterSpacing: 0.3,
  },
  saveBtn: {
    width: '100%', borderRadius: 4, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  skipBtn: { paddingVertical: 10 },
  skipBtnText: { fontSize: 13, color: TEXT2, letterSpacing: 0.5 },
});
