export interface ResolvePeriodInput {
  currentWeek?: boolean;
  currentMonth?: boolean;
  month?: string;
}

export interface DatePeriod {
  from: string;
  to: string;
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = pad2(date.getUTCMonth() + 1);
  const day = pad2(date.getUTCDate());
  return `${year}-${month}-${day}`;
}

function dateUtc(year: number, month1to12: number, day: number): Date {
  return new Date(Date.UTC(year, month1to12 - 1, day));
}

function parseMonth(month: string): { year: number; month: number } {
  if (!MONTH_PATTERN.test(month)) {
    throw new Error("Valor invalido para --month. Use o formato YYYY-MM.");
  }

  const [yearText, monthText] = month.split("-");
  return { year: Number(yearText), month: Number(monthText) };
}

function parseDateYmd(dateText: string): Date {
  if (!DATE_PATTERN.test(dateText)) {
    throw new Error(`Data invalida: ${dateText}. Use YYYY-MM-DD.`);
  }

  const [yearText, monthText, dayText] = dateText.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = dateUtc(year, month, day);

  if (formatDateUtc(parsed) !== dateText) {
    throw new Error(`Data invalida: ${dateText}.`);
  }

  return parsed;
}

function todayInSaoPaulo(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Nao foi possivel determinar a data atual.");
  }

  return `${year}-${month}-${day}`;
}

function firstAndLastDay(year: number, month: number): DatePeriod {
  const from = formatDateUtc(dateUtc(year, month, 1));
  const to = formatDateUtc(new Date(Date.UTC(year, month, 0)));
  return { from, to };
}

export function resolvePeriod(input: ResolvePeriodInput): DatePeriod {
  const { currentWeek = false, currentMonth = false, month } = input;
  const selectedFlags = [currentWeek, currentMonth, Boolean(month)].filter(Boolean).length;

  if (selectedFlags > 1) {
    throw new Error("Use apenas uma flag de periodo: --current-week, --current-month ou --month.");
  }

  if (month) {
    const parsed = parseMonth(month);
    return firstAndLastDay(parsed.year, parsed.month);
  }

  if (currentMonth) {
    const today = parseDateYmd(todayInSaoPaulo());
    return firstAndLastDay(today.getUTCFullYear(), today.getUTCMonth() + 1);
  }

  if (currentWeek) {
    const today = parseDateYmd(todayInSaoPaulo());
    const jsDay = today.getUTCDay();
    const daysFromMonday = (jsDay + 6) % 7;
    const monday = new Date(today.getTime());
    monday.setUTCDate(today.getUTCDate() - daysFromMonday);

    const sunday = new Date(monday.getTime());
    sunday.setUTCDate(monday.getUTCDate() + 6);

    return {
      from: formatDateUtc(monday),
      to: formatDateUtc(sunday)
    };
  }

  const today = todayInSaoPaulo();
  return { from: today, to: today };
}

export function eachDay(from: string, to: string): string[] {
  const fromDate = parseDateYmd(from);
  const toDate = parseDateYmd(to);

  if (fromDate.getTime() > toDate.getTime()) {
    throw new Error("Periodo invalido: 'from' deve ser menor ou igual a 'to'.");
  }

  const days: string[] = [];
  const cursor = new Date(fromDate.getTime());

  while (cursor.getTime() <= toDate.getTime()) {
    days.push(formatDateUtc(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}
