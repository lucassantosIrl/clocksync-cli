export interface SyncCommandOptions {
  currentWeek?: boolean;
  currentMonth?: boolean;
  month?: string;
}

import { getTimeEntries, createTimeEntry, deleteTimeEntry, type ClockifyTimeEntry } from "../api/clockify";
import { getIssue } from "../api/jira";
import { getWorklogs } from "../api/tempo";
import { getConfigPath, getDefaultProject, getIdleProject } from "../config";
import { CMD_ALIAS } from "../constants";
import { resolvePeriod } from "../utils/date";
import { formatDuration } from "../utils/format";
import { delayBetweenCalls } from "../utils/http";

function ensureDefaultProjectConfigured(): string {
  const defaultProject = getDefaultProject();
  if (!defaultProject.id) {
    throw new Error(
      [
        "Projeto padrao do Clockify nao configurado.",
        `Use: ${CMD_ALIAS} set --projectId=<id>`,
        `Para descobrir o id: ${CMD_ALIAS} projects`,
        `Arquivo de configuracao: ${getConfigPath()}`
      ].join("\n")
    );
  }

  return defaultProject.id;
}

function calculateEndDateTime(startDateTimeUtc: string, timeSpentSeconds: number): string {
  const start = new Date(startDateTimeUtc);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Data inicial invalida no worklog: ${startDateTimeUtc}`);
  }

  if (!Number.isFinite(timeSpentSeconds) || timeSpentSeconds <= 0) {
    throw new Error(`Duracao invalida no worklog: ${timeSpentSeconds}`);
  }

  return new Date(start.getTime() + timeSpentSeconds * 1000).toISOString();
}

function groupWorklogsByDate(worklogs: Array<{ startDate: string; startDateTimeUtc: string }>): string[] {
  const dates = new Set<string>();
  for (const worklog of worklogs) {
    dates.add(worklog.startDate);
  }
  return Array.from(dates).sort((a, b) => a.localeCompare(b));
}

function getLatestIsoDateTime(a: string | undefined, b: string): string {
  if (!a) {
    return b;
  }
  return new Date(b).getTime() > new Date(a).getTime() ? b : a;
}

export async function runSyncCommand(options: SyncCommandOptions): Promise<void> {
  const projectId = ensureDefaultProjectConfigured();
  const idleProjectId = getIdleProject().id;
  const period = resolvePeriod(options);
  const worklogs = await getWorklogs(period.from, period.to);

  console.log(`Periodo: ${period.from} ate ${period.to}`);
  console.log(`Worklogs encontrados no Tempo: ${worklogs.length}`);

  let createdCount = 0;
  let deletedCount = 0;
  let idleCreatedCount = 0;
  let errorCount = 0;

  const dates = groupWorklogsByDate(worklogs);

  for (const date of dates) {
    const dayWorklogs = worklogs
      .filter((worklog) => worklog.startDate === date)
      .sort((a, b) => a.startDateTimeUtc.localeCompare(b.startDateTimeUtc));

    let dayEntries: ClockifyTimeEntry[] = [];
    try {
      await delayBetweenCalls();
      dayEntries = await getTimeEntries(date);
      const entriesToDelete = dayEntries.filter((entry) => entry.projectId === projectId || entry.projectId === idleProjectId);
      if (entriesToDelete.length > 0) {
        console.log(`♻️ Limpando ${dayEntries.length} apontamento(s) existente(s) em ${date}`);
        for (const entry of entriesToDelete) {
          await delayBetweenCalls();
          await deleteTimeEntry(entry.id);
          deletedCount += 1;
        }
        dayEntries = [];
      }
    } catch (error) {
      errorCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`❌ Erro ao preparar dia ${date}: ${message}`);
      continue;
    }

    let daySyncedSeconds = 0;
    let lastEndDateTimeUtc: string | undefined;

    for (const worklog of dayWorklogs) {
      let issueKeyForLog = worklog.issueId;
      try {
        await delayBetweenCalls();
        const issue = await getIssue(worklog.issueId);
        issueKeyForLog = issue.key;
        const description = `${issue.key} - ${issue.summary}`;

        const end = calculateEndDateTime(worklog.startDateTimeUtc, worklog.timeSpentSeconds);
        await delayBetweenCalls();
        const createdEntry = await createTimeEntry({
          start: worklog.startDateTimeUtc,
          end,
          description,
          projectId
        });
        dayEntries.push(createdEntry);

        daySyncedSeconds += worklog.timeSpentSeconds;
        lastEndDateTimeUtc = getLatestIsoDateTime(lastEndDateTimeUtc, end);
        createdCount += 1;
        console.log(`✅ Criado: ${description} (${date})`);
      } catch (error) {
        errorCount += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.log(`❌ Erro: ${issueKeyForLog} (${worklog.startDate}) - ${message}`);
      }
    }

    console.log(`📊 Total sincronizado em ${date}: ${formatDuration(daySyncedSeconds)}`);

    if (daySyncedSeconds !== 8 * 3600 || !lastEndDateTimeUtc) {
      continue;
    }

    if (!idleProjectId) {
      console.log(`ℹ️ Idle nao configurado. Sem lancamento adicional em ${date}.`);
      continue;
    }

    try {
      const idleStart = lastEndDateTimeUtc;
      const idleEnd = calculateEndDateTime(idleStart, 30 * 60);
      await delayBetweenCalls();
      await createTimeEntry({
        start: idleStart,
        end: idleEnd,
        description: "Ociosidade",
        projectId: idleProjectId
      });
      idleCreatedCount += 1;
      createdCount += 1;
      console.log(`🕒 Ociosidade criada: 0:30 (${date})`);
    } catch (error) {
      errorCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`❌ Erro ao criar ociosidade em ${date}: ${message}`);
    }
  }

  console.log("\nResumo sync:");
  console.log(`- Criados: ${createdCount}`);
  console.log(`- Ociosidade criada: ${idleCreatedCount}`);
  console.log(`- Removidos no Clockify: ${deletedCount}`);
  console.log(`- Erros: ${errorCount}`);
}
