import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform, Linking, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';

const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const BORDER = '#E2E6EA';
const TEXT = '#1A1A2E';
const TEXT2 = '#888899';
const ACCENT = '#1A3C5E';

// 実際のGoogleフォームURLに差し替えてください
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform';

interface Props {
  onBack: () => void;
}

// ──────────────────────────────────────────────
// 利用規約モーダル
// ──────────────────────────────────────────────
function TermsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={terms.container}>
        <View style={terms.header}>
          <Text style={terms.headerTitle}>利用規約・個人情報取扱方針</Text>
          <TouchableOpacity onPress={onClose} style={terms.closeBtn}>
            <Text style={terms.closeBtnText}>閉じる</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={terms.content}>

          <Text style={terms.updated}>最終更新日：2026年3月25日</Text>
          <Text style={terms.intro}>
            本利用規約（以下「本規約」）は、本アプリの運営者（以下「運営者」）が提供するスポーツクラブ会員向けアプリケーション（以下「本サービス」）の利用条件を定めるものです。会員登録を行う前に、本規約を必ずお読みください。登録を完了した時点で、本規約に同意したものとみなします。
          </Text>

          <Text style={terms.article}>第1条（目的・適用）</Text>
          <Text style={terms.body}>
            本規約は、本サービスの利用に関する運営者と利用者（以下「ユーザー」）との間の権利義務関係を定めることを目的とし、ユーザーと運営者との間の本サービスに関わる一切の関係に適用されます。
          </Text>

          <Text style={terms.article}>第2条（収集する個人情報）</Text>
          <Text style={terms.body}>
            本サービスは、以下の個人情報を収集します。{'\n'}
            (1) 氏名{'\n'}
            (2) メールアドレス{'\n'}
            (3) 所属グループ・学年{'\n'}
            (4) 月謝支払いに関する情報（支払い結果・対象月・金額）{'\n'}
            (5) アプリの利用ログ（操作日時・画面遷移等）{'\n\n'}
            なお、クレジットカード番号等の決済情報は本サービス内に保存せず、決済代行業者が管理します。
          </Text>

          <Text style={terms.article}>第3条（個人情報の利用目的）</Text>
          <Text style={terms.body}>
            収集した個人情報は、以下の目的にのみ利用します。{'\n'}
            (1) 本サービスの提供・運営{'\n'}
            (2) 月謝引き落とし結果の通知{'\n'}
            (3) スケジュール・出欠情報の管理{'\n'}
            (4) サービスに関する重要なお知らせの送付{'\n'}
            (5) 不正利用の検知・防止
          </Text>

          <Text style={terms.article}>第4条（個人情報の管理・安全管理措置）</Text>
          <Text style={terms.body}>
            運営者は、個人情報の漏洩・滅失・毀損の防止のため、以下の安全管理措置を講じます。{'\n'}
            (1) 通信の暗号化（TLS/SSL）による送受信{'\n'}
            (2) データベースへのアクセス制御（認証・権限管理）{'\n'}
            (3) パスワードのハッシュ化保存（平文での保存禁止）{'\n'}
            (4) ログイン試行回数の制限によるブルートフォース対策{'\n'}
            (5) 個人情報へのアクセスを業務上必要な者に限定
          </Text>

          <Text style={[terms.article, terms.important]}>第5条（情報漏洩等のリスクと免責）【重要】</Text>
          <Text style={terms.body}>
            1. 本サービスは、インターネットを介したクラウドサービスを利用しており、技術的対策を講じているものの、いかなるシステムも完全な安全性を保証するものではありません。ユーザーは、本サービスの利用に際し、以下のリスクが存在することをあらかじめ承諾するものとします。{'\n'}
            (1) 第三者による不正アクセス・サイバー攻撃{'\n'}
            (2) 運営者が委託する外部サービス事業者側のセキュリティインシデント{'\n'}
            (3) 通信経路上での傍受・改ざん{'\n'}
            (4) ユーザー自身のデバイス紛失・盗難・マルウェア感染{'\n\n'}
            2. 次の各号に該当する場合、運営者はその責任を負いません。{'\n'}
            (1) 運営者の合理的な管理の及ばない事由による情報漏洩（不可抗力、第三者によるサイバー攻撃、外部委託先のセキュリティ事故を含む）{'\n'}
            (2) ユーザー自身の不注意（パスワード管理の怠慢、フィッシング詐欺への応答等）による情報流出{'\n'}
            (3) ユーザーが第三者にアカウント情報を開示したことに起因する損害{'\n\n'}
            3. 情報漏洩が発生し、または発生したおそれがある場合、運営者は速やかに事実関係を調査し、影響を受けるユーザーへの通知、および再発防止策の実施に努めます。{'\n\n'}
            4. 運営者の故意または重大な過失に起因する情報漏洩については、本条の免責は適用されません。この場合の損害賠償責任の範囲は、直接かつ現実の損害に限るものとします。
          </Text>

          <Text style={terms.article}>第6条（第三者提供の禁止）</Text>
          <Text style={terms.body}>
            運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。{'\n'}
            (1) ユーザーの同意がある場合{'\n'}
            (2) 法令に基づく場合（裁判所・警察機関等からの法的要請）{'\n'}
            (3) 月謝処理のために決済代行業者へ必要最小限の情報を提供する場合（当該業者は守秘義務を負います）
          </Text>

          <Text style={terms.article}>第7条（個人情報の開示・訂正・削除）</Text>
          <Text style={terms.body}>
            ユーザーは、自己の個人情報の開示・訂正・追加・削除・利用停止を求める権利を有します。請求はクラブ管理者を通じて行うものとし、運営者は合理的な期間内に対応します。退会時には、法令上の保存義務がある情報を除き、個人情報を適切に削除または匿名化します。
          </Text>

          <Text style={terms.article}>第8条（禁止事項）</Text>
          <Text style={terms.body}>
            ユーザーは以下の行為を行ってはなりません。{'\n'}
            (1) 他のユーザーの個人情報を無断で収集・利用する行為{'\n'}
            (2) 不正アクセス・リバースエンジニアリング等のシステムへの攻撃{'\n'}
            (3) 虚偽の情報による登録{'\n'}
            (4) 第三者へのアカウントの譲渡・共有{'\n'}
            (5) 本サービスの運営を妨害する行為{'\n'}
            (6) 法令または公序良俗に反する行為
          </Text>

          <Text style={terms.article}>第9条（サービスの変更・中断・終了）</Text>
          <Text style={terms.body}>
            運営者は、ユーザーへの事前通知をもって、本サービスの内容変更、一時中断、または終了を行うことができます。これによってユーザーに生じた損害について、運営者の故意または重大な過失がある場合を除き、責任を負いません。
          </Text>

          <Text style={terms.article}>第10条（規約の変更）</Text>
          <Text style={terms.body}>
            運営者は、必要に応じて本規約を変更できます。重要な変更を行う場合は、アプリ内または登録メールアドレスへの通知により周知します。変更後も本サービスを継続利用した場合、変更後の規約に同意したものとみなします。
          </Text>

          <Text style={terms.article}>第11条（準拠法・裁判管轄）</Text>
          <Text style={terms.body}>
            本規約は日本法に準拠します。本サービスに関する紛争については、運営者の所在地を管轄する地方裁判所を第一審の専属的合意管轄裁判所とします。
          </Text>

          <Text style={terms.article}>第12条（お問い合わせ）</Text>
          <Text style={terms.body}>
            個人情報の取扱いおよび本規約に関するお問い合わせは、クラブ管理者までご連絡ください。
          </Text>

          <TouchableOpacity style={terms.agreeBtn} onPress={onClose}>
            <Text style={terms.agreeBtnText}>内容を確認しました</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ──────────────────────────────────────────────
