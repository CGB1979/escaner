/*
 * Sonidos centralizados del Rebotador.
 * No requieren archivos de audio externos: se generan con Web Audio API.
 */
let contextoAudio = null;

function obtenerContextoAudio() {
  if (contextoAudio) return contextoAudio;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  contextoAudio = new AudioContextClass();
  return contextoAudio;
}

function prepararSonidos() {
  const ctx = obtenerContextoAudio();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

function reproducirTono(frecuencia, inicio, duracion, tipo = "sine", volumen = 0.10) {
  const ctx = obtenerContextoAudio();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const ahora = ctx.currentTime + inicio;

  oscillator.type = tipo;
  oscillator.frequency.setValueAtTime(frecuencia, ahora);

  gain.gain.setValueAtTime(0.0001, ahora);
  gain.gain.exponentialRampToValueAtTime(volumen, ahora + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ahora + duracion);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(ahora);
  oscillator.stop(ahora + duracion + 0.02);
}

function sonidoExito() {
  prepararSonidos();
  reproducirTono(880, 0, 0.10, "sine", 0.10);
  reproducirTono(1174.66, 0.12, 0.14, "sine", 0.10);
}

function sonidoError() {
  prepararSonidos();
  reproducirTono(220, 0, 0.13, "square", 0.07);
  reproducirTono(165, 0.15, 0.18, "square", 0.07);
}

// Intentamos habilitar el contexto desde la primera interacción del usuario.
["pointerdown", "touchstart", "keydown"].forEach(evento => {
  document.addEventListener(evento, prepararSonidos, { once: true, passive: true });
});
