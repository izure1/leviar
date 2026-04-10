/**
 * 컬러 문자열을 RGBA 배열로 파싱 및 포맷팅하는 유틸리티
 */

export type RGBA = [number, number, number, number];

/**
 * 16진수, rgb, rgba, hsl, hsla 형식의 문자열을 [r, g, b, a] 배열로 변환합니다. (r,g,b는 0~255, a는 0~1)
 */
export function parseColor(color: string): RGBA | null {
  const c = color.trim().toLowerCase();

  // hex
  if (c.startsWith('#')) {
    let hex = c.substring(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = Array.from(hex).map(char => char + char).join('');
    }
    if (hex.length === 6) hex += 'ff';
    if (hex.length !== 8) return null;
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = parseInt(hex.substring(6, 8), 16) / 255;
    return [r, g, b, a];
  }

  // rgb / rgba
  const rgbMatch = c.match(/^rgba?\(([^)]+)\)/);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/,|\s+/).filter(Boolean);
    if (parts.length < 3) return null;
    
    let tempParts = [];
    const cleaned = rgbMatch[1].replace(/[,/]/g, ' ').split(/\s+/).filter(Boolean);
    
    const r = parseComp(cleaned[0], 255);
    const g = parseComp(cleaned[1], 255);
    const b = parseComp(cleaned[2], 255);
    const a = cleaned.length > 3 ? parseComp(cleaned[3], 1) : 1;
    return [r, g, b, a];
  }

  // hsl / hsla
  const hslMatch = c.match(/^hsla?\(([^)]+)\)/);
  if (hslMatch) {
    const cleaned = hslMatch[1].replace(/[,/]/g, ' ').split(/\s+/).filter(Boolean);
    if (cleaned.length < 3) return null;

    let h = parseFloat(cleaned[0]); // degrees
    if (cleaned[0].endsWith('turn')) h = parseFloat(cleaned[0]) * 360;
    else if (cleaned[0].endsWith('rad')) h = parseFloat(cleaned[0]) * 180 / Math.PI;

    const s = parseComp(cleaned[1], 1); // 0~1 for calculation
    const l = parseComp(cleaned[2], 1);
    const a = cleaned.length > 3 ? parseComp(cleaned[3], 1) : 1;

    const rgb = hslToRgb(h / 360, s, l);
    return [rgb[0], rgb[1], rgb[2], a];
  }

  return null;
}

function parseComp(val: string, max: number): number {
  if (val.endsWith('%')) {
    return (parseFloat(val) / 100) * max;
  }
  return parseFloat(val);
}

/**
 * h, s, l (0~1 range) to r, g, b (0~255)
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function formatColor(rgba: RGBA): string {
  const r = Math.round(rgba[0]);
  const g = Math.round(rgba[1]);
  const b = Math.round(rgba[2]);
  const a = rgba[3];
  
  if (a === 1) {
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

export function interpolateColor(from: string, to: string, t: number): string | null {
  const fromRGBA = parseColor(from);
  const toRGBA = parseColor(to);
  if (fromRGBA && toRGBA) {
    const result: RGBA = [
      fromRGBA[0] + (toRGBA[0] - fromRGBA[0]) * t,
      fromRGBA[1] + (toRGBA[1] - fromRGBA[1]) * t,
      fromRGBA[2] + (toRGBA[2] - fromRGBA[2]) * t,
      fromRGBA[3] + (toRGBA[3] - fromRGBA[3]) * t,
    ];
    return formatColor(result);
  }

  // Handle gradient strings (e.g. '90deg, rgb(255,0,0) 0%, rgb(0,0,255) 100%')
  if (from.includes(',') || to.includes(',')) {
    const fromParts = from.split(/,(?![^(]*\))/).map(x => x.trim());
    const toParts = to.split(/,(?![^(]*\))/).map(x => x.trim());
    
    if (fromParts.length === toParts.length && fromParts.length > 0) {
      const resultParts = [];
      let success = true;
      
      for (let i = 0; i < fromParts.length; i++) {
        const fStr = fromParts[i];
        const tStr = toParts[i];

        // Is it an angle? (e.g. 90deg, 1turn)
        const angleMatchF = fStr.match(/^(-?\d*\.?\d+)(deg|turn|rad)$/);
        const angleMatchT = tStr.match(/^(-?\d*\.?\d+)(deg|turn|rad)$/);
        if (angleMatchF && angleMatchT && angleMatchF[2] === angleMatchT[2]) {
           const v = parseFloat(angleMatchF[1]) + (parseFloat(angleMatchT[1]) - parseFloat(angleMatchF[1])) * t;
           resultParts.push(`${v}${angleMatchF[2]}`);
           continue;
        }

        // Color stop match
        const stopRegex = /^(.+?)(?:\s+(-?\d*\.?\d+%?))?$/;
        const fMatch = fStr.match(stopRegex);
        const tMatch = tStr.match(stopRegex);
        if (fMatch && tMatch) {
          const fColorStr = fMatch[1];
          const tColorStr = tMatch[1];
          const fPos = fMatch[2] || "";
          const tPos = tMatch[2] || "";
          
          const interpolatedColor = interpolateColor(fColorStr, tColorStr, t);
          if (interpolatedColor) {
            let interpolatedPos = fPos;
            if (fPos.endsWith('%') && tPos.endsWith('%')) {
               const fv = parseFloat(fPos);
               const tv = parseFloat(tPos);
               interpolatedPos = `${fv + (tv - fv) * t}%`;
            }

            if (interpolatedPos) resultParts.push(`${interpolatedColor} ${interpolatedPos}`);
            else resultParts.push(`${interpolatedColor}`);
            continue;
          }
        }
        success = false;
        break;
      }
      
      if (success) {
        return resultParts.join(', ');
      }
    }
  }

  return null;
}

export function isColorString(str: string): boolean {
  return typeof str === 'string' && (
    str.startsWith('#') || 
    str.startsWith('rgb') || 
    str.startsWith('hsl')
  ) && parseColor(str) !== null;
}
