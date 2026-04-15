import type { Request, Response, NextFunction, Express } from "express";

import type { PublishedSnapshotService } from "../../services/published-snapshot-service.js";
import { renderCivicHome } from "./civic.js";
import { renderEditorialHome } from "./editorial.js";
import { renderLabIndex } from "./index.js";
import { renderProductHome } from "./product.js";
import { renderTerminalHome } from "./terminal.js";

type LabRenderer = (snapshot: Parameters<typeof renderEditorialHome>[0]) => string;

const VARIANT_RENDERERS: Record<string, LabRenderer> = {
  editorial: renderEditorialHome,
  terminal: renderTerminalHome,
  product: renderProductHome,
  civic: renderCivicHome,
};

function asyncRoute(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

export function attachLabRoutes(app: Express, service: PublishedSnapshotService): void {
  app.get(
    "/lab",
    asyncRoute(async (_request, response) => {
      const snapshot = await service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderLabEmpty("Design lab"));
        return;
      }
      response.send(renderLabIndex(snapshot.payload));
    }),
  );

  app.get(
    "/lab/:variant",
    asyncRoute(async (request, response) => {
      const variantParam = typeof request.params.variant === "string" ? request.params.variant : "";
      const renderer = VARIANT_RENDERERS[variantParam];
      if (!renderer) {
        response.status(404).send(renderLabEmpty("Variant not found"));
        return;
      }

      const snapshot = await service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderLabEmpty("No data yet"));
        return;
      }

      response.send(renderer(snapshot.payload));
    }),
  );
}

function renderLabEmpty(title: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${title}</title><style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #0f1016; color: #f4f4f7; margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 40px; }
    main { max-width: 40ch; text-align: center; }
    h1 { margin: 0 0 12px; font-size: 28px; font-weight: 600; letter-spacing: -0.02em; }
    p { margin: 0 0 24px; color: #a6a6b3; line-height: 1.5; }
    a { display: inline-block; padding: 12px 20px; background: #818cf8; color: #0f1016; text-decoration: none; border-radius: 8px; font-weight: 600; }
    a:hover { background: #a5aff8; }
  </style></head><body><main>
    <h1>${title}</h1>
    <p>No published snapshot is available yet, or the variant you asked for does not exist.</p>
    <a href="/lab">Back to the lab</a>
  </main></body></html>`;
}
