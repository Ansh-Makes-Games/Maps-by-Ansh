import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: any;
}

export async function searchPlaces(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    return await response.json();
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

export async function getRoute(start: [number, number], end: [number, number]) {
  try {
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`);
    return await response.json();
  } catch (error) {
    console.error("Routing error:", error);
    return null;
  }
}

export function speak(text: string, lang = 'en-US') {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
}

export async function askAI(prompt: string, history: any[] = []) {
  // Convert into the standard GoogleGenAI format: { role: 'user'|'model', parts: [{ text: '...' }] }
  const contents = [
    ...history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    { role: 'user', parts: [{ text: prompt }] }
  ];

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: contents,
        systemInstruction: "You are Lumina Maps AI, a travel expert. Suggest itineraries, interesting places, and optimize travel plans. Keep responses helpful and concise."
      })
    });
    return await response.json();
  } catch (error) {
    return { error: "AI assistant is busy." };
  }
}

export async function saveRoute(name: string, start: any, end: any, routeData: any) {
  if (!auth.currentUser) return { error: "Please sign in to save routes." };
  try {
    const docRef = await addDoc(collection(db, 'routes'), {
      name,
      ownerId: auth.currentUser.uid,
      startPoint: start,
      endPoint: end,
      routeData: JSON.stringify(routeData),
      createdAt: serverTimestamp(),
      isPublic: true
    });
    return { success: true, id: docRef.id };
  } catch (err: any) {
    console.error("Save error:", err);
    return { error: err.message };
  }
}

export async function getSharedRoute(id: string) {
  try {
    const { getDoc, doc } = await import('firebase/firestore');
    const docSnap = await getDoc(doc(db, 'routes', id));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.error("Error fetching shared route:", err);
    return null;
  }
}
