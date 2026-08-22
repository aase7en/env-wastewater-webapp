export type TwinRendererStatus = "loading" | "ready" | "unavailable";

/** Small capability probe used before R3F creates its renderer. Runtime
 * failures are still handled by the renderer boundary and context-lost path.
 * Cache the browser result so React StrictMode does not create/lose a second
 * probe context during its development double-initialization pass. */
let cachedWebGLSupport: boolean | undefined;

export function supportsWebGL(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (cachedWebGLSupport !== undefined) return cachedWebGLSupport;
  if (
    typeof window.WebGLRenderingContext === "undefined" &&
    typeof window.WebGL2RenderingContext === "undefined"
  ) {
    cachedWebGLSupport = false;
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) {
      cachedWebGLSupport = false;
      return false;
    }
    context.getExtension("WEBGL_lose_context")?.loseContext();
    cachedWebGLSupport = true;
    return true;
  } catch {
    cachedWebGLSupport = false;
    return false;
  }
}
