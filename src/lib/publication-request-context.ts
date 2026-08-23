import { AsyncLocalStorage } from "node:async_hooks";

export type RequestPublicationIdentity = {
  scope: string;
  publishedAt: string | null;
  publicationId?: string;
  publicationCreatedAt?: string;
};

type PublicationRecord = {
  id: string;
  payload: { snapshot: { publishedAt: string } };
  publicationId?: string;
  publicationCreatedAt?: string;
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
    .map(([scope, record]) => ({
      scope,
      publishedAt: record?.payload.snapshot.publishedAt ?? null,
      ...(record?.publicationId ? { publicationId: record.publicationId } : {}),
      ...(record?.publicationCreatedAt ? { publicationCreatedAt: record.publicationCreatedAt } : {}),
    }))
    .sort((left, right) => left.scope.localeCompare(right.scope));
}
