// src/lib/firestoreHelpers.ts
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

export async function saveRealtimeQuestProgress(
  uid: string,
  questId: string,
  payload: {
    lat: number;
    lng: number;
    accuracy?: number;
    steps: number;
    distanceMeters?: number;
  }
) {
  if (!uid || !questId) return;
  const ref = doc(db, "quests", questId, "participants", uid);
  try {
    await setDoc(
      ref,
      {
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Failed saving realtime progress", err);
  }
}
