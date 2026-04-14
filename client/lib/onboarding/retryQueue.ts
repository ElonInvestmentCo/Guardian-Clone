const QUEUE_KEY = "gt_retry_queue_v2";

export interface RetryItem {
  id: string;
  email: string;
  stepNum: number;
  stepKey: string;
  data: Record<string, unknown>;
  timestamp: number;
  attempts: number;
}

function readQueue(): RetryItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as RetryItem[];
  } catch {
    return [];
  }
}

function writeQueue(items: RetryItem[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

/**
 * Add a failed step to the retry queue. Deduplicates by stepNum so only
 * the latest attempt for a given step is retained.
 */
export function enqueueRetry(
  item: Omit<RetryItem, "id" | "timestamp" | "attempts">
): void {
  const queue = readQueue().filter((q) => q.stepNum !== item.stepNum);
  queue.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    attempts: 0,
  });
  writeQueue(queue);
}

export function getQueueSize(): number {
  return readQueue().length;
}

export function clearQueue(): void {
  writeQueue([]);
}

/**
 * Flush all queued items by replaying them against /api/signup/complete-step.
 * Items that succeed are removed. Items that fail with a validation error (422)
 * are dropped. Network failures increment the attempt counter (max 5).
 */
export async function flushRetryQueue(baseUrl: string): Promise<void> {
  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: RetryItem[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(`${baseUrl}/api/signup/complete-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: item.email,
          stepNumber: item.stepNum,
          stepKey: item.stepKey,
          data: item.data,
        }),
      });

      if (res.ok) {
        // Successfully replayed — discard
        continue;
      }

      if (res.status === 422) {
        // Validation error — the data is bad, drop it
        console.warn(
          `[RetryQueue] Dropping invalid queued step "${item.stepKey}"`,
          await res.json().catch(() => ({}))
        );
        continue;
      }

      // Server error — keep in queue
      if (item.attempts < 5) {
        remaining.push({ ...item, attempts: item.attempts + 1 });
      } else {
        console.warn(
          `[RetryQueue] Max retries for "${item.stepKey}", dropping.`
        );
      }
    } catch {
      if (item.attempts < 5) {
        remaining.push({ ...item, attempts: item.attempts + 1 });
      }
    }
  }

  writeQueue(remaining);
}
