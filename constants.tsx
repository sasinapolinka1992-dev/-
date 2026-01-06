
export const COLORS = {
  PRIMARY_BG: '#F8FAFC', // Чуть более мягкий фон для контраста с белыми карточками
  TEXT_BLACK: '#1E293B',
  BUTTON_BG: '#6699CC',
  BUTTON_BORDER: '#5588BB',
  BUTTON_HOVER: '#4A77A5',
  NEUTRAL_BORDER: '#E2E8F0',
  TEXT_SECONDARY: '#64748B',
  TEXT_MUTED: '#94A3B8',
  ACCENT_BLUE: '#6699CC',
  SUCCESS: '#10B981',
  ERROR: '#EF4444'
};

export const COMMON_STYLES = {
  BUTTON: 'h-[40px] px-5 flex items-center justify-center text-white bg-[#6699CC] border-[#5588BB] border rounded-[10px] hover:bg-[#5588BB] hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 font-semibold whitespace-nowrap text-[14px]',
  SECONDARY_BUTTON: 'h-[40px] px-5 flex items-center justify-center text-[#475569] bg-white border-[#E2E8F0] border rounded-[10px] hover:bg-slate-50 hover:border-slate-300 transition-all whitespace-nowrap font-semibold text-[14px] shadow-sm',
  INPUT: 'h-[40px] px-3 border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#6699CC]/20 focus:border-[#6699CC] w-full text-[14px] bg-white transition-all text-slate-800 placeholder:text-slate-400',
  TABLE_HEADER: 'bg-slate-50/80 border-b border-[#E2E8F0] text-left text-[11px] uppercase font-bold text-[#64748B] px-6 py-4 tracking-widest',
  TABLE_CELL: 'px-6 py-4 border-b border-slate-100 text-[14px] text-slate-700 align-middle',
  SIDEBAR: 'fixed left-0 top-0 h-full bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300 border-r border-slate-200',
  CARD: 'bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm hover:shadow-md transition-shadow'
};
