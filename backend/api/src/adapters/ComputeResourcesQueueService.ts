import { availableParallelism } from "node:os";
import { QueueOutboundPort } from "@demo-viewer/domain/src/ports/outbound/QueueOutboundPort";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

type QueueJob = {
  resolve: (v: unknown) => unknown;
  reject: (v: unknown) => unknown;
  task: () => Promise<unknown>;
};

const kb = (bytes: number) => {
  return bytes / 1024;
};

const mb = (bytes: number) => {
  return kb(bytes) / 1024;
};

const gb = (bytes: number) => {
  return mb(bytes) / 1024;
};

export class ComputeResourcesQueueService implements QueueOutboundPort {
  private readonly queue: QueueJob[] = [];
  private readonly maxParallelJobs = availableParallelism();
  private activeRegisteredParallelTasks = 0;

  get hasParallelRoom() {
    return this.activeRegisteredParallelTasks < this.maxParallelJobs;
  }

  get hasMemoryRoom() {
    return gb(process.memoryUsage().rss) < this.configuration.maxParallelRssGb;
  }

  constructor(private readonly configuration: ConfigurationInboundPort) {}

  enqueue(task: QueueJob["task"]) {
    const job = new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, task });
      this.tryDrain();
    });

    return job as Promise<void>;
  }

  tryDrain() {
    if (this.configuration.debug) {
      console.log(
        `[QUEUE][Resources] ${JSON.stringify({
          hasMemoryRoom: this.hasMemoryRoom,
          hasParallelRoom: this.hasParallelRoom,
          activeRegisteredParallelTasks: this.activeRegisteredParallelTasks,
          maxParallelJobs: this.maxParallelJobs,
          memory: mb(process.memoryUsage().rss),
        })}`,
      );
    }

    while (
      this.queue.length > 0 &&
      this.hasParallelRoom &&
      this.hasMemoryRoom
    ) {
      const job = this.queue.shift();
      if (!job) break;
      this.activeRegisteredParallelTasks++;
      job
        .task()
        .then(job.resolve, job.reject)
        .finally(() => {
          this.activeRegisteredParallelTasks--;
          this.tryDrain();
        });
    }
  }
}
