export function isBannedError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";
  return code.includes("banned") || message.includes("banned");
}
