import { Suspense } from "react";
import WorkspaceEntry from "@/components/babycam/WorkspaceEntry";

export default function BabycamWorkspacePage() { return <Suspense fallback={<p className="p-4">載入視訊工作區…</p>}><WorkspaceEntry /></Suspense>; }
