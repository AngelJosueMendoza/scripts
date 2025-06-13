interface Address {
  libreta: string;
  firstName: string;
  lastName: string;
  middleName: string;
  phone1: string;
  phone2: string;
  email: string;
  road: string;
  city: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  postalCode: string;
  settlement: string;
  neighborhood: string;
  municipality: string;
  state: string;
  country: string;
  region: string;
  optionalAddress1: string;
  optionalAddress2: string;
  reference: string;
  alias: string;
  countryCode?: string;
  countryCodeAlfa2?: string;
  countryCodeAlfa3?: string;
  rfc?: string;
  stateCode?: string;
  pudoinfo?: Array<{
    OwnerCode: string;
    SpaceOwnerName: string;
    EquivalentCode: string;
  }>;
}

interface ShipmentAddresses {
  origin: Address;
  destination: Address;
  recoleccion: Address;
}

export interface Shipment {
  guia: string;
  id: string;
  qr: string;
  orderId: string;
  typeGuide: string;
  address: ShipmentAddresses;
  trackingCode: string;
  orderNumberLast: string;
}
