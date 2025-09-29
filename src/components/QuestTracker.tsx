// src/components/QuestTracker.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useStepCounter } from "@/hooks/useStepCounter";
import { haversineDistanceMeters } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { saveRealtimeQuestProgress } from "@/lib/firestoreHelpers";
import throttle from "lodash.throttle";
import { auth } from "@/firebase";

type Props = {
  questLocation: { lat: number; lng: number } | null;
  questId?: string;
  saveIntervalMs?: number;
};

const QuestTracker: React.FC<Props> = ({ questLocation, questId, saveIntervalMs = 7000 }) => {
  const [tracking, setTracking] = useState(false);
  const { steps, reset } = useStepCounter(tracking);
  const { position, error: geoError } = useGeolocation(true);
  const lastSavedRef = useRef<number | null>(null);

  const distanceMeters = useMemo(() => {
    if (!position || !questLocation) return null;
    return Math.round(
      haversineDistanceMeters(
        { lat: position.lat, lng: position.lng },
        questLocation
      )
    );
  }, [position, questLocation]);

  const throttledSave = useRef(
    throttle(async (payload: {
      lat: number;
      lng: number;
      accuracy?: number;
      steps: number;
      distanceMeters?: number;
    }) => {
      const uid = auth.currentUser?.uid;
      if (!uid || !questId) return;
      await saveRealtimeQuestProgress(uid, questId, payload);
      lastSavedRef.current = Date.now();
    }, saveIntervalMs, { leading: true, trailing: true })
  ).current;

  useEffect(() => {
    if (!tracking) return;
    if (!position) return;

    const tick = () => {
      if (!position) return;
      throttledSave({
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
        steps,
        distanceMeters: distanceMeters ?? undefined,
      });
    };

    tick();
    const interval = setInterval(tick, saveIntervalMs);
    return () => clearInterval(interval);
  }, [tracking, position, steps, distanceMeters, throttledSave, saveIntervalMs]);

  return (
    <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Quest Tracker</h3>
      <div className="space-y-2">
        <div>
          <p className="text-sm text-gray-500">Distance to quest</p>
          <p className="text-xl font-bold">
            {distanceMeters == null ? "—" : `${distanceMeters} m`}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Steps</p>
          <p className="text-xl font-bold">{steps}</p>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={() => setTracking(!tracking)}>
            {tracking ? "Pause" : "Start tracking"}
          </Button>
          <Button variant="outline" onClick={reset}>Reset Steps</Button>
        </div>
        {geoError && (
          <p className="text-red-500 text-sm mt-2">
            Geolocation error: {geoError.message}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Location and step data are only tracked while active.{" "}
          Last saved:{" "}
          {lastSavedRef.current
            ? new Date(lastSavedRef.current).toLocaleTimeString()
            : "never"}
        </p>
      </div>
    </div>
  );
};

export default QuestTracker;
