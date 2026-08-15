import { AsyncLocalStorage } from "node:async_hooks";

export type RequestPublicationIdentity = {
  scope: string;
  publishedAt: string;
};

type PublicationRecord = {
  payload: { snapshot: { publishedAt: string } };
};

const storage = new AsyncLocalStorage<Map<string, PublicationRecord>>();

export function runPublicationRequest<T>(callback: () => T): T {
  return storage.run(new Map(), callback);
}

export function getRequestPublication<T extends PublicationRecord>(scope: string): T | undefined {
  return storage.getStore()?.get(scope) as T | undefined;
}

export function rememberRequestPublication(scope: string, record: PublicationRecord): void {
  storage.getStore()?.set(scope, record);
}

export function getRequestPublicationIdentities(): RequestPublicationIdentity[] {
  return [...(storage.getStore()?.entries() ?? [])]
    .map(([scope, record]) => ({ scope, publishedAt: record.payload.snapshot.publishedAt }))
    .sort((left, right) => left.scope.localeCompare(right.scope));
}
