
import { Unit, Promotion, PromotionStatus, PromotionType, AnalyticsData, AdjustmentType } from '../types';

const generateMockUnits = (): Unit[] => {
  const units: Unit[] = [];
  const sections = ['1', '2', '3'];
  const floors = 18;
  const unitsPerFloorPerSection = 4;

  sections.forEach(section => {
    for (let floor = 1; floor <= floors; floor++) {
      for (let uIdx = 1; uIdx <= unitsPerFloorPerSection; uIdx++) {
        const stackStr = uIdx.toString().padStart(2, '0');
        const unitId = `unit-${section}-${floor}-${stackStr}`;
        units.push({
          id: unitId,
          number: `${section}${floor}${stackStr}`,
          floor: floor,
          rooms: (uIdx % 3) + 1,
          area: 35 + (uIdx % 4) * 15 + (floor % 2) * 5,
          price: 6000000 + floor * 200000 + uIdx * 500000,
          status: Math.random() > 0.85 ? 'Продано' : Math.random() > 0.9 ? 'Бронь' : 'Свободно',
          section: section,
          popularity: Math.floor(Math.random() * 100)
        });
      }
    }
  });
  return units;
};

export const MOCK_UNITS: Unit[] = generateMockUnits();

const basePromos: Promotion[] = [
  {
    id: 'p-1',
    name: 'Старт продаж: Корпус А',
    shortDescription: 'Специальная скидка 7% на первые 10 квартир в секции А',
    project: 'ЖК "Гранд Тауэрс"',
    status: PromotionStatus.ACTIVE,
    type: PromotionType.DISCOUNT,
    adjustmentType: AdjustmentType.COST_PERCENT,
    adjustmentValue: 7,
    adjustmentMode: 'Понижение',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    unitIds: MOCK_UNITS.slice(0, 40).map(u => u.id),
    priority: 8,
    isStackable: false,
    createdAt: '2023-12-15'
  },
  {
    id: 'p-2',
    name: 'Семейные метры',
    shortDescription: 'Дополнительные 5м² в подарок для 3-комнатных квартир',
    project: 'ЖК "Гранд Тауэрс"',
    status: PromotionStatus.ACTIVE,
    type: PromotionType.M2_GIFT,
    adjustmentType: AdjustmentType.NTH_M2_GIFT,
    adjustmentValue: 5,
    adjustmentMode: 'Понижение',
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    unitIds: MOCK_UNITS.slice(40, 60).map(u => u.id),
    priority: 5,
    isStackable: true,
    createdAt: '2024-02-20'
  }
];

const extras = Array.from({ length: 15 }).map((_, i) => ({
  ...basePromos[i % basePromos.length],
  id: `p-extra-${i}`,
  name: `Спецпредложение №${i + 5}`,
  createdAt: new Date(2024, 2, i + 1).toISOString().split('T')[0],
  priority: (i % 10) + 1,
  unitIds: MOCK_UNITS.slice(100 + i * 5, 110 + i * 5).map(u => u.id),
  adjustmentValue: 5 + (i % 5),
  adjustmentMode: 'Понижение' as const
}));

export const MOCK_PROMOTIONS: Promotion[] = [...basePromos, ...extras];

export const MOCK_TIME_SERIES = [
  { name: 'Янв', salesWithPromo: 12, salesNoPromo: 8, revenueWithPromo: 85, revenueNoPromo: 60, discount: 5.2 },
  { name: 'Фев', salesWithPromo: 15, salesNoPromo: 10, revenueWithPromo: 110, revenueNoPromo: 75, discount: 6.8 },
  { name: 'Мар', salesWithPromo: 22, salesNoPromo: 12, revenueWithPromo: 165, revenueNoPromo: 90, discount: 9.4 },
  { name: 'Апр', salesWithPromo: 18, salesNoPromo: 9, revenueWithPromo: 135, revenueNoPromo: 65, discount: 7.1 },
  { name: 'Май', salesWithPromo: 30, salesNoPromo: 14, revenueWithPromo: 220, revenueNoPromo: 105, discount: 12.5 },
  { name: 'Июн', salesWithPromo: 25, salesNoPromo: 11, revenueWithPromo: 180, revenueNoPromo: 82, discount: 10.2 },
  { name: 'Июл', salesWithPromo: 28, salesNoPromo: 13, revenueWithPromo: 195, revenueNoPromo: 95, discount: 11.4 },
];

export const MOCK_ANALYTICS: (AnalyticsData & { bookedCount: number, availableCount: number, totalRevenue: number })[] = MOCK_PROMOTIONS.map((promo, idx) => {
  const totalUnits = Math.max(1, promo.unitIds.length);
  const mult = promo.status === PromotionStatus.ACTIVE ? 1 : 0.3;
  const sold = Math.floor(totalUnits * (0.3 + (idx % 4) * 0.1) * mult);
  const booked = Math.floor(totalUnits * 0.2 * mult);
  const available = Math.max(0, totalUnits - sold - booked);
  const total = Math.max(1, sold + booked + available);
  
  return {
    promoId: promo.id,
    soldCount: sold,
    bookedCount: booked,
    availableCount: available,
    soldArea: sold * 45,
    revenue: sold * 8200000,
    totalRevenue: total * 8200000,
    totalDiscount: sold * 580000,
    conversionRate: parseFloat(((sold / total) * 100).toFixed(1)),
    views: 1500 + idx * 350,
    bookings: booked
  };
});
