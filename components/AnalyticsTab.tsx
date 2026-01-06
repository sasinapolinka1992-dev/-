
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Promotion, PromotionType, Unit, AnalyticsData } from '../types';
import { COMMON_STYLES } from '../constants';
import { MOCK_TIME_SERIES, MOCK_ANALYTICS } from '../services/mockData';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface AnalyticsTabProps {
  promotions: Promotion[];
  units: Unit[];
  onRowClick: (promo: Promotion) => void;
}

const ChartSkeleton = () => (
  <div className="flex-1 w-full bg-slate-50 rounded-xl relative overflow-hidden animate-pulse">
    <div className="absolute bottom-0 left-0 w-full h-1/2 flex items-end justify-around px-4">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="w-8 bg-slate-200 rounded-t-lg" style={{ height: `${20 + Math.random() * 60}%` }}></div>
      ))}
    </div>
  </div>
);

const SortHeader = ({ label, sortKey, currentSortKey, sortOrder, onSort, className = "", tooltip = "" }: { label: string, sortKey: string, currentSortKey: string, sortOrder: 'asc' | 'desc', onSort: (key: any) => void, className?: string, tooltip?: string }) => (
  <th className={`${COMMON_STYLES.TABLE_HEADER} ${className}`}>
    <div className="flex items-center justify-center gap-2 cursor-pointer select-none group" onClick={() => onSort(sortKey)}>
      <div className="flex items-center gap-1.5">
        <span className="group-hover:text-slate-900 transition-colors">{label}</span>
        {tooltip && (
          <div className="text-slate-300 hover:text-[#6699CC] cursor-help transition-colors" title={tooltip}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        )}
      </div>
      <div className={`flex flex-col text-[10px] leading-[0.5] ${currentSortKey === sortKey ? 'text-[#6699CC]' : 'text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
        <span className={currentSortKey === sortKey && sortOrder === 'asc' ? 'text-[#6699CC]' : ''}>▲</span>
        <span className={currentSortKey === sortKey && sortOrder === 'desc' ? 'text-[#6699CC]' : ''}>▼</span>
      </div>
    </div>
  </th>
);

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ promotions = [], units = [], onRowClick }) => {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const [activeUnit, setActiveUnit] = useState<'шт' | 'м²' | 'руб' | '%'>('шт');
  const [activeRange, setActiveRange] = useState<'week' | 'month'>('month');

  const [filterPromoId, setFilterPromoId] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterPromoType, setFilterPromoType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [sortKey, setSortKey] = useState<string>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const COLORS_CHART = ['#6699CC', '#5577BB', '#AEC6CF', '#779ECB', '#99CCFF', '#CCCCFF'];

  const handleReset = () => {
    setFilterPromoId('');
    setFilterProject('');
    setFilterPromoType('');
    setDateFrom('');
    setDateTo('');
  };

  const soldSortKey = useMemo(() => {
    switch (activeUnit) {
      case 'шт': return 'soldCount';
      case 'м²': return 'soldArea';
      case 'руб': return 'revenue';
      case '%': return 'conversionRate';
      default: return 'soldCount';
    }
  }, [activeUnit]);

  const filteredAnalytics = useMemo(() => {
    let result = promotions.map(p => {
      const analytics = MOCK_ANALYTICS.find(a => a.promoId === p.id) || MOCK_ANALYTICS[0];
      const totalInPromo = p.unitIds.length;
      const soldShare = totalInPromo > 0 ? (analytics.soldCount / totalInPromo) * 100 : 0;
      const revenueContribution = (analytics.revenue / 500000000) * 100;
      
      return { 
        ...analytics, 
        promo: p,
        name: p.name,
        project: p.project,
        totalInPromo,
        soldShare,
        revenueContribution
      };
    });

    if (filterPromoId) result = result.filter(a => a.promoId === filterPromoId);
    if (filterProject) result = result.filter(a => a.promo?.project === filterProject);
    if (filterPromoType) result = result.filter(a => a.promo?.type === filterPromoType);
    if (dateFrom) result = result.filter(a => (a.promo?.startDate || '') >= dateFrom);
    if (dateTo) result = result.filter(a => (a.promo?.endDate || '9999-12-31') <= (dateTo || '9999-12-31'));
    
    result.sort((a, b) => {
      let valA: any = (a as any)[sortKey];
      let valB: any = (b as any)[sortKey];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valB > valA) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [promotions, filterPromoId, filterProject, filterPromoType, dateFrom, dateTo, sortKey, sortOrder]);

  const chartData = useMemo(() => {
    const data = activeRange === 'week' 
      ? [
          { name: 'Нед 1', salesWithPromo: 5, salesNoPromo: 3, revenueWithPromo: 35, revenueNoPromo: 20, discount: 4.2 },
          { name: 'Нед 2', salesWithPromo: 8, salesNoPromo: 2, revenueWithPromo: 55, revenueNoPromo: 15, discount: 6.5 },
          { name: 'Нед 3', salesWithPromo: 6, salesNoPromo: 4, revenueWithPromo: 42, revenueNoPromo: 28, discount: 5.1 },
          { name: 'Нед 4', salesWithPromo: 10, salesNoPromo: 5, revenueWithPromo: 70, revenueNoPromo: 35, discount: 8.9 },
        ]
      : MOCK_TIME_SERIES;

    return data.map(item => {
      let valPromo = 0;
      let valBase = 0;
      
      switch (activeUnit) {
        case 'шт': 
          valPromo = (item as any).salesWithPromo; 
          valBase = (item as any).salesNoPromo; 
          break;
        case 'м²': 
          valPromo = (item as any).salesWithPromo * 45; 
          valBase = (item as any).salesNoPromo * 45; 
          break;
        case 'руб': 
          valPromo = (item as any).revenueWithPromo; 
          valBase = (item as any).revenueNoPromo; 
          break;
        case '%': 
          valPromo = (item as any).discount; 
          valBase = (item as any).discount * 0.8;
          break;
      }

      return {
        ...item,
        displayPromo: valPromo,
        displayBase: valBase
      };
    });
  }, [activeRange, activeUnit]);

  const pieData = useMemo(() => {
    const data = filteredAnalytics
      .map(a => {
        let value = 0;
        switch (activeUnit) {
          case 'шт': value = a.soldCount; break;
          case 'м²': value = a.soldArea; break;
          case 'руб': value = a.revenue; break;
          case '%': value = a.conversionRate; break;
        }
        return {
          name: a.promo?.name || 'Акция',
          value: Math.max(0, value),
          unitLabel: activeUnit === 'руб' ? 'М₽' : activeUnit
        };
      })
      .sort((a, b) => b.value - a.value);
    
    if (data.length === 0) return [{ name: 'Нет данных', value: 1, unitLabel: '' }];
    
    // Top 5 + Others
    if (data.length > 6) {
      const top = data.slice(0, 5);
      const othersValue = data.slice(5).reduce((acc, curr) => acc + curr.value, 0);
      return [...top, { name: 'Прочие', value: othersValue, unitLabel: activeUnit === 'руб' ? 'М₽' : activeUnit }];
    }
    
    return data;
  }, [filteredAnalytics, activeUnit]);

  const handleUnitChange = (u: any) => {
    setIsLoading(true);
    setActiveUnit(u);
    setTimeout(() => setIsLoading(false), 400);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const renderPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const displayVal = activeUnit === 'руб' ? (data.value / 1000000).toFixed(1) : data.value;
      return (
        <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-black text-slate-800 mb-1">{data.name}</p>
          <p className="text-[14px] font-bold text-[#6699CC]">
            {displayVal} {data.unitLabel}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Активные акции', val: filteredAnalytics.length, color: 'text-slate-900' },
          { label: 'Продано помещений по акциям', val: filteredAnalytics.reduce((a,b) => a + b.soldCount, 0), color: 'text-slate-900' },
          { label: 'Выручка, М₽', val: (filteredAnalytics.reduce((a,b) => a + b.revenue, 0) / 1000000).toFixed(1), color: 'text-[#6699CC]' },
          { label: 'Сумма скидок, М₽', val: (filteredAnalytics.reduce((a,b) => a + b.totalDiscount, 0) / 1000000).toFixed(1), color: 'text-orange-500' }
        ].map((kpi, idx) => (
          <div key={idx} className={COMMON_STYLES.CARD}>
            <p className="text-gray-500 text-[10px] font-bold uppercase mb-1 tracking-widest">{kpi.label}</p>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Акция</label>
            <select value={filterPromoId} onChange={e => setFilterPromoId(e.target.value)} className={COMMON_STYLES.INPUT}>
              <option value="">Все акции</option>
              {promotions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Проект</label>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className={COMMON_STYLES.INPUT}>
              <option value="">Все проекты</option>
              {['ЖК "Гранд Тауэрс"', 'Резиденция Набережная', 'Скай Гарден'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Тип акции</label>
            <select value={filterPromoType} onChange={e => setFilterPromoType(e.target.value)} className={COMMON_STYLES.INPUT}>
              <option value="">Все типы</option>
              {Object.values(PromotionType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Период</label>
            <div className="flex gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={COMMON_STYLES.INPUT} />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={COMMON_STYLES.INPUT} />
            </div>
          </div>
        </div>
        <div className="flex justify-start pt-2">
          <button onClick={handleReset} className={COMMON_STYLES.SECONDARY_BUTTON}>Сбросить</button>
        </div>
      </div>

      <div className="flex justify-end items-center gap-4 mb-2">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['week', 'month'] as const).map((range) => (
            <button key={range} onClick={() => setActiveRange(range)} className={`h-[36px] px-4 text-xs font-bold rounded-md transition-all ${activeRange === range ? 'bg-white text-[#6699CC] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {range === 'week' ? 'Неделя' : 'Месяц'}
            </button>
          ))}
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['шт', 'м²', 'руб', '%'] as const).map((unit) => (
            <button key={unit} onClick={() => handleUnitChange(unit)} className={`h-[36px] px-4 text-xs font-bold rounded-md transition-all ${activeUnit === unit ? 'bg-white text-[#6699CC] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {unit}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 h-[460px] flex flex-col shadow-sm">
          <h4 className="font-bold text-xs uppercase text-slate-400 tracking-widest mb-6">Динамика продаж: По акции vs Без акции</h4>
          {isLoading ? <ChartSkeleton /> : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{fontSize: '11px', paddingBottom: '20px'}} />
                  <Bar dataKey="displayPromo" name={`По акции (${activeUnit})`} fill="#6699CC" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="displayBase" name={`Без акции (${activeUnit})`} fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 h-[460px] flex flex-col shadow-sm">
          <h4 className="font-bold text-xs uppercase text-slate-400 tracking-widest mb-6">Вклад акций в общую выручку</h4>
          {isLoading ? <ChartSkeleton /> : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70} 
                    outerRadius={110} 
                    paddingAngle={5} 
                    dataKey="value"
                    label={false}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => <Cell key={index} fill={COLORS_CHART[index % COLORS_CHART.length]} stroke="white" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip content={renderPieTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div ref={tableRef} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-50 bg-slate-50/30">
          <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Детальная статистика по акциям</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <SortHeader label="Название акции" sortKey="name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <SortHeader label="Проект" sortKey="project" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <SortHeader label={`Продано (${activeUnit})`} sortKey={soldSortKey} currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="text-center" />
                <SortHeader label="Скидки, М₽" sortKey="totalDiscount" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="text-center" />
                <SortHeader label="Всего помещений" sortKey="totalInPromo" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="text-center" tooltip="Сколько всего помещений было в акции" />
                <SortHeader label="Доля проданных, %" sortKey="soldShare" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="text-center" tooltip="Доля проданных по акции (% от акционных помещений)" />
                <SortHeader label="Конверсия, %" sortKey="conversionRate" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="text-center" tooltip="из брони в продажу" />
                <SortHeader label="Вклад в выручку, %" sortKey="revenueContribution" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="text-center" />
              </tr>
            </thead>
            <tbody>
              {filteredAnalytics.map(a => (
                <tr key={a.promoId} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer transition-all hover:scale-[1.002] active:scale-100 group" onClick={() => a.promo && onRowClick(a.promo)}>
                  <td className={COMMON_STYLES.TABLE_CELL + " font-bold group-hover:text-[#6699CC]"}>{a.promo?.name}</td>
                  <td className={COMMON_STYLES.TABLE_CELL + " text-slate-500"}>{a.promo?.project}</td>
                  <td className={COMMON_STYLES.TABLE_CELL + " text-center font-bold"}>
                    <span>{activeUnit === 'шт' ? `${a.soldCount} шт.` : activeUnit === 'м²' ? `${a.soldArea} м²` : activeUnit === 'руб' ? `${(a.revenue / 1000000).toFixed(1)} М₽` : `${a.conversionRate}%`}</span>
                  </td>
                  <td className={COMMON_STYLES.TABLE_CELL + " text-center text-orange-500 font-bold"}>{(a.totalDiscount / 1000000).toFixed(2)}</td>
                  <td className={COMMON_STYLES.TABLE_CELL + " text-center text-slate-500"}>{a.totalInPromo}</td>
                  <td className={COMMON_STYLES.TABLE_CELL + " text-center font-bold"}>{a.soldShare.toFixed(1)}%</td>
                  <td className={COMMON_STYLES.TABLE_CELL + " text-center font-bold text-emerald-600"}>{a.conversionRate}%</td>
                  <td className={COMMON_STYLES.TABLE_CELL + " text-center font-black text-[#6699CC]"}>{a.revenueContribution.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
