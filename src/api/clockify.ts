import { getClockifyIdentity, setClockifyIdentity, getDefaultProject, getIdleProject } from "../config";
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
  billable?: boolean;
  description?: string;
  timeInterval?: {
    start?: string;
    end?: string;
    duration?: string;
  };
}

interface ClockifyUserApiItem {
  id: string;
  defaultWorkspace?: string;
  activeWorkspace?: string;
}

interface ClockifyIdentity {
  workspaceId: string;
  userId: string;
}

const clockifyHttp = createClockifyHttpClient(env.clockifyApiKey);

let cachedIdentity: ClockifyIdentity | null = null;

export async function ensureClockifyIdentity(): Promise<ClockifyIdentity> {
  if (cachedIdentity) {
    return cachedIdentity;
  }

  const stored = getClockifyIdentity();
  if (stored.workspaceId && stored.userId) {
    cachedIdentity = {
      workspaceId: stored.workspaceId,
      userId: stored.userId,
    };
    return cachedIdentity;
  }

  const { data } = await clockifyHttp.get<ClockifyUserApiItem>("/user");

  const userId = data.id?.trim();
  const workspaceId = (data.defaultWorkspace ?? data.activeWorkspace)?.trim();

  if (!userId) {
    throw new Error(
      "Nao foi possivel obter o ID do usuario Clockify a partir da API."
    );
  }

  if (!workspaceId) {
    throw new Error(
      "Nao foi possivel obter o ID do workspace Clockify a partir da API."
    );
  }

  setClockifyIdentity(workspaceId, userId);
  cachedIdentity = { workspaceId, userId };
  return cachedIdentity;
}

export function clearClockifyIdentityCache(): void {
  cachedIdentity = null;
}

export async function listProjects(): Promise<ClockifyProject[]> {
  const { workspaceId } = await ensureClockifyIdentity();

  const { data } = await clockifyHttp.get<ClockifyProjectApiItem[]>(
    `/workspaces/${workspaceId}/projects`,
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
  const { workspaceId, userId } = await ensureClockifyIdentity();
  const start = `${date}T00:00:00Z`;
  const end = `${date}T23:59:59Z`;

  const { data } = await clockifyHttp.get<ClockifyTimeEntryApiItem[]>(
    `/workspaces/${workspaceId}/user/${userId}/time-entries`,
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
  const { workspaceId } = await ensureClockifyIdentity();
  const defaultProject = getDefaultProject();
  const idleProject = getIdleProject();

  const { data } = await clockifyHttp.post<ClockifyTimeEntryApiItem>(
    `/workspaces/${workspaceId}/time-entries`,
    {
      start: input.start,
      end: input.end,
      description: input.description,
      projectId: input.projectId,
      billable: input.projectId === defaultProject.id
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
  const { workspaceId } = await ensureClockifyIdentity();

  await clockifyHttp.delete(
    `/workspaces/${workspaceId}/time-entries/${encodeURIComponent(entryId)}`
  );
}
