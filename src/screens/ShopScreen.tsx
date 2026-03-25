import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTeam } from '../context/TeamContext';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';
const ACCENT = '#1A3C5E';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: string;
  url: string;
  category: string;
  isNew?: boolean;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: '1',
    category: 'ユニフォーム',
    name: 'AVANTE JAPAN 公式ユニフォーム上下セット',
    description: '練習・試合共用。サイズ: SS / S / M / L / XL',
    price: '¥8,800',
    url: 'https://example.com/uniform-set',
    isNew: true,
  },
  {
    id: '2',
    category: 'ユニフォーム',
    name: '公式プラクティスシャツ',
    description: '軽量・速乾素材。カラー: ネイビー / ホワイト',
    price: '¥3,300',
    url: 'https://example.com/practice-shirt',
  },
  {
    id: '3',
    category: 'シューズ',
    name: 'スポーツシューズ（推奨モデル）',
    description: 'クラブ推奨モデル。屋内・屋外兼用',
    price: '¥12,100〜',
    url: 'https://example.com/shoes',
  },
  {
    id: '4',
    category: 'バッグ',
    name: 'クラブ公式バッグ',
    description: 'A4サイズ収納可。ユニフォーム・シューズ収納ポケット付き',
    price: '¥5,500',
    url: 'https://example.com/bag',
  },
  {
    id: '5',
    category: 'その他',
    name: 'スポーツソックス（3足セット）',
    description: 'ハイソックスタイプ。クラブカラー（ネイビー）',
    price: '¥1,650',
    url: 'https://example.com/socks',
  },
];

const CATEGORIES = ['すべて', 'ユニフォーム', 'シューズ', 'バッグ', 'その他'];

const CATEGORY_COLORS: Record<string, string> = {
  ユニフォーム: '#4FC3F7',
  シューズ: '#34D399',
  バッグ: '#FB923C',
  その他: '#A78BFA',
};

export default function ShopScreen() {
  const { settings } = useTeam();
  const [selected, setSelected] = React.useState('すべて');

  const filtered = selected === 'すべて'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(i => i.category === selected);

  const handleOpen = (item: ShopItem) => {
    Alert.alert(
      item.name,
      `スポーツ用品店のページを開きます。\n\n${item.description}\n\n価格: ${item.price}`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '購入ページへ', onPress: () => {
            Linking.openURL(item.url).catch(() =>
              Alert.alert('エラー', 'ページを開けませんでした')
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: settings.primaryColor }]}>
        <Text style={styles.headerTitle}>ユニフォーム・用品購入</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat}
            style={[styles.filterBtn, selected === cat && [styles.filterBtnActive, { borderColor: settings.primaryColor, backgroundColor: settings.primaryColor + '15' }]]}
            onPress={() => setSelected(cat)}>
            <Text style={[styles.filterText, selected === cat && [styles.filterTextActive, { color: settings.primaryColor }]]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.banner, { borderLeftColor: settings.primaryColor }]}>
          <Text style={styles.bannerText}>
            ユニフォームは提携スポーツ用品店からご購入いただけます
          </Text>
        </View>

        {filtered.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.catBadge, { borderColor: CATEGORY_COLORS[item.category] ?? TEXT2 }]}>
                <Text style={[styles.catText, { color: CATEGORY_COLORS[item.category] ?? TEXT2 }]}>
                  {item.category}
                </Text>
              </View>
              {item.isNew && (
                <View style={[styles.newBadge, { borderColor: settings.primaryColor }]}>
                  <Text style={[styles.newText, { color: settings.primaryColor }]}>NEW</Text>
                </View>
              )}
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.price}>{item.price}</Text>
              <TouchableOpacity style={[styles.buyBtn, { borderColor: settings.primaryColor }]} onPress={() => handleOpen(item)}>
                <Text style={[styles.buyBtnText, { color: settings.primaryColor }]}>購入ページへ</Text>
              </TouchableOpacity>
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
  headerTitle: { color: TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  filterBar: { backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER, maxHeight: 54 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn: { borderRadius: 4, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: BORDER },
  filterBtnActive: { borderColor: ACCENT, backgroundColor: ACCENT + '15' },
  filterText: { fontSize: 12, color: TEXT2, letterSpacing: 0.5 },
  filterTextActive: { color: ACCENT, fontWeight: '700' },
  content: { padding: 16, gap: 10 },
  banner: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 14,
    borderLeftWidth: 2, borderLeftColor: ACCENT, borderWidth: 1, borderColor: BORDER,
  },
  bannerText: { fontSize: 12, color: TEXT2, lineHeight: 20, letterSpacing: 0.3 },
  card: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 18,
    borderWidth: 1, borderColor: BORDER, gap: 8,
  },
  cardTop: { flexDirection: 'row', gap: 8 },
  catBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1 },
  catText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  newBadge: { borderWidth: 1, borderColor: ACCENT, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  newText: { color: ACCENT, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: TEXT, letterSpacing: 0.2 },
  itemDesc: { fontSize: 12, color: TEXT2, letterSpacing: 0.3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: 1 },
  buyBtn: { borderWidth: 1, borderColor: ACCENT, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 9 },
  buyBtnText: { color: '#1A3C5E', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
});
