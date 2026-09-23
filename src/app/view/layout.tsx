/**
 * 對外觀看頁的版面：媽媽端與親友端是給手機開的獨立頁面，
 * 不套院務系統的 AppShell（無側邊欄、無角色切換、無 Phase 切換）。
 * AppShell 以路徑前綴判斷，見 components/layout/AppShell.tsx。
 */
export default function ViewLayout(props: LayoutProps<"/view">) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 sm:py-10">{props.children}</div>
  );
}
