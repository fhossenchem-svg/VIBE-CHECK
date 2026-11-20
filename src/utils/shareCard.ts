interface ShareCardOptions {
  kicker: string;
  title: string;
  subtitle: string;
  body: string;
  stats?: { label: string; value: string }[];
  footerHandle?: string;
  accentFrom: string;
  accentTo: string;
  fileName: string;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateStoryCardBlob(opts: ShareCardOptions): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Deep obsidian violet base
  ctx.fillStyle = '#0D0B16';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft gradient wash
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, opts.accentFrom);
  grad.addColorStop(0.55, opts.accentTo);
  grad.addColorStop(1, '#1E1B4B');
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // Radial glow orbs
  const orb1 = ctx.createRadialGradient(240, 380, 30, 240, 380, 480);
  orb1.addColorStop(0, 'rgba(255,255,255,0.28)');
  orb1.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = orb1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const orb2 = ctx.createRadialGradient(860, 1450, 30, 860, 1450, 520);
  orb2.addColorStop(0, 'rgba(236,72,153,0.35)');
  orb2.addColorStop(1, 'rgba(236,72,153,0)');
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Inner glass card frame
  const pad = 88;
  const cardX = pad;
  const cardY = 180;
  const cardW = canvas.width - pad * 2;
  const cardH = canvas.height - 360;

  ctx.fillStyle = 'rgba(13, 11, 22, 0.56)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 56);
  ctx.fill();
  ctx.stroke();

  // Brand top mark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.font = '700 38px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('VIBE CHECK', cardX + 72, cardY + 110);

  // Kicker
  ctx.fillStyle = 'rgba(233, 213, 255, 0.9)';
  ctx.font = '600 32px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(opts.kicker, cardX + 72, cardY + 230);

  // Main title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 84px "Bricolage Grotesque", system-ui, sans-serif';
  const titleLines = wrapLines(ctx, opts.title, cardW - 144);
  let y = cardY + 350;
  for (const line of titleLines.slice(0, 3)) {
    ctx.fillText(line, cardX + 72, y);
    y += 98;
  }

  // Subtitle
  y += 18;
  ctx.fillStyle = 'rgba(245, 243, 255, 0.88)';
  ctx.font = '500 40px "Plus Jakarta Sans", system-ui, sans-serif';
  const subLines = wrapLines(ctx, opts.subtitle, cardW - 144);
  for (const line of subLines.slice(0, 3)) {
    ctx.fillText(line, cardX + 72, y);
    y += 54;
  }

  // Divider
  y += 34;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 72, y);
  ctx.lineTo(cardX + cardW - 72, y);
  ctx.stroke();

  // Body / quote
  y += 72;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '500 36px "Plus Jakarta Sans", system-ui, sans-serif';
  const bodyLines = wrapLines(ctx, opts.body, cardW - 144);
  for (const line of bodyLines.slice(0, 5)) {
    ctx.fillText(line, cardX + 72, y);
    y += 52;
  }

  // Stats grid
  if (opts.stats && opts.stats.length > 0) {
    const statY = cardY + cardH - 310;
    const colW = (cardW - 144) / Math.min(opts.stats.length, 3);
    opts.stats.slice(0, 3).forEach((st, idx) => {
      const sx = cardX + 72 + idx * colW;
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '500 26px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(st.label, sx, statY);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 54px "Bricolage Grotesque", system-ui, sans-serif';
      ctx.fillText(st.value, sx, statY + 64);
    });
  }

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '500 28px "JetBrains Mono", monospace';
  ctx.fillText(
    `${opts.footerHandle || '@vibecheck'}  ·  Your mood. Your people. Your internet.`,
    cardX + 72,
    cardY + cardH - 76
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export async function downloadOrShareStoryCard(
  opts: ShareCardOptions
): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob = await generateStoryCardBlob(opts);
  if (!blob) return 'failed';

  const file = new File([blob], opts.fileName, { type: 'image/png' });
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        title: opts.title,
        text: `${opts.title} — VIBE CHECK`,
        files: [file],
      });
      return 'shared';
    } catch {
      // User dismissed or share unavailable, fallback to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = opts.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
