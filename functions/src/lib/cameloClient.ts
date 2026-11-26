/**
 * P3-E42: Server-side Camelo GraphQL client for the Won Lead -> Camelo bridge.
 *
 * Mirrors `functions-ops/src/camelo.ts` safety guarantees:
 * - Mutations are NEVER automatically retried (prevents duplicate Clients/Job Sites on timeout).
 * - Reads retry up to 2 times on 429/5xx/timeout, honoring `Retry-After`.
 * - Endpoint and `fetchImpl` are injectable for pretend-Camelo tests.
 */
import type { CameloClientSummary, CameloScheduleSummary } from '../shared/cameloBridge'

export const DEFAULT_CAMELO_ENDPOINT = 'https://api.camelohq.com/graphql'
const USER_AGENT = 'fresh-nest-lead-bridge/1.0'

export interface CameloCallOptions {
  token: string
  endpoint?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
  retryDelaysMs?: readonly number[]
  maxWaitMs?: number
}

interface CameloMutationError {
  attribute: string | null
  fullMessage: string | null
  type: string | null
}

function retryAfterMs(res: Response): number {
  const sec = Number(res.headers.get('retry-after'))
  return Number.isFinite(sec) && sec > 0 ? sec * 1000 : 0
}

function formatMutationErrors(errors: CameloMutationError[] | null | undefined): string | null {
  if (!errors || errors.length === 0) return null
  return errors.map((e) => e.fullMessage || e.type || 'Camelo refused the request').join('; ')
}

