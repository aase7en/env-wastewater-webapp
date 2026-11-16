/**
 * ENV-PARITY-P2-002 — QR scanner for the extinguisher inspection flow
 * (WO §4 / D1-4).
 *
 * Minimal-footprint scan path per the binding constraints:
 *   1. native `BarcodeDetector` when the browser ships it (Android Chrome)
 *   2. smallest viable decode fallback for iOS Safari — jsQR over
 *      requestVideoFrameCallback/animation frames
 *   3. honest Thai states for permission-denied / no-camera / unsupported
 *      — and the manual pick from the master list stays available in the
 *      page regardless (the AppSheet scan/manual duality)
 *
 * The decoded payload is handed to the caller; NOTHING camera-related is
 * stored. The stream is always stopped on unmount.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";

type DetectorLike = { detect: (source: VideoFrame | HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };

type ScanState = "idle" | "starting" | "scanning" | "denied" | "no-camera" | "unsupported" | "error";

const MSG_DENIED = "ไม่ได้รับอนุญาตให้ใช้กล้อง — โปรดอนุญาตการเข้าถึงกล้องในเบราว์เซอร์ หรือเลือกถังจากรายการแทน";
const MSG_NO_CAMERA = "ไม่พบกล้องของอุปกรณ์ — เลือกถังจากรายการแทน";
const MSG_UNSUPPORTED = "เบราว์เซอร์นี้ไม่รองรับการสแกน QR — เลือกถังจากรายการแทน";

type JsqrDecode = (data: Uint8ClampedArray, w: number, h: number) => { data: string } | null;

interface QrScannerProps {
  onDetected: (payload: string) => void;
  /** test-id prefix for the interactive controls (e2e pins) */
  scanButtonTestId?: string;
}

export function QrScanner({ onDetected, scanButtonTestId = "ext-qr-scan-btn" }: QrScannerProps) {
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stoppedRef = useRef(false);
  const detectedRef = useRef(false);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const startDetectorLoop = useCallback(
    async (video: HTMLVideoElement, detector: DetectorLike) => {
      const tick = async () => {
        if (stoppedRef.current || detectedRef.current) return;
        try {
          const codes = await detector.detect(video);
          const hit = codes.find((c) => c.rawValue?.trim());
          if (hit && !detectedRef.current) {
            detectedRef.current = true;
            stop();
            setState("idle");
            onDetected(hit.rawValue.trim());
            return;
          }
        } catch {
          // transient decode errors (frame not ready) — keep looping
        }
        rafRef.current = requestAnimationFrame(() => void tick());
      };
      rafRef.current = requestAnimationFrame(() => void tick());
    },
    [onDetected, stop],
  );

  const startJsqrLoop = useCallback(
    async (video: HTMLVideoElement) => {
      let decode: JsqrDecode | null = null;
      try {
        // the D1-4 sanctioned iOS fallback — lazily imported so browsers
        // with native BarcodeDetector never load it
        const mod = await import("jsqr");
        decode = mod.default as JsqrDecode;
      } catch {
        setState("unsupported");
        setMessage(MSG_UNSUPPORTED);
        stop();
        return;
      }
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const tick = () => {
        if (stoppedRef.current || detectedRef.current || !ctx) return;
        if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hit = decode?.(img.data, img.width, img.height);
          if (hit?.data?.trim() && !detectedRef.current) {
            detectedRef.current = true;
            stop();
            setState("idle");
            onDetected(hit.data.trim());
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [onDetected, stop],
  );

  const start = useCallback(async () => {
    detectedRef.current = false;
    stoppedRef.current = false;
    setMessage(null);
    setState("starting");
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      setMessage(MSG_UNSUPPORTED);
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setState("denied");
        setMessage(MSG_DENIED);
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setState("no-camera");
        setMessage(MSG_NO_CAMERA);
      } else {
        setState("error");
        setMessage(MSG_NO_CAMERA);
      }
      return;
    }
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      stop();
      return;
    }
    // srcObject/play failures (test-harness proxy streams, blocked
    // autoplay) must NOT kill the decode loop — the detector path only
    // needs the element when genuinely decoding camera frames.
    try {
      video.srcObject = stream as MediaStream;
      await video.play().catch(() => {});
    } catch {
      // keep going — the decode loop below runs regardless
    }
    setState("scanning");

    // Prefer the native detector when constructible (Android Chrome);
    // fall back to jsQR (iOS Safari).
    const BDCtor = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => DetectorLike })
      .BarcodeDetector;
    if (BDCtor) {
      try {
        const detector = new BDCtor({ formats: ["qr_code"] });
        await startDetectorLoop(video, detector);
        return;
      } catch {
        // constructor rejected (unsupported platform claims to ship the
        // API) — fall through to jsQR
      }
    }
    await startJsqrLoop(video);
  }, [startDetectorLoop, startJsqrLoop, stop]);

  return (
    <div className="space-y-2" data-testid="ext-qr-scanner">
      {/* the video element stays MOUNTED from the first start() so the ref
          is populated when getUserMedia resolves (a state-gated render
          would race React's commit and yield a null ref) */}
      <video
        ref={videoRef}
        muted
        playsInline
        className={state === "scanning" || state === "starting" ? "w-full rounded-xl border border-aura-cyan/40 bg-black/40" : "hidden"}
        data-testid="ext-qr-video"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void start()}
          data-testid={scanButtonTestId}
        >
          สแกน QR CODE
        </Button>
        {state === "scanning" ? <span className="text-xs text-aura-textMuted font-thai">กำลังสแกน…</span> : null}
      </div>
      {message ? (
        <p className="text-xs text-alert-red font-thai" data-testid="ext-qr-camera-error" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
