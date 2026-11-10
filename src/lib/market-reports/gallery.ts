// One market card in MarketReportGallery (the "Market Reports Near
// {City}" block on a property-management page for a city with no market
// report of its own).
import type { MarketSnapshotStat } from './snapshot';

export interface GalleryMarket {
  slug: string;
  /** e.g. "Westside", the market's h1 minus " Market Report". */
  name: string;
  county: string;
  /** The cities the market covers, e.g. ["Avon", "Brownsburg", "Plainfield"]. */
  covers: string[];
  snapshot: MarketSnapshotStat | null;
}
