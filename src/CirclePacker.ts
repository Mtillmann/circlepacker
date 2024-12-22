import { Circle } from './types/Circle'
import { ExportOptions } from './types/ExportOptions'
import { Options } from './types/Options'
import Core from './Core'

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
    useMainThread: false,
    reuseWorker: true
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

  worker: Worker | null = null

  constructor (options: Partial<Options> = {}) {
    this.options = { ...this.defaultOptions, ...options } as Options

    if (['transparent', null, '', false, undefined].includes(this.options.background!)) {
      this.options.background = false
    }

    for (let i = 0; i < this.options.numCircles!; i++) {
      this.spareCircles.push({
        radius: this.options.minRadius! + Math.random() * Math.random() * (this.options.maxRadius! - this.options.minRadius!),
      } as Circle)
    }
    this.spareCircles.sort((a, b) => a.radius - b.radius)
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

  async pack (imageData: ImageData, imageWidth: number): Promise<Circle[]> {
    let circles: Circle[] = []

    if (typeof Worker === 'undefined' || this.options.useMainThread) {
      circles = Core.pack(imageData, imageWidth, this.spareCircles, this.options)
    } else {
      if (!this.worker) {
        this.worker = new Worker('%%WORKER_URL')
      }
      circles = await new Promise((resolve) => {
        this.worker!.onmessage = (e) => resolve(e.data)
        this.worker!.postMessage({
          imageData,
          imageWidth,
          spareCircles: this.spareCircles,
          options: this.options
        })
      })
      if (!this.options.reuseWorker) {
        this.worker.terminate()
      }
    }

    this.dims = { width: imageWidth, height: imageData.data.length / imageWidth / 4 }

    this.placedCircles = circles.reduce((acc:Circle[], circle:Circle) => {
      const color = this.getCircleColor(imageData, circle.x!, circle.y!)
      if (color) {
        circle.color = color as string
        acc.push(circle)
      }
      return acc
    }, [])

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

  return await fromImage(img, options)
}

export async function fromImage (image: HTMLImageElement, options: Partial<Options> = {}): Promise<CirclePacker> {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0)

  return await fromContext2D(ctx, options)
}

export async function fromImageData (imageData: ImageData, imageWidth: number, options: Partial<Options> = {}): Promise<CirclePacker> {
  const cf = new CirclePacker(options)
  await cf.pack(imageData, imageWidth)
  return cf
}

export async function fromContext2D (ctx: CanvasRenderingContext2D, options: Partial<Options> = {}): Promise<CirclePacker> {
  return await fromImageData(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height), ctx.canvas.width, options)
}

export async function fromCanvas (canvas: HTMLCanvasElement, options: Partial<Options> = {}): Promise<CirclePacker> {
  const ctx = canvas.getContext('2d')!
  return await fromContext2D(ctx, options)
}

export async function fromSquare (edgeLength: number = 200, color: string = 'black', options: Partial<Options> = {}): Promise<CirclePacker> {
  return await fromRect(edgeLength, edgeLength, color, options)
}

export async function fromCircle (radius: number = 100, color: string = 'black', options: Partial<Options> = {}): Promise<CirclePacker> {
  const canvas = document.createElement('canvas')
  canvas.width = radius * 2
  canvas.height = radius * 2
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(radius, radius, radius, 0, 2 * Math.PI)
  ctx.closePath()
  ctx.fill()
  return await fromContext2D(ctx, options)
}

export async function fromRect (width: number = 200, height: number = 200, color: string = 'black', options: Partial<Options> = {}): Promise<CirclePacker> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
  return await fromContext2D(ctx, options)
}
