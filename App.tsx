import React, { useState, useMemo, useCallback } from 'react';
import { Promotion, PromotionStatus, Unit, PromotionType, AdjustmentType } from './types';
import { COMMON_STYLES } from './constants';
import { MOCK_UNITS, MOCK_PROMOTIONS } from './services/mockData';
import PromotionForm from './components/PromotionForm';
import Chessboard from './components/Chessboard';
import AppearanceSettingsModal from './components/AppearanceSettingsModal';
import AnalyticsTab from './components/AnalyticsTab';
import PromotionDetailSidebar from './components/PromotionDetailSidebar';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '...';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};

const calculatePriceWithPromo = (unitPrice: number, promo: Promotion) => {
  let finalPrice = unitPrice;
  const value = promo.adjustmentValue;
  const isDown = promo.adjustmentMode === 'Понижение';
  
  if (promo.adjustmentType === AdjustmentType.COST_PERCENT || promo.type === PromotionType.DISCOUNT) {
    finalPrice = isDown ? unitPrice * (1 - value / 100) : unitPrice * (1 + value / 100);
  } else if (promo.adjustmentType === AdjustmentType.FIXED_COST) {
    finalPrice = isDown ? unitPrice - value : unitPrice + value;
  } else {
    // Fallback for others
    finalPrice = isDown ? unitPrice * 0.95 : unitPrice;
  }
  return Math.round(finalPrice);
};

