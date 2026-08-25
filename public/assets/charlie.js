const preferredNames = ["karen", "lee", "catherine", "moira", "serena", "samantha", "daniel"];

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  const au = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en-au"));
  const pool = au.length ? au : voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  for (const name of preferredNames) {
    const hit = pool.find((voice) => voice.name.toLowerCase().includes(name));
    if (hit) return hit;
  }
  return pool[0] ?? voices[0] ?? null;
}

let unlocked = false;

export function unlockSpeech() {
  if (unlocked || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(" ");
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
  unlocked = true;
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export function speak(text, { mute = false } = {}) {
  stopSpeaking();
  if (mute || !text || !window.speechSynthesis) return Promise.resolve();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text.replace(/\s+/g, " ").trim());
    utterance.rate = 0.96;
    utterance.pitch = 0.95;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = pickVoice;
}
