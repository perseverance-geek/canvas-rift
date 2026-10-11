import * as THREE from 'three';

export function seeded(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

const textures = new Map<string, THREE.CanvasTexture>();
export function paintTexture(color: string, kind: 'wall' | 'wood' | 'road' = 'wall') {
  const key = color + kind;
  if (textures.has(key)) return textures.get(key)!;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = kind === 'road' ? 1024 : 256;
  const ctx = canvas.getContext('2d')!;
  const rand = seeded(3829);
  const size = canvas.width;
  ctx.fillStyle = color; ctx.fillRect(0, 0, size, size);
  if (kind === 'road') {
    ctx.fillStyle = '#283e49'; ctx.fillRect(0, 0, size, size);
    for (let row = 0; row < 35; row++) {
      for (let col = -1; col < 20; col++) {
        const x = col * 54 + (row % 2) * 27;
        const y = row * 30;
        const warm = Math.max(0, 1 - x / size);
        ctx.fillStyle = `hsl(${42 + (1 - warm) * 155},${20 + warm * 13}%,${19 + rand() * 19 + warm * 14}%)`;
        ctx.beginPath(); ctx.roundRect(x + 2, y + 2, 47 + rand() * 5, 23 + rand() * 3, 5); ctx.fill();
        ctx.strokeStyle = `rgba(239,209,135,${.07 + warm * .12})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 7, y + 5); ctx.lineTo(x + 42, y + 4 + rand() * 3); ctx.stroke();
      }
    }
  }
  for (let i = 0; i < (kind === 'road' ? 24000 : 3900); i++) {
    const x = rand() * size, y = rand() * size;
    ctx.strokeStyle = rand() > .5 ? `rgba(255,235,185,${rand() * .12})` : `rgba(8,24,48,${rand() * .17})`;
    ctx.lineWidth = .5 + rand() * 2;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + (kind === 'wood' ? 1 : 2 + rand() * 12), y + (kind === 'wood' ? rand() * 30 : rand() * 6 - 3)); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  if (kind === 'road') texture.repeat.set(2, 7);
  textures.set(key, texture);
  return texture;
}

export function glowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,244,198,1)'); g.addColorStop(.13, 'rgba(255,226,151,.9)');
  g.addColorStop(.32, 'rgba(236,178,77,.3)'); g.addColorStop(1, 'rgba(237,173,63,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export function signTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#b4822c'; ctx.fillRect(0, 0, 1024, 160);
  ctx.strokeStyle = '#f2d68c'; ctx.lineWidth = 3; ctx.strokeRect(12, 12, 1000, 136);
  ctx.fillStyle = '#342d21'; ctx.textAlign = 'center'; ctx.font = '52px Georgia'; ctx.fillText('CAFÉ  ·  LA NUIT', 512, 98);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
