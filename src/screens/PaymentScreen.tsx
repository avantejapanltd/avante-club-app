import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTeam } from '../context/TeamContext';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';

interface Payment {
  id: string;
  month: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'failed';
}

const PAYMENTS: Payment[] = [
  { id: '1', month: '2026年3月', amount: 8000, dueDate: '3月27日', status: 'pending' },
  { id: '2', month: '2026年2月', amount: 8000, dueDate: '2月27日', status: 'paid' },
  { id: '3', month: '2026年1月', amount: 8000, dueDate: '1月27日', status: 'paid' },
  { id: '4', month: '2025年12月', amount: 8000, dueDate: '12月27日', status: 'paid' },
];

const STATUS_LABEL: Record<Payment['status'], string> = {
  paid: '支払い済み',
  pending: '引き落とし予定',
  failed: '引き落とし失敗',
};

const STATUS_COLOR: Record<Payment['status'], string> = {
  paid: '#28A745',
  pending: '#E8A020',
  failed: '#DC3545',
};

export default function PaymentScreen() {
  const { settings } = useTeam();
  const [payments] = useState<Payment[]>(PAYMENTS);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>月謝・支払い管理</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>お支払いについて</Text>
          <Text style={styles.infoText}>
            月謝の引き落としは決済代行業者を通じて毎月27日に行われます。{'\n'}
            引き落とし結果はメールにてご連絡いたします。
          </Text>
        </View>

        <Text style={styles.sectionTitle}>支払い履歴</Text>
        {payments.map(p => (
          <View key={p.id} style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.month}>{p.month}</Text>
                <Text style={styles.dueDate}>引き落とし日: {p.dueDate}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.amount}>¥{p.amount.toLocaleString()}</Text>
                <View style={[styles.badge, { borderColor: STATUS_COLOR[p.status] }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLOR[p.status] }]}>
                    {STATUS_LABEL[p.status]}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  content: { padding: 16, gap: 10 },
  infoCard: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 20,
    borderWidth: 1, borderColor: BORDER,
  },
  infoLabel: { color: TEXT2, fontSize: 10, marginBottom: 8, letterSpacing: 2, fontWeight: '700' },
  infoText: { color: TEXT, fontSize: 13, lineHeight: 22, letterSpacing: 0.3 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: TEXT2, marginTop: 8, letterSpacing: 2 },
  card: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 18,
    borderWidth: 1, borderColor: BORDER,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  month: { fontSize: 15, fontWeight: '700', color: TEXT, letterSpacing: 0.3 },
  dueDate: { fontSize: 11, color: TEXT2, marginTop: 4, letterSpacing: 0.5 },
  right: { alignItems: 'flex-end', gap: 8 },
  amount: { fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: 1 },
  badge: { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});
