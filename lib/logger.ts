export function logApiError(context: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[${context}] ${error.name}: ${error.message}`);
    return;
  }

  console.error(`[${context}]`, error);
}

export function logApiWarn(context: string, message: string) {
  console.warn(`[${context}] ${message}`);
}
