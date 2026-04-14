import { saveSignupStep } from "../saveStep";

const OFFLINE_KEY = "gt_offline_queue";

interface QueueItem {
  step: string;
  data: Record<string, unknown>;
  ts: number;
}

function getOfflineQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? "[]") as QueueItem[];
  } catch {
    return [];
  }
}

function addToOfflineQueue(step: string, data: Record<string, unknown>): void {
  const queue = getOfflineQueue();
  const existing = queue.findIndex((q) => q.step === step);
  if (existing >= 0) {
    queue[existing] = { step, data, ts: Date.now() };
  } else {
    queue.push({ step, data, ts: Date.now() });
  }
  try {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
  } catch {}
}

function saveDraftLocally(step: string, data: Record<string, unknown>): void {
  try {
    localStorage.setItem(
      `gt_draft_${step}`,
      JSON.stringify({ data, savedAt: new Date().toISOString() })
    );
  } catch {}
}

export async function flushOfflineQueue(): Promise<void> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;
  const remaining: QueueItem[] = [];
  for (const item of queue) {
    try {
      await saveSignupStep(item.step, item.data);
    } catch {
      remaining.push(item);
    }
  }
  try {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(remaining));
  } catch {}
}

export function getDraft(step: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(`gt_draft_${step}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: Record<string, unknown> };
    return parsed.data;
  } catch {
    return null;
  }
}

export async function saveStep(
  step: string,
  data: Record<string, unknown>
): Promise<void> {
  saveDraftLocally(step, data);

  const email = sessionStorage.getItem("signupEmail");
  if (!email) {
    addToOfflineQueue(step, data);
    return;
  }

  try {
    await saveSignupStep(step, data);
    void flushOfflineQueue();
  } catch {
    addToOfflineQueue(step, data);
  }
}
