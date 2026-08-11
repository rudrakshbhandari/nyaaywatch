import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  ParliamentaryCaptureBundleSchema,
  type ParliamentaryCaptureBundle,
} from "../domain/parliamentary-schema.js";

export interface ParliamentarySourceClient {
  capture(): Promise<ParliamentaryCaptureBundle>;
}

export class FixtureParliamentarySourceClient implements ParliamentarySourceClient {
  public constructor(private readonly fixtureDirectory: string) {}

  public async capture(): Promise<ParliamentaryCaptureBundle> {
    const fixturePath = join(this.fixtureDirectory, "lok-sabha-18-session-5.json");
    const raw = await readFile(fixturePath, "utf8");
    return ParliamentaryCaptureBundleSchema.parse(JSON.parse(raw));
  }
}
