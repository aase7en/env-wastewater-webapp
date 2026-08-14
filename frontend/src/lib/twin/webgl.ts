export type TwinRendererStatus = "loading" | "ready" | "unavailable";

/** Small capability probe used before R3F creates its renderer. Runtime
 * failures are still handled by the renderer boundary and context-lost path. */
export function supportsWebGL(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (
    typeof window.WebGLRenderingContext === "undefined" &&
    typeof window.WebGL2RenderingContext === "undefined"
  ) {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
