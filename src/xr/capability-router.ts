export type ARMode = 'webxr' | 'ios-quicklook' | 'desktop-3d';
export interface CapabilityReport { mode: ARMode; isSecure: boolean; label: string; }

export async function detectCapabilities(): Promise<CapabilityReport> {
  const isSecure = window.isSecureContext;
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
  if (isSecure && xr) {
    try {
      if (await xr.isSessionSupported('immersive-ar')) return { mode: 'webxr', isSecure, label: 'WebXR Nativo Disponible' };
    } catch {}
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return { mode: 'ios-quicklook', isSecure, label: 'iOS AR Quick Look Disponible' };
  return { mode: 'desktop-3d', isSecure, label: 'Modo Visor 3D Interactivo' };
}