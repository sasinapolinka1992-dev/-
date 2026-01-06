
export enum PromotionStatus {
  ACTIVE = 'Активна',
  ARCHIVED = 'Архив',
  DRAFT = 'Черновик',
  PENDING = 'На проверке'
}

export enum PromotionType {
  DISCOUNT = 'Скидка',
  GIFT = 'Подарок за покупку',
  M2_GIFT = 'м² в подарок',
  FLAT_MONTH = 'Квартира месяца'
}

export enum AdjustmentType {
  COST_PERCENT = '% от стоимости',
  M2_PERCENT = '% от квадратного метра',
  FIXED_COST = 'фиксированная сумма к стоимости',
  FIXED_M2 = 'фиксированная сумма к стоимости за м²',
  NTH_M2_GIFT = 'каждый n м² в подарок'
}

export interface AppearanceSettings {
  activeInCrm: boolean;
  badgeText: string;
  badgeTooltipText: string;
  bgColor: string;
  textColor: string;
  fontSize: number;
  badgeHeight: number;
  isBold: boolean;
  borderRadius: number;
  tooltipTextColor: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  changes?: string;
}

export interface Promotion {
  id: string;
  name: string;
  shortDescription?: string;
  project: string;
  section?: string;
  roomTypes?: string[];
  rooms?: string[];
  areaFrom?: number;
  areaTo?: number;
  unitStatus?: string;
  status: PromotionStatus;
  type: PromotionType;
  adjustmentType?: AdjustmentType;
  adjustmentValue: number;
  adjustmentMode: 'Повышение' | 'Понижение';
  startDate: string;
  endDate: string;
  unitIds: string[];
  priority: number;
  isStackable: boolean;
  maxTotalDiscount?: number;
  link?: string;
  image?: string;
  showOnDomclick?: boolean;
  createdAt: string;
  appearance?: AppearanceSettings;
  auditLog?: AuditLog[];
}

export interface Unit {
  id: string;
  number: string;
  floor: number;
  rooms: number;
  area: number;
  price: number;
  status: 'Свободно' | 'Бронь' | 'Продано';
  section: string;
  popularity?: number; // 0-100 for heatmap
}

export interface AnalyticsData {
  promoId: string;
  soldCount: number;
  soldArea: number;
  revenue: number;
  totalDiscount: number;
  conversionRate: number;
  views: number;
  bookings: number;
}