export async function cameloGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  opts: CameloCallOptions,
): Promise<T> {
  const endpoint = opts.endpoint || process.env['CAMELO_ENDPOINT'] || DEFAULT_CAMELO_ENDPOINT
  const fetchImpl = opts.fetchImpl ?? fetch
  const timeoutMs = opts.timeoutMs ?? 15_000
  const maxWaitMs = opts.maxWaitMs ?? 10_000
  const isMutation = /^\s*mutation\b/.test(query)
  const delays = isMutation ? [] : (opts.retryDelaysMs ?? [500, 1500])

  for (let attempt = 0; ; attempt++) {
    let failure: unknown
    let retryable = true
    let askedMs = 0

    try {
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.token}`,
          'User-Agent': USER_AGENT,
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (res.ok) {
        const payload = (await res.json()) as { data?: T; errors?: Array<{ message?: string }> }
        if (payload.errors?.length || !payload.data) {
          const msg = payload.errors?.map((e) => e.message || 'GraphQL error').join('; ') || 'No data returned'
          throw new Error(`Camelo GraphQL: ${msg}`)
        }
        return payload.data
      }

      failure = new Error(`Camelo HTTP ${res.status}`)
      retryable = res.status === 429 || res.status >= 500
      if (res.status === 429 || res.status === 503) askedMs = retryAfterMs(res)
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Camelo GraphQL:')) {
        throw err
      }
      failure = err instanceof Error && err.name === 'TimeoutError' ? new Error('Camelo timed out') : err
    }

    if (!retryable || attempt >= delays.length) throw failure
    const waitMs = Math.max(delays[attempt], Math.min(askedMs, maxWaitMs))
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
}

const CLIENTS_QUERY = `
query ListClients($after: String) {
  clients(first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      name
      email
      phoneNumber
      clientNumber
      billingAddress
    }
  }
}`

const SCHEDULES_QUERY = `
query ListSchedules {
  schedules(first: 50) {
    nodes {
      id
      name
    }
  }
}`

const CREATE_CLIENT_MUTATION = `
mutation CreateClient($input: CreateClientInput!) {
  createClient(input: $input) {
    errors { attribute fullMessage type }
    result {
      id
      name
      email
      phoneNumber
      clientNumber
      billingAddress
    }
  }
}`

const CREATE_JOB_SITE_MUTATION = `
mutation CreateJobSite($input: CreateJobSiteInput!) {
  createJobSite(input: $input) {
    errors { attribute fullMessage type }
    result {
      id
      name
      address
      note
      geoLat
      geoLong
      clients { id }
      schedules { id name }
    }
  }
}`

const UPDATE_JOB_SITE_MUTATION = `
mutation UpdateJobSite($input: UpdateJobSiteInput!) {
  updateJobSite(input: $input) {
    errors { attribute fullMessage type }
    result {
      id
      note
    }
  }
}`

const CREATE_COMMENT_MUTATION = `
mutation CreateComment($input: CreateCommentInput!) {
  createComment(input: $input) {
    errors { attribute fullMessage type }
    result {
      id
    }
  }
}`

export async function listCameloClients(opts: CameloCallOptions): Promise<CameloClientSummary[]> {
  type Page = {
    clients: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: Array<{
        id: string
        name: string | null
        email: string | null
        phoneNumber: string | null
        clientNumber: string | null
        billingAddress: string | null
      }>
    }
  }
  const rows: CameloClientSummary[] = []
  let after: string | null = null
  for (let page = 0; page < 30; page++) {
    const data: Page = await cameloGraphql<Page>(CLIENTS_QUERY, { after }, opts)
    for (const node of data.clients.nodes) {
      rows.push({
        id: node.id,
        name: node.name || 'Unnamed client',
        email: node.email ?? null,
        phoneNumber: node.phoneNumber ?? null,
        clientNumber: node.clientNumber ?? null,
        billingAddress: node.billingAddress ?? null,
      })
    }
    if (!data.clients.pageInfo.hasNextPage || !data.clients.pageInfo.endCursor) break
    after = data.clients.pageInfo.endCursor
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

export async function listCameloSchedules(opts: CameloCallOptions): Promise<CameloScheduleSummary[]> {
  type Resp = { schedules: { nodes: Array<{ id: string; name: string | null }> } }
  const data = await cameloGraphql<Resp>(SCHEDULES_QUERY, {}, opts)
  return data.schedules.nodes.map((s) => ({
    id: s.id,
    name: s.name || 'Unnamed schedule',
  }))
}

export async function createCameloClient(
  input: {
    name: string
    email?: string | null
    phoneNumber?: string | null
    billingAddress?: string | null
    clientNumber?: string | null
  },
  opts: CameloCallOptions,
): Promise<CameloClientSummary> {
  const payload: Record<string, unknown> = { name: input.name.trim() }
  if (input.email?.trim()) payload.email = input.email.trim()
  if (input.phoneNumber?.trim()) payload.phoneNumber = input.phoneNumber.trim()
  if (input.billingAddress?.trim()) payload.billingAddress = input.billingAddress.trim()
  if (input.clientNumber?.trim()) payload.clientNumber = input.clientNumber.trim()

  const data = await cameloGraphql<{
    createClient: {
      errors: CameloMutationError[] | null
      result: {
        id: string
        name: string | null
        email: string | null
        phoneNumber: string | null
        clientNumber: string | null
        billingAddress: string | null
      } | null
    } | null
  }>(CREATE_CLIENT_MUTATION, { input: payload }, opts)

  const errMsg = formatMutationErrors(data.createClient?.errors)
  const result = data.createClient?.result
  if (errMsg || !result) {
    throw new Error(errMsg ?? 'Camelo did not create the client.')
  }
  return {
    id: result.id,
    name: result.name || input.name.trim(),
    email: result.email ?? null,
    phoneNumber: result.phoneNumber ?? null,
    clientNumber: result.clientNumber ?? null,
    billingAddress: result.billingAddress ?? null,
  }
}

export async function createCameloJobSite(
  input: {
    name: string
    address: string
    geoLat: number
    geoLong: number
    scheduleIds: string[]
    clientIds: string[]
    note?: string | null
  },
  opts: CameloCallOptions,
): Promise<{
  id: string
  name: string
  address: string
  note: string | null
  geoLat: number
  geoLong: number
  scheduleName: string | null
}> {
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    address: input.address.trim(),
    geoLat: input.geoLat,
    geoLong: input.geoLong,
    scheduleIds: input.scheduleIds,
    clientIds: input.clientIds,
  }
  if (input.note?.trim()) payload.note = input.note.trim()

  const data = await cameloGraphql<{
    createJobSite: {
      errors: CameloMutationError[] | null
      result: {
        id: string
        name: string | null
        address: string | null
        note: string | null
        geoLat: number | null
        geoLong: number | null
        schedules: Array<{ id: string; name: string | null }> | null
      } | null
    } | null
  }>(CREATE_JOB_SITE_MUTATION, { input: payload }, opts)

  const errMsg = formatMutationErrors(data.createJobSite?.errors)
  const result = data.createJobSite?.result
  if (errMsg || !result) {
    throw new Error(errMsg ?? 'Camelo did not create the job site.')
  }
  return {
    id: result.id,
    name: result.name || input.name.trim(),
    address: result.address || input.address.trim(),
    note: result.note ?? (input.note?.trim() || null),
    geoLat: typeof result.geoLat === 'number' ? result.geoLat : input.geoLat,
    geoLong: typeof result.geoLong === 'number' ? result.geoLong : input.geoLong,
    scheduleName: result.schedules?.[0]?.name ?? null,
  }
}

export async function updateCameloJobSiteNote(
  jobSiteId: string,
  note: string,
  opts: CameloCallOptions,
): Promise<{ id: string; note: string }> {
  const data = await cameloGraphql<{
    updateJobSite: {
      errors: CameloMutationError[] | null
      result: { id: string; note: string | null } | null
    } | null
  }>(UPDATE_JOB_SITE_MUTATION, { input: { jobSiteId, note } }, opts)

  const errMsg = formatMutationErrors(data.updateJobSite?.errors)
  const result = data.updateJobSite?.result
  if (errMsg || !result) {
    throw new Error(errMsg ?? 'Camelo did not update the job site note.')
  }
  return { id: result.id, note: result.note ?? note }
}

export async function createCameloClientComment(
  clientId: string,
  content: string,
  opts: CameloCallOptions,
): Promise<{ id: string }> {
  const data = await cameloGraphql<{
    createComment: {
      errors: CameloMutationError[] | null
      result: { id: string } | null
    } | null
  }>(
    CREATE_COMMENT_MUTATION,
    { input: { commentableId: clientId, commentableType: 'CLIENT', content } },
    opts,
  )

  const errMsg = formatMutationErrors(data.createComment?.errors)
  const result = data.createComment?.result
  if (errMsg || !result) {
    throw new Error(errMsg ?? 'Camelo did not save the client comment.')
  }
  return { id: result.id }
}
