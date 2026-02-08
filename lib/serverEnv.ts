type IntEnvOptions = {
  min?: number;
  max?: number;
};

export function envInt(name: string, fallback: number, options: IntEnvOptions = {}) {
  const raw = process.env[name];
  if (!raw) return fallback;

  const cleaned = raw.replace(/_/g, '').trim();
  const parsed = Number.parseInt(cleaned, 10);
  if (!Number.isFinite(parsed)) return fallback;

  if (typeof options.min === 'number' && parsed < options.min) return fallback;
  if (typeof options.max === 'number' && parsed > options.max) return fallback;
  return parsed;
}

