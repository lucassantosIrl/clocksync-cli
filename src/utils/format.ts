function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error("Duracao invalida: informe segundos >= 0.");
  }

  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}:${pad2(minutes)}`;
}

function getSaoPauloParts(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }

    return acc;
  }, {});
}

export function formatLocalDateTime(isoDateTimeUtc: string): string {
  const parsed = new Date(isoDateTimeUtc);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Data/hora invalida: ${isoDateTimeUtc}.`);
  }

  const parts = getSaoPauloParts(parsed);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export function formatSaoPauloTime(isoDateTimeUtc: string): string {
  const parsed = new Date(isoDateTimeUtc);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Data/hora invalida: ${isoDateTimeUtc}.`);
  }

  const parts = getSaoPauloParts(parsed);
  return `${parts.hour}:${parts.minute}`;
}
