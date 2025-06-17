export interface Guide {
  guide: string;
  trackingCode: string;
  QR: string;
  address: Record<string, unknown>;
  qrStatus: "active" | "inactive" | string;
  validityDays: number;
  validityDate: string;
  renovationDate: string | null;
  renovationEndDate: string | null;
  updatedAddress: boolean;
}

interface ShipmentItem {
  sku: string;
  code: string;
  orderSap: string;
  guides: Guide[];
}

export interface Folios {
  folio: string;
  folioMD5: string;
}

export type ShipmentData = Record<string, ShipmentItem>;
export type FolioData = Record<string, Folios>;
