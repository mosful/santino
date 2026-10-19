export type DemoPhase = "normal" | "departing" | "care" | "returned" | "restored" | "fault";
export type DemoViewer = "idle" | "internal" | "family";

export type DemoScenario = {
  phase: DemoPhase;
  viewer: DemoViewer;
  abnormalSamples: number;
  departedAt: number | null;
};

export type DemoScenarioAction =
  | { type: "reset" }
  | { type: "view"; viewer: DemoViewer }
  | { type: "cart-away"; now: number }
  | { type: "tick"; now: number }
  | { type: "sample" }
  | { type: "cart-back" }
  | { type: "scan-return" }
  | { type: "fault" };

export const DEMO_AUTO_CARE_MS = 5_000;

export function initialDemoScenario(): DemoScenario {
  return { phase: "normal", viewer: "idle", abnormalSamples: 0, departedAt: null };
}

export function isDemoMasked(state: DemoScenario): boolean {
  return ["care", "returned", "fault"].includes(state.phase);
}

export function reduceDemoScenario(state: DemoScenario, action: DemoScenarioAction): DemoScenario {
  switch (action.type) {
    case "reset":
      return initialDemoScenario();
    case "view":
      return { ...state, viewer: action.viewer };
    case "cart-away":
      return { ...state, phase: "departing", abnormalSamples: 1, departedAt: action.now };
    case "tick":
      return state.phase === "departing" && state.departedAt !== null
        && action.now - state.departedAt >= DEMO_AUTO_CARE_MS
        ? { ...state, phase: "care", abnormalSamples: 3, departedAt: null }
        : state;
    case "sample": {
      if (state.phase !== "departing" && state.phase !== "fault") return state;
      const abnormalSamples = Math.min(3, state.abnormalSamples + 1);
      return {
        ...state,
        abnormalSamples,
        phase: abnormalSamples === 3 ? "care" : state.phase,
        departedAt: abnormalSamples === 3 ? null : state.departedAt,
      };
    }
    case "cart-back":
      return { ...state, phase: "returned", abnormalSamples: 3, departedAt: null };
    case "scan-return":
      return state.phase === "returned"
        ? { ...state, phase: "restored", abnormalSamples: 0, departedAt: null }
        : state;
    case "fault":
      return { ...state, phase: "fault", abnormalSamples: 1, departedAt: null };
  }
}
