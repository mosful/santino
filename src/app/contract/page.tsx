import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import ContractList from "./tabs/ContractList";
import NewContract from "./tabs/NewContract";
import ContractTerms from "./tabs/ContractTerms";
import ContractTemplates from "./tabs/ContractTemplates";
import RenewalManagement from "./tabs/RenewalManagement";
import TerminationManagement from "./tabs/TerminationManagement";
import SignStatusDashboard from "./tabs/SignStatusDashboard";
import ContractChangeOrder from "./tabs/ContractChangeOrder";
import ChildcareContract from "./tabs/ChildcareContract";

export default function ContractPage() {
  return (
    <div className="page-frame">
      <RequireAccess moduleNo="12">
      <PageHeader title="櫃台服務・合約與付款" moduleNo="12" />
      <section className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stone-300 bg-white p-4">
        <div><h2 className="font-semibold">合約作業已整合進案件七階段</h2><p className="mt-1 text-sm text-stone-600">新增預約、試算、下訂、審閱、簽名、付款、變更與入住 v2 請由同一案件接續，避免重複建檔。</p></div>
        <Link href="/cases/" className={buttonStyles({ variant: "primary", size: "lg" })}>前往案件流程</Link>
      </section>
      <TabsFromUrl
        tabs={[
          { key: "list", label: "合約查詢與列表", content: <ContractList /> },
          { key: "new", label: "新增合約", content: <NewContract /> },
          { key: "terms", label: "合約條款檢視", content: <ContractTerms /> },
          { key: "templates", label: "合約範本管理", content: <ContractTemplates /> },
          { key: "renewal", label: "續約管理", content: <RenewalManagement /> },
          { key: "termination", label: "退約／作廢管理", content: <TerminationManagement /> },
          { key: "sign-status", label: "合約簽署狀態總覽", content: <SignStatusDashboard /> },
          { key: "change-order", label: "合約變更單", content: <ContractChangeOrder /> },
          { key: "childcare", label: "寶寶留房／托嬰合約", content: <ChildcareContract /> },
        ]}
      />
      <div className="mt-6 rounded border border-dashed border-stone-300 p-3 text-xs text-stone-400">
        本頁保留既有合約查詢與管理工具；入住指導單、繳費通知單的紙本列印及完成狀態已移至案件「入住前」，電子簽核流程仍不在本次靜態原型範圍。
      </div>
      </RequireAccess>
    </div>
  );
}
import Link from "next/link";
import { buttonStyles } from "@/components/ui/buttonStyles";
