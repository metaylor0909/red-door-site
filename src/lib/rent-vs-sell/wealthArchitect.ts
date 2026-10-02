// Wealth Architect — sell vs. keep modeling for the Red Door investor wizard.
//
// Three parallel paths across a 15-year horizon:
//   1. Sell now and reinvest net proceeds (or split between debt-payoff and
//      a stock-baseline surplus when the user picks "Pay Down Debt").
//   2. Keep the property — full Schedule E style cashflow, taxed on rental
//      profit and credited for rental losses (depreciation included).
//   3. Tax-Free Refi & Scale (LTV ≤ 75%): pull cash out at 75% LTV and roll
//      it 100% tax-free into a Property #2 acquisition; both properties then
//      compound side-by-side for the horizon.
//      Leverage Optimization Hold (LTV > 75%): defer the refi, ride the
//      leverage multiplier on Property #1 alone until equity reaches 25%.
//
// Every path's net worth is what the owner would walk away with if they
// cashed out in that year: rentals net of selling costs and capital-gains
// tax, investments net of capital-gains tax on their growth. Without that,
// a rental's paper equity is compared against already-taxed sale proceeds.

import { monthlyMortgagePayment } from "./mortgage";

export type AltChoice =
  | "stocks"
  | "syndication"
  | "debt"
  | "other"
  | "not-sure";

export type DebtType = "high" | "moderate" | "low";

export interface WealthInputs {
  homeValue: number;
  mortgageBalance: number;
  monthlyRent: number;
  purchasePrice: number;
  yearsOwned: number;
  altChoice: AltChoice;
  expectedReturn: number;
  debtType: DebtType;
  debtPayoff: number;

  managementFeeRate: number;
  newLeaseFee: number;
  renewalFee: number;
  renewalRate: number;
  vacancyRate: number;
  maintenanceRate: number;
  rentGrowthRate: number;
  appreciationRate: number;
  marginalTaxRate: number;
  buildingValuePct: number;
  propertyTaxRate: number;
  annualInsurance: number;
  capitalGainsTaxRate: number;
  // Off by default: most investors defer recapture by 1031-exchanging into
  // the next property, so it isn't counted unless the owner opts in.
  includeDepreciationRecapture: boolean;
  depreciationRecaptureRate: number;

  currentMortgageRate: number;
  currentMortgageTermYears: number;
  refiRate: number;
  refiTermYears: number;
  refiClosingCostPct: number;

  property2Rate: number;
  property2TermYears: number;
  property2DownPaymentPct: number;

  sellingCostPct: number;
}

export interface YearSnapshot {
  year: number;
  homeValue: number;

  // Sell path
  sellGrossValue: number;
  sellLiquidationTax: number;
  sellNetWorth: number;
  sellCashFlowAnnual: number;
  sellDebtBucket: number;
  sellSurplusBucket: number;

  // Keep path (pillar decomposition for the bar chart)
  keepEquity: number;
  keepStartingEquity: number;
  keepAppreciationGain: number;
  keepPrincipalPaydown: number;
  keepCumOperatingCashFlow: number;
  keepCumTaxEffect: number;
  keepCumCashFlow: number;
  keepLiquidationCost: number;
  keepNetWorth: number;
  keepCashFlowAnnual: number;
  keepAnnualTaxEffect: number;

  // Property #1 (refi'd) — populated only when scenarioMode === "refi"
  p1Equity: number;
  p1StartingEquity: number;
  p1AppreciationGain: number;
  p1PrincipalPaydown: number;
  p1CumOperatingCashFlow: number;
  p1CumTaxEffect: number;
  p1CashFlowAnnual: number;

  // Property #2 — populated only when scenarioMode === "refi"
  p2HomeValue: number;
  p2Equity: number;
  p2StartingEquity: number;
  p2AppreciationGain: number;
  p2PrincipalPaydown: number;
  p2CumOperatingCashFlow: number;
  p2CumTaxEffect: number;
  p2CashFlowAnnual: number;

  // Combined Refi & Scale totals
  scaleNetWorth: number;
  scaleCashFlowAnnual: number;
  scaleCumCashFlow: number;
  scaleCumTaxEffect: number;
  scaleEquityGrowth: number; // starting equity + appreciation across both
  scaleTenantPaydown: number; // principal paydown across both
  scaleLiquidationCost: number;

