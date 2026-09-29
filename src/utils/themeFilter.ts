export const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16) / 255,
      parseInt(clean.slice(2, 4), 16) / 255,
      parseInt(clean.slice(4, 6), 16) / 255,
    ];
  } else if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) / 255,
      parseInt(clean[1] + clean[1], 16) / 255,
      parseInt(clean[2] + clean[2], 16) / 255,
    ];
  }
  return [0.12, 0.12, 0.12];
};

/**
 * Calculates a 4x5 SVG ColorMatrix that maps light paper background
 * to theme.background and dark text ink to theme.text in real-time.
 */
export const calculateColorMatrix = (bgHex: string, textHex: string): string => {
  const [rBg, gBg, bBg] = hexToRgb(bgHex);
  const [rFg, gFg, bFg] = hexToRgb(textHex);

  const dR = rBg - rFg;
  const dG = gBg - gFg;
  const dB = bBg - bFg;

  const row1 = `${(0.299 * dR).toFixed(4)} ${(0.587 * dR).toFixed(4)} ${(0.114 * dR).toFixed(4)} 0 ${rFg.toFixed(4)}`;
  const row2 = `${(0.299 * dG).toFixed(4)} ${(0.587 * dG).toFixed(4)} ${(0.114 * dG).toFixed(4)} 0 ${gFg.toFixed(4)}`;
  const row3 = `${(0.299 * dB).toFixed(4)} ${(0.587 * dB).toFixed(4)} ${(0.114 * dB).toFixed(4)} 0 ${bFg.toFixed(4)}`;
  const row4 = `0 0 0 1 0`;

  return `${row1} ${row2} ${row3} ${row4}`;
};
