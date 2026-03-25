import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';

const BRAND_COLOR = '#1A3C5E';

export default function PaymentSetupScreen() {
  const { user, completePaymentSetup } = useAuth();
  const { settings } = useTeam();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>月謝について</Text>
        <Text style={styles.headerSub}>{user?.name} さん</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>月謝の引き落としについて</Text>
          <Text style={styles.infoText}>
            月謝は毎月27日に決済代行業者を通じて引き落としが行われます。{'\n\n'}
            引き落とし結果は登録メールアドレス（{user?.email}）にお知らせします。{'\n\n'}
            引き落とし日の前日までに口座残高をご確認ください。
          </Text>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>お支払いに関するお問い合わせ</Text>
          <Text style={styles.noteText}>
            引き落とし結果や金額についてご不明な点は、クラブ管理者までお問い合わせください。
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.completeBtn, { backgroundColor: settings.primaryColor }]}
          onPress={() => completePaymentSetup()}
        >
          <Text style={styles.completeBtnText}>確認してアプリを始める</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: BRAND_COLOR, paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#aac', fontSize: 13, marginTop: 4 },
  content: { padding: 20, gap: 16 },
  infoBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: '#C8D8EC',
  },
  infoTitle: { fontSize: 15, fontWeight: 'bold', color: BRAND_COLOR, marginBottom: 12 },
  infoText: { fontSize: 14, color: '#555', lineHeight: 24 },
  noteBox: {
    backgroundColor: '#FFFBF0', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#F0D080',
  },
  noteTitle: { fontSize: 13, fontWeight: 'bold', color: '#7A6000', marginBottom: 8 },
  noteText: { fontSize: 13, color: '#666', lineHeight: 20 },
  completeBtn: {
    backgroundColor: BRAND_COLOR, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    marginTop: 8,
  },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
