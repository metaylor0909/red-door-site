import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import StepProgress, { type SubProgress, type WizardStep } from "../calculator-ui/StepProgress";
import { DEFAULT_SETTINGS, type MarketData, type ModelSettings } from "../../lib/rent-reduction/model";
import PropertyStep from "./PropertyStep";
import MarketStep from "./MarketStep";
import PriceStep from "./PriceStep";
import ForecastStep from "./ForecastStep";
import Report from "./Report";
import "../calculator-ui/calculator.css";

export interface PropertyInputs {
  zip: string;
  bedrooms: number;
  bathrooms: number;
  askingRent: number;
}

type Step = 1 | 2 | 3 | 4;

const STEPS: WizardStep[] = [
  { number: 1, label: "Property" },
  { number: 2, label: "Your Market" },
  { number: 3, label: "Price Change" },
  { number: 4, label: "Forecast" },
];

const INITIAL_INPUTS: PropertyInputs = { zip: "", bedrooms: 3, bathrooms: 2, askingRent: 1800 };

export default function Wizard() {
  const [step, setStep] = useState<Step>(1);
  const [inputs, setInputs] = useState<PropertyInputs>(INITIAL_INPUTS);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [marketKey, setMarketKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reduction, setReduction] = useState(100);
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  const [subProgress, setSubProgress] = useState<SubProgress | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const updateInputs = useCallback((patch: Partial<PropertyInputs>) => {
    setInputs((prev) => ({ ...prev, ...patch }));
  }, []);

  const fetchMarket = useCallback(async (d: PropertyInputs) => {
    const key = `${d.zip}-${d.bedrooms}-${d.bathrooms}`;
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ zip: d.zip, beds: String(d.bedrooms), baths: String(d.bathrooms) });
      const res = await fetch(`/api/rent-reduction/market?${q.toString()}`);
      const body = (await res.json().catch(() => ({}))) as MarketData & { error?: string };
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      setMarket(body);
      setMarketKey(key);
    } catch (err) {
      setMarket(null);
      setError(err instanceof Error ? err.message : "Could not load market data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const goToMarket = useCallback(() => {
    setSubProgress(null);
    if (marketKey !== `${inputs.zip}-${inputs.bedrooms}-${inputs.bathrooms}`) void fetchMarket(inputs);
    setStep(2);
  }, [fetchMarket, inputs, marketKey]);

  const handleDownloadPdf = useCallback(async () => {
    const node = reportRef.current;
    if (!node) return;
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const img = canvas.toDataURL("image/jpeg", 0.85);
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let y = 0;
    let remaining = imgHeight;
    pdf.addImage(img, "JPEG", 0, y, pageWidth, imgHeight);
    remaining -= pageHeight;
    while (remaining > 0) {
      y -= pageHeight;
      pdf.addPage();
      pdf.addImage(img, "JPEG", 0, y, pageWidth, imgHeight);
      remaining -= pageHeight;
    }
    pdf.save(`rent-reduction-report-${inputs.zip || "property"}.pdf`);
  }, [inputs.zip]);

  let body;
  if (step === 1) {
    body = <PropertyStep data={inputs} onChange={updateInputs} onContinue={goToMarket} onSubProgress={setSubProgress} />;
  } else if (step === 2) {
    body = (
      <MarketStep
        data={inputs}
        market={market}
        loading={loading}
        error={error}
        onRetry={() => void fetchMarket(inputs)}
        onBack={() => setStep(1)}
        onContinue={() => setStep(3)}
      />
    );
  } else if (step === 3 && market) {
    body = (
      <PriceStep
        data={inputs}
        market={market}
        settings={settings}
        reduction={reduction}
        onReductionChange={setReduction}
        onBack={() => setStep(2)}
        onContinue={() => setStep(4)}
      />
    );
  } else if (market) {
    body = (
      <ForecastStep
        data={inputs}
        market={market}
        settings={settings}
        onSettingsChange={setSettings}
        reduction={reduction}
        onBack={() => setStep(3)}
        onDownload={handleDownloadPdf}
      />
    );
  }

  return (
    <div className="calc-app">
      <div className="mx-auto max-w-4xl">
        <StepProgress steps={STEPS} current={step} subProgress={subProgress} />

        <div className="mt-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {body}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted">
          Educational illustration only — not financial or investment advice. Local lease times and comparable
          rents come from RentCast rental listings removed in the last 12 months. The days-to-lease forecast is an
          estimate; actual time to rent varies with condition, season, and marketing.
        </p>
      </div>

      <div
        ref={reportRef}
        className="pointer-events-none absolute left-[-9999px] top-0 w-[816px]"
        style={{ backgroundColor: "#ffffff" }}
        aria-hidden="true"
      >
        {market && <Report data={inputs} market={market} settings={settings} reduction={reduction} />}
      </div>
    </div>
  );
}
