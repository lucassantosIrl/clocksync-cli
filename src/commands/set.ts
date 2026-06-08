import { listProjects } from "../api/clockify";
import { setDefaultProject, setIdleProject } from "../config";
import { CMD_ALIAS } from "../constants";

export interface SetCommandOptions {
  projectId?: string;
  idleProjectId?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return String(error);
}

function normalizeProjectId(value: string | undefined, paramName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized === "") {
    throw new Error(`Parametro invalido: --${paramName} nao pode ser vazio.`);
  }

  return normalized;
}

export async function runSetCommand(options: SetCommandOptions): Promise<void> {
  const projectId = normalizeProjectId(options.projectId, "projectId");
  const idleProjectId = normalizeProjectId(options.idleProjectId, "idleProjectId");

  if (!projectId && !idleProjectId) {
    throw new Error(
      "Informe ao menos um parametro: --projectId=<id> ou --idleProjectId=<id>."
    );
  }

  try {
    const projects = await listProjects();
    const projectsById = new Map(projects.map((project) => [project.id, project]));

    if (projectId) {
      const project = projectsById.get(projectId);
      if (!project) {
        throw new Error(
          `Projeto inexistente para --projectId: "${projectId}". Execute "${CMD_ALIAS} projects" para listar IDs validos.`
        );
      }

      setDefaultProject(project.id, project.name);
      console.log(`Projeto padrao configurado: ${project.name} (${project.id})`);
    }

    if (idleProjectId) {
      const idleProject = projectsById.get(idleProjectId);
      if (!idleProject) {
        throw new Error(
          `Projeto inexistente para --idleProjectId: "${idleProjectId}". Execute "${CMD_ALIAS} projects" para listar IDs validos.`
        );
      }

      setIdleProject(idleProject.id, idleProject.name);
      console.log(`Projeto de ociosidade configurado: ${idleProject.name} (${idleProject.id})`);
    }
  } catch (error) {
    throw new Error(`Falha ao configurar projeto: ${getErrorMessage(error)}`);
  }
}
