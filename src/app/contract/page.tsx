import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import { MODULES, type SubItem } from "@/lib/modules";
import ContractList from "./tabs/ContractList";
import NewContract from "./tabs/NewContract";
import ContractTerms from "./tabs/ContractTerms";
import ContractTemplates from "./tabs/ContractTemplates";
import RenewalManagement from "./tabs/RenewalManagement";
import TerminationManagement from "./tabs/TerminationManagement";
import SignStatusDashboard from "./tabs/SignStatusDashboard";
import ContractChangeOrder from "./tabs/ContractChangeOrder";
import ChildcareContract from "./tabs/ChildcareContract";

/**
 * key → 頁籤內容。
 *
 * ⚠️ 「有哪些頁籤、叫什麼、哪些已下架」一律以 `lib/modules.ts` 的模組 12
 * subItems 為準，這裡只回答「這個 key 要渲染什麼」。
 */
function contractTabContent(key: string) {
  switch (key) {
    case "list":
      return <ContractList />;
    case "terms":
      return <ContractTerms />;
    case "childcare":
      return <ChildcareContract />;
    case "new":
      return <NewContract />;
    case "templates":
      return <ContractTemplates />;
    case "renewal":
      return <RenewalManagement />;
    case "termination":
      return <TerminationManagement />;
    case "sign-status":
      return <SignStatusDashboard />;
    case "change-order":
      return <ContractChangeOrder />;
    default:
      return null;
  }
}

const SUB_ITEMS = MODULES.find((m) => m.no === "12")?.subItems ?? [];
const toTab = (item: SubItem) => ({ key: item.key, label: item.label, content: contractTabContent(item.key) });

/**
 * 合約與付款。
 *
 * ⚠️ 這一頁**不是簽約的地方**，簽約在案件流程。這裡只做案件做不到的事：
 * 查歷史合約、看條款版本、托嬰另立合約。
 * 原本頁首有一張大卡寫著「合約作業已整合進案件流程」、底下卻仍排著九個頁籤
 * （含「新增合約」），自己打自己的臉——客戶回報「合約管理太多入口」正是指這個。
 */
export default function ContractPage() {
  return (
    <div className="page-frame">
      <RequireAccess moduleNo="12">
        <PageHeader title="合約與付款" moduleNo="12" />
        <p className="mb-4 text-sm text-stone-500">
          簽約、收款、變更與入住請由「案件流程」同一案件接續辦理，避免重複建檔；本頁用於查詢既有合約與條款。
        </p>
        <TabsFromUrl
          tabs={SUB_ITEMS.filter((item) => !item.hidden).map(toTab)}
          // 下架的頁籤不列，但保留 /contract/?tab=xxx 直達，供舊連結與內部查閱使用。
          deepLinkTabs={SUB_ITEMS.filter((item) => item.hidden).map(toTab)}
        />
      </RequireAccess>
    </div>
  );
}
