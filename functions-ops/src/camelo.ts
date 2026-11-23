// The Camelo client: one GraphQL request with its timeout and retries, and Relay paging.
import type { Deps } from "./api.js";

const ENDPOINT = "https://api.camelohq.com/graphql";

export type Shift = { id: string; startTime: string } & Record<string, unknown>;
export type Timesheet = { id: string; from: string } & Record<string, unknown>;

/**
 * Each Camelo request gives up after timeoutMs instead of running into the
 * function's 60 s limit. Reads are retried after a network error, a timeout, a
 * 429 or a 5xx; mutations never are, since a retry after a lost reply could
 * apply the change twice. A 429 or 503 that says how long to wait (Retry-After,
 * in seconds) is waited out, up to maxWaitMs so the call stays inside the 60 s.
 * Tests shorten these.
 */
export const cameloRetry = { timeoutMs: 15_000, delaysMs: [500, 1500], maxWaitMs: 10_000 };

/** How long Camelo asked us to wait, in ms, or 0 if it did not say. */
function retryAfterMs(res: Response): number {
  const seconds = Number(res.headers.get("retry-after"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
}

/** One GraphQL request to Camelo; returns the parsed JSON body. */
async function postCamelo(fetchImpl: typeof fetch, token: string, query: string, variables: unknown): Promise<unknown> {
  const delays = /^\s*mutation\b/.test(query) ? [] : cameloRetry.delaysMs;
  for (let attempt = 0; ; attempt++) {
    let failure: unknown;
    let retryable = true;
    let asked = 0;
    try {
      const res = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "fresh-nest-schedule-report/1.0",
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(cameloRetry.timeoutMs),
      });
      if (res.ok) return await res.json();
      failure = new Error(`Camelo HTTP ${res.status}`);
      retryable = res.status === 429 || res.status >= 500;
      if (res.status === 429 || res.status === 503) asked = retryAfterMs(res);
    } catch (e) {
      failure = e instanceof Error && e.name === "TimeoutError" ? new Error("Camelo timed out") : e;
    }
    if (!retryable || attempt >= delays.length) throw failure;
    const wait = Math.max(delays[attempt], Math.min(asked, cameloRetry.maxWaitMs));
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

/** Follows Relay pagination for a connection filtered by fromTime/toTime, and by `only` when given. */
export async function fetchAll<T>(
  query: string,
  field: string,
  token: string,
  from: string,
  to: string,
  fetchImpl: typeof fetch,
  /** More of the filter, beside the dates: one person's shifts or timesheets. */
  only: Record<string, unknown> = {},
): Promise<T[]> {
  const rows: T[] = [];
  let after: string | null = null;
  for (;;) {
    const payload = (await postCamelo(fetchImpl, token, query, { filter: { fromTime: from, toTime: to, ...only }, after })) as {
      data?: Record<string, { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: T[] }>;
      errors?: { message: string }[];
    };
    if (payload.errors?.length || !payload.data) {
      throw new Error(`Camelo GraphQL: ${payload.errors?.map((e) => e.message).join("; ") ?? "no data"}`);
    }
    const page = payload.data[field];
    rows.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) return rows;
    after = page.pageInfo.endCursor;
  }
}

/** One request with the site's token (or a cleaner's token); returns its data, and throws if Camelo reports an error. */
export async function camelo<T>(deps: Deps, query: string, variables: unknown, token = deps.camelToken): Promise<T> {
  const payload = (await postCamelo(deps.fetchImpl ?? fetch, token, query, variables)) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (payload.errors?.length || !payload.data) {
    throw new Error(`Camelo GraphQL: ${payload.errors?.map((e) => e.message).join("; ") ?? "no data"}`);
  }
  return payload.data;
}
