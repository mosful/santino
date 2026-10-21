import {
  LayoutDashboard,
  HeartPulse,
  Baby,
  BedDouble,
  Users,
  Stethoscope,
  PhoneCall,
  BarChart3,
  UtensilsCrossed,
  IdCard,
  FileSignature,
  GraduationCap,
  MessageCircle,
  Settings,
  Cctv,
  ListTodo,
  ClipboardList,
  UserRoundSearch,
  Bed,
  Tags,
  SlidersHorizontal,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export const MODULE_ICONS: Record<string, LucideIcon> = {
  "0": ListTodo,
  "1": LayoutDashboard,
  "2": HeartPulse,
  "3": Baby,
  "4": BedDouble,
  "5": Users,
  "6": Stethoscope,
  "7": PhoneCall,
  "8": BarChart3,
  "9": UtensilsCrossed,
  "10": IdCard,
  "12": FileSignature,
  "13": GraduationCap,
  "14": MessageCircle,
  "15": Settings,
  "17": Cctv,
};

/**
 * 側邊欄第二層的圖示，`lib/modules.ts` 的 `SubItem.iconKey` 對應到這裡。
 *
 * ⚠️ 寶寶視訊那四個刻意與 `components/babycam/BabycamUi.tsx` 的 `GROUP_ICONS`
 * 用同一組圖示——同一個群組在選單與工作區內要長一樣，不要各挑各的。
 */
export const SUB_ICONS: Record<string, LucideIcon> = {
  cases: ClipboardList,
  customer: UserRoundSearch,
  care: PhoneCall,
  "babycam-01": Bed,
  "babycam-02": Tags,
  "babycam-04": SlidersHorizontal,
  "babycam-08": Settings2,
};
