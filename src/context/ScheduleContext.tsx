import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ScheduleItem {
  id: string;
  group: string;
  date: Date;
  title: string;
  opponent: string;
  startTime: Date;
  endTime: Date;
  location: string;
  memo: string;
  presentCount: number;
  absentCount: number;
  maybeCount: number;
  totalMembers: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'maybe';

export interface AttendanceResponse {
  scheduleId: string;
  userEmail: string;
  userName: string;
  userRole: 'member' | 'coach';
  status: AttendanceStatus;
}

export type TransportType = 'driver' | 'rider' | 'direct';

export interface CarpoolEntry {
  scheduleId: string;
  userEmail: string;
  userName: string;
  type: TransportType;
  capacity?: number; // drivers only: number of passengers they can take
}

export interface CarpoolAssignment {
  driverEmail: string;
  driverName: string;
  capacity: number;
  passengers: { email: string; name: string }[];
}

export interface CarpoolPost {
  id: string;
  scheduleId: string;
  driverEmail: string;
  driverName: string;
  pickupTime: string;
  pickupLocation: string;
  postedAt: Date;
}

function makeDate(y: number, m: number, d: number) {
  return new Date(y, m - 1, d);
}
function makeTime(h: number, min: number) {
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d;
}

const INITIAL_SCHEDULES: ScheduleItem[] = [
  { id: '1', group: '1年園児', date: makeDate(2026, 3, 25), title: '練習', opponent: '', startTime: makeTime(15, 0), endTime: makeTime(16, 0), location: '○○体育館', memo: '', presentCount: 8, absentCount: 2, maybeCount: 1, totalMembers: 12 },
  { id: '2', group: '2年', date: makeDate(2026, 3, 25), title: '練習', opponent: '', startTime: makeTime(16, 0), endTime: makeTime(17, 30), location: '○○体育館', memo: '', presentCount: 10, absentCount: 1, maybeCount: 2, totalMembers: 15 },
  { id: '3', group: '3年', date: makeDate(2026, 3, 25), title: '練習', opponent: '', startTime: makeTime(17, 30), endTime: makeTime(19, 0), location: '○○スポーツセンター', memo: '', presentCount: 7, absentCount: 3, maybeCount: 0, totalMembers: 14 },
  { id: '4', group: '3年', date: makeDate(2026, 3, 29), title: '公式戦', opponent: '○○FC', startTime: makeTime(10, 0), endTime: makeTime(15, 0), location: '△△グラウンド', memo: '雨天中止の場合は前日連絡', presentCount: 5, absentCount: 2, maybeCount: 7, totalMembers: 14 },
  { id: '5', group: '4年', date: makeDate(2026, 3, 26), title: '練習', opponent: '', startTime: makeTime(17, 30), endTime: makeTime(19, 0), location: '○○スポーツセンター', memo: '', presentCount: 9, absentCount: 0, maybeCount: 3, totalMembers: 13 },
  { id: '6', group: 'サテライト', date: makeDate(2026, 3, 27), title: '練習', opponent: '', startTime: makeTime(18, 0), endTime: makeTime(20, 0), location: '△△アリーナ', memo: '', presentCount: 12, absentCount: 2, maybeCount: 1, totalMembers: 16 },
  { id: '7', group: 'トップ', date: makeDate(2026, 3, 25), title: '練習', opponent: '', startTime: makeTime(19, 0), endTime: makeTime(21, 0), location: '○○スポーツセンター', memo: '', presentCount: 7, absentCount: 1, maybeCount: 2, totalMembers: 10 },
  { id: '8', group: 'トップ', date: makeDate(2026, 3, 29), title: '公式戦', opponent: '△△クラブ', startTime: makeTime(13, 0), endTime: makeTime(17, 0), location: '□□競技場', memo: 'ユニフォーム着用必須', presentCount: 6, absentCount: 1, maybeCount: 3, totalMembers: 10 },
];

// ─────────────────────────────────────────────────────────────
// AVANTE トップチーム デモ用 10アカウント
// ─────────────────────────────────────────────────────────────
const DEMO_MEMBERS = [
  { email: 'yamada@avante.jp',    name: '山田 太郎' },
  { email: 'suzuki@avante.jp',    name: '鈴木 健太' },
  { email: 'tanaka@avante.jp',    name: '田中 翔'   },
  { email: 'sato@avante.jp',      name: '佐藤 勇気' },
  { email: 'takahashi@avante.jp', name: '高橋 龍'   },
  { email: 'ito@avante.jp',       name: '伊藤 海斗' },
  { email: 'watanabe@avante.jp',  name: '渡辺 大輝' },
  { email: 'kobayashi@avante.jp', name: '小林 颯'   },
  { email: 'nakamura@avante.jp',  name: '中村 蓮'   },
  { email: 'kato@avante.jp',      name: '加藤 凌'   },
] as const;

// スケジュール '7'（練習 3/25）の出欠回答
// 参加7・欠席1・未定2
const DEMO_ATTENDANCE_S7: AttendanceResponse[] = [
  { scheduleId: '7', userEmail: 'yamada@avante.jp',    userName: '山田 太郎', userRole: 'member', status: 'present' },
  { scheduleId: '7', userEmail: 'suzuki@avante.jp',    userName: '鈴木 健太', userRole: 'member', status: 'present' },
  { scheduleId: '7', userEmail: 'tanaka@avante.jp',    userName: '田中 翔',   userRole: 'member', status: 'present' },
  { scheduleId: '7', userEmail: 'sato@avante.jp',      userName: '佐藤 勇気', userRole: 'member', status: 'present' },
  { scheduleId: '7', userEmail: 'takahashi@avante.jp', userName: '高橋 龍',   userRole: 'member', status: 'present' },
  { scheduleId: '7', userEmail: 'watanabe@avante.jp',  userName: '渡辺 大輝', userRole: 'member', status: 'present' },
  { scheduleId: '7', userEmail: 'kato@avante.jp',      userName: '加藤 凌',   userRole: 'member', status: 'present' },
  { scheduleId: '7', userEmail: 'kobayashi@avante.jp', userName: '小林 颯',   userRole: 'member', status: 'absent'  },
  { scheduleId: '7', userEmail: 'ito@avante.jp',       userName: '伊藤 海斗', userRole: 'member', status: 'maybe'   },
  { scheduleId: '7', userEmail: 'nakamura@avante.jp',  userName: '中村 蓮',   userRole: 'member', status: 'maybe'   },
];

// スケジュール '8'（公式戦 3/29 vs △△クラブ）の出欠回答
// 参加6・欠席1・未定3
const DEMO_ATTENDANCE_S8: AttendanceResponse[] = [
  { scheduleId: '8', userEmail: 'yamada@avante.jp',    userName: '山田 太郎', userRole: 'member', status: 'present' },
  { scheduleId: '8', userEmail: 'suzuki@avante.jp',    userName: '鈴木 健太', userRole: 'member', status: 'present' },
  { scheduleId: '8', userEmail: 'tanaka@avante.jp',    userName: '田中 翔',   userRole: 'member', status: 'present' },
  { scheduleId: '8', userEmail: 'sato@avante.jp',      userName: '佐藤 勇気', userRole: 'member', status: 'present' },
  { scheduleId: '8', userEmail: 'takahashi@avante.jp', userName: '高橋 龍',   userRole: 'member', status: 'present' },
  { scheduleId: '8', userEmail: 'watanabe@avante.jp',  userName: '渡辺 大輝', userRole: 'member', status: 'present' },
  { scheduleId: '8', userEmail: 'kobayashi@avante.jp', userName: '小林 颯',   userRole: 'member', status: 'absent'  },
  { scheduleId: '8', userEmail: 'ito@avante.jp',       userName: '伊藤 海斗', userRole: 'member', status: 'maybe'   },
  { scheduleId: '8', userEmail: 'nakamura@avante.jp',  userName: '中村 蓮',   userRole: 'member', status: 'maybe'   },
  { scheduleId: '8', userEmail: 'kato@avante.jp',      userName: '加藤 凌',   userRole: 'member', status: 'maybe'   },
];

const INITIAL_ATTENDANCE_RESPONSES: AttendanceResponse[] = [
  ...DEMO_ATTENDANCE_S7,
  ...DEMO_ATTENDANCE_S8,
];

// 公式戦 '8' の乗り合わせ
// 山田（3人乗り）→ 田中・佐藤・高橋
// 鈴木（2人乗り）→ 渡辺
// 伊藤・中村・加藤 → まだ未回答（未定のため）
const INITIAL_CARPOOL_ENTRIES: CarpoolEntry[] = [
  { scheduleId: '8', userEmail: 'yamada@avante.jp',    userName: '山田 太郎', type: 'driver', capacity: 3 },
  { scheduleId: '8', userEmail: 'suzuki@avante.jp',    userName: '鈴木 健太', type: 'driver', capacity: 2 },
  { scheduleId: '8', userEmail: 'tanaka@avante.jp',    userName: '田中 翔',   type: 'rider'  },
  { scheduleId: '8', userEmail: 'sato@avante.jp',      userName: '佐藤 勇気', type: 'rider'  },
  { scheduleId: '8', userEmail: 'takahashi@avante.jp', userName: '高橋 龍',   type: 'rider'  },
  { scheduleId: '8', userEmail: 'watanabe@avante.jp',  userName: '渡辺 大輝', type: 'rider'  },
];

const INITIAL_CARPOOL_POSTS: CarpoolPost[] = [
  {
    id: 'post-1',
    scheduleId: '8',
    driverEmail: 'yamada@avante.jp',
    driverName: '山田 太郎',
    pickupTime: '12:00',
    pickupLocation: '△△駅 北口',
    postedAt: new Date(2026, 2, 28, 20, 15),
  },
  {
    id: 'post-2',
    scheduleId: '8',
    driverEmail: 'suzuki@avante.jp',
    driverName: '鈴木 健太',
    pickupTime: '12:30',
    pickupLocation: '○○公園前 バス停',
    postedAt: new Date(2026, 2, 28, 21, 3),
  },
];

interface ScheduleContextType {
  schedules: ScheduleItem[];
  addSchedule: (s: Omit<ScheduleItem, 'id' | 'presentCount' | 'absentCount' | 'maybeCount' | 'totalMembers'>) => void;
  updateSchedule: (id: string, s: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;
  carpoolEntries: CarpoolEntry[];
  setCarpoolEntry: (entry: CarpoolEntry) => void;
  removeCarpoolEntry: (scheduleId: string, userEmail: string) => void;
  getCarpoolForSchedule: (scheduleId: string) => { entries: CarpoolEntry[]; assignments: CarpoolAssignment[] };
  carpoolPosts: CarpoolPost[];
  addCarpoolPost: (post: Omit<CarpoolPost, 'id' | 'postedAt'>) => void;
  deleteCarpoolPost: (postId: string) => void;
  getCarpoolPostsForSchedule: (scheduleId: string) => CarpoolPost[];
  attendanceResponses: AttendanceResponse[];
  setAttendanceResponse: (res: AttendanceResponse) => void;
  removeAttendanceResponse: (scheduleId: string, userEmail: string) => void;
  getAttendanceForSchedule: (scheduleId: string) => AttendanceResponse[];
}

const ScheduleContext = createContext<ScheduleContextType>({
  schedules: [],
  addSchedule: () => {},
  updateSchedule: () => {},
  deleteSchedule: () => {},
  carpoolEntries: [],
  setCarpoolEntry: () => {},
  removeCarpoolEntry: () => {},
  getCarpoolForSchedule: () => ({ entries: [], assignments: [] }),
  carpoolPosts: [],
  addCarpoolPost: () => {},
  deleteCarpoolPost: () => {},
  getCarpoolPostsForSchedule: () => [],
  attendanceResponses: [],
  setAttendanceResponse: () => {},
  removeAttendanceResponse: () => {},
  getAttendanceForSchedule: () => [],
});

function buildCarpoolAssignments(entries: CarpoolEntry[]): CarpoolAssignment[] {
  const drivers = entries
    .filter(e => e.type === 'driver')
    .sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));
  const riders = entries.filter(e => e.type === 'rider');

  const assignments: CarpoolAssignment[] = drivers.map(d => ({
    driverEmail: d.userEmail,
    driverName: d.userName,
    capacity: d.capacity ?? 0,
    passengers: [],
  }));

  const unassigned = [...riders];
  for (const assignment of assignments) {
    while (assignment.passengers.length < assignment.capacity && unassigned.length > 0) {
      const rider = unassigned.shift()!;
      assignment.passengers.push({ email: rider.userEmail, name: rider.userName });
    }
  }

  return assignments;
}

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);
  const [carpoolEntries, setCarpoolEntries] = useState<CarpoolEntry[]>(INITIAL_CARPOOL_ENTRIES);
  const [carpoolPosts, setCarpoolPosts] = useState<CarpoolPost[]>(INITIAL_CARPOOL_POSTS);
  const [attendanceResponses, setAttendanceResponses] = useState<AttendanceResponse[]>(INITIAL_ATTENDANCE_RESPONSES);

  const addSchedule = (s: Omit<ScheduleItem, 'id' | 'presentCount' | 'absentCount' | 'maybeCount' | 'totalMembers'>) => {
    setSchedules(prev => [...prev, {
      ...s,
      id: String(Date.now()),
      presentCount: 0, absentCount: 0, maybeCount: 0, totalMembers: 0,
    }]);
  };

  const updateSchedule = (id: string, s: Partial<ScheduleItem>) => {
    setSchedules(prev => prev.map(item => item.id === id ? { ...item, ...s } : item));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(item => item.id !== id));
  };

  const setCarpoolEntry = (entry: CarpoolEntry) => {
    setCarpoolEntries(prev => {
      const filtered = prev.filter(
        e => !(e.scheduleId === entry.scheduleId && e.userEmail === entry.userEmail)
      );
      return [...filtered, entry];
    });
  };

  const removeCarpoolEntry = (scheduleId: string, userEmail: string) => {
    setCarpoolEntries(prev =>
      prev.filter(e => !(e.scheduleId === scheduleId && e.userEmail === userEmail))
    );
  };

  const getCarpoolForSchedule = useCallback((scheduleId: string) => {
    const entries = carpoolEntries.filter(e => e.scheduleId === scheduleId);
    const assignments = buildCarpoolAssignments(entries);
    return { entries, assignments };
  }, [carpoolEntries]);

  const addCarpoolPost = (post: Omit<CarpoolPost, 'id' | 'postedAt'>) => {
    setCarpoolPosts(prev => [...prev, { ...post, id: String(Date.now()), postedAt: new Date() }]);
  };

  const deleteCarpoolPost = (postId: string) => {
    setCarpoolPosts(prev => prev.filter(p => p.id !== postId));
  };

  const getCarpoolPostsForSchedule = useCallback((scheduleId: string) => {
    return carpoolPosts.filter(p => p.scheduleId === scheduleId);
  }, [carpoolPosts]);

  const setAttendanceResponse = (res: AttendanceResponse) => {
    setAttendanceResponses(prev => {
      const filtered = prev.filter(
        r => !(r.scheduleId === res.scheduleId && r.userEmail === res.userEmail)
      );
      return [...filtered, res];
    });
  };

  const removeAttendanceResponse = (scheduleId: string, userEmail: string) => {
    setAttendanceResponses(prev =>
      prev.filter(r => !(r.scheduleId === scheduleId && r.userEmail === userEmail))
    );
  };

  const getAttendanceForSchedule = useCallback((scheduleId: string) => {
    return attendanceResponses.filter(r => r.scheduleId === scheduleId);
  }, [attendanceResponses]);

  return (
    <ScheduleContext.Provider value={{
      schedules, addSchedule, updateSchedule, deleteSchedule,
      carpoolEntries, setCarpoolEntry, removeCarpoolEntry, getCarpoolForSchedule,
      carpoolPosts, addCarpoolPost, deleteCarpoolPost, getCarpoolPostsForSchedule,
      attendanceResponses, setAttendanceResponse, removeAttendanceResponse, getAttendanceForSchedule,
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export const useSchedule = () => useContext(ScheduleContext);
