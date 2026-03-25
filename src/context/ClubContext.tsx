import React, { createContext, useContext, useState } from 'react';
import { TeamSettings } from './TeamContext';
import { UserRole } from './AuthContext';

export interface ClubTestAccount {
  password: string;
  role: UserRole;
  name: string;
}

export interface ClubData {
  clubId: string;
  settings: TeamSettings;
  testAccounts: Record<string, ClubTestAccount>;
}

const AVANTE_SETTINGS: TeamSettings = {
  teamName: 'AVANTE JAPAN',
  tagline: 'サッカークラブ',
  primaryColor: '#1A3C5E',
  accentColor: '#E8A020',
  logoType: 'initials',
  logoValue: 'AJ',
  scheduleCategories: ['練習', 'トレーニングマッチ', '招待大会', '公式戦'],
  scheduleGroups: ['1年園児', '2年', '3年', '4年', 'サテライト', 'トップ'],
};

const SAKURA_SETTINGS: TeamSettings = {
  teamName: 'スポーツクラブ桜',
  tagline: 'バスケットボールクラブ',
  primaryColor: '#7F0000',
  accentColor: '#FFB300',
  logoType: 'emoji',
  logoValue: '🌸',
  scheduleCategories: ['練習', '練習試合', '公式戦'],
  scheduleGroups: ['ミニバス', 'U-15', 'U-18', 'シニア'],
};

const HOKUSEI_SETTINGS: TeamSettings = {
  teamName: 'アカデミー北星',
  tagline: '総合スポーツクラブ',
  primaryColor: '#1B5E20',
  accentColor: '#8BC34A',
  logoType: 'emoji',
  logoValue: '⭐',
  scheduleCategories: ['練習', '練習試合', '大会'],
  scheduleGroups: ['幼児クラス', '小学生低学年', '小学生高学年', '中学生'],
};

const INITIAL_CLUBS: ClubData[] = [
  {
    clubId: 'AVANTE-001',
    settings: AVANTE_SETTINGS,
    testAccounts: {
      'player@avante.jp':  { password: 'player123', role: 'member',  name: 'テスト会員' },
      'coach@avante.jp':   { password: 'coach123',  role: 'coach',   name: '指導者' },
      'manager@avante.jp': { password: 'manager123', role: 'manager', name: '管理者' },
    },
  },
  {
    clubId: 'SAKURA-002',
    settings: SAKURA_SETTINGS,
    testAccounts: {
      'player@sakura.jp':  { password: 'player123', role: 'member',  name: 'テスト会員' },
      'coach@sakura.jp':   { password: 'coach123',  role: 'coach',   name: '指導者' },
      'manager@sakura.jp': { password: 'manager123', role: 'manager', name: '管理者' },
    },
  },
  {
    clubId: 'HOKUSEI-003',
    settings: HOKUSEI_SETTINGS,
    testAccounts: {
      'player@hokusei.jp':  { password: 'player123', role: 'member',  name: 'テスト会員' },
      'coach@hokusei.jp':   { password: 'coach123',  role: 'coach',   name: '指導者' },
      'manager@hokusei.jp': { password: 'manager123', role: 'manager', name: '管理者' },
    },
  },
];

interface ClubContextType {
  clubs: Record<string, ClubData>;
  currentClubId: string | null;
  currentClub: ClubData | null;
  /** Returns true if club found and selected, false if ID not found */
  selectClub: (clubId: string) => boolean;
  updateCurrentSettings: (patch: Partial<TeamSettings>) => void;
  /** Manager renames their own Club ID. Returns error string or null on success. */
  updateClubId: (newId: string) => string | null;
}

const ClubContext = createContext<ClubContextType>({
  clubs: {},
  currentClubId: null,
  currentClub: null,
  selectClub: () => false,
  updateCurrentSettings: () => {},
  updateClubId: () => 'Not initialized',
});

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const [clubs, setClubs] = useState<Record<string, ClubData>>(
    Object.fromEntries(INITIAL_CLUBS.map(c => [c.clubId, c]))
  );
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);

  const currentClub = currentClubId ? (clubs[currentClubId] ?? null) : null;

  const selectClub = (clubId: string): boolean => {
    const normalized = clubId.trim().toUpperCase();
    if (!clubs[normalized]) return false;
    setCurrentClubId(normalized);
    return true;
  };

  const updateCurrentSettings = (patch: Partial<TeamSettings>) => {
    if (!currentClubId) return;
    setClubs(prev => ({
      ...prev,
      [currentClubId]: {
        ...prev[currentClubId],
        settings: { ...prev[currentClubId].settings, ...patch },
      },
    }));
  };

  const updateClubId = (newId: string): string | null => {
    if (!currentClubId) return 'クラブが選択されていません';
    const trimmed = newId.trim().toUpperCase();
    if (!trimmed) return 'IDを入力してください';
    if (trimmed.length < 3) return 'IDは3文字以上で設定してください';
    if (trimmed === currentClubId) return null; // no change needed
    if (clubs[trimmed]) return 'このIDはすでに使用されています';

    const updated: ClubData = { ...clubs[currentClubId], clubId: trimmed };
    setClubs(prev => {
      const next = { ...prev };
      delete next[currentClubId];
      next[trimmed] = updated;
      return next;
    });
    setCurrentClubId(trimmed);
    return null;
  };

  return (
    <ClubContext.Provider value={{
      clubs, currentClubId, currentClub,
      selectClub, updateCurrentSettings, updateClubId,
    }}>
      {children}
    </ClubContext.Provider>
  );
}

export const useClub = () => useContext(ClubContext);