// 新規登録画面
// ──────────────────────────────────────────────
export default function SignUpScreen({ onBack }: Props) {
  const { signUp } = useAuth();
  const { settings } = useTeam();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [error, setError] = useState('');

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  const handleSignUp = () => {
    setError('');
    if (!name.trim()) { setError('お名前を入力してください'); return; }
    if (!EMAIL_REGEX.test(email.trim())) { setError('正しいメールアドレスを入力してください'); return; }
    if (!PASSWORD_REGEX.test(password)) {
      setError('パスワードは8文字以上で、英字と数字を両方含めてください');
      return;
    }
    if (password !== confirm) { setError('パスワードが一致しません'); return; }
    if (!agreed) { setError('利用規約への同意が必要です'); return; }
    signUp(name.trim(), email.trim().toLowerCase());
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>新規登録</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>

          {/* Googleフォーム案内バナー */}
          <TouchableOpacity
            style={[styles.formBanner, { borderColor: settings.primaryColor + '50' }]}
            onPress={() => Linking.openURL(GOOGLE_FORM_URL)}
          >
            <View style={styles.formBannerLeft}>
              <Text style={[styles.formBannerSym, { color: settings.primaryColor }]}>□</Text>
              <View>
                <Text style={styles.formBannerTitle}>入会申込フォームを記入する</Text>
                <Text style={styles.formBannerSub}>登録前にGoogleフォームの記入をお願いします</Text>
              </View>
            </View>
            <Text style={[styles.formBannerArrow, { color: settings.primaryColor }]}>›</Text>
          </TouchableOpacity>

          <Text style={styles.label}>お名前</Text>
          <TextInput style={styles.input} value={name}
            onChangeText={v => { setName(v); setError(''); }}
            placeholder="例: 山田 太郎" placeholderTextColor={TEXT2} />

          <Text style={styles.label}>メールアドレス</Text>
          <TextInput style={styles.input} value={email}
            onChangeText={v => { setEmail(v); setError(''); }}
            placeholder="example@email.com" placeholderTextColor={TEXT2}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

          <Text style={styles.label}>パスワード（8文字以上・英字と数字を含む）</Text>
          <TextInput style={styles.input} value={password}
            onChangeText={v => { setPassword(v); setError(''); }}
            placeholder="パスワード" placeholderTextColor={TEXT2}
            secureTextEntry autoCorrect={false} />

          <Text style={styles.label}>パスワード（確認）</Text>
          <TextInput style={styles.input} value={confirm}
            onChangeText={v => { setConfirm(v); setError(''); }}
            placeholder="パスワード（再入力）" placeholderTextColor={TEXT2}
            secureTextEntry autoCorrect={false} />

          {/* 利用規約同意チェックボックス */}
          <View style={styles.agreeRow}>
            <TouchableOpacity
              style={[styles.checkbox, agreed && { backgroundColor: settings.primaryColor, borderColor: settings.primaryColor }]}
              onPress={() => { setAgreed(v => !v); setError(''); }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
            >
              {agreed && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
            <View style={styles.agreeTextWrap}>
              <TouchableOpacity onPress={() => setTermsVisible(true)}>
                <Text style={styles.agreeText}>
                  <Text style={[styles.termsLink, { color: settings.primaryColor }]}>
                    利用規約・個人情報取扱方針
                  </Text>
                  <Text style={styles.agreeText}>を読み、同意します</Text>
                </Text>
              </TouchableOpacity>
              <Text style={styles.agreeNote}>
                ※ 情報漏洩リスクに関する免責事項（第5条）を含みます
              </Text>
            </View>
          </View>

          {error !== '' && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: agreed ? settings.primaryColor : '#B0BEC5' },
            ]}
            onPress={handleSignUp}
          >
            <Text style={styles.submitBtnText}>登録する</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            登録後、月謝に関する案内を確認していただきます。
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────
// スタイル
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { width: 60 },
  backText: { color: TEXT2, fontSize: 13, letterSpacing: 0.5 },
  headerTitle: { color: TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  content: { padding: 24, gap: 6 },
  formBanner: {
    backgroundColor: SURFACE, borderRadius: 4, padding: 16,
    borderWidth: 1, borderColor: ACCENT + '50',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  formBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  formBannerSym: { fontSize: 20, color: ACCENT, fontWeight: '700' },
  formBannerTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  formBannerSub: { fontSize: 12, color: TEXT2, marginTop: 3 },
  formBannerArrow: { fontSize: 22, color: ACCENT, fontWeight: '700' },
  label: { fontSize: 10, color: TEXT2, fontWeight: '700', marginTop: 14, letterSpacing: 2 },
  input: {
    backgroundColor: SURFACE, borderRadius: 4, borderWidth: 1,
    borderColor: BORDER, padding: 16, fontSize: 15, color: TEXT,
  },
  agreeRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginTop: 20, marginBottom: 4,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2,
    borderColor: BORDER, alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  agreeTextWrap: { flex: 1 },
  agreeText: { fontSize: 13, color: TEXT, lineHeight: 20 },
  termsLink: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  agreeNote: { fontSize: 11, color: TEXT2, marginTop: 4, lineHeight: 16 },
  errorText: { color: '#F87171', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  submitBtn: {
    borderRadius: 4, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  note: { color: TEXT2, fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 18 },
});

const terms = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: SURFACE,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: TEXT, letterSpacing: 1 },
  closeBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  closeBtnText: { fontSize: 14, color: TEXT2 },
  content: { padding: 24, gap: 4 },
  updated: { fontSize: 11, color: TEXT2, marginBottom: 12, letterSpacing: 0.5 },
  intro: { fontSize: 13, color: TEXT, lineHeight: 22, marginBottom: 12 },
  article: {
    fontSize: 13, fontWeight: '800', color: ACCENT,
    marginTop: 20, marginBottom: 6, letterSpacing: 0.5,
  },
  important: { color: '#C0392B' },
  body: { fontSize: 13, color: TEXT, lineHeight: 22 },
  agreeBtn: {
    backgroundColor: ACCENT, borderRadius: 4, paddingVertical: 16,
    alignItems: 'center', marginTop: 32, marginBottom: 16,
  },
  agreeBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
