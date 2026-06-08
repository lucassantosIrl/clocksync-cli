import { ensureJiraAccountId } from "./jira";
import { env } from "../env";
import { createTempoHttpClient, delayBetweenCalls } from "../utils/http";

export interface TempoWorklog {
  issueId: string;
  startDate: string;
  startDateTimeUtc: string;
  timeSpentSeconds: number;
}

interface TempoWorklogApiItem {
  issue?: {
    id?: number | string;
  };
  issueId?: number | string;
  startDate: string;
  startDateTime?: string;
  startDateTimeUtc?: string;
  timeSpentSeconds: number;
}

interface TempoWorklogResponse {
  results?: TempoWorklogApiItem[];
  metadata?: {
    count?: number;
  };
}

const tempoHttp = createTempoHttpClient(env.tempoApiToken);
const TEMPO_PAGE_LIMIT = 1000;

export async function getWorklogs(
  from: string,
  to: string
): Promise<TempoWorklog[]> {
  const accountId = await ensureJiraAccountId();
  const allWorklogs: TempoWorklog[] = [];
  let offset = 0;

  while (true) {
    const { data } = await tempoHttp.get<TempoWorklogResponse>(
      `/worklogs/user/${accountId}`,
      {
        params: {
          from,
          to,
          offset,
          limit: TEMPO_PAGE_LIMIT
        }
      }
    );

    const pageResults = data.results ?? [];
    const mappedWorklogs = pageResults.map((item) => {
      const issueId = item.issueId ?? item.issue?.id;
      const startDateTimeUtc = item.startDateTimeUtc ?? item.startDateTime;

      if (!issueId || !startDateTimeUtc) {
        throw new Error("Worklog do Tempo retornou campos obrigatorios ausentes.");
      }

      return {
        issueId: String(issueId),
        startDate: item.startDate,
        startDateTimeUtc,
        timeSpentSeconds: item.timeSpentSeconds
      };
    });

    allWorklogs.push(...mappedWorklogs);

    const currentPageCount = data.metadata?.count ?? pageResults.length;
    const hasMorePages = currentPageCount >= TEMPO_PAGE_LIMIT;

    if (!hasMorePages) {
      break;
    }

    offset += currentPageCount;
    await delayBetweenCalls();
  }

  return allWorklogs;
}
