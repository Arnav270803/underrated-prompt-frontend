export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_INPUT_BYTES = 20 * 1024 * 1024

export interface CompressedImage {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  bytes: number
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the image.'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Shrinks an image in the browser before upload: longest side ≤ maxSide, re-encoded as WebP
 * (JPEG where WebP encoding isn't supported). Re-encoding also strips EXIF metadata such as
 * GPS location. SVG is refused because it can carry scripts.
 */
export async function compressImage(
  file: File,
  { maxSide = 1600, quality = 0.82, maxBytes = 900_000 }: { maxSide?: number; quality?: number; maxBytes?: number } = {},
): Promise<CompressedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error('Use a JPG, PNG, WebP or AVIF image.')
  if (file.size > MAX_INPUT_BYTES) throw new Error('That image is over 20 MB. Try a smaller one.')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error("This browser couldn't read that image. Try a JPG or PNG.")
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Your browser blocked image processing.')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  let q = quality
  let blob = await toBlob(canvas, 'image/webp', q)
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', q)
  while (blob && blob.size > maxBytes && q > 0.45) {
    q -= 0.1
    blob = await toBlob(canvas, blob.type, q)
  }
  if (!blob) throw new Error('Could not convert that image.')

  return { blob, dataUrl: await blobToDataUrl(blob), width, height, bytes: blob.size }
}
