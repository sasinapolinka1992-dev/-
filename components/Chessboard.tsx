
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Unit } from '../types';
import { COMMON_STYLES } from '../constants';

interface ChessboardProps {
  units: Unit[];
  selectedIds: string[];
  onToggleUnit: (id: string) => void;
  onMassSelect?: (ids: string[]) => void;
  isLoading?: boolean;
}

const Chessboard: React.FC<ChessboardProps> = ({ units, selectedIds, onToggleUnit, onMassSelect, isLoading = false }) => {
  const [currentProject, setCurrentProject] = useState('ЖК "Гранд Тауэрс"');
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  
  // Selection box state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const floors = useMemo(() => Array.from({ length: 18 }, (_, i) => 18 - i), []);
  const sections = useMemo(() => ['1', '2', '3'], []);
  const stackKeys = useMemo(() => ['01', '02', '03', '04'], []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !containerRef.current) return;
    if ((e.target as HTMLElement).closest('button')) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;
    startPos.current = { x, y };
    setIsSelecting(true);
    setSelectionBox({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left + containerRef.current.scrollLeft;
    const currentY = e.clientY - rect.top + containerRef.current.scrollTop;

    const x = Math.min(startPos.current.x, currentX);
    const y = Math.min(startPos.current.y, currentY);
    const w = Math.abs(startPos.current.x - currentX);
    const h = Math.abs(startPos.current.y - currentY);

    setSelectionBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);

    if (selectionBox && onMassSelect) {
      const unitButtons = containerRef.current?.querySelectorAll('[data-unit-id]');
      const newlySelectedIds: string[] = [];
      
      unitButtons?.forEach(btn => {
        const bRect = (btn as HTMLElement).getBoundingClientRect();
        const cRect = containerRef.current!.getBoundingClientRect();
        
        const btnX = bRect.left - cRect.left + containerRef.current!.scrollLeft;
        const btnY = bRect.top - cRect.top + containerRef.current!.scrollTop;

        const intersects = (
          btnX < selectionBox.x + selectionBox.w &&
          btnX + bRect.width > selectionBox.x &&
          btnY < selectionBox.y + selectionBox.h &&
          btnY + bRect.height > selectionBox.y
        );

        if (intersects) {
          const id = (btn as HTMLElement).getAttribute('data-unit-id');
          if (id) {
            const unit = units.find(u => u.id === id);
            if (unit && unit.status === 'Свободно') newlySelectedIds.push(id);
          }
        }
      });

      if (newlySelectedIds.length > 0) {
        onMassSelect(Array.from(new Set([...selectedIds, ...newlySelectedIds])));
      }
    }
    setSelectionBox(null);
  };

  const handleSelectAll = () => onMassSelect?.(units.filter(u => u.status === 'Свободно').map(u => u.id));
  const handleClearAll = () => onMassSelect?.([]);

  const handleSelectFloorInSection = (section: string, floor: number) => {
    const floorUnitIds = units.filter(u => u.section === section && u.floor === floor && u.status === 'Свободно').map(u => u.id);
    if (floorUnitIds.length === 0) return;
    const allFloorSelected = floorUnitIds.every(id => selectedIds.includes(id));
    
    if (allFloorSelected) {
      onMassSelect?.(selectedIds.filter(id => !floorUnitIds.includes(id)));
    } else {
      onMassSelect?.(Array.from(new Set([...selectedIds, ...floorUnitIds])));
    }
  };

  const handleSelectStackInSection = (section: string, stack: string) => {
    const stackUnitIds = units.filter(u => u.section === section && u.number.endsWith(stack) && u.status === 'Свободно').map(u => u.id);
    if (stackUnitIds.length === 0) return;
    const allStackSelected = stackUnitIds.every(id => selectedIds.includes(id));

    if (allStackSelected) {
      onMassSelect?.(selectedIds.filter(id => !stackUnitIds.includes(id)));
    } else {
      onMassSelect?.(Array.from(new Set([...selectedIds, ...stackUnitIds])));
    }
  };

  const getHeatmapColor = (popularity: number = 0) => {
    if (!isHeatmapMode) return '';
    if (popularity > 80) return 'bg-rose-500 text-white border-rose-600';
    if (popularity > 50) return 'bg-orange-400 text-white border-orange-500';
    if (popularity > 20) return 'bg-amber-200 text-amber-900 border-amber-300';
    return 'bg-emerald-50 text-emerald-900 border-emerald-100';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full space-y-4 animate-pulse p-8">
        <div className="h-16 bg-slate-100 rounded-xl"></div>
        <div className="flex-1 bg-slate-50 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col flex-1 min-h-0 overflow-hidden select-none px-8 pb-4">
      {/* Controls Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shrink-0 mt-2">
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Объект</label>
            <select value={currentProject} onChange={(e) => setCurrentProject(e.target.value)} className={`${COMMON_STYLES.INPUT} h-11 min-w-[240px] font-bold shadow-sm`}>
              <option>ЖК "Гранд Тауэрс"</option>
              <option>Резиденция Набережная</option>
              <option>Скай Гарден</option>
            </select>
          </div>
          <div className="flex gap-2 self-end pb-0.5">
            <button onClick={handleSelectAll} className="px-4 h-9 text-[11px] font-bold border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600">Выделить все</button>
            <button onClick={handleClearAll} className="px-4 h-9 text-[11px] font-bold border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-400">Сброс</button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsHeatmapMode(!isHeatmapMode)}
            className={`flex items-center gap-2 px-4 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all border ${isHeatmapMode ? 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-200' : 'bg-white text-slate-400 border-slate-200 hover:border-orange-500 hover:text-orange-500'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.5-7 3 3 3 6 1 9 2-2 5-2 5-2z"></path></svg>
            Тепловая карта
          </button>
          <div className="flex gap-6 text-[11px] text-slate-500 font-bold bg-slate-50/80 px-5 py-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border border-slate-200 bg-white rounded-md shadow-sm"></div> Свободно</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-[#6699CC] rounded-md shadow-md shadow-[#6699CC]/20"></div> Выбрано</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-slate-100 border border-slate-200 rounded-md"></div> Продано</div>
          </div>
        </div>
      </div>

      {/* Main Grid Container */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 min-h-0 overflow-auto custom-scrollbar border border-slate-100 rounded-2xl relative bg-slate-50/30 cursor-crosshair"
      >
        {isSelecting && selectionBox && (
          <div 
            className="absolute z-50 border-2 border-[#6699CC] bg-[#6699CC]/10 pointer-events-none rounded-sm"
            style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }}
          />
        )}

        <div className="min-w-max flex flex-col">
          {/* Sticky Header Row */}
          <div className="flex sticky top-0 z-30 bg-[#FBFDFF] border-b border-slate-100 shadow-sm">
            {/* Corner Cell (Floor label space) */}
            <div className="w-20 shrink-0 bg-[#FBFDFF] sticky left-0 z-40"></div>
            
            {sections.map(section => (
              <div key={section} className="flex flex-col border-r border-slate-100 last:border-0 px-6 py-4 bg-[#FBFDFF]">
                <div className="text-center font-bold text-[#6699CC] text-[10px] uppercase mb-4 tracking-[0.2em]">Секция {section}</div>
                <div className="flex gap-2"> 
                  <div className="w-6 shrink-0"></div>
                  {stackKeys.map(stack => (
                    <div key={stack} className="flex flex-col items-center w-14 gap-2">
                       <span className="text-[10px] font-bold text-slate-400">{stack}</span>
                       <button 
                         onClick={() => handleSelectStackInSection(section, stack)}
                         className="w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center hover:border-[#6699CC] transition-all shadow-sm group"
                       >
                         <div className={`w-1.5 h-1.5 rounded-full ${units.filter(u => u.section === section && u.number.endsWith(stack) && u.status === 'Свободно').every(u => selectedIds.includes(u.id)) && units.filter(u => u.section === section && u.number.endsWith(stack) && u.status === 'Свободно').length > 0 ? 'bg-[#6699CC]' : 'bg-transparent group-hover:bg-[#6699CC]/20'}`}></div>
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          <div className="flex flex-col p-8 pt-4">
            {floors.map(floor => (
              <div key={floor} className="flex items-center mb-2 group">
                {/* Floor Label - Sticky Left */}
                <div className="w-20 shrink-0 flex items-center justify-end pr-4 gap-2 sticky left-0 z-10 bg-inherit group-hover:bg-white/80 transition-colors">
                  <span className="font-bold text-slate-400 text-[11px] w-6 text-right whitespace-nowrap">{floor} эт.</span>
                </div>
                
                <div className="flex h-14">
                  {sections.map(section => (
                    <div key={section} className="flex items-center gap-2 border-r border-slate-100 last:border-0 px-6">
                      <div className="w-6 shrink-0 flex items-center justify-center">
                         <button 
                           onClick={() => handleSelectFloorInSection(section, floor)}
                           className="w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center hover:border-[#6699CC] transition-all shadow-sm group"
                         >
                           <div className={`w-1.5 h-1.5 rounded-full ${units.filter(u => u.section === section && u.floor === floor && u.status === 'Свободно').every(u => selectedIds.includes(u.id)) && units.filter(u => u.section === section && u.floor === floor && u.status === 'Свободно').length > 0 ? 'bg-[#6699CC]' : 'bg-transparent group-hover:bg-[#6699CC]/20'}`}></div>
                         </button>
                      </div>
                      {stackKeys.map(stack => {
                        const unit = units.find(u => u.section === section && u.floor === floor && u.number.endsWith(stack));
                        if (!unit) return <div key={stack} className="w-14 h-14"></div>;
                        const isSelected = selectedIds.includes(unit.id);
                        const isUnavailable = unit.status !== 'Свободно';
                        const heatmapClass = isHeatmapMode ? getHeatmapColor(unit.popularity) : '';
                        
                        return (
                          <button 
                            key={unit.id} 
                            data-unit-id={unit.id}
                            onClick={() => !isUnavailable && onToggleUnit(unit.id)} 
                            className={`w-14 h-14 flex flex-col items-center justify-center border transition-all rounded-xl shadow-sm ${isUnavailable ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-300' : isSelected ? 'bg-[#6699CC] border-[#5577BB] text-white shadow-lg shadow-[#6699CC]/30 ring-2 ring-white ring-inset scale-[0.96]' : heatmapClass || 'bg-white border-slate-100 hover:border-[#6699CC] text-slate-700 hover:shadow-md hover:translate-y-[-1px] active:translate-y-0'}`} 
                          >
                            <span className="text-[11px] leading-tight font-extrabold">{unit.number}</span>
                            <span className="text-[9px] font-medium opacity-60 mt-0.5">{unit.area}м²</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chessboard;
