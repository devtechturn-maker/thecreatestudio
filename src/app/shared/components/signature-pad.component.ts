import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, output, signal, viewChild,
} from '@angular/core';

/**
 * Hand-drawn signature input (mouse, touch, stylus). Emits a transparent PNG data URL,
 * or null when cleared. The backend re-validates that the image actually contains ink.
 */
@Component({
  selector: 'app-signature-pad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pad" [class.pad--filled]="!empty()">
      <canvas #canvas aria-label="Signature area. Draw your signature with a mouse, finger or stylus." role="img"></canvas>
      @if (empty()) { <span class="pad__hint" aria-hidden="true">Sign here</span> }
      <span class="pad__line" aria-hidden="true"></span>
    </div>
    <div class="pad__actions">
      <button type="button" class="pad__clear" (click)="clear()" [disabled]="empty()">Clear</button>
    </div>
  `,
  styles: `
    :host { display: block; }
    .pad { position: relative; height: 180px; border-radius: 16px; background: #fff; border: 2px dashed #9fb3b5; touch-action: none; overflow: hidden; }
    .pad--filled { border-style: solid; border-color: var(--yellow); }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: crosshair; }
    .pad__hint { position: absolute; left: 1.25rem; bottom: 2.6rem; color: #9aa7a9; font-family: var(--f-alt); font-weight: 600; pointer-events: none; }
    .pad__line { position: absolute; left: 1.25rem; right: 1.25rem; bottom: 2.25rem; height: 1px; background: #c9d3d4; pointer-events: none; }
    .pad__actions { display: flex; justify-content: flex-end; margin-top: .5rem; }
    .pad__clear { font-family: var(--f-alt); font-weight: 700; font-size: .85rem; color: var(--text-2); padding: .4rem .8rem; border-radius: 999px; border: 1px solid var(--line-strong); }
    .pad__clear:disabled { opacity: .4; cursor: default; }
  `,
})
export class SignaturePadComponent implements OnDestroy {
  readonly changed = output<string | null>();
  protected readonly empty = signal(true);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private ctx?: CanvasRenderingContext2D;
  private drawing = false;
  private last = { x: 0, y: 0 };
  private cleanup?: () => void;

  constructor() {
    afterNextRender(() => this.setup());
  }

  clear(): void {
    const c = this.canvas().nativeElement;
    this.ctx?.clearRect(0, 0, c.width, c.height);
    this.empty.set(true);
    this.changed.emit(null);
  }

  private setup(): void {
    const c = this.canvas().nativeElement;
    let lastWidth = -1;
    const resize = () => {
      const rect = c.getBoundingClientRect();
      if (Math.round(rect.width) === lastWidth) return; // ignore height-only changes (mobile address bar)
      lastWidth = Math.round(rect.width);
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      c.width = Math.round(rect.width * ratio);
      c.height = Math.round(rect.height * ratio);
      this.ctx = c.getContext('2d')!;
      this.ctx.scale(ratio, ratio);
      this.ctx.lineWidth = 2.4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = '#0b1f3a';
      if (!this.empty()) this.clear(); // resizing wipes the canvas; ask to re-sign rather than keep a distorted copy
    };
    resize();

    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      this.drawing = true;
      this.last = pos(e);
      this.ctx!.beginPath();
      this.ctx!.arc(this.last.x, this.last.y, 1.1, 0, Math.PI * 2);
      this.ctx!.fillStyle = '#0b1f3a';
      this.ctx!.fill();
    };
    const move = (e: PointerEvent) => {
      if (!this.drawing) return;
      e.preventDefault();
      const p = pos(e);
      this.ctx!.beginPath();
      this.ctx!.moveTo(this.last.x, this.last.y);
      this.ctx!.lineTo(p.x, p.y);
      this.ctx!.stroke();
      this.last = p;
    };
    const up = () => {
      if (!this.drawing) return;
      this.drawing = false;
      this.empty.set(false);
      this.changed.emit(c.toDataURL('image/png'));
    };

    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    window.addEventListener('resize', resize);
    this.cleanup = () => {
      c.removeEventListener('pointerdown', down);
      c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerup', up);
      c.removeEventListener('pointercancel', up);
      window.removeEventListener('resize', resize);
    };
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