  // Convenience for the third column (refi mode → scale; leverage mode → keep)
  thirdNetWorth: number;
  thirdCashFlowAnnual: number;
}

export interface LiquidationCosts {
  sellingCosts: number;
  capitalGain: number;
  capitalGainsTax: number;
  accumulatedDepreciation: number;
  depreciationRecaptureTax: number;
  total: number;
}

export interface SaleProceedsBreakdown extends LiquidationCosts {
  grossSalePrice: number;
  mortgagePayoff: number;
  purchasePrice: number;
  netProceeds: number;
}

export interface RefiBreakdown {
  newLoanBalance: number;
  cashOut: number;
  refiClosingCosts: number;
  newMonthlyPayment: number;
}

export interface LeverageBreakdown {
  currentLtv: number;
  currentEquity: number;
  yearsToTwentyFiveEquity: number;
  appreciationRate: number;
  appreciationOnEquityYear1: number;
}

export interface DebtSplitBreakdown {
  debtPayoffAmount: number;
  debtRate: number;
  surplusAmount: number;
  surplusRate: number;
}

export interface Property2Breakdown {
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyRent: number;
  monthlyPayment: number;
  rentToPriceRatio: number;
}

export interface WealthProjection {
  ltv: number;
  scenarioMode: "refi" | "leverage";
  altReturnRate: number;
  altLabel: string;
  sale: SaleProceedsBreakdown;
  refi: RefiBreakdown | null;
  leverage: LeverageBreakdown | null;
  debtSplit: DebtSplitBreakdown | null;
  property2: Property2Breakdown | null;
  snapshots: YearSnapshot[];
}

export const DEBT_TYPE_RATES: Record<DebtType, number> = {
  high: 0.2,
  moderate: 0.07,
  low: 0.04,
};

export const STOCK_BASELINE_RATE = 0.1;

export const WEALTH_DEFAULTS = {
  altChoice: "not-sure" as AltChoice,
  expectedReturn: 0.1,
  debtType: "moderate" as DebtType,
  debtPayoff: 0,

  managementFeeRate: 0.09,
  // Red Door's published fees (/pricing). A 75% renewal rate means an
  // average 4-year tenancy.
  newLeaseFee: 995,
  renewalFee: 350,
  renewalRate: 0.75,
  vacancyRate: 0.05,
  maintenanceRate: 0.1,
  rentGrowthRate: 0.05,
  appreciationRate: 0.05,
  marginalTaxRate: 0.24,
  buildingValuePct: 0.8,
  propertyTaxRate: 0.0105,
  annualInsurance: 1400,
  capitalGainsTaxRate: 0.15,
  includeDepreciationRecapture: false,
  depreciationRecaptureRate: 0.25,

  currentMortgageRate: 0.065,
  currentMortgageTermYears: 25,
  refiRate: 0.0725,
  refiTermYears: 30,
  refiClosingCostPct: 0.02,

  property2Rate: 0.065,
  property2TermYears: 30,
  property2DownPaymentPct: 0.2,

  sellingCostPct: 0.07,
};

const HORIZON_YEARS = 15;
const DEPRECIATION_PERIOD_YEARS = 27.5;

export function resolveAltReturn(inputs: WealthInputs): {
  rate: number;
  label: string;
} {
  switch (inputs.altChoice) {
    case "debt":
      return {
        rate: DEBT_TYPE_RATES[inputs.debtType],
        label:
          inputs.debtType === "high"
            ? "Paying Down High-Interest Debt"
            : inputs.debtType === "moderate"
              ? "Paying Down Moderate-Interest Debt"
              : "Paying Down Low-Interest Debt",
      };
    case "stocks":
      return { rate: inputs.expectedReturn, label: "Stock Market" };
    case "syndication":
      return { rate: inputs.expectedReturn, label: "Real Estate Syndication" };
    case "other":
      return { rate: inputs.expectedReturn, label: "Other Investment" };
    case "not-sure":
    default:
      return { rate: inputs.expectedReturn, label: "Diversified Portfolio" };
  }
}

