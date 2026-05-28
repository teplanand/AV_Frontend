export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DatePickerProps {
  onDateRangeChange: (range: DateRange) => void;
  initialRange?: DateRange;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  fiscalYearStartMonth?: number;
}

export type PresetOption = 
  | 'today' 
  | 'yesterday' 
  | 'last7days' 
  | 'thisMonth' 
  | 'lastMonth' 
  | 'currentFY' 
  | 'custom';

export interface Preset {
  id: PresetOption;
  label: string;
  icon: React.ReactNode;
}

export interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isStartDate: boolean;
  isEndDate: boolean;
  isDisabled: boolean;
}

export interface QuickSelectRange {
  label: string;
  days: number;
  description?: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isStartDate: boolean;
  isEndDate: boolean;
  isDisabled: boolean;
}

export interface MonthData {
  month: Date;
  days: CalendarDay[];
  year: number;
  monthName: string;
}

export interface FiscalYearInfo {
  startMonth: number;
  startMonthName: string;
  currentFY: string;
  range: DateRange;
}