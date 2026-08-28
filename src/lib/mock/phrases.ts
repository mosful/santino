export type Phrase = {
  id: number;
  category: string;
  tags: string[];
  text: string;
};

export const PHRASE_CATEGORIES = [
  "照顧重點",
  "關懷片語",
  "衛教說明",
  "傷口照護",
  "飲食指導",
];

export const SEED_PHRASES: Phrase[] = [
  { id: 1, category: "照顧重點", tags: ["傷口", "產後"], text: "傷口照護、觀察惡露量與顏色變化" },
  { id: 2, category: "關懷片語", tags: ["母乳", "心情"], text: "媽媽今日精神狀況良好，寶寶哺乳順利" },
  { id: 3, category: "衛教說明", tags: ["母乳", "哺育"], text: "親餵時注意寶寶含乳姿勢，避免乳頭破皮" },
  { id: 4, category: "傷口照護", tags: ["會陰", "傷口"], text: "會陰傷口每日溫水坐浴兩次，觀察有無紅腫滲液" },
  { id: 5, category: "飲食指導", tags: ["飲食", "禁忌"], text: "產後初期避免生冷、辛辣及過度油膩飲食" },
];
