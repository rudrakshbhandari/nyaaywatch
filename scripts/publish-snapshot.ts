import { FileSnapshotStore } from "../api/src/store/snapshot-store";
import { PublishService } from "../api/src/services/publish-service";

async function main() {
  const runId = process.argv[2];

  if (!runId) {
    console.error("Usage: npm run publish:snapshot -- <run-id>");
    process.exitCode = 1;
    return;
  }

  const store = new FileSnapshotStore();
  const publishService = new PublishService(store, () => new Date());
  const result = await publishService.publish(runId);

  if (!result.publishable) {
    console.error(`Publish blocked for ${runId}:`);
    for (const reason of result.reasons) {
      console.error(`- ${reason}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Published ${runId}`);
}

void main();
