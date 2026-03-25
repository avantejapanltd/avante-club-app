import React, { createContext, useContext } from 'react';
import { useClub } from './ClubContext';

export interface TeamSettings {
  teamName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  logoType: 'initials' | 'emoji';
  logoValue: string;
  scheduleCategories: string[];
  scheduleGroups: string[];
}

export const COLOR_THEMES = [
  { name: 'ネイビー',    primary: '#1A3C5E', accent: '#E8A020' },
  { name: 'フォレスト',  primary: '#1B5E20', accent: '#8BC34A' },
  { name: 'クリムゾン',  primary: '#7F0000', accent: '#FFB300' },
  { name: 'パープル',    primary: '#4A148C', accent: '#E040FB' },
  { name: 'ティール',    primary: '#004D40', accent: '#1DE9B6' },
  { name: 'チャコール',  primary: '#212121', accent: '#FF5722' },
  { name: 'ロイヤル',    primary: '#0D47A1', accent: '#FFC107' },
  { name: 'ナイト',      primary: '#0A0A0B', accent: '#C8FF00' },
];

export const SPORT_EMOJIS = [
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥊',
  '🥋', '🏒', '🏓', '🏸', '🤺', '🏋️', '🚴', '🏊',
  '⛹️', '🏆', '🥇', '🎯', '🌟', '🔥', '⚡', '🦁',
];

// Fallback used only if somehow rendered outside ClubProvider
const FALLBACK: TeamSettings = {
  teamName: 'CLUB APP',
  tagline: 'スポーツクラブ',
  primaryColor: '#1A3C5E',
  accentColor: '#E8A020',
  logoType: 'initials',
  logoValue: 'CA',
  scheduleCategories: ['練習', '公式戦'],
  scheduleGroups: ['全体'],
};

interface TeamContextType {
  settings: TeamSettings;
  updateSettings: (patch: Partial<TeamSettings>) => void;
}

const TeamContext = createContext<TeamContextType>({
  settings: FALLBACK,
  updateSettings: () => {},
});

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { currentClub, updateCurrentSettings } = useClub();
  const settings = currentClub?.settings ?? FALLBACK;

  return (
    <TeamContext.Provider value={{ settings, updateSettings: updateCurrentSettings }}>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);
