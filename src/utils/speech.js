// Cache the Spanish voice once it's available
  let spanishVoice = null;
  
  function pickSpanishVoice() {
      const voices = speechSynthesis.getVoices();
      if (!voices.length) return null;
  
      // Preferred order: Colombian → Mexican → any Spanish (LatAm) → any Spanish
      const priorities = ["es-CO", "es-MX", "es-US", "es-AR", "es-ES", "es"];
      for (const lang of priorities) {
          const match = voices.find(v => v.lang?.toLowerCase().startsWith(lang.toLowerCase()));
          if (match) return match;
      }
      return null;
  }
  
  // Voices load asynchronously in most browsers
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
      spanishVoice = pickSpanishVoice();
      speechSynthesis.onvoiceschanged = () => {
          spanishVoice = pickSpanishVoice();
      };
  }
  
  export function announcePayment(name, amount) {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  
      const text = `Pago recibido de ${name} por ${amount} pesos`;
      const utterance = new SpeechSynthesisUtterance(text);
  
      utterance.lang = "es-CO"; // change to "es-MX" / "es-ES" if you prefer
      utterance.rate = 1;       // 0.1 – 10 (default 1)
      utterance.pitch = 1;      // 0 – 2 (default 1)
      utterance.volume = 1;     // 0 – 1 (default 1)
  
      const voice = spanishVoice ?? pickSpanishVoice();
      if (voice) utterance.voice = voice;
  
      speechSynthesis.speak(utterance);
  }