"use client";

import { useEffect, useRef } from "react";

// A tiny canvas, stretched by CSS: the browser's upscaling turns 32×32 pixels into a soft blur for free.
const SIZE = 32;
const TONES = ["--yuzu", "--jade", "--sakura", "--wisteria", "--mizu"];
// Each blob drifts on its own slow Lissajous path (periods of roughly 30–60 s).
const PATHS = TONES.map((_, i) => ({ phase: i * 1.9, sx: 0.00011 + i * 0.000023, sy: 0.00009 + i * 0.000031 }));
const FRAME_MS = 1000 / 30;

type Rgb = [number, number, number];

function hexToRgb(value: string): Rgb {
  const n = parseInt(value.trim().replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readColors() {
  const style = getComputedStyle(document.documentElement);
  return { paper: hexToRgb(style.getPropertyValue("--paper")), tones: TONES.map((t) => hexToRgb(style.getPropertyValue(t))) };
}

/** Pastel light that slowly drifts and blends behind the top of every page; follows the theme's colours. */
export function HeroGlow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const image = ctx.createImageData(SIZE, SIZE);
    let colors = readColors();
    let frame = 0;
    let last = -Infinity;
    let now = 0;

    const draw = (t: number) => {
      const centers = PATHS.map((p) => [0.5 + 0.45 * Math.sin(t * p.sx + p.phase), 0.45 + 0.45 * Math.cos(t * p.sy + p.phase * 0.7)]);
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          // Paper keeps a small constant weight so gaps between blobs fade back to the page colour.
          let weight = 0.12;
          let r = colors.paper[0] * weight;
          let g = colors.paper[1] * weight;
          let b = colors.paper[2] * weight;
          for (let i = 0; i < centers.length; i++) {
            const dx = x / SIZE - centers[i][0];
            const dy = y / SIZE - centers[i][1];
            const w = Math.exp(-(dx * dx + dy * dy) / 0.07);
            r += colors.tones[i][0] * w;
            g += colors.tones[i][1] * w;
            b += colors.tones[i][2] * w;
            weight += w;
          }
          const p = (y * SIZE + x) * 4;
          image.data[p] = r / weight;
          image.data[p + 1] = g / weight;
          image.data[p + 2] = b / weight;
          image.data[p + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
      canvas.dataset.ready = "";
    };

    const loop = (t: number) => {
      now = t;
      if (t - last >= FRAME_MS) {
        last = t;
        draw(t);
      }
      frame = requestAnimationFrame(loop);
    };

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = () => {
      if (!frame && !reduced) frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    draw(performance.now());
    // Only animate while the glow is on screen.
    const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    visibility.observe(canvas);
    // Re-read the palette when the theme switches.
    const theme = new MutationObserver(() => {
      colors = readColors();
      draw(now || performance.now());
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      stop();
      visibility.disconnect();
      theme.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      width={SIZE}
      height={SIZE}
      aria-hidden
      className="absolute inset-0 size-full opacity-0 transition-opacity duration-1000 data-[ready]:opacity-70 dark:data-[ready]:opacity-30"
    />
  );
}
