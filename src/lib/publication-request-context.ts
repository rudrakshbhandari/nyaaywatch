import { AsyncLocalStorage } from "node:async_hooks";

export type RequestPublicationIdentity = {
  scope: string;
  publishedAt: string | null;
};

type PublicationRecord = {
  payload: { snapshot: { publishedAt: string } };
};

const storage = new AsyncLocalStorage<Map<string, PublicationRecord | null>>();

export function runPublicationRequest<T>(callback: () => T): T {
  return storage.run(new Map(), callback);
}

export function getRequestPublication<T extends PublicationRecord>(scope: string): T | null | undefined {
  return storage.getStore()?.get(scope) as T | null | undefined;
}

export function rememberRequestPublication(scope: string, record: PublicationRecord | null): void {
  storage.getStore()?.set(scope, record);
}

export function getRequestPublicationIdentities(): RequestPublicationIdentity[] {
  return [...(storage.getStore()?.entries() ?? [])]
    .map(([scope, record]) => ({ scope, publishedAt: record?.payload.snapshot.publishedAt ?? null }))
    .sort((left, right) => left.scope.localeCompare(right.scope));
}
