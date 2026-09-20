// Small helper for reading this tool's required runtime config. On
// Cloudflare Workers (this adapter version), bindings and vars/secrets are
// read via `import { env } from 'cloudflare:workers'` in the calling route
// — `Astro.locals.runtime.env` was removed in this @astrojs/cloudflare
// version. See wrangler.toml for the D1 binding and .dev.vars.example for
// the secret names this tool expects locally.

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`Missing required rental-analysis config: ${name}. See .dev.vars.example.`);
    this.name = 'MissingEnvError';
  }
}

export function requireEnvString(env: Record<string, unknown>, name: string): string {
  const value = env[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new MissingEnvError(name);
  }
  return value;
}
