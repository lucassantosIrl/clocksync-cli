import { getJiraAccountId, setJiraAccountId } from "../config";
import { env } from "../env";
import { createJiraHttpClient } from "../utils/http";

export interface JiraIssue {
  key: string;
  summary: string;
}

interface JiraIssueResponse {
  key?: string;
  fields?: {
    summary?: string;
  };
}

interface JiraMyselfResponse {
  accountId?: string;
}

const jiraHttp = createJiraHttpClient({
  jiraDomain: env.jiraDomain,
  jiraEmail: env.jiraEmail,
  jiraApiToken: env.jiraApiToken
});

const issueCache = new Map<string, JiraIssue>();
let cachedAccountId: string | null = null;

export async function ensureJiraAccountId(): Promise<string> {
  if (cachedAccountId) {
    return cachedAccountId;
  }

  const stored = getJiraAccountId();
  if (stored.accountId) {
    cachedAccountId = stored.accountId;
    return cachedAccountId;
  }

  const { data } = await jiraHttp.get<JiraMyselfResponse>("/myself");
  const accountId = data.accountId?.trim();

  if (!accountId) {
    throw new Error(
      "Nao foi possivel obter o accountId do Jira a partir da API /myself."
    );
  }

  setJiraAccountId(accountId);
  cachedAccountId = accountId;
  return accountId;
}

export function clearJiraAccountIdCache(): void {
  cachedAccountId = null;
}

export async function getIssue(issueId: string): Promise<JiraIssue> {
  const cachedIssue = issueCache.get(issueId);
  if (cachedIssue) {
    return cachedIssue;
  }

  const { data } = await jiraHttp.get<JiraIssueResponse>(`/issue/${encodeURIComponent(issueId)}`);
  const key = data.key;
  const summary = data.fields?.summary;

  if (!key || !summary) {
    throw new Error(`Issue ${issueId} retornou dados incompletos no Jira.`);
  }

  const issue = { key, summary };
  issueCache.set(issueId, issue);
  return issue;
}
