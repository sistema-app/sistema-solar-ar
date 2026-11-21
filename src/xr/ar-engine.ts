import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import type { ARMode } from './capability-router';
import { createExperience, type ARExperience } from '../scene/experience';

export interface AREngineCallbacks {
  onStatus: (msg: string) => void;
  onSelectInfo: (html: string | null) => void;
  onSessionState: (inAR: boolean) => void;
}

export class AREngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private experience: ARExperience;
  private reticle: THREE.Mesh;
  private hitTestSource: XRHitTestSource | null = null;
  private hitTestRequested = false;
  private placedInAR = false;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  constructor(container: HTMLElement, private hudRoot: HTMLElement, private mode: ARMode, private cb: AREngineCallbacks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 50);
    this.camera.position.set(0, 0.55, 1.15);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 1.4));
    const dir = new THREE.DirectionalLight(0xffffff, 1.8);
    dir.position.set(1.5, 3, 2);
    this.scene.add(dir);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0.22, 0);

    this.experience = createExperience();
    this.scene.add(this.experience.root);

    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.11, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);

    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.setAnimationLoop(this.renderLoop);
  }

  public async startAR(): Promise<void> {
    if (this.mode === 'webxr') await this.startWebXR();
    else if (this.mode === 'ios-quicklook') await this.startIOS();
  }

  public async endAR(): Promise<void> { await this.renderer.xr.getSession()?.end(); }

  public togglePause(): boolean {
    const next = !this.experience.isPaused();
    this.experience.setPaused(next);
    return next;
  }

  public resetView(): void {
    this.placedInAR = false;
    this.experience.root.position.set(0, 0, 0);
    this.experience.root.visible = true;
    this.camera.position.set(0, 0.55, 1.15);
    this.controls.target.set(0, 0.22, 0);
    this.controls.update();
    this.cb.onSelectInfo(null);
  }

  private async startWebXR(): Promise<void> {
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (!xr) return;
    try {
      const session = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hit-test', 'dom-overlay', 'anchors'],
        domOverlay: { root: this.hudRoot }
      });
      this.renderer.xr.setReferenceSpaceType('local-floor');
      await this.renderer.xr.setSession(session);
      this.placedInAR = false;
      this.experience.root.visible = false;
      this.cb.onSessionState(true);
      this.cb.onStatus('Apunta a una superficie y toca para colocar.');

      const ctrl = this.renderer.xr.getController(0);
      ctrl.addEventListener('select', () => {
        if (!this.placedInAR && this.reticle.visible) {
          this.experience.root.position.setFromMatrixPosition(this.reticle.matrix);
          this.experience.root.visible = true;
          this.placedInAR = true;
          this.cb.onStatus('Sistema Solar anclado. Toca cualquier planeta para ver su ficha.');
          return;
        }
        if (this.placedInAR && this.experience.onSelectObject) {
          const tempMatrix = new THREE.Matrix4().identity().extractRotation(ctrl.matrixWorld);
          this.raycaster.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
          this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
          const hits = this.raycaster.intersectObjects(this.experience.root.children, true);
          this.handleSelectionHits(hits);
        }
      });
      this.scene.add(ctrl);

      session.addEventListener('end', () => {
        this.hitTestRequested = false;
        this.hitTestSource = null;
        this.reticle.visible = false;
        this.experience.root.visible = true;
        this.experience.root.position.set(0, 0, 0);
        this.cb.onSessionState(false);
        this.cb.onStatus('Sesión AR finalizada.');
      });
    } catch { this.cb.onStatus('No se pudo iniciar la cámara AR.'); }
  }

  private async startIOS(): Promise<void> {
    this.cb.onStatus('Generando escena para Apple AR Quick Look...');
    try {
      const data = await new USDZExporter().parseAsync(this.experience.root);
      const url = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: 'model/vnd.usdz+zip' }));
      const a = document.createElement('a');
      a.rel = 'ar'; a.href = url; a.download = 'experiencia-ar.usdz';
      a.appendChild(document.createElement('img'));
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { this.cb.onStatus('Error al exportar USDZ en iOS.'); }
  }

  private handleSelectionHits(hits: THREE.Intersection[]): void {
    if (!this.experience.onSelectObject) return;
    const interactiveHit = hits.find((h) => !h.object.userData.nonInteractive);
    this.cb.onSelectInfo(interactiveHit ? this.experience.onSelectObject(interactiveHit) : null);
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (!this.experience.onSelectObject) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.experience.root.children, true);
    this.handleSelectionHits(hits);
  };

  private renderLoop = (_t: number, frame?: XRFrame): void => {
    this.experience.update(this.clock.elapsedTime, this.clock.getDelta());
    if (frame && this.renderer.xr.isPresenting) {
      const session = this.renderer.xr.getSession();
      const refSpace = this.renderer.xr.getReferenceSpace();
      if (session && !this.hitTestRequested) {
        this.hitTestRequested = true;
        session.requestReferenceSpace('viewer').then(vs => session.requestHitTestSource?.({ space: vs })?.then(s => this.hitTestSource = s))
          .catch(() => { this.experience.root.position.set(0, 0, -0.8); this.experience.root.visible = true; });
      }
      if (this.hitTestSource && refSpace && !this.placedInAR) {
        const hits = frame.getHitTestResults(this.hitTestSource);
        const pose = hits[0]?.getPose(refSpace);
        this.reticle.visible = Boolean(pose);
        if (pose) this.reticle.matrix.fromArray(pose.transform.matrix);
      } else this.reticle.visible = false;
    } else this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}