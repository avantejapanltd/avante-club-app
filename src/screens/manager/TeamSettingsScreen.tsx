import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView as RNSafeAreaView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTeam, COLOR_THEMES, SPORT_EMOJIS } from '../../context/TeamContext';

export default function TeamSettingsScreen() {
  const { settings, updateSettings } = useTeam();
  const [localName, setLocalName] = useState(settings.teamName);
  const [localTagline, setLocalTagline] = useState(settings.tagline);
  const [localLogoValue, setLocalLogoValue] = useState(settings.logoValue);
  const [newScheduleCat, setNewScheduleCat] = useState('');
  const [newScheduleGroup, setNewScheduleGroup] = useState('');

  const handleAddScheduleCategory = () => {
    const trimmed = newScheduleCat.trim();
    if (!trimmed) return;
    if ((settings.scheduleCategories ?? []).includes(trimmed)) {
      Alert.alert('重複', `「${trimmed}」はすでに存在します`);
      return;
    }
    updateSettings({ scheduleCategories: [...(settings.scheduleCategories ?? []), trimmed] });
    setNewScheduleCat('');
  };

  const handleDeleteScheduleCategory = (cat: string) => {
    if ((settings.scheduleCategories ?? []).length <= 1) {
      Alert.alert('削除できません', 'カテゴリは最低1つ必要です');
      return;
    }
    Alert.alert('削除確認', `「${cat}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive',
        onPress: () => updateSettings({ scheduleCategories: (settings.scheduleCategories ?? []).filter(c => c !== cat) }),
      },
    ]);
  };

  const handleAddScheduleGroup = () => {
    const trimmed = newScheduleGroup.trim();
    if (!trimmed) return;
    if ((settings.scheduleGroups ?? []).includes(trimmed)) {
      Alert.alert('重複', `「${trimmed}」はすでに存在します`);
      return;
    }
    updateSettings({ scheduleGroups: [...(settings.scheduleGroups ?? []), trimmed] });
    setNewScheduleGroup('');
  };

  const handleDeleteScheduleGroup = (group: string) => {
    if ((settings.scheduleGroups ?? []).length <= 1) {
      Alert.alert('削除できません', 'グループは最低1つ必要です');
      return;
    }
    Alert.alert('削除確認', `「${group}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive',
        onPress: () => updateSettings({ scheduleGroups: (settings.scheduleGroups ?? []).filter(g => g !== group) }),
      },
    ]);
  };

  const apply = (patch: Parameters<typeof updateSettings>[0]) => {
    updateSettings(patch);
  };

  const handleNameBlur = () => {
    const trimmed = localName.trim() || 'TEAM';
    setLocalName(trimmed);
    apply({ teamName: trimmed });
    // 頭文字モードなら自動更新
    if (settings.logoType === 'initials' && settings.logoValue === autoInitials(settings.teamName)) {
      const ni = autoInitials(trimmed);
      setLocalLogoValue(ni);
      apply({ teamName: trimmed, logoValue: ni });
    }
  };

  const autoInitials = (name: string) =>
    name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || name.slice(0, 2).toUpperCase();

  const handleLogoValueChange = (v: string) => {
    const upper = v.toUpperCase().slice(0, 3);
    setLocalLogoValue(upper);
    apply({ logoValue: upper });
  };

  const currentThemeIndex = COLOR_THEMES.findIndex(
    t => t.primary === settings.primaryColor && t.accent === settings.accentColor
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>チーム設定</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ライブプレビュー */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>プレビュー</Text>
          <View style={[styles.previewHeader, { backgroundColor: settings.primaryColor }]}>
            <View style={styles.previewLeft}>
              <View style={[styles.logoBox, { backgroundColor: settings.accentColor }]}>
                {settings.logoType === 'initials' ? (
                  <Text style={styles.logoInitials}>{settings.logoValue || '??'}</Text>
                ) : (
                  <Text style={styles.logoEmoji}>{settings.logoValue || '⚽'}</Text>
                )}
              </View>
              <View>
                <Text style={styles.previewName}>{settings.teamName}</Text>
                <Text style={styles.previewTagline}>{settings.tagline}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.previewTabBar, { borderTopColor: '#E2E6EA' }]}>
            {['ホーム', 'スケジュール', '月謝', 'ショップ', '書類'].map((tab, i) => (
              <View key={tab} style={styles.previewTab}>
                <View style={[styles.previewTabDot, { backgroundColor: i === 0 ? settings.primaryColor : '#CCC' }]} />
                <Text style={[styles.previewTabText, { color: i === 0 ? settings.primaryColor : '#CCC' }]}>{tab}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* チーム名 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>チーム名</Text>
          <TextInput
            style={styles.input}
            value={localName}
            onChangeText={setLocalName}
            onBlur={handleNameBlur}
            placeholder="チーム名を入力"
            autoCapitalize="characters"
          />
        </View>

        {/* タグライン */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>タグライン / サブテキスト</Text>
          <TextInput
            style={styles.input}
            value={localTagline}
            onChangeText={v => { setLocalTagline(v); apply({ tagline: v }); }}
            placeholder="例: スポーツクラブ、サッカーアカデミー"
          />
        </View>

        {/* ロゴ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ロゴスタイル</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, settings.logoType === 'initials' && styles.toggleBtnActive, { borderColor: settings.primaryColor }]}
              onPress={() => apply({ logoType: 'initials', logoValue: autoInitials(settings.teamName) })}>
              <Text style={[styles.toggleText, settings.logoType === 'initials' && { color: settings.primaryColor }]}>
                頭文字
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, settings.logoType === 'emoji' && styles.toggleBtnActive, { borderColor: settings.primaryColor }]}
              onPress={() => apply({ logoType: 'emoji', logoValue: '⚽' })}>
              <Text style={[styles.toggleText, settings.logoType === 'emoji' && { color: settings.primaryColor }]}>
                絵文字
              </Text>
            </TouchableOpacity>
          </View>

          {settings.logoType === 'initials' && (
            <View style={styles.initialsRow}>
              <TextInput
                style={[styles.initialsInput, { borderColor: settings.primaryColor }]}
                value={localLogoValue}
                onChangeText={handleLogoValueChange}
                placeholder="AJ"
                maxLength={3}
                autoCapitalize="characters"
              />
              <Text style={styles.initialsHint}>最大3文字（例: AJ, FC, SCなど）</Text>
            </View>
          )}

          {settings.logoType === 'emoji' && (
            <View style={styles.emojiGrid}>
              {SPORT_EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, settings.logoValue === e && { backgroundColor: settings.primaryColor + '20', borderColor: settings.primaryColor }]}
                  onPress={() => apply({ logoValue: e })}>
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* カラーテーマ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>カラーテーマ</Text>
          <View style={styles.themeGrid}>
            {COLOR_THEMES.map((theme, i) => (
              <TouchableOpacity
                key={theme.name}
                style={[styles.themeCard, currentThemeIndex === i && styles.themeCardActive]}
                onPress={() => apply({ primaryColor: theme.primary, accentColor: theme.accent })}>
                <View style={styles.themeSwatches}>
                  <View style={[styles.swatchPrimary, { backgroundColor: theme.primary }]} />
                  <View style={[styles.swatchAccent, { backgroundColor: theme.accent }]} />
                </View>
                <Text style={[styles.themeName, currentThemeIndex === i && { color: settings.primaryColor, fontWeight: '700' }]}>
                  {theme.name}
                </Text>
                {currentThemeIndex === i && (
                  <View style={[styles.themeCheck, { backgroundColor: settings.primaryColor }]}>
                    <Text style={styles.themeCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* スケジュールグループ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>スケジュール グループ</Text>

          {(settings.scheduleGroups ?? []).map(group => (
            <View key={group} style={styles.catRow}>
              <Text style={styles.catRowText}>{group}</Text>
              <TouchableOpacity onPress={() => handleDeleteScheduleGroup(group)}>
                <Text style={styles.catDeleteText}>削除</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.addCatRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newScheduleGroup}
              onChangeText={setNewScheduleGroup}
              placeholder="新しいグループ名（例: U-12）"
              onSubmitEditing={handleAddScheduleGroup}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addCatBtn, { backgroundColor: settings.primaryColor }]}
              onPress={handleAddScheduleGroup}>
              <Text style={styles.addCatBtnText}>追加</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* スケジュールカテゴリ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>スケジュールカテゴリ</Text>

          {(settings.scheduleCategories ?? []).map(cat => (
            <View key={cat} style={styles.catRow}>
              <Text style={styles.catRowText}>{cat}</Text>
              <TouchableOpacity onPress={() => handleDeleteScheduleCategory(cat)}>
                <Text style={styles.catDeleteText}>削除</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.addCatRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newScheduleCat}
              onChangeText={setNewScheduleCat}
              placeholder="新しいカテゴリ名（例: 合宿）"
              onSubmitEditing={handleAddScheduleCategory}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addCatBtn, { backgroundColor: settings.primaryColor }]}
              onPress={handleAddScheduleCategory}>
              <Text style={styles.addCatBtnText}>追加</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>変更はリアルタイムでアプリ全体に反映されます</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16, gap: 16 },

  // Preview
  previewSection: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2E6EA',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  previewHeader: { padding: 16 },
  previewLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  logoInitials: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  logoEmoji: { fontSize: 22 },
  previewName: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 1 },
  previewTagline: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
  previewTabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderTopWidth: 1, paddingVertical: 10,
  },
  previewTab: { flex: 1, alignItems: 'center', gap: 3 },
  previewTabDot: { width: 14, height: 14, borderRadius: 7 },
  previewTabText: { fontSize: 9, fontWeight: '600' },

  // Sections
  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, gap: 10,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 1, textTransform: 'uppercase' },

  // Inputs
  input: {
    backgroundColor: '#F7F9FC', borderRadius: 10, borderWidth: 1,
    borderColor: '#E2E6EA', padding: 14, fontSize: 15, color: '#1A1A2E',
  },

  // Logo toggle
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E6EA', backgroundColor: '#F7F9FC',
  },
  toggleBtnActive: { backgroundColor: '#fff' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#888' },

  initialsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  initialsInput: {
    width: 80, backgroundColor: '#F7F9FC', borderRadius: 10, borderWidth: 2,
    padding: 12, fontSize: 22, fontWeight: '900', textAlign: 'center', color: '#1A1A2E',
  },
  initialsHint: { flex: 1, fontSize: 12, color: '#aaa', lineHeight: 18 },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  emojiBtn: {
    width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E2E6EA', backgroundColor: '#F7F9FC',
  },
  emojiText: { fontSize: 22 },

  // Color themes
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeCard: {
    width: '47%', backgroundColor: '#F7F9FC', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: '#E2E6EA', gap: 8, position: 'relative',
  },
  themeCardActive: { backgroundColor: '#fff', borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  themeSwatches: { flexDirection: 'row', gap: 6 },
  swatchPrimary: { flex: 2, height: 24, borderRadius: 6 },
  swatchAccent: { flex: 1, height: 24, borderRadius: 6 },
  themeName: { fontSize: 13, color: '#555', fontWeight: '500' },
  themeCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  themeCheckText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  catRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F7F9FC', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E2E6EA',
  },
  catRowText: { fontSize: 14, color: '#333', fontWeight: '500' },
  catDeleteText: { color: '#DC3545', fontSize: 13, fontWeight: '600' },
  addCatRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  addCatBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  addCatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  bottomNote: { alignItems: 'center', paddingBottom: 8 },
  bottomNoteText: { fontSize: 12, color: '#bbb', textAlign: 'center' },
});
