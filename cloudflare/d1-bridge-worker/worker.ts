/**
 * Optionnel : Cloudflare Worker D1 Bridge sécurisé pour le backend Node.js / Express.
 * Permet d'exécuter les requêtes SQL sur le binding natif env.DB de Cloudflare D1
 * tout en conservant le serveur Node.js / Express intact.
 */
interface Env {
  DB: {
    prepare(query: string): {
      bind(...values: unknown[]): {
        all<T = Record<string, unknown>>(): Promise<{ results: T[]; meta?: Record<string, unknown> }>;
        run(): Promise<{ success: boolean; meta?: Record<string, unknown> }>;
      };
      all<T = Record<string, unknown>>(): Promise<{ results: T[]; meta?: Record<string, unknown> }>;
      run(): Promise<{ success: boolean; meta?: Record<string, unknown> }>;
    };
  };
  BRIDGE_AUTH_TOKEN: string;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i += 1) {
    diff |= ab[i] ^ bb[i];
  }
  return diff === 0;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!env.BRIDGE_AUTH_TOKEN || !token || !timingSafeEqualStr(token, env.BRIDGE_AUTH_TOKEN)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body = (await request.json()) as {
        sql?: string;
        params?: unknown[];
        mode?: 'all' | 'run';
      };
      const sql = (body.sql || '').trim();
      const params = Array.isArray(body.params) ? body.params : [];
      if (!sql) {
        return Response.json({ error: 'SQL query is required' }, { status: 400 });
      }

      const stmt = env.DB.prepare(sql);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;

      if (body.mode === 'run') {
        const result = await bound.run();
        return Response.json({ success: result.success, meta: result.meta || {}, results: [] });
      }

      const result = await bound.all();
      return Response.json({ success: true, results: result.results || [], meta: result.meta || {} });
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : 'D1 execution error' },
        { status: 500 },
      );
    }
  },
};
