/**
 * Unified AI Fallback Utility
 * 
 * All AI calls follow the pattern:
 * 1. Primary: Google Direct API
 * 2. Fallback: Lovable AI Gateway
 */

export interface CallAIOptions {
  logPrefix?: string;
}

/**
 * Determine if an error should trigger fallback to backup API
 */
export function shouldFallback(error: unknown): boolean {
  if (error instanceof Response) {
    return [429, 402, 500, 502, 503, 504].includes(error.status);
  }
  
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate limit") ||
      msg.includes("blocked") ||
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("503") ||
      msg.includes("502") ||
      msg.includes("500") ||
      msg.includes("failed to fetch")
    );
  }
  
  return true; // Default to fallback on unknown errors
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(status: number, source: "google" | "lovable"): string {
  switch (status) {
    case 429:
      return source === "google" 
        ? "Google API 请求频率过高，正在切换备用服务..."
        : "AI 请求频率过高，请稍后再试";
    case 402:
      return "AI 额度已用完，请充值后再试";
    case 503:
    case 502:
      return source === "google"
        ? "Google 服务暂时不可用，正在切换备用服务..."
        : "AI 服务暂时不可用";
    default:
      return "AI 服务出错，请重试";
  }
}

/**
 * Unified dual-backup AI call wrapper
 * Primary: Google Direct → Fallback: Lovable AI
 */
export async function callWithFallback<T>(
  primaryCall: () => Promise<T>,
  fallbackCall: () => Promise<T>,
  options?: CallAIOptions
): Promise<{ result: T; usedFallback: boolean }> {
  const prefix = options?.logPrefix || "AI";
  
  try {
    console.log(`${prefix}: Attempting primary call (Google Direct)...`);
    const result = await primaryCall();
    console.log(`${prefix}: Primary call succeeded`);
    return { result, usedFallback: false };
  } catch (primaryError) {
    console.warn(`${prefix}: Primary call failed:`, primaryError);
    
    if (!shouldFallback(primaryError)) {
      throw primaryError;
    }
    
    console.log(`${prefix}: Switching to fallback (Lovable AI)...`);
    try {
      const result = await fallbackCall();
      console.log(`${prefix}: Fallback succeeded`);
      return { result, usedFallback: true };
    } catch (fallbackError) {
      console.error(`${prefix}: Both primary and fallback failed`);
      throw fallbackError;
    }
  }
}

/**
 * Check response and throw if not ok
 */
export async function checkResponse(response: Response, source: string): Promise<void> {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${source} API error:`, response.status, errorText);
    throw new Error(`${source} API error: ${response.status}`);
  }
}
