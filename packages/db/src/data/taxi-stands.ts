export interface TaxiStandData {
  address: string;
  id: string;
  lat: number;
  lng: number;
  name: string;
}

/**
 * Taxi stand / robot-taxi pickup locations.
 * Placeholder — fill with real data later.
 */
export const TAXI_STANDS: TaxiStandData[] = [];

/** Quick lookup by stand ID */
export const TAXI_STAND_MAP = new Map(TAXI_STANDS.map((s) => [s.id, s]));
