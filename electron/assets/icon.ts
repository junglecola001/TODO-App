import { deflateSync } from "node:zlib"

/**
 * FocusFlow's app/tray icon is generated at runtime instead of being checked in
 * as a binary asset: the mark stays in sync with the accent color, and the
 * repository keeps no opaque blobs. Pure Node — no Electron import, so the
 * build scripts can reuse it.
 */

/** RGB color, channels in 0..255. */
export type Rgb = [number, number, number]

/** #FF5A5F — the default accent, matching `--primary` in globals.css. */
export const ACCENT: Rgb = [255, 90, 95]

const WHITE: Rgb = [255, 255, 255]

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[index] = value >>> 0
  }
  return table
})()

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC_TABLE[(crc ^ buffer[index]!) & 0xff]! ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)

  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data])

  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData), 0)

  return Buffer.concat([length, typeAndData, crc])
}

/** Encodes straight RGBA pixels as a PNG buffer. */
export function encodePng(size: number, rgba: Uint8Array): Buffer {
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (stride + 1)
    raw[rowStart] = 0 // filter type: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, rowStart + 1)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // color type: truecolor + alpha
  header[10] = 0 // compression
  header[11] = 0 // filter
  header[12] = 0 // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ])
}

export interface AppIconOptions {
  background?: Rgb
  foreground?: Rgb
}

/**
 * Draws the mark: a rounded square in the accent color with a white focus ring
 * that has a session gap in the top-right, antialiased by hand.
 */
export function renderAppIcon(size: number, options: AppIconOptions = {}): Buffer {
  const background = options.background ?? ACCENT
  const foreground = options.foreground ?? WHITE
  const pixels = new Uint8Array(size * size * 4)

  const half = size / 2
  const cornerRadius = size * 0.28
  const ringOuter = size * 0.31
  const ringInner = size * 0.2
  // Antialiasing width in pixels: at least a pixel, more on large renderings.
  const softness = Math.max(0.75, size * 0.02)
  const gapCenter = -Math.PI / 4 // top-right
  const gapHalfWidth = (26 * Math.PI) / 180

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5 - half
      const py = y + 0.5 - half

      // Rounded-square coverage via a signed distance field.
      const qx = Math.abs(px) - (half - cornerRadius)
      const qy = Math.abs(py) - (half - cornerRadius)
      const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
      const inside = Math.min(Math.max(qx, qy), 0)
      const distance = outside + inside - cornerRadius
      const squareAlpha = clamp01(0.5 - distance / softness)

      if (squareAlpha <= 0) continue

      // Focus ring coverage.
      const radius = Math.hypot(px, py)
      const ringAlpha = clamp01((ringOuter - radius) / softness) * clamp01((radius - ringInner) / softness)

      let ring = 0
      if (ringAlpha > 0) {
        const angle = Math.atan2(py, px)
        const delta = Math.abs(normalizeAngle(angle - gapCenter))
        const gapAlpha = clamp01((gapHalfWidth - delta) / (softness / Math.max(radius, 1)))
        ring = clamp01(ringAlpha * (1 - gapAlpha))
      }

      const offset = (y * size + x) * 4
      pixels[offset] = Math.round(background[0] + (foreground[0] - background[0]) * ring)
      pixels[offset + 1] = Math.round(background[1] + (foreground[1] - background[1]) * ring)
      pixels[offset + 2] = Math.round(background[2] + (foreground[2] - background[2]) * ring)
      pixels[offset + 3] = Math.round(squareAlpha * 255)
    }
  }

  return encodePng(size, pixels)
}

/** Icon sized for the Windows notification area. */
export function renderTrayIcon(accent: Rgb = ACCENT): Buffer {
  return renderAppIcon(32, { background: accent })
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function normalizeAngle(angle: number): number {
  let result = angle
  while (result > Math.PI) result -= Math.PI * 2
  while (result < -Math.PI) result += Math.PI * 2
  return result
}