interface AmortYear {
  interest: number;
  principal: number;
  endBalance: number;
}

function amortizeYearly(
  loanAmount: number,
  annualRate: number,
  termYears: number,
): AmortYear[] {
  if (loanAmount <= 0 || termYears <= 0) return [];
  const payment = monthlyMortgagePayment(loanAmount, annualRate, termYears);
  const r = annualRate / 12;
  let balance = loanAmount;
  const out: AmortYear[] = [];
  for (let y = 1; y <= termYears; y++) {
    let interest = 0;
    let principal = 0;
    for (let m = 0; m < 12 && balance > 0.005; m++) {
      const monthlyInterest = balance * r;
      const monthlyPrincipal = Math.min(payment - monthlyInterest, balance);
      balance -= monthlyPrincipal;
      interest += monthlyInterest;
      principal += monthlyPrincipal;
    }
    out.push({ interest, principal, endBalance: Math.max(0, balance) });
    if (balance <= 0.005) {
      balance = 0;
      break;
    }
  }
  return out;
}

// Straight-line residential depreciation is fixed at purchase: the building
// share of what was paid, spread over 27.5 years — not today's value.
function depreciationForYear(
  depreciableBasis: number,
  yearsAlreadyDepreciated: number,
): number {
  const remaining = DEPRECIATION_PERIOD_YEARS - yearsAlreadyDepreciated;
  const fraction = Math.max(0, Math.min(1, remaining));
  return (depreciableBasis / DEPRECIATION_PERIOD_YEARS) * fraction;
}

function accumulatedDepreciation(
  depreciableBasis: number,
  yearsDepreciated: number,
): number {
  const years = Math.max(0, Math.min(yearsDepreciated, DEPRECIATION_PERIOD_YEARS));
  return (depreciableBasis / DEPRECIATION_PERIOD_YEARS) * years;
}

type LiquidationRates = Pick<
  WealthInputs,
  | "sellingCostPct"
  | "capitalGainsTaxRate"
  | "includeDepreciationRecapture"
  | "depreciationRecaptureRate"
>;

function computeLiquidationCosts(
  salePrice: number,
  purchasePrice: number,
  depreciationTaken: number,
  rates: LiquidationRates,
): LiquidationCosts {
  const sellingCosts = salePrice * rates.sellingCostPct;
  const amountRealized = salePrice - sellingCosts;
  const capitalGain = Math.max(0, amountRealized - purchasePrice);
  const capitalGainsTax = capitalGain * rates.capitalGainsTaxRate;
  // Recapture applies to the part of the gain created by depreciation
  // lowering the basis, capped at the depreciation actually taken.
  const recapturableGain = rates.includeDepreciationRecapture
    ? Math.min(
        depreciationTaken,
        Math.max(0, amountRealized - (purchasePrice - depreciationTaken)),
      )
    : 0;
  const depreciationRecaptureTax =
    recapturableGain * rates.depreciationRecaptureRate;
  return {
    sellingCosts,
    capitalGain,
    capitalGainsTax,
    accumulatedDepreciation: depreciationTaken,
    depreciationRecaptureTax,
    total: sellingCosts + capitalGainsTax + depreciationRecaptureTax,
  };
}

export function estimateNetProceeds(params: {
  homeValue: number;
  mortgageBalance: number;
  purchasePrice: number;
  yearsOwned: number;
}): number {
  const depreciableBasis = params.purchasePrice * WEALTH_DEFAULTS.buildingValuePct;
  const costs = computeLiquidationCosts(
    params.homeValue,
    params.purchasePrice,
    accumulatedDepreciation(depreciableBasis, params.yearsOwned),
    WEALTH_DEFAULTS,
  );
  return Math.max(0, params.homeValue - params.mortgageBalance - costs.total);
}

function computeSale(inputs: WealthInputs): SaleProceedsBreakdown {
  const depreciableBasis = inputs.purchasePrice * inputs.buildingValuePct;
  const costs = computeLiquidationCosts(
    inputs.homeValue,
    inputs.purchasePrice,
    accumulatedDepreciation(depreciableBasis, inputs.yearsOwned),
    inputs,
  );
  return {
    ...costs,
    grossSalePrice: inputs.homeValue,
    mortgagePayoff: inputs.mortgageBalance,
    purchasePrice: inputs.purchasePrice,
    netProceeds: Math.max(
      0,
      inputs.homeValue - inputs.mortgageBalance - costs.total,
    ),
  };
}

