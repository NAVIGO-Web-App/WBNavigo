// src/hooks/useStepCounter.ts
import { useEffect, useRef, useState } from "react";

export function useStepCounter(enabled = false) {
  const [steps, setSteps] = useState(0);
  const lastPeakTime = useRef(0);
  const lastMagnitude = useRef(0);
  const buffer = useRef<number[]>([]);
  const samplingInterval = 200; // ms, how often we process

  useEffect(() => {
    if (!enabled) return;

    let handler: (e: DeviceMotionEvent) => void;
    let processTimer: number | null = null;

    handler = (e) => {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;
      const mag = Math.sqrt(x * x + y * y + z * z);
      buffer.current.push(mag);
      // keep buffer short
      if (buffer.current.length > 50) buffer.current.shift();
    };

    // Request permission on iOS 13+ (must be called in response to user gesture)
    const tryAddListener = async () => {
      if ((DeviceMotionEvent as any)?.requestPermission) {
        try {
          const p = await (DeviceMotionEvent as any).requestPermission();
          if (p !== "granted") return;
        } catch (err) {
          console.warn("devicemotion permission error", err);
          return;
        }
      }
      window.addEventListener("devicemotion", handler);
      processTimer = window.setInterval(() => {
        const buf = buffer.current;
        if (buf.length < 5) return;
        // simple peak detection:
        const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
        const last = buf[buf.length - 1];
        // threshold tuned for walking; tweak as needed
        const threshold = avg + 1.2;
        const now = Date.now();
        if (last > threshold && last > lastMagnitude.current && now - lastPeakTime.current > 300) {
          // count step
          lastPeakTime.current = now;
          setSteps((s) => s + 1);
        }
        lastMagnitude.current = last;
      }, samplingInterval);
    };

    tryAddListener();

    return () => {
      window.removeEventListener("devicemotion", handler);
      if (processTimer) clearInterval(processTimer);
    };
  }, [enabled]);

  const reset = () => setSteps(0);

  return { steps, reset };
}
