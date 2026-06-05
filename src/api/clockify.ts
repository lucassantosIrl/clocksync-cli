import { env } from "../env";
import { createClockifyHttpClient } from "../utils/http";

export interface ClockifyProject {
  id: string;
  name: string;
  color?: string;
}

export interface ClockifyTimeEntryInput {
  start: string;
  end: string;
  description: string;
  projectId: string;
}

export interface ClockifyTimeEntry {
  id: string;
  projectId?: string;
  description?: string;
  timeInterval?: {
    start?: string;
    end?: string;
    duration?: string;
  };
}

interface ClockifyProjectApiItem {
  id: string;
  name: string;
  color?: string;
}

interface ClockifyTimeEntryApiItem {
  id: string;
  projectId?: string;
  description?: string;
  timeInterval?: {
    start?: string;
    end?: string;
    duration?: string;
  };
}

const clockifyHttp = createClockifyHttpClient(env.clockifyApiKey);

export async function listProjects(): Promise<ClockifyProject[]> {
  const { data } = await clockifyHttp.get<ClockifyProjectApiItem[]>(
    `/workspaces/${env.clockifyWorkspaceId}/projects`,
    {
      params: {
        "page-size": 100
      }
    }
  );

  return data.map((project) => ({
    id: project.id,
    name: project.name,
    color: project.color
  }));
}

export async function getTimeEntries(date: string): Promise<ClockifyTimeEntry[]> {
  const start = `${date}T00:00:00Z`;
  const end = `${date}T23:59:59Z`;

  const { data } = await clockifyHttp.get<ClockifyTimeEntryApiItem[]>(
    `/workspaces/${env.clockifyWorkspaceId}/user/${env.clockifyUserId}/time-entries`,
    {
      params: {
        start,
        end,
        "page-size": 1000
      }
    }
  );

  return data.map((entry) => ({
    id: entry.id,
    projectId: entry.projectId,
    description: entry.description,
    timeInterval: entry.timeInterval
  }));
}

export async function createTimeEntry(
  input: ClockifyTimeEntryInput
): Promise<ClockifyTimeEntry> {
  const { data } = await clockifyHttp.post<ClockifyTimeEntryApiItem>(
    `/workspaces/${env.clockifyWorkspaceId}/time-entries`,
    {
      start: input.start,
      end: input.end,
      description: input.description,
      projectId: input.projectId
    }
  );

  return {
    id: data.id,
    projectId: data.projectId,
    description: data.description,
    timeInterval: data.timeInterval
  };
}

export async function deleteTimeEntry(entryId: string): Promise<void> {
  await clockifyHttp.delete(
    `/workspaces/${env.clockifyWorkspaceId}/time-entries/${encodeURIComponent(entryId)}`
  );
}
