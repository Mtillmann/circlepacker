import { Circle } from './types/Circle'
import { ExportOptions } from './types/ExportOptions'
import { Options } from './types/Options'

export class CirclePacker {
  defaultOptions: Options = {
    spacing: 1,
    numCircles: 1000,
    minRadius: 1,
    maxRadius: 10,
    higherAccuracy: false,
    colors: 'auto',
    minAlpha: 1,
    background: 'transparent',
  }

  defaultExportOptions: ExportOptions = {
    scale: globalThis.devicePixelRatio || 1,
    quality: 1,
    format: 'image/png',
  }

  options: Partial<Options>

  spareCircles: Circle[] = []
  placedCircles: Circle[] = []

  dims: { width: number; height: number } = { width: 0, height: 0 }

  constructor (options: Partial<Options> = {}) {
    this.options = { ...this.defaultOptions, ...options } as Options

    if(['transparent', null, '', false, undefined].includes(this.options.background!)) {
      this.options.background = false
    }

    for (let i = 0; i < this.options.numCircles!; i++) {
      this.spareCircles.push({
        radius: this.options.minRadius! + Math.random() * Math.random() * (this.options.maxRadius! - this.options.minRadius!),
      } as Circle)
    }
    this.spareCircles.sort((a, b) => a.radius - b.radius)
  }

  isFilled (imageData: ImageData, x: number, y: number): boolean {
    x = Math.round(x)
    y = Math.round(y)
    return imageData.data[(this.dims.width * y + x) * 4 + 3] > this.options.minAlpha!
  }

  isCircleInside (imageData: ImageData, x: number, y: number, r: number): boolean {
    if (!this.isFilled(imageData, x, y - r)) return false
    if (!this.isFilled(imageData, x, y + r)) return false
    if (!this.isFilled(imageData, x + r, y)) return false
    if (!this.isFilled(imageData, x - r, y)) return false
    if (this.options.higherAccuracy) {
      const o = Math.cos(Math.PI / 4)
      if (!this.isFilled(imageData, x + o, y + o)) return false
      if (!this.isFilled(imageData, x - o, y + o)) return false
      if (!this.isFilled(imageData, x - o, y - o)) return false
      if (!this.isFilled(imageData, x + o, y - o)) return false
    }
    return true
  }

  touchesPlacedCircle (x: number, y: number, r: number): boolean {
    return this.placedCircles.some((circle: Circle) => {
      return this.dist(x, y, circle.x!, circle.y!) < circle.radius + r + this.options.spacing!
    })
  }

  dist (x1: number, y1: number, x2: number, y2: number): number {
    const a = x1 - x2
    const b = y1 - y2
    return Math.sqrt(a * a + b * b)
  }

  getCircleColor (imageData: ImageData, x: number, y: number): string | boolean {
    if (this.options.colors === 'auto') {
      x = Math.round(x)
      y = Math.round(y)
      const i = (this.dims.width * y + x) * 4

      if (imageData.data[i + 3] / 255 < this.options.minAlpha!) {
        return false
      }

      const r = imageData.data[i]
      const g = imageData.data[i + 1]
      const b = imageData.data[i + 2]

      return `rgb(${r},${g},${b})`
    }

    return this.options.colors![Math.floor(Math.random() * this.options.colors!.length)]
  }

  render (imageData: ImageData, imageWidth: number): Circle[] {
    let i: number = this.spareCircles.length

    this.dims = { width: imageWidth, height: imageData.data.length / imageWidth / 4 }

    while (i > 0) {
      i--
      const circle: Circle = this.spareCircles[i]
      let safety = 1000
      while (!circle.x && safety-- > 0) {
        const x = Math.random() * this.dims.width
        const y = Math.random() * this.dims.height
        if (this.isCircleInside(imageData, x, y, circle.radius)) {
          if (!this.touchesPlacedCircle(x, y, circle.radius)) {
            const color = this.getCircleColor(imageData, x, y)
            if (color) {
              circle.x = x
              circle.y = y
              circle.color = color as string
              this.placedCircles.push(circle)
            }
          }
        }
      }
    }

    return this.placedCircles
  }

