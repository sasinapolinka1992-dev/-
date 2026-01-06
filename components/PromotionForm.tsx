
import React, { useState, useRef, useMemo } from 'react';
import { Promotion, PromotionType, Unit, AdjustmentType } from '../types';
import { COMMON_STYLES } from '../constants';

interface PromotionFormProps {
  initialData?: Partial<Promotion>;
  onSave: (data: Partial<Promotion>) => void;
  onCancel: () => void;
  openChessboard: () => void;
  selectedUnitsCount: number;
  units: Unit[];
}

const Switch = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <button onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-[#6699CC]' : 'bg-slate-200'}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const MultiSelect = ({ label, options, selected = [], onChange }: { label: string, options: string[], selected?: string[], onChange: (vals: string[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAllSelected = selected.length === options.length;
  return (
    <div className="relative space-y-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className={`${COMMON_STYLES.INPUT} flex items-center justify-between cursor-pointer group hover:border-[#6699CC] transition-all`} onClick={() => setIsOpen(!isOpen)}>
        <span className="truncate pr-4 text-sm font-medium">
          {selected.length === 0 ? 'Выберите из списка' : isAllSelected ? 'Выбраны все' : selected.join(', ')}
        </span>
        <svg className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180 text-[#6699CC]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-fade-in py-1">
            <div className="max-h-56 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 mb-1 font-bold text-slate-600 text-[13px]" onClick={() => isAllSelected ? onChange([]) : onChange([...options])}>
                <input type="checkbox" checked={isAllSelected} readOnly className="w-4 h-4 rounded border-slate-300 text-[#6699CC]" />
                Выбрать всё
              </div>
              {options.map(opt => (
                <div key={opt} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-600 text-[13px]" onClick={() => selected.includes(opt) ? onChange(selected.filter(s => s !== opt)) : onChange([...selected, opt])}>
                  <input type="checkbox" checked={selected.includes(opt)} readOnly className="w-4 h-4 rounded border-slate-300 text-[#6699CC]" />
                  {opt}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const PromotionForm: React.FC<PromotionFormProps> = ({ initialData, onSave, onCancel, openChessboard, selectedUnitsCount, units }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultValues = useMemo(() => ({ name: '', description: '', promoLink: '', image: null, type: PromotionType.DISCOUNT, value: 5, startDate: new Date().toISOString().split('T')[0], endDate: '', priority: 5, isStackable: false, maxTotalDiscount: 15, projects: ['ЖК "Гранд Тауэрс"'], sections: ['1', '2', '3'], unitTypes: ['Квартиры'], rooms: ['Студия', '1-к', '2-к', '3-к', '4-к'], areaMin: '', areaMax: '', statuses: ['Свободно'], priceDirection: 'down', costType: AdjustmentType.COST_PERCENT, displayOnDomclick: false }), []);
  const [formData, setFormData] = useState<any>(() => ({ ...defaultValues, ...initialData, promoLink: initialData?.link || '' }));

  const matchingUnitsCount = useMemo(() => {
    return units.filter(unit => {
      if (formData.sections.length > 0 && !formData.sections.includes(unit.section)) return false;
      const roomStr = unit.rooms === 0 ? 'Студия' : `${unit.rooms}-к`;
      if (formData.rooms.length > 0 && !formData.rooms.includes(roomStr)) return false;
      if (formData.areaMin && unit.area < Number(formData.areaMin)) return false;
      if (formData.areaMax && unit.area > Number(formData.areaMax)) return false;
      if (formData.statuses.length > 0 && !formData.statuses.includes(unit.status)) return false;
      return true;
    }).length;
  }, [units, formData.sections, formData.rooms, formData.areaMin, formData.areaMax, formData.statuses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev: any) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const projectOptions = ['ЖК "Гранд Тауэрс"', 'Резиденция Набережная', 'Скай Гарден'];
  const sectionOptions = ['1', '2', '3'];
  const unitTypeOptions = ['Квартиры', 'Апартаменты', 'Коммерция', 'Машиноместа', 'Кладовые'];
  const roomOptions = ['Студия', '1-к', '2-к', '3-к', '4-к'];
  const statusOptions = ['Свободно', 'Бронь', 'Продано'];

  return (
    <div className="p-8 flex flex-col h-full bg-white">
      <div className="mb-10 shrink-0">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">
          {initialData?.id ? 'Правка акции' : 'Новая акция'}
        </h2>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 h-12 flex items-center justify-center text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm">Отмена</button>
          <button onClick={() => onSave(formData)} className="flex-1 h-12 flex items-center justify-center gap-2 text-white bg-[#6699CC] rounded-xl hover:bg-[#5588BB] shadow-lg shadow-blue-100 transition-all font-bold text-sm">
            Сохранить
          </button>
        </div>
      </div>

      <div className="space-y-8 flex-1 overflow-y-auto pr-4 -mr-4 custom-scrollbar">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Название</label>
            <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Напр: Скидка 10% на 3-к" className={COMMON_STYLES.INPUT} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Описание</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Введите текст акции..." className={`${COMMON_STYLES.INPUT} h-24 py-3 resize-none`} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Баннер акции</label>
            {!formData.image ? (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#6699CC] hover:bg-blue-50/50 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#6699CC] group-hover:scale-110 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <p className="text-[13px] font-bold text-slate-400">Перетащите или кликните</p>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video group shadow-md">
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 hover:text-[#6699CC] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536"></path></svg></button>
                  <button onClick={(e) => { e.stopPropagation(); setFormData({...formData, image: null}); }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ссылка на акцию</label>
            <input name="promoLink" value={formData.promoLink || ''} onChange={handleChange} placeholder="https://..." className={COMMON_STYLES.INPUT} />
          </div>
        </div>

        <div className="space-y-6 bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-4 bg-[#6699CC] rounded-full"></div> Подбор помещений
          </h3>
          <MultiSelect label="Проект" options={projectOptions} selected={formData.projects} onChange={(vals) => setFormData({...formData, projects: vals})} />
          <MultiSelect label="Секции" options={sectionOptions} selected={formData.sections} onChange={(vals) => setFormData({...formData, sections: vals})} />
          <div className="grid grid-cols-2 gap-4">
             <MultiSelect label="Тип помещения" options={unitTypeOptions} selected={formData.unitTypes} onChange={(vals) => setFormData({...formData, unitTypes: vals})} />
             <MultiSelect label="Комнатность" options={roomOptions} selected={formData.rooms} onChange={(vals) => setFormData({...formData, rooms: vals})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Площадь, м²</label>
            <div className="flex items-center gap-3">
              <input type="number" name="areaMin" value={formData.areaMin || ''} onChange={handleChange} placeholder="От" className={COMMON_STYLES.INPUT} />
              <input type="number" name="areaMax" value={formData.areaMax || ''} onChange={handleChange} placeholder="До" className={COMMON_STYLES.INPUT} />
            </div>
          </div>
          <button onClick={openChessboard} className="w-full h-12 flex items-center justify-between px-5 bg-white border border-slate-200 rounded-xl hover:border-[#6699CC] transition-all group">
            <span className="flex items-center gap-3 text-sm font-bold text-slate-700 group-hover:text-[#6699CC]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              Подбор помещений
            </span>
            <span className="bg-[#6699CC] text-white text-[11px] px-3 py-1 rounded-full font-black shadow-md shadow-blue-200">{selectedUnitsCount || 0}</span>
          </button>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-4 bg-[#6699CC] rounded-full"></div> Условия
          </h3>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Срок действия</label>
            <div className="flex items-center gap-3">
              <input type="date" name="startDate" value={formData.startDate || ''} onChange={handleChange} className={COMMON_STYLES.INPUT} />
              <input type="date" name="endDate" value={formData.endDate || ''} onChange={handleChange} className={COMMON_STYLES.INPUT} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Тип акции</label>
            <select name="type" value={formData.type} onChange={handleChange} className={COMMON_STYLES.INPUT + " font-bold"}>
              <option value={PromotionType.DISCOUNT}>Скидка %</option>
              <option value={PromotionType.GIFT}>Подарок за покупку</option>
              <option value={PromotionType.M2_GIFT}>м² в подарок</option>
              <option value={PromotionType.FLAT_MONTH}>Квартира месяца</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1 px-1">чтобы добавить новый тип акции, напишите нам в чат @plan7_bot</p>
          </div>

          <div className="p-6 bg-[#6699CC]/5 border border-[#6699CC]/20 rounded-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#6699CC] uppercase tracking-widest px-1">Направление цены</label>
              <div className="flex gap-3">
                <button onClick={() => setFormData({...formData, priceDirection: 'up'})} className={`flex-1 h-11 rounded-xl text-sm font-extrabold border transition-all ${formData.priceDirection === 'up' ? 'bg-rose-500 border-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-white border-slate-200 text-slate-400'}`}>Повышение</button>
                <button onClick={() => setFormData({...formData, priceDirection: 'down'})} className={`flex-1 h-11 rounded-xl text-sm font-extrabold border transition-all ${formData.priceDirection === 'down' ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-200 text-slate-400'}`}>Снижение</button>
              </div>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-[#6699CC] uppercase tracking-widest px-1">Расчет суммы</label>
               <select 
                 name="adjustmentType" 
                 value={formData.adjustmentType} 
                 onChange={handleChange} 
                 className={COMMON_STYLES.INPUT + " font-medium"}
               >
                 <option value={AdjustmentType.COST_PERCENT}>% от стоимости</option>
                 <option value={AdjustmentType.M2_PERCENT}>% от квадратного метра</option>
                 <option value={AdjustmentType.FIXED_COST}>фиксированная сумма к стоимости</option>
                 <option value={AdjustmentType.FIXED_M2}>фиксированная сумма к стоимости за м²</option>
                 <option value={AdjustmentType.NTH_M2_GIFT}>каждый n м² в подарок</option>
               </select>
               <div className="flex items-center gap-4 mt-3">
                  <input type="number" name="adjustmentValue" value={formData.adjustmentValue || 0} onChange={handleChange} className={COMMON_STYLES.INPUT + " font-extrabold text-lg"} />
                  <span className="text-xl font-black text-[#6699CC]">
                    {formData.adjustmentType?.includes('фиксированная') ? '₽' : '%'}
                  </span>
               </div>
            </div>
          </div>

          <div className="p-6 border border-slate-200 rounded-2xl space-y-5">
            <label className="flex items-center gap-4 cursor-pointer group">
              <Switch checked={formData.isStackable} onChange={(val) => setFormData({...formData, isStackable: val})} />
              <span className="text-sm font-bold text-slate-700">Суммируется с другими акциями</span>
            </label>
            {formData.isStackable && (
              <div className="pt-4 border-t border-slate-100 animate-fade-in">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Макс. общий дисконт, %</label>
                <input type="number" name="maxTotalDiscount" value={formData.maxTotalDiscount || ''} onChange={handleChange} className={COMMON_STYLES.INPUT} />
              </div>
            )}
          </div>

          <div className="space-y-4 border border-slate-200 p-6 rounded-2xl">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-black uppercase tracking-wider px-1">Приоритет: {formData.priority}</label>
                <input type="range" min="1" max="10" name="priority" value={formData.priority || 5} onChange={handleChange} className="w-1/2" />
              </div>
              <p className="text-[9px] text-slate-500 italic leading-relaxed px-1">
                Если на помещение действует несколько акций, то та, у которой выше приоритет будет отображаться в шахматке в первую очередь.
              </p>
            </div>
          </div>

          <div className="p-6 border border-slate-200 rounded-2xl flex items-center justify-between gap-6 hover:border-[#6699CC] transition-colors cursor-pointer group">
             <div className="space-y-1">
                <span className="text-sm font-bold text-slate-800">Отображать на Домклик</span>
                <p className="text-[11px] text-slate-400 leading-tight">Автоматическая публикация акций в объявлениях</p>
             </div>
             <Switch checked={formData.displayOnDomclick} onChange={(val) => setFormData({...formData, displayOnDomclick: val})} />
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
        <span className="text-sm font-bold text-slate-400">Итого помещений:</span>
        <span className="text-2xl font-black text-[#6699CC]">
          {selectedUnitsCount || matchingUnitsCount}
        </span>
      </div>
    </div>
  );
};

export default PromotionForm;
