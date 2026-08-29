/**
 * 假資料產生工具：使用固定種子的決定性亂數（非 Math.random()），
 * 確保 output:"export" 靜態匯出時 build 階段與瀏覽器 hydrate 階段算出同一組資料，
 * 避免 React hydration mismatch。
 */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed: number) {
  const rand = mulberry32(seed);
  return {
    next: () => rand(),
    int(min: number, max: number) {
      return min + Math.floor(rand() * (max - min + 1));
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(rand() * arr.length)];
    },
    bool(pTrue = 0.5) {
      return rand() < pTrue;
    },
  };
}

export const SURNAMES = [
  "陳", "林", "黃", "張", "李", "王", "吳", "劉", "蔡", "楊",
  "許", "鄭", "謝", "洪", "邱", "曾", "廖", "賴", "徐", "周",
  "葉", "蘇", "莊", "呂", "江", "何", "蕭", "羅", "高", "潘",
];
const GIVEN = [
  "乾", "臻", "雅", "婷", "如", "真", "美", "芳", "玲", "雯",
  "君", "萍", "慧", "娟", "蓉", "琪", "涵", "蓁", "瑄", "彤",
  "翰", "凱", "宇", "軒", "睿", "廷", "皓",
];

export function maskedName(rng: ReturnType<typeof makeRng>) {
  return `${rng.pick(SURNAMES)}o${rng.pick(GIVEN)}`;
}

/** 洗牌（Fisher-Yates），使用同一顆決定性亂數種子 */
export function shuffle<T>(rng: ReturnType<typeof makeRng>, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 產生「本次呼叫皆不重複」的姓名產生器：候選池夠大（姓氏×名字約810種組合）時
 * 直接用「已出現過就重抽」保證不重複；exclude可排除已被精選範例佔用的姓名。
 */
export function makeUniqueNameGenerator(rng: ReturnType<typeof makeRng>, exclude: readonly string[] = []) {
  const used = new Set(exclude);
  return function next(): string {
    let name = maskedName(rng);
    let guard = 0;
    while (used.has(name) && guard < 1000) {
      name = maskedName(rng);
      guard++;
    }
    used.add(name);
    return name;
  };
}

/**
 * 候選池較小、需求數量可能超過池大小的情境（如講師/醫師姓名）：
 * 洗牌後依序取用，池用完會重新洗牌進入「第2輪」，並在名稱後附加輪次避免完全重複字串。
 */
export function makeCycler<T>(rng: ReturnType<typeof makeRng>, candidates: readonly T[]) {
  let shuffled = shuffle(rng, candidates);
  let i = 0;
  let round = 1;
  return function next(): { value: T; round: number } {
    if (i >= shuffled.length) {
      i = 0;
      round++;
      shuffled = shuffle(rng, candidates);
    }
    const value = shuffled[i];
    i++;
    return { value, round };
  };
}

export function phoneNumber(rng: ReturnType<typeof makeRng>) {
  return `09${rng.int(10, 99)}-${rng.int(100, 999)}-${rng.int(100, 999)}`;
}

/** 依 baseISO 為起點加上 offsetDays 天，回傳 YYYY-MM-DD */
export function addDays(baseISO: string, offsetDays: number) {
  const d = new Date(baseISO + "T00:00:00");
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}
