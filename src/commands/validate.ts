export interface ValidateCommandOptions {
  currentWeek?: boolean;
  currentMonth?: boolean;
  month?: string;
}

export async function runValidateCommand(
  options: ValidateCommandOptions
): Promise<void> {
  const idleProjectId = getIdleProject().id;
  const period = resolvePeriod(options);
  const worklogs = await getWorklogs(period.from, period.to);
  const days = eachDay(period.from, period.to);

  const tempoSecondsByDay = new Map<string, number>();
  for (const worklog of worklogs) {
    const total = tempoSecondsByDay.get(worklog.startDate) ?? 0;
    tempoSecondsByDay.set(worklog.startDate, total + worklog.timeSpentSeconds);
  }

  const clockifySecondsByDay = new Map<string, number>();
  for (const day of days) {
    await delayBetweenCalls();
    const entries = await getTimeEntries(day);
    const entriesForValidation = idleProjectId
      ? entries.filter((entry) => entry.projectId !== idleProjectId)
      : entries;
    const total = entriesForValidation.reduce((acc, entry) => acc + getEntryDurationSeconds(entry), 0);
    clockifySecondsByDay.set(day, total);
  }

  let hasDivergence = false;
  console.log(`Periodo: ${period.from} ate ${period.to}`);

  for (const day of days) {
    const tempoSeconds = tempoSecondsByDay.get(day) ?? 0;
    const clockifySeconds = clockifySecondsByDay.get(day) ?? 0;
    const difference = clockifySeconds - tempoSeconds;

    if (difference === 0) {
      console.log(`✅ ${day} - OK (${formatDuration(tempoSeconds)})`);
      continue;
    }

    hasDivergence = true;
    const sign = difference > 0 ? "+" : "-";
    console.log(
      `❌ ${day} - DIVERGENTE | Tempo ${formatDuration(tempoSeconds)} | Clockify ${formatDuration(clockifySeconds)} | Diferenca ${sign}${formatDuration(Math.abs(difference))}`
    );
  }

  if (hasDivergence) {
    process.exitCode = 1;
    console.log("\nEncontradas divergencias no periodo.");
    if (options.month) {
      console.log(`Sugestao: clocksync sync --month=${options.month}`);
    } else if (options.currentWeek) {
      console.log("Sugestao: clocksync sync --current-week");
    } else if (options.currentMonth) {
      console.log("Sugestao: clocksync sync --current-month");
    } else {
      console.log("Sugestao: clocksync sync");
    }
    return;
  }

  process.exitCode = 0;
  console.log("\nValidacao concluida sem divergencias.");
}

import { getTimeEntries, type ClockifyTimeEntry } from "../api/clockify";
import { getIdleProject } from "../config";
import { getWorklogs } from "../api/tempo";
import { eachDay, resolvePeriod } from "../utils/date";
import { formatDuration } from "../utils/format";
import { delayBetweenCalls } from "../utils/http";

function parseIso8601DurationToSeconds(value: string): number {
  const match = /^P(?:\d+D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value);
  if (!match) {
    return 0;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function getEntryDurationSeconds(entry: ClockifyTimeEntry): number {
  const duration = entry.timeInterval?.duration;
  if (duration && duration.startsWith("P")) {
    const parsedDuration = parseIso8601DurationToSeconds(duration);
    if (parsedDuration > 0) {
      return parsedDuration;
    }
  }

  const start = entry.timeInterval?.start;
  const end = entry.timeInterval?.end;
  if (!start || !end) {
    return 0;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 1000));
}
