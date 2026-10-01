import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import StepProgress, {
  type SubProgress,
  type WizardStep,
} from "./StepProgress";
import {
  computeWealthProjection,
  WEALTH_DEFAULTS,
  type WealthInputs,
} from "../../lib/rent-vs-sell/wealthArchitect";
import IntakeStep, { type IntakeData } from "./IntakeStep";
import ScenarioDashboard from "./ScenarioDashboard";
import ExpertOverrides, { type OverrideValues } from "./ExpertOverrides";
import "./rent-vs-sell.css";

const STEPS: WizardStep[] = [
  { number: 1, label: "Tell Us About the Property" },
  { number: 2, label: "Your Wealth Map" },
];

const CURRENT_YEAR = new Date().getFullYear();

const INITIAL_INTAKE: IntakeData = {
  homeValue: 350_000,
  mortgageBalance: 220_000,
  mortgageRate: WEALTH_DEFAULTS.currentMortgageRate,
  mortgageYearsRemaining: WEALTH_DEFAULTS.currentMortgageTermYears,
  purchasePrice: 250_000,
  purchaseYear: CURRENT_YEAR - 5,
  monthlyRent: 2_400,
  altChoice: null,
  expectedReturn: WEALTH_DEFAULTS.expectedReturn,
  debtType: WEALTH_DEFAULTS.debtType,
  debtPayoff: WEALTH_DEFAULTS.debtPayoff,
};

const INITIAL_OVERRIDES: OverrideValues = {
  managementFeeRate: WEALTH_DEFAULTS.managementFeeRate,
  renewalRate: WEALTH_DEFAULTS.renewalRate,
  vacancyRate: WEALTH_DEFAULTS.vacancyRate,
  maintenanceRate: WEALTH_DEFAULTS.maintenanceRate,
  appreciationRate: WEALTH_DEFAULTS.appreciationRate,
  marginalTaxRate: WEALTH_DEFAULTS.marginalTaxRate,
  buildingValuePct: WEALTH_DEFAULTS.buildingValuePct,
  propertyTaxRate: WEALTH_DEFAULTS.propertyTaxRate,
  annualInsurance: WEALTH_DEFAULTS.annualInsurance,
  rentGrowthRate: WEALTH_DEFAULTS.rentGrowthRate,
  capitalGainsTaxRate: WEALTH_DEFAULTS.capitalGainsTaxRate,
  includeDepreciationRecapture: WEALTH_DEFAULTS.includeDepreciationRecapture,
};

export default function Wizard() {
  const [step, setStep] = useState<1 | 2>(1);
  const [intake, setIntake] = useState<IntakeData>(INITIAL_INTAKE);
  const [subProgress, setSubProgress] = useState<SubProgress | null>(null);
  const [overrides, setOverrides] =
    useState<OverrideValues>(INITIAL_OVERRIDES);

  const updateIntake = useCallback((patch: Partial<IntakeData>) => {
    setIntake((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateOverrides = useCallback((patch: Partial<WealthInputs>) => {
    setOverrides((prev) => ({ ...prev, ...patch }));
  }, []);

  const wealthInputs: WealthInputs = useMemo(
    () => ({
      homeValue: intake.homeValue,
      mortgageBalance: intake.mortgageBalance,
      monthlyRent: intake.monthlyRent,
      purchasePrice: intake.purchasePrice,
      yearsOwned: Math.max(0, CURRENT_YEAR - intake.purchaseYear),
      altChoice: intake.altChoice ?? "not-sure",
      expectedReturn: intake.expectedReturn,
      debtType: intake.debtType,
      debtPayoff: intake.debtPayoff,
      ...overrides,
      depreciationRecaptureRate: WEALTH_DEFAULTS.depreciationRecaptureRate,
      newLeaseFee: WEALTH_DEFAULTS.newLeaseFee,
      renewalFee: WEALTH_DEFAULTS.renewalFee,
      currentMortgageRate: intake.mortgageRate,
      currentMortgageTermYears: intake.mortgageYearsRemaining,
      refiRate: WEALTH_DEFAULTS.refiRate,
      refiTermYears: WEALTH_DEFAULTS.refiTermYears,
      refiClosingCostPct: WEALTH_DEFAULTS.refiClosingCostPct,
      property2Rate: WEALTH_DEFAULTS.property2Rate,
      property2TermYears: WEALTH_DEFAULTS.property2TermYears,
      property2DownPaymentPct: WEALTH_DEFAULTS.property2DownPaymentPct,
      sellingCostPct: WEALTH_DEFAULTS.sellingCostPct,
    }),
    [intake, overrides],
  );

  const projection = useMemo(
    () => computeWealthProjection(wealthInputs),
    [wealthInputs],
  );

  const goToResults = useCallback(() => {
    setSubProgress(null);
    setStep(2);
  }, []);

  return (
    <div className="rvs-app">
      <div className="mx-auto max-w-6xl">
        <div>
          <StepProgress
            steps={STEPS}
            current={step as 1 | 2 | 3 | 4}
            subProgress={subProgress}
          />
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {step === 1 ? (
                <IntakeStep
                  data={intake}
                  onChange={updateIntake}
                  onContinue={goToResults}
                  onSubProgress={setSubProgress}
                />
              ) : (
                <div className="space-y-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Edit my inputs
                  </button>
                  <ScenarioDashboard
                    projection={projection}
                    homeValue={intake.homeValue}
                  />
                  <ExpertOverrides
                    values={overrides}
                    onChange={updateOverrides}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-10 text-center text-xs leading-relaxed text-muted">
          Educational illustration only — not financial, tax, or investment
          advice. Projections use a simplified tax model: rental profit is
          taxed at your marginal rate, rental losses are assumed fully
          deductible (passive-loss limits can apply at higher incomes), and
          depreciation recapture is excluded unless turned on. Actual results
          vary with market, financing, and tax circumstances.
        </p>
      </div>
    </div>
  );
}
