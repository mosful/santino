"use client";

import { useSearchParams } from "next/navigation";
import BabycamWorkspace from "./BabycamWorkspace";

export default function WorkspaceEntry() {
  const params = useSearchParams(); const bindingId = params.get("binding") ?? ""; const section = params.get("section") ?? "registration";
  return <BabycamWorkspace key={`${bindingId}:${section}`} initialBindingId={bindingId} initialSection={section} />;
}
