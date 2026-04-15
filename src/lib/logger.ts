type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

export function logInfo(event: string, fields: LogFields = {}) {
  writeLog("info", event, fields);
}

export function logWarn(event: string, fields: LogFields = {}) {
  writeLog("warn", event, fields);
}

export function logError(event: string, fields: LogFields = {}) {
  writeLog("error", event, fields);
}

function writeLog(level: LogLevel, event: string, fields: LogFields) {
  const payload = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  console.log(payload);
}
