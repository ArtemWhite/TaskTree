export interface BaseCalendarCell {
  day: number;
  date: string;
  count: number;
  level: number;
}

export interface MonthGridData<T extends BaseCalendarCell> {
  name: string;
  month: number;
  cells: T[];
}

export class CalendarService {
  public static readonly MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  public static readonly WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  public static getLevel(count: number): number {
    if (count >= 5) return 4;
    if (count >= 3) return 3;
    if (count >= 2) return 2;
    if (count >= 1) return 1;
    return 0;
  }

  /**
   * Generates a 7-column Monday–Sunday year grid padded to exactly 42 cells per month
   */
  public static buildYearGrid<T extends BaseCalendarCell>(
    year: number,
    createCell: (day: number, dateStr: string) => T,
    createDummyCell: () => T
  ): MonthGridData<T>[] {
    return Array.from({ length: 12 }, (_, month) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      // Monday = 0, Sunday = 6
      const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
      const cells: T[] = [];

      // Prepend leading empty cells
      for (let i = 0; i < firstDayIndex; i++) {
        cells.push(createDummyCell());
      }

      // Add month day cells
      for (let day = 1; day <= daysInMonth; day++) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
        cells.push(createCell(day, dateStr));
      }

      // Always pad to 42 cells (6 rows * 7 columns) for uniform grid height
      while (cells.length < 42) {
        cells.push(createDummyCell());
      }

      return { name: CalendarService.MONTH_NAMES[month], month, cells };
    });
  }
}
