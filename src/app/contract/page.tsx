import Tabs from "@/components/ui/Tabs";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import ContractList from "./tabs/ContractList";
import NewContract from "./tabs/NewContract";
import ContractTerms from "./tabs/ContractTerms";

const NEW_PLANNED = [
  "合約範本管理",
  "續約管理",
  "退約／作廢管理",
  "合約簽署狀態總覽",
  "合約變更單（收費/房型/天數異動，需選單化＋留log）",
];

const NOT_NOW = ["入住指導單", "入住當天繳費通知單", "寶寶脫離合約（托嬰邏輯已確認：另立新合約＋以車號識別）", "簽核流程（明確排除）"];

export default function ContractPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-lg font-bold">12. 合約管理</h1>
      <Tabs
        tabs={[
          { key: "list", label: "合約查詢與列表", content: <ContractList /> },
          { key: "new", label: "新增合約", content: <NewContract /> },
          { key: "terms", label: "合約條款檢視", content: <ContractTerms /> },
          {
            key: "planned",
            label: "新規劃項目",
            content: (
              <PlaceholderNotice
                text={"以下為全新規劃、無截圖可對照，待建置：" + NEW_PLANNED.join("／")}
              />
            ),
          },
        ]}
      />
      <div className="mt-6 rounded border border-dashed border-slate-300 p-3 text-xs text-slate-400">
        本階段不做／明確排除：{NOT_NOW.join("、")}
      </div>
    </div>
  );
}
