// src/CirclePacker.ts
var CirclePacker = class {
  defaultOptions = {
    spacing: 1,
    numCircles: 1e3,
    minRadius: 1,
    maxRadius: 10,
    higherAccuracy: false,
    colors: "auto",
    minAlpha: 1
  };
  defaultExportOptions = {
    scale: window.devicePixelRatio,
    quality: 1,
    format: "image/png"
  };
  options;
  spareCircles = [];
  placedCircles = [];
  dims = { width: 0, height: 0 };
  constructor(options = {}) {
    this.options = { ...this.defaultOptions, ...options };
    for (let i = 0; i < this.options.numCircles; i++) {
      this.spareCircles.push({
        radius: this.options.minRadius + Math.random() * Math.random() * (this.options.maxRadius - this.options.minRadius)
      });
    }
    this.spareCircles.sort((a, b) => a.radius - b.radius);
  }
  isFilled(imageData, x, y) {
    x = Math.round(x);
    y = Math.round(y);
    return imageData.data[(this.dims.width * y + x) * 4 + 3] > this.options.minAlpha;
  }
  isCircleInside(imageData, x, y, r) {
    if (!this.isFilled(imageData, x, y - r)) return false;
    if (!this.isFilled(imageData, x, y + r)) return false;
    if (!this.isFilled(imageData, x + r, y)) return false;
    if (!this.isFilled(imageData, x - r, y)) return false;
    if (this.options.higherAccuracy) {
      const o = Math.cos(Math.PI / 4);
      if (!this.isFilled(imageData, x + o, y + o)) return false;
      if (!this.isFilled(imageData, x - o, y + o)) return false;
      if (!this.isFilled(imageData, x - o, y - o)) return false;
      if (!this.isFilled(imageData, x + o, y - o)) return false;
    }
    return true;
  }
  touchesPlacedCircle(x, y, r) {
    return this.placedCircles.some((circle) => {
      return this.dist(x, y, circle.x, circle.y) < circle.radius + r + this.options.spacing;
    });
  }
  dist(x1, y1, x2, y2) {
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.sqrt(a * a + b * b);
  }
  getCircleColor(imageData, x, y) {
    if (this.options.colors === "auto") {
      x = Math.round(x);
      y = Math.round(y);
      const i = (this.dims.width * y + x) * 4;
      if (imageData.data[i + 3] / 255 < this.options.minAlpha) {
        return false;
      }
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      return `rgb(${r},${g},${b})`;
    }
    return this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
  }
  render(imageData, imageWidth) {
    let i = this.spareCircles.length;
    this.dims = { width: imageWidth, height: imageData.data.length / imageWidth / 4 };
    while (i > 0) {
      i--;
      const circle = this.spareCircles[i];
      let safety = 1e3;
      while (!circle.x && safety-- > 0) {
        const x = Math.random() * this.dims.width;
        const y = Math.random() * this.dims.height;
        if (this.isCircleInside(imageData, x, y, circle.radius)) {
          if (!this.touchesPlacedCircle(x, y, circle.radius)) {
            const color = this.getCircleColor(imageData, x, y);
            if (color) {
              circle.x = x;
              circle.y = y;
              circle.color = color;
              this.placedCircles.push(circle);
            }
          }
        }
      }
    }
    return this.placedCircles;
  }
  asSVGString() {
    const svg = `<svg width="${this.dims.width}" height="${this.dims.height}" viewBox="0 0 ${this.dims.width} ${this.dims.height}" xmlns="http://www.w3.org/2000/svg">` + this.placedCircles.map((circle) => {
      const { x, y, radius, color } = circle;
      return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" />`;
    }).join("") + "</svg>";
    return svg;
  }
  asSVG() {
    const svgString = this.asSVGString();
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    return doc.documentElement;
  }
  asCanvas(options = {}) {
    options = { ...this.defaultExportOptions, ...options };
    const scale = options.scale;
    const canvas = document.createElement("canvas");
    canvas.width = this.dims.width * scale;
    canvas.height = this.dims.height * scale;
    const ctx = canvas.getContext("2d");
    for (const circle of this.placedCircles) {
      const { x, y, radius, color } = circle;
      ctx.fillStyle = String(color);
      ctx.beginPath();
      ctx.arc(Number(x * scale), Number(y * scale), radius * scale, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();
    }
    return canvas;
  }
  asImageData(options = {}) {
    options = { ...this.defaultExportOptions, ...options };
    const canvas = this.asCanvas(options);
    return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
  }
  async asBlob(options = {}) {
    options = { ...this.defaultExportOptions, ...options };
    const canvas = this.asCanvas(options);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob2) => {
          if (blob2) {
            resolve(blob2);
          } else {
            reject(new Error("Blob creation failed"));
          }
        },
        options.format,
        options.quality
      );
    });
    return blob;
  }
  async asBlobURL(options = {}) {
    return URL.createObjectURL(await this.asBlob(options));
  }
  asDataURL(options = {}) {
    options = { ...this.defaultExportOptions, ...options };
    return this.asCanvas().toDataURL(options.format, options.quality);
  }
  asArray() {
    return this.placedCircles;
  }
};
async function fromBlob(blob, options = {}) {
  const url = URL.createObjectURL(blob);
  return await fromURL(url, options);
}
async function fromURL(url, options = {}) {
  url = url instanceof URL ? url.href : url;
  const img = document.createElement("img");
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = url;
  });
  return fromImage(img, options);
}
function fromImage(image, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  return fromContext2D(ctx, options);
}
function fromImageData(imageData, imageWidth, options = {}) {
  const cf = new CirclePacker(options);
  cf.render(imageData, imageWidth);
  return cf;
}
function fromContext2D(ctx, options = {}) {
  return fromImageData(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height), ctx.canvas.width, options);
}
function fromCanvas(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  return fromContext2D(ctx, options);
}
function fromSquare(edgeLength = 200, color = "black", options = {}) {
  return fromRect(edgeLength, edgeLength, color, options);
}
function fromCircle(radius = 100, color = "black", options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = radius * 2;
  canvas.height = radius * 2;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
  return fromContext2D(ctx, options);
}
function fromRect(width = 200, height = 200, color = "black", options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  return fromContext2D(ctx, options);
}
export {
  CirclePacker,
  fromBlob,
  fromCanvas,
  fromCircle,
  fromContext2D,
  fromImage,
  fromImageData,
  fromRect,
  fromSquare,
  fromURL
};
