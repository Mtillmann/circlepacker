import Core from './Core'

self.onmessage = (e) => {
  postMessage(Core.pack(e.data.imageData, e.data.imageWidth, e.data.spareCircles, e.data.options))
}
