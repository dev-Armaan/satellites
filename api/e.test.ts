/** The events relay (api/e.ts).  npx vitest run --config scripts/backend-vitest.config.ts */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleEvents, relayBody } from './e.js'

const SID = 'sid_abcdefghijklmnop'
const batch = (over: Record<string, unknown> = {}) => JSON.stringify({ sid: SID, ctx: { device: 'phone', country: 'zz' }, events: [{ type: 'view', p: { entry: 'landing' } }], ...over })

describe('relayBody', () => {
  it('wraps the batch, and the country is only ever the edge header', () => {
    expect(JSON.parse(relayBody(batch(), 'CA')!)).toEqual({ batch: { sid: SID, ctx: { device: 'phone', country: 'ca' }, events: [{ type: 'view', p: { entry: 'landing' } }] } })
    expect(JSON.parse(relayBody(batch(), null)!).batch.ctx).toEqual({ device: 'phone' })
    expect(JSON.parse(relayBody(batch(), 'XX')!).batch.ctx).toEqual({ device: 'phone' })
  })
  it('drops extra top-level keys', () => expect(JSON.parse(relayBody(batch({ ip: '1.2.3.4' }), null)!).batch).not.toHaveProperty('ip'))
  it('rejects junk', () => {
    expect(relayBody('nope', null)).toBeNull()
    expect(relayBody('[]', null)).toBeNull()
    expect(relayBody(batch({ sid: 'short' }), null)).toBeNull()
    expect(relayBody(batch({ events: [] }), null)).toBeNull()
    expect(relayBody(batch({ events: Array(51).fill({ type: 'view' }) }), null)).toBeNull()
  })
})

describe('handleEvents', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })
  const req = (body: string, headers: Record<string, string> = {}, method = 'POST') =>
    new Request('https://www.watched.earth/api/e', { method, body: method === 'POST' ? body : undefined, headers: { 'content-type': 'text/plain', ...headers } })

  it('forwards to log_events with the publishable key and no IP', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test')
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await handleEvents(req(batch(), { 'x-vercel-ip-country': 'DE', 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '1.2.3.4' }))
    expect(res.status).toBe(204)
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://example.supabase.co/rest/v1/rpc/log_events')
    const headers = init.headers as Record<string, string>
    expect(headers.apikey).toBe('sb_publishable_test')
    expect(JSON.stringify(headers)).not.toContain('1.2.3.4')
    expect(String(init.body)).not.toContain('1.2.3.4')
    expect(JSON.parse(String(init.body)).batch.ctx.country).toBe('de')
  })
  it('204 without forwarding for junk or no backend; 405 for GET; 413 when too big', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('VITE_SUPABASE_URL', '')
    expect((await handleEvents(req(batch()))).status).toBe(204)
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'k')
    expect((await handleEvents(req('nope'))).status).toBe(204)
    expect(fetchMock).not.toHaveBeenCalled()
    expect((await handleEvents(req('', {}, 'GET'))).status).toBe(405)
    expect((await handleEvents(req('x'.repeat(17000)))).status).toBe(413)
  })
  it('preview deployments write nothing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'k')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect((await handleEvents(req(batch()))).status).toBe(204)
    expect(fetchMock).not.toHaveBeenCalled()
    vi.stubEnv('VERCEL_ENV', 'production')
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await handleEvents(req(batch()))
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('on Cloudflare, writes only for the production hosts, with the country from cf-ipcountry', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'k')
    vi.stubEnv('PRODUCTION_HOSTS', 'www.watched.earth, watched.earth')
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const staging = new Request('https://next.watched.earth/api/e', { method: 'POST', body: batch(), headers: { 'cf-ipcountry': 'CA' } })
    expect((await handleEvents(staging)).status).toBe(204)
    expect(fetchMock).not.toHaveBeenCalled()
    await handleEvents(req(batch(), { 'cf-ipcountry': 'CA' }))
    expect(fetchMock).toHaveBeenCalledOnce()
    const sent = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body))
    expect(sent.batch.ctx.country).toBe('ca')
  })
  it('swallows a failing upstream', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'k')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down') }))
    expect((await handleEvents(req(batch()))).status).toBe(204)
  })
})