interface YearlyOps {
  cashFlow: number; // after tax
  taxEffect: number; // + = tax saved by a rental loss, − = tax owed on profit
  interest: number;
  principal: number;
  endBalance: number;
}

interface PropertyContext {
  homeValueAtYear: number;
  grossRent: number;
  depreciation: number;
  managementFeeRate: number;
  annualLeasingCost: number;
  vacancyRate: number;
  maintenanceRate: number;
  propertyTaxRate: number;
  annualInsurance: number;
  marginalTaxRate: number;
}

function rentalYearlyOps(
  year: number,
  ctx: PropertyContext,
  schedule: AmortYear[],
): YearlyOps {
  const vacancyLoss = ctx.grossRent * ctx.vacancyRate;
  const effectiveGross = ctx.grossRent - vacancyLoss;
  const management = effectiveGross * ctx.managementFeeRate;
  const maintenance = ctx.grossRent * ctx.maintenanceRate;
  const propertyTax = ctx.homeValueAtYear * ctx.propertyTaxRate;
  const insurance = ctx.annualInsurance;
  const cashExpenses =
    management + ctx.annualLeasingCost + maintenance + propertyTax + insurance;

  const yr = schedule[year - 1];
  const interest = yr?.interest ?? 0;
  const principal = yr?.principal ?? 0;
  const endBalance = yr?.endBalance ?? 0;
  const debtService = interest + principal;

  const taxableIncome =
    effectiveGross - cashExpenses - interest - ctx.depreciation;
  const taxEffect = -taxableIncome * ctx.marginalTaxRate;

  const cashFlow = effectiveGross - cashExpenses - debtService + taxEffect;

  return { cashFlow, taxEffect, interest, principal, endBalance };
}

