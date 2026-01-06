
import React, { useState } from 'react';
import { AppearanceSettings, Promotion } from '../types';
import { COMMON_STYLES } from '../constants';

interface AppearanceSettingsModalProps {
  promo: Promotion;
  onSave: (settings: AppearanceSettings) => void;
  onClose: () => void;
}

const DEFAULT_SETTINGS: AppearanceSettings = {
  activeInCrm: true,
  badgeText: 'Квартира месяца',
  badgeTooltipText: 'Специальное предложение от застройщика при покупке в ипотеку',
  bgColor: '#5577BB',
  textColor: '#FFFFFF',
  fontSize: 14,
  badgeHeight: 36,
  isBold: true,
  borderRadius: 0,
  tooltipTextColor: '#666666',
};

const AppearanceSettingsModal: React.FC<AppearanceSettingsModalProps> = ({ promo, onSave, onClose }) => {
  const [settings, setSettings] = useState<AppearanceSettings>(promo.appearance || DEFAULT_SETTINGS);

  const handleChange = (key: keyof AppearanceSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-[#DDDDDD] flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold">Настройка внешнего вида: {promo.name}</h2>
          <button onClick={onClose} className="text-[#999999] hover:text-black">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Controls */}
          <div className="w-1/2 p-6 overflow-y-auto custom-scrollbar border-r border-[#DDDDDD] space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[8px] border border-[#DDDDDD]">
              <span className="text-sm font-bold">Активировать показ в CRM</span>
              <button 
                onClick={() => handleChange('activeInCrm', !settings.activeInCrm)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.activeInCrm ? 'bg-[#6699CC]' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.activeInCrm ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Текст на плашке</label>
                <input 
                  type="text" 
                  value={settings.badgeText} 
                  onChange={(e) => handleChange('badgeText', e.target.value)} 
                  className={COMMON_STYLES.INPUT}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Подсказка (не более 200 симв.)</label>
                <textarea 
                  maxLength={200}
                  value={settings.badgeTooltipText} 
                  onChange={(e) => handleChange('badgeTooltipText', e.target.value)} 
                  className={`${COMMON_STYLES.INPUT} h-20 py-2 resize-none`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Цвет фона плашки</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.bgColor} onChange={(e) => handleChange('bgColor', e.target.value)} className="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer" />
                  <input type="text" value={settings.bgColor} onChange={(e) => handleChange('bgColor', e.target.value)} className={COMMON_STYLES.INPUT} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Цвет текста плашки</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.textColor} onChange={(e) => handleChange('textColor', e.target.value)} className="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer" />
                  <input type="text" value={settings.textColor} onChange={(e) => handleChange('textColor', e.target.value)} className={COMMON_STYLES.INPUT} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Размер текста (px)</label>
                <input type="number" value={settings.fontSize} onChange={(e) => handleChange('fontSize', Number(e.target.value))} className={COMMON_STYLES.INPUT} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Высота плашки (px)</label>
                <input type="number" value={settings.badgeHeight} onChange={(e) => handleChange('badgeHeight', Number(e.target.value))} className={COMMON_STYLES.INPUT} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Скругление (px)</label>
                <input type="number" value={settings.borderRadius} onChange={(e) => handleChange('borderRadius', Number(e.target.value))} className={COMMON_STYLES.INPUT} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input 
                  type="checkbox" 
                  id="isBold"
                  checked={settings.isBold} 
                  onChange={(e) => handleChange('isBold', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#6699CC] focus:ring-[#6699CC]"
                />
                <label htmlFor="isBold" className="text-sm font-bold cursor-pointer">Жирный шрифт</label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Цвет текста подсказки</label>
              <div className="flex gap-2">
                <input type="color" value={settings.tooltipTextColor} onChange={(e) => handleChange('tooltipTextColor', e.target.value)} className="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer" />
                <input type="text" value={settings.tooltipTextColor} onChange={(e) => handleChange('tooltipTextColor', e.target.value)} className={COMMON_STYLES.INPUT} />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="w-1/2 bg-gray-100 p-8 flex flex-col items-center justify-center space-y-8">
                    
            <div className="bg-white p-12 rounded-[12px] shadow-md w-full max-w-sm flex items-center justify-center relative overflow-hidden">
               {/* Badge Component */}
               <div 
                  style={{
                    backgroundColor: settings.bgColor,
                    color: settings.textColor,
                    fontSize: `${settings.fontSize}px`,
                    height: `${settings.badgeHeight}px`,
                    fontWeight: settings.isBold ? 'bold' : 'normal',
                    borderRadius: `${settings.borderRadius}px 0 0 ${settings.borderRadius}px`,
                    clipPath: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)',
                    padding: '0 40px 0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease-in-out'
                  }}
               >
                 {settings.badgeText || 'Текст плашки'}
               </div>
            </div>

            <div className="bg-white p-6 rounded-[8px] shadow-sm w-full max-w-sm">
              <p className="text-[10px] text-[#999999] uppercase font-bold mb-2">Подсказка</p>
              <p 
                className="text-sm leading-relaxed"
                style={{ color: settings.tooltipTextColor }}
              >
                {settings.badgeTooltipText || 'Текст подсказки появится здесь...'}
              </p>
            </div>

            <p className="text-[12px] text-[#666666] text-center max-w-xs italic">
              Так акция будет выглядеть в карточке лота в CRM системе и на сайте
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-[#DDDDDD] flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className={COMMON_STYLES.SECONDARY_BUTTON}>Отмена</button>
          <button onClick={() => onSave(settings)} className={COMMON_STYLES.BUTTON}>Применить настройки</button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettingsModal;
