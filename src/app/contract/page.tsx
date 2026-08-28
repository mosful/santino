import Tabs from "@/components/ui/Tabs";
import ContractList from "./tabs/ContractList";
import NewContract from "./tabs/NewContract";
import ContractTerms from "./tabs/ContractTerms";
import ContractTemplates from "./tabs/ContractTemplates";
import RenewalManagement from "./tabs/RenewalManagement";
import TerminationManagement from "./tabs/TerminationManagement";
import SignStatusDashboard from "./tabs/SignStatusDashboard";
import ContractChangeOrder from "./tabs/ContractChangeOrder";

const NOT_NOW = [
  "入住指導單",
  "入住當天繳費通知單",
  "寶寶脫離合約（托嬰邏輯已確認：另立新合約＋以車號識別）",
  "簽核流程（明確排除）",
];

export default function ContractPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-lg font-bold">12. 合約管理</h1>
      <Tabs
        tabs={[
          { key: "list", label: "合約查詢與列表", content: <ContractList /> },
          { key: "new", label: "新增合約", content: <NewContract /> },
          { key: "terms", label: "合約條款檢視", content: <ContractTerms /> },
          { key: "templates", label: "合約範本管理", content: <ContractTemplates /> },
          { key: "renewal", label: "續約管理", content: <RenewalManagement /> },
          { key: "termination", label: "退約／作廢管理", content: <TerminationManagement /> },
          { key: "sign-status", label: "合約簽署狀態總覽", content: <SignStatusDashboard /> },
          { key: "change-order", label: "合約變更單", content: <ContractChangeOrder /> },
        ]}
      />
      <div className="mt-6 rounded border border-dashed border-slate-300 p-3 text-xs text-slate-400">
        本階段不做／明確排除：{NOT_NOW.join("、")}
      </div>
    </div>
  );
}
