export default {
  async fetch(request: Request, env: Env, _ctx: unknown): Promise<Response> {
    const url = new URL(request.url)

    // Proxy API requests to the tt-server service binding
    if (url.pathname.startsWith('/api/')) {
      const proxiedUrl = new URL(request.url)
      // Strip the /api prefix so tt-server sees the original route
      proxiedUrl.pathname = url.pathname.replace(/^\/api\//, '/')
      return env.TT_SERVER.fetch(new Request(proxiedUrl.toString(), request))
    }

    // Serve static assets for everything else (SPA fallback handled by wrangler "assets")
    // The assets binding is available when "assets" is configured in wrangler.jsonc
    if (env.ASSETS && 'fetch' in env.ASSETS) {
      return (env.ASSETS as Fetcher).fetch(request)
    }

    return new Response('Not found', { status: 404 })
  },
}

// Bindings types for better DX (optional)
// Minimal Fetcher type for bindings
type Fetcher = {
  fetch: (req: Request | string, init?: RequestInit) => Promise<Response>
}

export interface Env {
  TT_SERVER: Fetcher
  ASSETS: Fetcher
}
