export enum Category {
  Expertos = "Expertos",
  Expertos30 = "30 Expertos",
  Avanzados = "Avanzados",
  Expertos40 = "40 Expertos",
  Intermedios = "Intermedios",
  Clase30 = "Clase 30",
  Clase40 = "Clase 40",
  Clase50 = "Clase 50",
  Novatos = "Novatos",
  Promocionales = "Promocionales",
  Femenil = "Femenil",
  CC85 = "85cc",
  CC65 = "65cc",
  CC50 = "50cc"
}

export interface Participant {
  id: string;
  fullName: string;
  motoNumber: string;
  category: Category;
  phone: string;
  residence: string;
  registrationDate: string;
  accessCode: string; // 4-digit code for transponder access
}

export interface TransponderEntry {
  id: string;
  participantId: string;
  timestamp: string;
}

export interface RegistrationStats {
  total: number;
  byCategory: Record<string, number>;
}