import { Circle } from './types/Circle'
import { Options } from './types/Options'

export default {

  pack (imageData: ImageData, imageWidth: number, spareCircles: Circle[], options: Partial<Options>): Circle[] {
    let i: number = spareCircles.length

    const placedCircles: Circle[] = []

    const dims = { width: imageWidth, height: imageData.data.length / imageWidth / 4 }

    while (i > 0) {
      i--
      const circle: Circle = spareCircles[i]
      let safety = 1000
      while (!circle.x && safety-- > 0) {
        const x = Math.random() * dims.width
        const y = Math.random() * dims.height
        if (this.isCircleInside(imageData, dims.width, x, y, circle.radius, options.higherAccuracy!, options.minAlpha!)) {
          if (!this.touchesPlacedCircle(x, y, circle.radius, placedCircles, options.spacing!)) {
            circle.x = x
            circle.y = y
            placedCircles.push(circle)
          }
        }
      }
    }

    return placedCircles
  },

  isFilled (imageData: ImageData, x: number, y: number, width:number, minAlpha:number): boolean {
    x = Math.round(x)
    y = Math.round(y)
    return imageData.data[(width * y + x) * 4 + 3] > minAlpha
  },

  isCircleInside (imageData: ImageData, width: number, x: number, y: number, radius: number, higherAccuracy: boolean, minAlpha: number): boolean {
    if (!this.isFilled(imageData, x, y - radius, width, minAlpha)) return false
    if (!this.isFilled(imageData, x, y + radius, width, minAlpha)) return false
    if (!this.isFilled(imageData, x + radius, y, width, minAlpha)) return false
    if (!this.isFilled(imageData, x - radius, y, width, minAlpha)) return false
    if (higherAccuracy) {
      const o = Math.cos(Math.PI / 4)
      if (!this.isFilled(imageData, x + o, y + o, width, minAlpha)) return false
      if (!this.isFilled(imageData, x - o, y + o, width, minAlpha)) return false
      if (!this.isFilled(imageData, x - o, y - o, width, minAlpha)) return false
      if (!this.isFilled(imageData, x + o, y - o, width, minAlpha)) return false
    }
    return true
  },

  touchesPlacedCircle (x: number, y: number, r: number, placedCircles: Circle[], spacing:number): boolean {
    return placedCircles.some((circle: Circle) => {
      return this.dist(x, y, circle.x!, circle.y!) < circle.radius + r + spacing
    })
  },

  dist (x1: number, y1: number, x2: number, y2: number): number {
    const a = x1 - x2
    const b = y1 - y2
    return Math.sqrt(a * a + b * b)
  }
}
