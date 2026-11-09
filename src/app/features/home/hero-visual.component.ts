import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';
import { IconComponent } from '../../shared/components/icon.component';
import { MotionService } from '../../core/services/motion.service';

/**
 * Layered hero composition: website mockup, phone app mockup, social post,
 * growth chart & floating chips. Layers drift with the pointer (desktop).
 */
@Component({
  selector: 'app-hero-visual',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="stage" aria-hidden="true">
    <div class="orb" data-depth="0.2"></div>

    <div class="browser layer" data-depth="0.35">
      <div class="browser__bar"><i></i><i></i><i></i><span>yourbrand.com</span></div>
      <div class="browser__body">
        <div class="b-hero"><b></b><b class="s"></b><em></em></div>
        <div class="b-cards"><span></span><span></span><span></span></div>
      </div>
    </div>

    <div class="phone layer" data-depth="0.8">
      <div class="phone__notch"></div>
      <div class="phone__screen">
        <div class="p-head"></div>
        <div class="p-card"><span></span></div>
        <div class="p-row"><i></i><i></i></div>
        <div class="p-row"><i></i><i></i></div>
        <div class="p-btn"></div>
      </div>
    </div>

    <div class="post layer" data-depth="1.1">
      <div class="post__head"><span class="post__av"></span><span class="post__name"></span></div>
      <div class="post__img"><app-icon name="spark" [size]="34" /></div>
      <div class="post__foot"><span>♥ Engagement</span><span class="up">▲</span></div>
    </div>

    <div class="chart layer" data-depth="0.6">
      <p>Growth</p>
      <svg viewBox="0 0 160 70"><defs><linearGradient id="hv-g" x1="0" x2="1"><stop offset="0" stop-color="#ffe01b"/><stop offset="1" stop-color="#13808c"/></linearGradient></defs>
        <path d="M0 62 C30 58 40 44 62 46 S100 22 120 24 S150 6 160 4" fill="none" stroke="url(#hv-g)" stroke-width="3" stroke-linecap="round"/></svg>
    </div>

    <span class="tag tag--1 layer" data-depth="1.3"><app-icon name="share" [size]="16" /> Social</span>
    <span class="tag tag--2 layer" data-depth="1.0"><app-icon name="globe" [size]="16" /> Web</span>
    <span class="tag tag--3 layer" data-depth="1.4"><app-icon name="phone" [size]="16" /> Apps</span>
    <span class="tag tag--4 layer" data-depth="0.9"><app-icon name="pen" [size]="16" /> Design</span>
  </div>`,
  styles: `
    :host { display: block; }
    .stage { position: relative; width: 100%; max-width: 600px; margin-inline: auto; aspect-ratio: 1 / .92; }
    .layer { position: absolute; will-change: transform; }
    .orb { position: absolute; inset: 14%; border-radius: 50%; background: conic-gradient(from 120deg, #ffe01b, #13808c, #07191c 60%, #ffe01b); filter: blur(50px); opacity: .45; animation: spin 18s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .browser { left: 0; top: 10%; width: 74%; border-radius: 16px; background: #0f3036; border: 1px solid var(--line-strong); box-shadow: 0 40px 80px rgba(0,0,0,.5); overflow: hidden; }
    .browser__bar { display: flex; align-items: center; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--line); }
    .browser__bar i { width: 9px; height: 9px; border-radius: 50%; background: #3f3f46; }
    .browser__bar span { margin-left: 10px; font-size: 10px; color: var(--text-2); background: rgba(255,255,255,.05); padding: 3px 10px; border-radius: 99px; }
    .browser__body { padding: 18px; display: grid; gap: 14px; }
    .b-hero { height: 110px; border-radius: 12px; padding: 16px; background: linear-gradient(120deg, rgba(255,224,27,.35), rgba(19,128,140,.25)); display: grid; gap: 8px; align-content: center; }
    .b-hero b { display: block; height: 12px; width: 70%; border-radius: 6px; background: rgba(255,255,255,.85); }
    .b-hero b.s { width: 45%; background: rgba(255,255,255,.45); }
    .b-hero em { display: block; width: 70px; height: 20px; border-radius: 99px; background: #fff; margin-top: 6px; }
    .b-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .b-cards span { height: 64px; border-radius: 10px; background: rgba(255,255,255,.06); border: 1px solid var(--line); }
    .phone { right: 2%; top: 22%; width: 31%; aspect-ratio: 9/18.5; border-radius: 28px; background: #0c0c0e; border: 1px solid var(--line-strong); padding: 8px; box-shadow: 0 40px 70px rgba(0,0,0,.6); }
    .phone__notch { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 34%; height: 12px; border-radius: 99px; background: #000; z-index: 1; }
    .phone__screen { height: 100%; border-radius: 22px; background: #0f3036; padding: 30px 10px 12px; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
    .p-head { height: 10px; width: 60%; border-radius: 5px; background: rgba(255,255,255,.7); }
    .p-card { height: 34%; border-radius: 14px; background: var(--grad); position: relative; }
    .p-card span { position: absolute; left: 10px; bottom: 10px; width: 50%; height: 8px; border-radius: 4px; background: rgba(255,255,255,.8); }
    .p-row { display: flex; gap: 6px; } .p-row i { flex: 1; height: 38px; border-radius: 10px; background: rgba(255,255,255,.07); }
    .p-btn { margin-top: auto; height: 26px; border-radius: 99px; background: #fff; }
    .post { left: 8%; bottom: 0; width: 38%; border-radius: 18px; background: #f7f7f5; color: #111; padding: 10px; box-shadow: 0 30px 60px rgba(0,0,0,.5); }
    .post__head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .post__av { width: 22px; height: 22px; border-radius: 50%; background: var(--grad); }
    .post__name { width: 50%; height: 8px; border-radius: 4px; background: #d4d4d8; }
    .post__img { aspect-ratio: 1; border-radius: 12px; background: linear-gradient(135deg, #ffe01b, #13808c 60%, #07191c); display: grid; place-items: center; color: #fff; }
    .post__foot { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-top: 8px; font-family: var(--f-alt); }
    .post__foot .up { color: #16a34a; }
    .chart { right: 0; bottom: 6%; width: 36%; border-radius: 16px; padding: 12px 14px; background: rgba(23,23,23,.85); backdrop-filter: blur(10px); border: 1px solid var(--line-strong); }
    .chart p { font-size: 11px; color: var(--text-2); font-family: var(--f-alt); font-weight: 700; margin-bottom: 4px; }
    .tag { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; font-family: var(--f-alt); background: rgba(23,23,23,.85); border: 1px solid var(--line-strong); backdrop-filter: blur(8px); white-space: nowrap; }
    .tag app-icon { color: var(--purple); }
    .tag--1 { left: 58%; top: 0; } .tag--2 { left: -2%; top: 2%; } .tag--3 { right: -2%; top: 76%; } .tag--4 { left: 40%; bottom: 26%; }
    @media (max-width: 600px) { .tag { font-size: 10px; padding: 6px 10px; } .browser__body { padding: 10px; gap: 8px; } .b-hero { height: 70px; } .b-cards span { height: 36px; } }
  `,
})
export class HeroVisualComponent implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);
  private cleanup?: () => void;
  private ctx?: gsap.Context;

  constructor() {
    afterNextRender(() => {
      if (this.motion.reduced) return;
      const root = this.host.nativeElement as HTMLElement;
      const { gsap } = this.motion;
      const layers = Array.from(root.querySelectorAll<HTMLElement>('.layer'));
      this.ctx = gsap.context(() => {
        // gentle idle float
        layers.forEach((l, i) =>
          gsap.to(l, { y: '+=' + (8 + (i % 3) * 4), duration: 3 + i * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut' }),
        );
      }, root);
      if (!this.motion.finePointer) return;
      const setters = layers.map((l) => ({
        d: Number(l.dataset['depth'] ?? 0.5),
        x: gsap.quickTo(l, 'x', { duration: 1, ease: 'power3.out' }),
        r: gsap.quickTo(l, 'rotation', { duration: 1, ease: 'power3.out' }),
      }));
      const move = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        setters.forEach((s) => { s.x(nx * 30 * s.d); s.r(nx * 2 * s.d); });
      };
      window.addEventListener('pointermove', move, { passive: true });
      this.cleanup = () => window.removeEventListener('pointermove', move);
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
    this.ctx?.revert();
  }
}