export function computeWealthProjection(
  inputs: WealthInputs,
): WealthProjection {
  const ltv =
    inputs.homeValue > 0 ? inputs.mortgageBalance / inputs.homeValue : 0;
  const scenarioMode: "refi" | "leverage" = ltv <= 0.75 ? "refi" : "leverage";

  const { rate: altRate, label: altLabel } = resolveAltReturn(inputs);
  const sale = computeSale(inputs);

  // --- Sell path bucketing -------------------------------------------------
  let debtSplit: DebtSplitBreakdown | null = null;
  let sellInitialBalance = sale.netProceeds;
  if (inputs.altChoice === "debt") {
    const debtPayoffAmount = Math.max(
      0,
      Math.min(inputs.debtPayoff, sale.netProceeds),
    );
    const surplusAmount = Math.max(0, sale.netProceeds - debtPayoffAmount);
    debtSplit = {
      debtPayoffAmount,
      debtRate: DEBT_TYPE_RATES[inputs.debtType],
      surplusAmount,
      surplusRate: STOCK_BASELINE_RATE,
    };
    sellInitialBalance = debtPayoffAmount + surplusAmount;
  }

  // --- Keep schedule -------------------------------------------------------
  const keepSchedule = amortizeYearly(
    inputs.mortgageBalance,
    inputs.currentMortgageRate,
    inputs.currentMortgageTermYears,
  );
  const keepStartingEquity = inputs.homeValue - inputs.mortgageBalance;
  const p1DepreciableBasis = inputs.purchasePrice * inputs.buildingValuePct;

  // --- Refi + Property #2 setup -------------------------------------------
  let refi: RefiBreakdown | null = null;
  let refiSchedule: AmortYear[] = [];
  let property2: Property2Breakdown | null = null;
  let p2Schedule: AmortYear[] = [];

  if (scenarioMode === "refi") {
    const newLoanBalance = inputs.homeValue * 0.75;
    const refiClosingCosts = newLoanBalance * inputs.refiClosingCostPct;
    const cashOut = Math.max(
      0,
      newLoanBalance - inputs.mortgageBalance - refiClosingCosts,
    );
    const newMonthlyPayment = monthlyMortgagePayment(
      newLoanBalance,
      inputs.refiRate,
      inputs.refiTermYears,
    );
    refi = { newLoanBalance, cashOut, refiClosingCosts, newMonthlyPayment };
    refiSchedule = amortizeYearly(
      newLoanBalance,
      inputs.refiRate,
      inputs.refiTermYears,
    );

    if (cashOut > 0 && inputs.property2DownPaymentPct > 0) {
      const purchasePrice = cashOut / inputs.property2DownPaymentPct;
      const downPayment = cashOut;
      const loanAmount = purchasePrice * (1 - inputs.property2DownPaymentPct);
      const rentToPriceRatio =
        inputs.homeValue > 0 ? inputs.monthlyRent / inputs.homeValue : 0;
      const monthlyRent = purchasePrice * rentToPriceRatio;
      const monthlyPayment = monthlyMortgagePayment(
        loanAmount,
        inputs.property2Rate,
        inputs.property2TermYears,
      );
      property2 = {
        purchasePrice,
        downPayment,
        loanAmount,
        monthlyRent,
        monthlyPayment,
        rentToPriceRatio,
      };
      p2Schedule = amortizeYearly(
        loanAmount,
        inputs.property2Rate,
        inputs.property2TermYears,
      );
    }
  }
  const p2DepreciableBasis = property2
    ? property2.purchasePrice * inputs.buildingValuePct
    : 0;

  // --- Leverage breakdown --------------------------------------------------
  let leverage: LeverageBreakdown | null = null;
  if (scenarioMode === "leverage") {
    const currentEquity = inputs.homeValue - inputs.mortgageBalance;
    let yearsToEquity = 0;
    for (let y = 1; y <= 60; y++) {
      const homeAtY =
        inputs.homeValue * Math.pow(1 + inputs.appreciationRate, y);
      const balAtY =
        y <= keepSchedule.length ? keepSchedule[y - 1].endBalance : 0;
      if ((homeAtY - balAtY) / homeAtY >= 0.25) {
        yearsToEquity = y;
        break;
      }
    }
    leverage = {
      currentLtv: ltv,
      currentEquity,
      yearsToTwentyFiveEquity: yearsToEquity,
      appreciationRate: inputs.appreciationRate,
      appreciationOnEquityYear1:
        currentEquity > 0
          ? (inputs.appreciationRate * inputs.homeValue) / currentEquity
          : 0,
    };
  }

  // --- Year-by-year projection --------------------------------------------
  const snapshots: YearSnapshot[] = [];
  let keepCumOp = 0;
  let keepCumTax = 0;
  let p1CumOp = 0;
  let p1CumTax = 0;
  let p2CumOp = 0;
  let p2CumTax = 0;
  let prevSellGrossValue = sellInitialBalance;

  // Expected leasing fees per year: a new-lease fee when the tenant turns
  // over, a renewal fee when they stay.
  const annualLeasingCost =
    (1 - inputs.renewalRate) * inputs.newLeaseFee +
    inputs.renewalRate * inputs.renewalFee;

  const baseCtx = {
    managementFeeRate: inputs.managementFeeRate,
    annualLeasingCost,
    vacancyRate: inputs.vacancyRate,
    maintenanceRate: inputs.maintenanceRate,
    propertyTaxRate: inputs.propertyTaxRate,
    annualInsurance: inputs.annualInsurance,
    marginalTaxRate: inputs.marginalTaxRate,
  };

  for (let year = 1; year <= HORIZON_YEARS; year++) {
    const homeValueAtYear =
      inputs.homeValue * Math.pow(1 + inputs.appreciationRate, year);
    const grossRentP1 =
      inputs.monthlyRent *
      12 *
      Math.pow(1 + inputs.rentGrowthRate, year - 1);
    const p1Depreciation = depreciationForYear(
      p1DepreciableBasis,
      inputs.yearsOwned + year - 1,
    );
    const p1DepreciationTaken = accumulatedDepreciation(
      p1DepreciableBasis,
      inputs.yearsOwned + year,
    );
    const p1Liquidation = computeLiquidationCosts(
      homeValueAtYear,
      inputs.purchasePrice,
      p1DepreciationTaken,
      inputs,
    );

    // --- KEEP ---
    const keepOps = rentalYearlyOps(
      year,
      {
        ...baseCtx,
        homeValueAtYear,
        grossRent: grossRentP1,
        depreciation: p1Depreciation,
      },
      keepSchedule,
    );
    keepCumOp += keepOps.cashFlow - keepOps.taxEffect;
    keepCumTax += keepOps.taxEffect;
    const keepPrincipalPaydown = inputs.mortgageBalance - keepOps.endBalance;
    const keepAppreciationGain = homeValueAtYear - inputs.homeValue;
    const keepEquity = homeValueAtYear - keepOps.endBalance;
    const keepCumCashFlow = keepCumOp + keepCumTax;
    const keepNetWorth = keepEquity + keepCumCashFlow - p1Liquidation.total;

    // --- SELL ---
    let sellGrossValue: number;
    let sellLiquidationTax: number;
    let sellDebtBucket = 0;
    let sellSurplusBucket = 0;
    if (debtSplit) {
      // Avoided interest is never taxed; the reinvested surplus is.
      sellDebtBucket =
        debtSplit.debtPayoffAmount * Math.pow(1 + debtSplit.debtRate, year);
      sellSurplusBucket =
        debtSplit.surplusAmount * Math.pow(1 + debtSplit.surplusRate, year);
      sellGrossValue = sellDebtBucket + sellSurplusBucket;
      sellLiquidationTax =
        Math.max(0, sellSurplusBucket - debtSplit.surplusAmount) *
        inputs.capitalGainsTaxRate;
    } else {
      sellGrossValue = sale.netProceeds * Math.pow(1 + altRate, year);
      sellLiquidationTax =
        Math.max(0, sellGrossValue - sale.netProceeds) *
        inputs.capitalGainsTaxRate;
    }
    const sellNetWorth = sellGrossValue - sellLiquidationTax;
    const sellCashFlowAnnual = sellGrossValue - prevSellGrossValue;
    prevSellGrossValue = sellGrossValue;

    // --- REFI & SCALE (Property #1 refi + Property #2 acquisition) ---
    let p1Equity = 0;
    let p1StartingEquityYear = 0;
    let p1AppreciationGain = 0;
    let p1PrincipalPaydown = 0;
    let p1CumOperatingCashFlow = 0;
    let p1CumTaxEffect = 0;
    let p1CashFlowAnnual = 0;

    let p2HomeValue = 0;
    let p2Equity = 0;
    let p2StartingEquityYear = 0;
    let p2AppreciationGain = 0;
    let p2PrincipalPaydown = 0;
    let p2CumOperatingCashFlow = 0;
    let p2CumTaxEffect = 0;
    let p2CashFlowAnnual = 0;
    let p2LiquidationTotal = 0;

    let scaleNetWorth = keepNetWorth;
    let scaleCashFlowAnnual = keepOps.cashFlow;
    let scaleLiquidationCost = 0;

    if (scenarioMode === "refi" && refi) {
      // A cash-out refi doesn't change the property's tax basis or its
      // depreciation schedule — only the loan.
      const p1Ops = rentalYearlyOps(
        year,
        {
          ...baseCtx,
          homeValueAtYear,
          grossRent: grossRentP1,
          depreciation: p1Depreciation,
        },
        refiSchedule,
      );
      p1CumOp += p1Ops.cashFlow - p1Ops.taxEffect;
      p1CumTax += p1Ops.taxEffect;
      p1Equity = homeValueAtYear - p1Ops.endBalance;
      p1StartingEquityYear = inputs.homeValue - refi.newLoanBalance; // 0.25 * homeValue
      p1AppreciationGain = homeValueAtYear - inputs.homeValue;
      p1PrincipalPaydown = refi.newLoanBalance - p1Ops.endBalance;
      p1CumOperatingCashFlow = p1CumOp;
      p1CumTaxEffect = p1CumTax;
      p1CashFlowAnnual = p1Ops.cashFlow;

      if (property2) {
        const p2HomeValueAtYear =
          property2.purchasePrice *
          Math.pow(1 + inputs.appreciationRate, year);
        const grossRentP2 =
          property2.monthlyRent *
          12 *
          Math.pow(1 + inputs.rentGrowthRate, year - 1);
        const p2Ops = rentalYearlyOps(
          year,
          {
            ...baseCtx,
            homeValueAtYear: p2HomeValueAtYear,
            grossRent: grossRentP2,
            depreciation: depreciationForYear(p2DepreciableBasis, year - 1),
          },
          p2Schedule,
        );
        p2CumOp += p2Ops.cashFlow - p2Ops.taxEffect;
        p2CumTax += p2Ops.taxEffect;
        p2HomeValue = p2HomeValueAtYear;
        p2Equity = p2HomeValueAtYear - p2Ops.endBalance;
        p2StartingEquityYear = property2.downPayment;
        p2AppreciationGain = p2HomeValueAtYear - property2.purchasePrice;
        p2PrincipalPaydown = property2.loanAmount - p2Ops.endBalance;
        p2CumOperatingCashFlow = p2CumOp;
        p2CumTaxEffect = p2CumTax;
        p2CashFlowAnnual = p2Ops.cashFlow;
        p2LiquidationTotal = computeLiquidationCosts(
          p2HomeValueAtYear,
          property2.purchasePrice,
          accumulatedDepreciation(p2DepreciableBasis, year),
          inputs,
        ).total;
      }

      scaleLiquidationCost = p1Liquidation.total + p2LiquidationTotal;
      scaleNetWorth =
        p1Equity +
        p1CumOperatingCashFlow +
        p1CumTaxEffect +
        p2Equity +
        p2CumOperatingCashFlow +
        p2CumTaxEffect -
        scaleLiquidationCost;
      scaleCashFlowAnnual = p1CashFlowAnnual + p2CashFlowAnnual;
    }

    const scaleCumCashFlow = p1CumOperatingCashFlow + p2CumOperatingCashFlow;
    const scaleCumTaxEffect = p1CumTaxEffect + p2CumTaxEffect;
    const scaleEquityGrowth =
      p1StartingEquityYear +
      p1AppreciationGain +
      p2StartingEquityYear +
      p2AppreciationGain;
    const scaleTenantPaydown = p1PrincipalPaydown + p2PrincipalPaydown;

    const thirdNetWorth =
      scenarioMode === "refi" ? scaleNetWorth : keepNetWorth;
    const thirdCashFlowAnnual =
      scenarioMode === "refi" ? scaleCashFlowAnnual : keepOps.cashFlow;

    snapshots.push({
      year,
      homeValue: homeValueAtYear,
      sellGrossValue,
      sellLiquidationTax,
      sellNetWorth,
      sellCashFlowAnnual,
      sellDebtBucket,
      sellSurplusBucket,
      keepEquity,
      keepStartingEquity,
      keepAppreciationGain,
      keepPrincipalPaydown,
      keepCumOperatingCashFlow: keepCumOp,
      keepCumTaxEffect: keepCumTax,
      keepCumCashFlow,
      keepLiquidationCost: p1Liquidation.total,
      keepNetWorth,
      keepCashFlowAnnual: keepOps.cashFlow,
      keepAnnualTaxEffect: keepOps.taxEffect,
      p1Equity,
      p1StartingEquity: p1StartingEquityYear,
      p1AppreciationGain,
      p1PrincipalPaydown,
      p1CumOperatingCashFlow,
      p1CumTaxEffect,
      p1CashFlowAnnual,
      p2HomeValue,
      p2Equity,
      p2StartingEquity: p2StartingEquityYear,
      p2AppreciationGain,
      p2PrincipalPaydown,
      p2CumOperatingCashFlow,
      p2CumTaxEffect,
      p2CashFlowAnnual,
      scaleNetWorth,
      scaleCashFlowAnnual,
      scaleCumCashFlow,
      scaleCumTaxEffect,
      scaleEquityGrowth,
      scaleTenantPaydown,
      scaleLiquidationCost,
      thirdNetWorth,
      thirdCashFlowAnnual,
    });
  }

  return {
    ltv,
    scenarioMode,
    altReturnRate: altRate,
    altLabel,
    sale,
    refi,
    leverage,
    debtSplit,
    property2,
    snapshots,
  };
}