  asSVGString (): string {
    const svg =
      `<svg width="${this.dims.width}" height="${this.dims.height}" viewBox="0 0 ${this.dims.width} ${this.dims.height}" xmlns="http://www.w3.org/2000/svg">` +
      (this.options.background ? `<rect x="0" y="0" width="${this.dims.width}" height="${this.dims.height}" fill="${this.options.background}" />` : '') +
      this.placedCircles
        .map(circle => {
          const { x, y, radius, color } = circle
          return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" />`
        })
        .join('') +
      '</svg>'
    return svg
  }

  asSVG (): SVGElement {
    const svgString = this.asSVGString()
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')

    return doc.documentElement as unknown as SVGElement
  }

  asCanvas (options: ExportOptions = {}): HTMLCanvasElement {
    options = { ...this.defaultExportOptions, ...options } as ExportOptions

    const scale: number = options.scale as number

    const canvas = document.createElement('canvas')
    canvas.width = this.dims.width * scale
    canvas.height = this.dims.height * scale

    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!

    if (this.options.background) {
      ctx.fillStyle = this.options.background as string
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    for (const circle of this.placedCircles) {
      const { x, y, radius, color } = circle
      ctx.fillStyle = String(color)
      ctx.beginPath()
      ctx.arc(Number(x! * scale), Number(y! * scale), radius * scale, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
    }

    return canvas
  }

  asImageData (options: ExportOptions = {}): ImageData {
    options = { ...this.defaultExportOptions, ...options } as ExportOptions
    const canvas = this.asCanvas(options)
    return canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
  }

  async asBlob (options: ExportOptions = {}): Promise<Blob> {
    options = { ...this.defaultExportOptions, ...options } as ExportOptions
    const canvas = this.asCanvas(options)
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Blob creation failed'))
          }
        },
        options.format,
        options.quality
      )
    })
    return blob
  }

  async asBlobURL (options: ExportOptions = {}): Promise<string> {
    return URL.createObjectURL(await this.asBlob(options))
  }

  asDataURL (options: ExportOptions = {}): string {
    options = { ...this.defaultExportOptions, ...options } as ExportOptions
    return this.asCanvas().toDataURL(options.format, options.quality)
  }

  asArray (): Circle[] {
    return this.placedCircles
  }
}

export async function fromBlob (blob: Blob, options: Partial<Options> = {}): Promise<CirclePacker> {
  const url = URL.createObjectURL(blob)
  return await fromURL(url, options)
}

export async function fromURL (url: string | URL, options: Partial<Options> = {}): Promise<CirclePacker> {
  url = url instanceof URL ? url.href : url

  const img = document.createElement('img')
  await new Promise(resolve => {
    img.onload = resolve
    img.src = url
  })

  return fromImage(img, options)
}

export function fromImage (image: HTMLImageElement, options: Partial<Options> = {}): CirclePacker {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0)

  return fromContext2D(ctx, options)
}

export function fromImageData (imageData: ImageData, imageWidth: number, options: Partial<Options> = {}): CirclePacker {
  const cf = new CirclePacker(options)
  cf.render(imageData, imageWidth)
  return cf
}

export function fromContext2D (ctx: CanvasRenderingContext2D, options: Partial<Options> = {}): CirclePacker {
  return fromImageData(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height), ctx.canvas.width, options)
}

export function fromCanvas (canvas: HTMLCanvasElement, options: Partial<Options> = {}): CirclePacker {
  const ctx = canvas.getContext('2d')!
  return fromContext2D(ctx, options)
}

export function fromSquare (edgeLength: number = 200, color: string = 'black', options: Partial<Options> = {}): CirclePacker {
  return fromRect(edgeLength, edgeLength, color, options)
}

export function fromCircle (radius: number = 100, color: string = 'black', options: Partial<Options> = {}): CirclePacker {
  const canvas = document.createElement('canvas')
  canvas.width = radius * 2
  canvas.height = radius * 2
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(radius, radius, radius, 0, 2 * Math.PI)
  ctx.closePath()
  ctx.fill()
  return fromContext2D(ctx, options)
}

export function fromRect (width: number = 200, height: number = 200, color: string = 'black', options: Partial<Options> = {}): CirclePacker {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
  return fromContext2D(ctx, options)
}
