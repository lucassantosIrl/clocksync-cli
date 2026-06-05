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

const jiraHttp = createJiraHttpClient({
  jiraDomain: env.jiraDomain,
  jiraEmail: env.jiraEmail,
  jiraApiToken: env.jiraApiToken
});

const issueCache = new Map<string, JiraIssue>();

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
