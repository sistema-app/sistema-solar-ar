import './style.css';
import { detectCapabilities } from './xr/capability-router';
import { AREngine } from './xr/ar-engine';

async function bootstrap(): Promise<void> {
  const modeBadge = document.getElementById('mode-badge')!;
  const statusText = document.getElementById('status-text')!;
  const infoCard = document.getElementById('info-card')!;
  const btnAr = document.getElementById('btn-ar') as HTMLButtonElement;
  const btnPause = document.getElementById('btn-pause') as HTMLButtonElement;
  const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;

  const caps = await detectCapabilities();
  modeBadge.textContent = caps.label;

  let inAR = false;
  const engine = new AREngine(document.getElementById('app')!, document.getElementById('ar-hud')!, caps.mode, {
    onStatus: (m) => { statusText.textContent = m; },
    onSelectInfo: (h) => { infoCard.innerHTML = h ?? ''; infoCard.classList.toggle('hidden', !h); },
    onSessionState: (a) => { inAR = a; btnAr.textContent = a ? 'Salir de AR' : 'Ver en Realidad Aumentada'; }
  });

  if (caps.isSecure && (caps.mode === 'webxr' || caps.mode === 'ios-quicklook')) {
    btnAr.disabled = false;
    statusText.textContent = 'Toca el botón inferior para proyectar en tu entorno real.';
  } else {
    btnAr.textContent = 'AR disponible en móvil';
    statusText.textContent = 'Arrastra para rotar el modelo 3D o abre el enlace en tu teléfono.';
  }

  btnAr.addEventListener('click', () => { void (inAR ? engine.endAR() : engine.startAR()); });
  btnPause.addEventListener('click', () => {
    const paused = engine.togglePause();
    btnPause.textContent = paused ? 'Reanudar' : 'Pausar';
    btnPause.classList.toggle('is-paused', paused);
  });
  btnReset.addEventListener('click', () => engine.resetView());
  infoCard.addEventListener('click', () => infoCard.classList.add('hidden'));
}
void bootstrap();