const MultiSelectFilter = ({ label, options, selected = [], onChange }: { label: string, options: string[], selected: string[], onChange: (vals: string[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative flex flex-col gap-1.5 min-w-0">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 truncate">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`${COMMON_STYLES.INPUT} flex items-center justify-between cursor-pointer hover:border-[#6699CC] transition-all`}
      >
        <span className="truncate text-[12px] font-medium">
          {selected.length === 0 ? 'Все' : selected.join(', ')}
        </span>
        <svg className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[70] py-1 max-h-60 overflow-y-auto custom-scrollbar">
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-[12px] font-medium text-slate-600">
                <input 
                  type="checkbox" 
                  checked={selected.includes(opt)}
                  onChange={() => {
                    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
                    onChange(next);
                  }}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#6699CC]"
                />
                {opt}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onChange(); }}
    className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-[#6699CC]' : 'bg-slate-200'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);

const FilterItem = ({ label, children, className = "" }: { label: string, children?: React.ReactNode, className?: string }) => (
  <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 truncate">{label}</label>
    {children}
  </div>
);

const SortHeader = ({ label, sortKey, currentSortKey, sortOrder, onSort, className = "" }: { label: string, sortKey: string, currentSortKey: string, sortOrder: 'asc' | 'desc', onSort: (key: any) => void, className?: string }) => (
  <th className={`${COMMON_STYLES.TABLE_HEADER} ${className} px-4 py-4`}>
    <div className="flex items-center gap-1.5 cursor-pointer select-none group" onClick={() => onSort(sortKey)}>
      <span className="group-hover:text-slate-900 transition-colors whitespace-nowrap">{label}</span>
      <div className={`flex flex-col text-[8px] items-center leading-[0.5] ${currentSortKey === sortKey ? 'text-[#6699CC]' : 'text-slate-300 transition-opacity'}`}>
        <span className={currentSortKey === sortKey && sortOrder === 'asc' ? 'text-[#6699CC]' : ''}>▲</span>
        <span className={currentSortKey === sortKey && sortOrder === 'desc' ? 'text-[#6699CC]' : ''}>▼</span>
      </div>
    </div>
  </th>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Registry' | 'Analytics'>('Registry');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  const [promotions, setPromotions] = useState<Promotion[]>(MOCK_PROMOTIONS);
  const [units] = useState<Unit[]>(MOCK_UNITS);
  const [selectedPromoIds, setSelectedPromoIds] = useState<string[]>([]);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChessboardOverlayOpen, setIsChessboardOverlayOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [isBulkPeriodModalOpen, setIsBulkPeriodModalOpen] = useState(false);
  const [isUnitListModalOpen, setIsUnitListModalOpen] = useState(false);
  
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
  const [appearancePromo, setAppearancePromo] = useState<Promotion | null>(null);
  const [detailPromo, setDetailPromo] = useState<Promotion | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<Promotion | null>(null);
  const [unitListPromo, setUnitListPromo] = useState<Promotion | null>(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'error' | 'success'}[]>([]);

  const [sortKey, setSortKey] = useState<keyof Promotion | 'unitCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [regStatus, setRegStatus] = useState('');
  const [regDateCreated, setRegDateCreated] = useState('');
  const [regNames, setRegNames] = useState<string[]>([]);
  const [regPeriodFrom, setRegPeriodFrom] = useState('');
  const [regPeriodTo, setRegPeriodTo] = useState('');
  const [regProjects, setRegProjects] = useState<string[]>([]);
  const [regTypes, setRegTypes] = useState<string[]>([]);
  const [regPriority, setRegPriority] = useState('');

  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');

  const promoNames = useMemo(() => Array.from(new Set(promotions.map(p => p.name))).sort(), [promotions]);
  const projects = useMemo(() => Array.from(new Set(promotions.map(p => p.project))).sort(), [promotions]);
  const priorities = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], []);

  const filteredPromotions = useMemo(() => {
    let result = [...promotions];
    if (regStatus === 'Активные') result = result.filter(p => p.status === PromotionStatus.ACTIVE);
    else if (regStatus === 'Деактивированы') result = result.filter(p => p.status !== PromotionStatus.ACTIVE);
    if (regDateCreated) result = result.filter(p => p.createdAt === regDateCreated);
    if (regNames.length > 0) result = result.filter(p => regNames.includes(p.name));
    if (regPeriodFrom) result = result.filter(p => p.startDate >= regPeriodFrom);
    if (regPeriodTo) result = result.filter(p => p.endDate && p.endDate <= regPeriodTo);
    if (regProjects.length > 0) result = result.filter(p => regProjects.includes(p.project));
    if (regTypes.length > 0) result = result.filter(p => regTypes.includes(p.type));
    if (regPriority) result = result.filter(p => p.priority === parseInt(regPriority));
    
    result.sort((a, b) => {
      let valA: any = (a as any)[sortKey] ?? '';
      let valB: any = (b as any)[sortKey] ?? '';
      
      if (sortKey === 'unitIds') {
        valA = a.unitIds.length;
        valB = b.unitIds.length;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [promotions, regStatus, regDateCreated, regNames, regPeriodFrom, regPeriodTo, regProjects, regTypes, regPriority, sortKey, sortOrder]);

  const addNotification = useCallback((message: string, type: 'error' | 'success' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  const handleEditPromo = (promo: Promotion) => {
    setEditingPromo(promo);
    setSelectedUnitIds(promo.unitIds);
    setIsSidebarOpen(true);
  };

  const handleCopyPromo = (promo: Promotion) => {
    const newName = promo.name.includes('(копия)') ? promo.name : `${promo.name} (копия)`;
    const newPromo: Promotion = {
      ...promo,
      id: `p-${Date.now()}`,
      name: newName,
      createdAt: new Date().toISOString().split('T')[0],
      status: PromotionStatus.ACTIVE
    };
    setPromotions(prev => [newPromo, ...prev]);
    addNotification(`Создана копия: ${newName}`);
  };

  const handleDeleteClick = (promo: Promotion) => {
    setPromoToDelete(promo);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (promoToDelete) {
      setPromotions(prev => prev.filter(p => p.id !== promoToDelete.id));
      addNotification(`Акция "${promoToDelete.name}" удалена`, "success");
      setIsDeleteModalOpen(false);
      setPromoToDelete(null);
    }
  };

  const handleOpenAppearance = (promo: Promotion) => {
    setAppearancePromo(promo);
    setIsAppearanceModalOpen(true);
  };

  const handleOpenDetail = (promo: Promotion) => {
    setDetailPromo(promo);
    setIsDetailSidebarOpen(true);
  };

  const handleShowUnits = (promo: Promotion) => {
    setUnitListPromo(promo);
    setIsUnitListModalOpen(true);
  };

  const handleSavePromo = (data: any) => {
    const newPromo: Promotion = {
      id: data.id || `p-${Date.now()}`,
      name: data.name || 'Новая акция',
      shortDescription: data.shortDescription || data.description || '',
      project: data.project || 'ЖК "Гранд Тауэрс"',
      status: PromotionStatus.ACTIVE,
      type: data.type as any,
      adjustmentValue: Number(data.adjustmentValue || data.value),
      adjustmentType: data.adjustmentType,
      adjustmentMode: data.adjustmentMode || 'Понижение',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      unitIds: [...selectedUnitIds],
      priority: Number(data.priority),
      isStackable: !!data.isStackable,
      createdAt: data.createdAt || new Date().toISOString().split('T')[0],
      appearance: data.appearance,
      showOnDomclick: data.displayOnDomclick
    };
    if (data.id && promotions.find(p => p.id === data.id)) {
      setPromotions(prev => prev.map(p => data.id === p.id ? newPromo : p));
      addNotification("Изменения сохранены");
    } else {
      setPromotions(prev => [newPromo, ...prev]);
      addNotification("Акция успешно создана");
    }
    setIsSidebarOpen(false);
    setEditingPromo(null);
  };

  const togglePromoStatus = (id: string) => {
    const promo = promotions.find(p => p.id === id);
    if (!promo) return;
    const willBeActive = promo.status !== PromotionStatus.ACTIVE;
    const notifyMessage = willBeActive ? "Акция включена" : "Акция выключена";
    setPromotions(prev => prev.map(p => id === p.id ? { ...p, status: willBeActive ? PromotionStatus.ACTIVE : PromotionStatus.ARCHIVED } : p));
    addNotification(notifyMessage);
  };

  const handleResetFilters = () => {
    setRegStatus(''); setRegDateCreated(''); setRegNames([]); setRegPeriodFrom('');
    setRegPeriodTo(''); setRegProjects([]); setRegTypes([]); setRegPriority('');
  };

  const handleSort = (key: any) => {
    setSortKey(key);
    setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
  };

  const handleExport = (format: 'Excel' | 'PDF') => {
    addNotification(`Экспорт в ${format} запущен...`);
    setIsExportMenuOpen(false);
    setTimeout(() => addNotification(`Файл ${format} успешно загружен`), 1500);
  };

  const handleBulkStatusChange = (status: PromotionStatus) => {
    setPromotions(prev => prev.map(p => selectedPromoIds.includes(p.id) ? { ...p, status } : p));
    addNotification(`Статус изменен для ${selectedPromoIds.length} акций`);
    setIsBulkStatusModalOpen(false);
    setSelectedPromoIds([]);
  };

  const handleBulkPeriodApply = () => {
    setPromotions(prev => prev.map(p => selectedPromoIds.includes(p.id) ? { 
      ...p, 
      startDate: bulkStartDate || p.startDate, 
      endDate: bulkEndDate || p.endDate 
    } : p));
    addNotification(`Период обновлен для ${selectedPromoIds.length} акций`);
    setIsBulkPeriodModalOpen(false);
    setSelectedPromoIds([]);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-['Roboto'] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className={`px-5 py-4 rounded-xl shadow-2xl text-white text-sm font-semibold animate-slide-in pointer-events-auto flex items-center gap-3 ${n.type === 'error' ? 'bg-rose-500' : 'bg-slate-900'}`}>
              <div className={`w-2 h-2 rounded-full ${n.type === 'error' ? 'bg-white' : 'bg-emerald-400'}`}></div>
              {n.message}
            </div>
          ))}
        </div>

        <header className="px-8 bg-white border-b border-slate-200 flex items-center justify-between h-[72px] shrink-0 shadow-sm z-30">
          <div className="flex gap-10 h-full">
            <button onClick={() => setActiveTab('Registry')} className={`relative px-1 flex items-center h-full font-bold transition-all ${activeTab === 'Registry' ? 'text-[#6699CC]' : 'text-slate-400 hover:text-slate-600'}`}>
              Реестр акций
              {activeTab === 'Registry' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6699CC] rounded-t-full"></div>}
            </button>
            <button onClick={() => setActiveTab('Analytics')} className={`relative px-1 flex items-center h-full font-bold transition-all ${activeTab === 'Analytics' ? 'text-[#6699CC]' : 'text-slate-400 hover:text-slate-600'}`}>
              Аналитика
              {activeTab === 'Analytics' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6699CC] rounded-t-full"></div>}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className={COMMON_STYLES.SECONDARY_BUTTON + " gap-2"}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Экспорт
              </button>
              {isExportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setIsExportMenuOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-[50] w-48 py-1 overflow-hidden animate-fade-in">
                    <button onClick={() => handleExport('Excel')} className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors text-sm font-bold flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">X</span> Excel
                    </button>
                    <button onClick={() => handleExport('PDF')} className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors text-sm font-bold flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-black">P</span> PDF
                    </button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => { setEditingPromo(null); setSelectedUnitIds([]); setIsSidebarOpen(true); }} className={COMMON_STYLES.BUTTON + " gap-2"}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Создать акцию
            </button>
          </div>
        </header>

        {selectedPromoIds.length > 0 && activeTab === 'Registry' && (
          <div className="h-14 bg-[#6699CC] text-white flex items-center justify-between px-10 animate-fade-in shadow-xl z-20 shrink-0">
            <div className="flex items-center gap-4">
              <span className="font-bold text-sm">Выбрано: {selectedPromoIds.length}</span>
              <button onClick={() => setSelectedPromoIds([])} className="text-xs uppercase font-black hover:opacity-70 border-b border-white/40 ml-2">Отменить выбор</button>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsBulkStatusModalOpen(true)} className="px-4 h-9 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all">Сменить статус</button>
              <button onClick={() => setIsBulkPeriodModalOpen(true)} className="px-4 h-9 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all">Изменить период</button>
              <button onClick={() => { setPromotions(prev => prev.filter(p => !selectedPromoIds.includes(p.id))); addNotification("Акции удалены"); setSelectedPromoIds([]); }} className="px-4 h-9 bg-rose-500 hover:bg-rose-600 rounded-lg text-xs font-bold transition-all shadow-lg">Удалить выбранные</button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 max-w-[1700px] mx-auto space-y-8">
            {activeTab === 'Registry' ? (
              <div className="animate-fade-in space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                    <FilterItem label="Статус">
                      <select value={regStatus} onChange={(e) => setRegStatus(e.target.value)} className={COMMON_STYLES.INPUT}>
                        <option value="">Все</option>
                        <option value="Активные">Активные</option>
                        <option value="Деактивированы">Деактивированы</option>
                      </select>
                    </FilterItem>
                    <FilterItem label="Период">
                      <div className="flex items-center gap-1 h-[40px]">
                        <input type="date" value={regPeriodFrom} onChange={(e) => setRegPeriodFrom(e.target.value)} className={`${COMMON_STYLES.INPUT} !px-2 !text-[11px] w-full min-w-0 flex-1`} />
                        <div className="text-slate-300 px-0.5">/</div>
                        <input type="date" value={regPeriodTo} onChange={(e) => setRegPeriodTo(e.target.value)} className={`${COMMON_STYLES.INPUT} !px-2 !text-[11px] w-full min-w-0 flex-1`} />
                      </div>
                    </FilterItem>
                    <FilterItem label="Дата создания">
                      <input type="date" value={regDateCreated} onChange={(e) => setRegDateCreated(e.target.value)} className={COMMON_STYLES.INPUT} />
                    </FilterItem>
                    <MultiSelectFilter label="Акция" options={promoNames} selected={regNames} onChange={setRegNames} />
                    <MultiSelectFilter label="Проект" options={projects} selected={regProjects} onChange={setRegProjects} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 items-end">
                    <MultiSelectFilter label="Тип акции" options={Object.values(PromotionType)} selected={regTypes} onChange={setRegTypes} />
                    <FilterItem label="Приоритет">
                      <select value={regPriority} onChange={(e) => setRegPriority(e.target.value)} className={COMMON_STYLES.INPUT}>
                        <option value="">Все</option>
                        {priorities.map(p => <option key={p} value={p.toString()}>{p}</option>)}
                      </select>
                    </FilterItem>
                    <div className="lg:col-span-3 flex justify-end">
                      <button onClick={handleResetFilters} className="h-[40px] px-6 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-[10px] text-[12px] font-bold uppercase transition-all">Сбросить</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr>
                        <th className="px-2 py-4 border-b border-slate-100 bg-slate-50/80 w-[48px] text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedPromoIds.length === filteredPromotions.length && filteredPromotions.length > 0} 
                            onChange={(e) => setSelectedPromoIds(e.target.checked ? filteredPromotions.map(p => p.id) : [])}
                            className="w-4 h-4 rounded border-slate-300 text-[#6699CC]"
                          />
                        </th>
                        <SortHeader label="Статус" sortKey="status" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="w-[72px]" />
                        <SortHeader label="Создана" sortKey="createdAt" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="w-[100px]" />
                        <SortHeader label="Акция" sortKey="name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="w-[240px]" />
                        <SortHeader label="Период" sortKey="startDate" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="w-[155px]" />
                        <SortHeader label="Объект" sortKey="project" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="w-auto" />
                        <SortHeader label="Тип" sortKey="type" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="w-[110px]" />
                        <SortHeader label="Условия" sortKey="adjustmentValue" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="w-[135px]" />
                        <SortHeader label="Приор." sortKey="priority" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} className="w-[70px]" />
                        <th className={COMMON_STYLES.TABLE_HEADER + " text-right px-4 w-[145px]"}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPromotions.map(p => (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-all group cursor-pointer ${selectedPromoIds.includes(p.id) ? 'bg-blue-50/50' : ''}`} 
                          onClick={() => handleEditPromo(p)}
                        >
                          <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                             <input 
                               type="checkbox" 
                               checked={selectedPromoIds.includes(p.id)} 
                               onChange={(e) => {
                                 const checked = e.target.checked;
                                 setSelectedPromoIds(prev => checked ? [...prev, p.id] : prev.filter(id => id !== p.id));
                               }}
                               className="w-4 h-4 rounded border-slate-300 text-[#6699CC]"
                             />
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><Toggle checked={p.status === PromotionStatus.ACTIVE} onChange={() => togglePromoStatus(p.id)} /></td>
                          <td className="px-4 py-3 text-[11px] font-medium text-slate-400">{formatDate(p.createdAt)}</td>
                          <td className="px-4 py-3">
                             <div className="flex flex-col gap-1 min-w-0">
                               <span className="font-bold text-[13px] truncate" title={p.name}>{p.name}</span>
                             </div>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">
                             {formatDate(p.startDate)} — {formatDate(p.endDate)}
                          </td>
                          <td className="px-4 py-3">
                             <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
                                <span className="font-semibold text-slate-700 leading-none text-[12px] truncate" title={p.project}>{p.project}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleShowUnits(p); }} className="text-[10px] font-bold text-[#6699CC] bg-[#6699CC]/10 px-1.5 py-0.5 rounded-full self-start hover:bg-[#6699CC]/20 transition-all">
                                  {p.unitIds.length} пом.
                                </button>
                             </div>
                          </td>
                          <td className="px-4 py-3"><span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-slate-500 truncate inline-block max-w-full">{p.type}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className={`font-bold whitespace-nowrap text-[13px] leading-tight ${p.adjustmentMode === 'Понижение' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                {p.adjustmentMode === 'Понижение' ? '↓' : '↑'} {p.adjustmentValue.toLocaleString()}{p.adjustmentType?.includes('%') || p.type.includes('%') ? '%' : ' ₽'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold truncate leading-tight mt-0.5">
                                {p.adjustmentType || 'не указано'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                               <div className={`w-2 h-2 rounded-full ${p.priority >= 8 ? 'bg-[#6699CC]' : p.priority >= 4 ? 'bg-indigo-200' : 'bg-slate-200'}`}></div>
                               <span className={`font-bold text-[13px] ${p.priority >= 8 ? 'text-[#6699CC]' : 'text-slate-700'}`}>{p.priority}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                             <div className="flex justify-end gap-0.5">
                               <button onClick={() => handleOpenAppearance(p)} className="p-1.5 text-slate-400 hover:text-[#6699CC] hover:bg-white rounded-lg transition-all" title="Внешний вид">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a4.5 4.5 0 0 1-4.5-4.5V5.5A2.5 2.5 0 0 1 10 3h4a2.5 2.5 0 0 1 2.5 2.5V16.5A4.5 4.5 0 0 1 12 21zm-2-15.5v11a2.5 2.5 0 0 0 5 0v-11a0.5 0.5 0 0 0-0.5-0.5h-4a0.5 0.5 0 0 0-0.5 0.5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 16.5h6"></path></svg>
                               </button>
                               <button onClick={() => handleCopyPromo(p)} className="p-1.5 text-slate-400 hover:text-[#6699CC] hover:bg-white rounded-lg transition-all" title="Копировать">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                               </button>
                               <button onClick={() => handleEditPromo(p)} className="p-1.5 text-slate-400 hover:text-[#6699CC] hover:bg-white rounded-lg transition-all" title="Изменить">
                                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                               </button>
                               <button onClick={() => handleDeleteClick(p)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all" title="Удалить">
                                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-[12px] uppercase text-slate-400 tracking-wider">Итого</td>
                        <td colSpan={6} className="px-6 py-4 text-slate-700 text-[13px]">
                           Всего акций: <span className="text-[#6699CC] mr-4">{filteredPromotions.length}</span>
                           Включено: <span className="text-emerald-500">{filteredPromotions.filter(p => p.status === PromotionStatus.ACTIVE).length}</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <AnalyticsTab promotions={promotions} units={units} onRowClick={handleOpenDetail} />
            )}
          </div>
        </main>
      </div>

      {isUnitListModalOpen && unitListPromo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUnitListModalOpen(false)}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[80vh] flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-slate-900">Помещения в акции: {unitListPromo.name}</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="py-3">Номер</th>
                      <th className="py-3">Секция</th>
                      <th className="py-3">Этаж</th>
                      <th className="py-3">Площадь</th>
                      <th className="py-3">Стоимость без акции</th>
                      <th className="py-3">Стоимость по акции</th>
                      <th className="py-3 text-right">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {units.filter(u => unitListPromo.unitIds.includes(u.id)).map(u => (
                      <tr key={u.id} className="text-[13px] hover:bg-slate-50">
                        <td className="py-3 font-bold">{u.number}</td>
                        <td className="py-3 text-slate-500">{u.section}</td>
                        <td className="py-3">{u.floor}</td>
                        <td className="py-3">{u.area} м²</td>
                        <td className="py-3 text-slate-400 line-through">{u.price.toLocaleString()} ₽</td>
                        <td className="py-3 font-bold text-[#6699CC]">{calculatePriceWithPromo(u.price, unitListPromo as Promotion).toLocaleString()} ₽</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.status === 'Свободно' ? 'bg-emerald-50 text-emerald-600' :
                            u.status === 'Бронь' ? 'bg-amber-50 text-amber-600' :
                            u.status === 'Резерв' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-slate-100 text-slate-400'
                          }`}>{u.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setIsUnitListModalOpen(false)} className="w-full mt-6 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm transition-all text-slate-600">Закрыть</button>
           </div>
        </div>
      )}

      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBulkStatusModalOpen(false)}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-sm w-full">
              <h3 className="text-xl font-bold mb-6 text-slate-900 text-center">Изменить статус</h3>
              <div className="grid grid-cols-1 gap-3">
                {[PromotionStatus.ACTIVE, PromotionStatus.ARCHIVED].map(status => (
                  <button 
                    key={status} 
                    onClick={() => handleBulkStatusChange(status)}
                    className={`h-12 border rounded-xl transition-all font-bold text-sm flex items-center justify-center gap-3 ${status === PromotionStatus.ACTIVE ? 'border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-400 hover:bg-slate-50 text-slate-600'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${status === PromotionStatus.ACTIVE ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                    {status === PromotionStatus.ACTIVE ? 'Активировать' : 'В архив'}
                  </button>
                ))}
              </div>
              <button onClick={() => setIsBulkStatusModalOpen(false)} className="w-full mt-6 text-slate-400 text-xs font-bold uppercase hover:text-slate-600">Отмена</button>
           </div>
        </div>
      )}

      {isBulkPeriodModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBulkPeriodModalOpen(false)}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-sm w-full">
              <h3 className="text-xl font-bold mb-6 text-slate-900">Обновить период</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Дата начала</label>
                  <input type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} className={COMMON_STYLES.INPUT} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Дата окончания</label>
                  <input type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} className={COMMON_STYLES.INPUT} />
                </div>
                <div className="flex gap-3 pt-4">
                   <button onClick={() => setIsBulkPeriodModalOpen(false)} className={COMMON_STYLES.SECONDARY_BUTTON + " flex-1"}>Отмена</button>
                   <button onClick={handleBulkPeriodApply} className={COMMON_STYLES.BUTTON + " flex-1"}>Применить</button>
                </div>
              </div>
           </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-md w-full animate-fade-in">
            <h3 className="text-xl font-bold mb-3 text-slate-900">Удаление акции</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Вы уверены, что хотите удалить акцию <span className="font-bold text-slate-900 italic">«{promoToDelete?.name}»</span>? Это действие нельзя будет отменить.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className={COMMON_STYLES.SECONDARY_BUTTON}>Отмена</button>
              <button onClick={confirmDelete} className="h-[40px] px-6 text-white bg-rose-500 rounded-[10px] hover:bg-rose-600 transition-all font-bold text-[14px] shadow-lg shadow-rose-200">Удалить</button>
            </div>
          </div>
        </div>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setIsSidebarOpen(false)}></div>
          <div className={`${COMMON_STYLES.SIDEBAR} w-[540px] left-0 animate-slide-in-left flex flex-col`}>
            <PromotionForm initialData={editingPromo || {}} onSave={handleSavePromo} onCancel={() => setIsSidebarOpen(false)} openChessboard={() => setIsChessboardOverlayOpen(true)} selectedUnitsCount={selectedUnitIds.length} units={units} />
          </div>
        </div>
      )}

      {isChessboardOverlayOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsChessboardOverlayOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-full max-h-[94vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Подбор помещений</h2>
                <p className="text-slate-400 text-xs mt-1">Отметьте помещения, которые будут участвовать в акции</p>
              </div>
              <button onClick={() => setIsChessboardOverlayOpen(false)} className={COMMON_STYLES.BUTTON + " shadow-lg shadow-blue-100"}>Подтвердить ({selectedUnitIds.length})</button>
            </div>
            <div className="flex-1 min-h-0 bg-white flex flex-col overflow-hidden">
              <Chessboard units={units} selectedIds={selectedUnitIds} onToggleUnit={id => setSelectedUnitIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} onMassSelect={setSelectedUnitIds} />
            </div>
          </div>
        </div>
      )}

      {isAppearanceModalOpen && appearancePromo && (
        <AppearanceSettingsModal promo={appearancePromo} onClose={() => setIsAppearanceModalOpen(false)} onSave={(settings) => { setPromotions(prev => prev.map(p => p.id === appearancePromo.id ? { ...p, appearance: settings } : p)); setIsAppearanceModalOpen(false); addNotification("Дизайн успешно обновлен"); }} />
      )}

      {isDetailSidebarOpen && detailPromo && (
        <PromotionDetailSidebar promo={detailPromo} onClose={() => setIsDetailSidebarOpen(false)} />
      )}
    </div>
  );
};

export default App;
