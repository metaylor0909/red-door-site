import type { ScenarioLabel } from "../../lib/rent-reduction/model";

// Validated with the dataviz palette checker against a white surface. No
// scenario gets "bad" red or "good" green: the colors identify, they don't judge.
export const SCENARIO_COLOR: Record<ScenarioLabel, string> = {
  Current: "#2563eb",
  "Owner Adjusted": "#bc1719",
  Aggressive: "#b45309",
};

export const SCENARIO_NAME: Record<ScenarioLabel, string> = {
  Current: "Hold current rent",
  "Owner Adjusted": "Your reduction",
  Aggressive: "Deeper cut",
};
