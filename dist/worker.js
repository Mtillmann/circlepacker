// src/Core.ts
var Core_default = {
  pack(imageData, imageWidth, spareCircles, options) {
    let i = spareCircles.length;
    const placedCircles = [];
    const dims = { width: imageWidth, height: imageData.data.length / imageWidth / 4 };
    while (i > 0) {
      i--;
      const circle = spareCircles[i];
      let safety = 1e3;
      while (!circle.x && safety-- > 0) {
        const x = Math.random() * dims.width;
        const y = Math.random() * dims.height;
        if (this.isCircleInside(imageData, dims.width, x, y, circle.radius, options.higherAccuracy, options.minAlpha)) {
          if (!this.touchesPlacedCircle(x, y, circle.radius, placedCircles, options.spacing)) {
            circle.x = x;
            circle.y = y;
            placedCircles.push(circle);
          }
        }
      }
    }
    return placedCircles;
  },
  isFilled(imageData, x, y, width, minAlpha) {
    x = Math.round(x);
    y = Math.round(y);
    return imageData.data[(width * y + x) * 4 + 3] > minAlpha;
  },
  isCircleInside(imageData, width, x, y, radius, higherAccuracy, minAlpha) {
    if (!this.isFilled(imageData, x, y - radius, width, minAlpha)) return false;
    if (!this.isFilled(imageData, x, y + radius, width, minAlpha)) return false;
    if (!this.isFilled(imageData, x + radius, y, width, minAlpha)) return false;
    if (!this.isFilled(imageData, x - radius, y, width, minAlpha)) return false;
    if (higherAccuracy) {
      const o = Math.cos(Math.PI / 4);
      if (!this.isFilled(imageData, x + o, y + o, width, minAlpha)) return false;
      if (!this.isFilled(imageData, x - o, y + o, width, minAlpha)) return false;
      if (!this.isFilled(imageData, x - o, y - o, width, minAlpha)) return false;
      if (!this.isFilled(imageData, x + o, y - o, width, minAlpha)) return false;
    }
    return true;
  },
  touchesPlacedCircle(x, y, r, placedCircles, spacing) {
    return placedCircles.some((circle) => {
      return this.dist(x, y, circle.x, circle.y) < circle.radius + r + spacing;
    });
  },
  dist(x1, y1, x2, y2) {
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.sqrt(a * a + b * b);
  }
};

// src/Worker.ts
self.onmessage = (e) => {
  postMessage(Core_default.pack(e.data.imageData, e.data.imageWidth, e.data.spareCircles, e.data.options));
};
