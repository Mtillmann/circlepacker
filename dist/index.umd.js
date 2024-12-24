(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MTCP = {}));
})(this, (function (exports) { 'use strict';

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

  // src/CirclePacker.ts
  var CirclePacker = class {
    defaultOptions = {
      spacing: 1,
      numCircles: 1e3,
      minRadius: 1,
      maxRadius: 10,
      higherAccuracy: false,
      colors: "auto",
      minAlpha: 1,
      background: "transparent",
      useMainThread: false,
      reuseWorker: true
    };
    defaultExportOptions = {
      scale: globalThis.devicePixelRatio || 1,
      quality: 1,
      format: "image/png"
    };
    options;
    spareCircles = [];
    placedCircles = [];
    dims = { width: 0, height: 0 };
    worker = null;
    constructor(options = {}) {
      this.options = { ...this.defaultOptions, ...options };
      if (["transparent", null, "", false, void 0].includes(this.options.background)) {
        this.options.background = false;
      }
      if (this.options.colors === "auto") {
        this.options.colors = [];
      }
      for (let i = 0; i < this.options.numCircles; i++) {
        this.spareCircles.push({
          radius: this.options.minRadius + Math.random() * Math.random() * (this.options.maxRadius - this.options.minRadius)
        });
      }
      this.spareCircles.sort((a, b) => a.radius - b.radius);
    }
    getCircleColor(imageData, x, y) {
      if (this.options.colors.length === 0) {
        x = Math.min(Math.round(x), this.dims.width - 1);
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
    async pack(imageData, imageWidth) {
      let circles = [];
      if (typeof Worker === "undefined" || this.options.useMainThread) {
        circles = Core_default.pack(imageData, imageWidth, this.spareCircles, this.options);
      } else {
        if (!this.worker) {
          this.worker = new Worker("data:text/javascript;base64,dmFyIENvcmVfZGVmYXVsdD17cGFjayhpLHQsZSxzKXtsZXQgcj1lLmxlbmd0aDtjb25zdCBhPVtdLGQ9e3dpZHRoOnQsaGVpZ2h0OmkuZGF0YS5sZW5ndGgvdC80fTtmb3IoO3I+MDspe3ItLTtjb25zdCB0PWVbcl07bGV0IGg9MWUzO2Zvcig7IXQueCYmaC0tID4wOyl7Y29uc3QgZT1NYXRoLnJhbmRvbSgpKmQud2lkdGgscj1NYXRoLnJhbmRvbSgpKmQuaGVpZ2h0O3RoaXMuaXNDaXJjbGVJbnNpZGUoaSxkLndpZHRoLGUscix0LnJhZGl1cyxzLmhpZ2hlckFjY3VyYWN5LHMubWluQWxwaGEpJiYodGhpcy50b3VjaGVzUGxhY2VkQ2lyY2xlKGUscix0LnJhZGl1cyxhLHMuc3BhY2luZyl8fCh0Lng9ZSx0Lnk9cixhLnB1c2godCkpKX19cmV0dXJuIGF9LGlzRmlsbGVkOihpLHQsZSxzLHIpPT4odD1NYXRoLnJvdW5kKHQpLGU9TWF0aC5yb3VuZChlKSxpLmRhdGFbNCoocyplK3QpKzNdPnIpLGlzQ2lyY2xlSW5zaWRlKGksdCxlLHMscixhLGQpe2lmKCF0aGlzLmlzRmlsbGVkKGksZSxzLXIsdCxkKSlyZXR1cm4hMTtpZighdGhpcy5pc0ZpbGxlZChpLGUscytyLHQsZCkpcmV0dXJuITE7aWYoIXRoaXMuaXNGaWxsZWQoaSxlK3Iscyx0LGQpKXJldHVybiExO2lmKCF0aGlzLmlzRmlsbGVkKGksZS1yLHMsdCxkKSlyZXR1cm4hMTtpZihhKXtjb25zdCByPU1hdGguY29zKE1hdGguUEkvNCk7aWYoIXRoaXMuaXNGaWxsZWQoaSxlK3IscytyLHQsZCkpcmV0dXJuITE7aWYoIXRoaXMuaXNGaWxsZWQoaSxlLXIscytyLHQsZCkpcmV0dXJuITE7aWYoIXRoaXMuaXNGaWxsZWQoaSxlLXIscy1yLHQsZCkpcmV0dXJuITE7aWYoIXRoaXMuaXNGaWxsZWQoaSxlK3Iscy1yLHQsZCkpcmV0dXJuITF9cmV0dXJuITB9LHRvdWNoZXNQbGFjZWRDaXJjbGUoaSx0LGUscyxyKXtyZXR1cm4gcy5zb21lKChzPT50aGlzLmRpc3QoaSx0LHMueCxzLnkpPHMucmFkaXVzK2UrcikpfSxkaXN0KGksdCxlLHMpe2NvbnN0IHI9aS1lLGE9dC1zO3JldHVybiBNYXRoLnNxcnQocipyK2EqYSl9fTtzZWxmLm9ubWVzc2FnZT1pPT57cG9zdE1lc3NhZ2UoQ29yZV9kZWZhdWx0LnBhY2soaS5kYXRhLmltYWdlRGF0YSxpLmRhdGEuaW1hZ2VXaWR0aCxpLmRhdGEuc3BhcmVDaXJjbGVzLGkuZGF0YS5vcHRpb25zKSl9Ow==");
        }
        circles = await new Promise((resolve) => {
          this.worker.onmessage = (e) => resolve(e.data);
          this.worker.postMessage({
            imageData,
            imageWidth,
            spareCircles: this.spareCircles,
            options: this.options
          });
        });
        if (!this.options.reuseWorker) {
          this.worker.terminate();
        }
      }
      this.dims = { width: imageWidth, height: imageData.data.length / imageWidth / 4 };
      this.placedCircles = circles.reduce((acc, circle) => {
        const color = this.getCircleColor(imageData, circle.x, circle.y);
        if (color) {
          circle.color = color;
          acc.push(circle);
        }
        return acc;
      }, []);
      return this.placedCircles;
    }
    asSVGString() {
      const svg = `<svg width="${this.dims.width}" height="${this.dims.height}" viewBox="0 0 ${this.dims.width} ${this.dims.height}" xmlns="http://www.w3.org/2000/svg">` + (this.options.background ? `<rect x="0" y="0" width="${this.dims.width}" height="${this.dims.height}" fill="${this.options.background}" />` : "") + this.placedCircles.map((circle) => {
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
      if (this.options.background) {
        ctx.fillStyle = this.options.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
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
    return await fromImage(img, options);
  }
  async function fromImage(image, options = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    return await fromContext2D(ctx, options);
  }
  async function fromImageData(imageData, imageWidth, options = {}) {
    const cf = new CirclePacker(options);
    await cf.pack(imageData, imageWidth);
    return cf;
  }
  async function fromContext2D(ctx, options = {}) {
    return await fromImageData(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height), ctx.canvas.width, options);
  }
  async function fromCanvas(canvas, options = {}) {
    const ctx = canvas.getContext("2d");
    return await fromContext2D(ctx, options);
  }
  async function fromSquare(edgeLength = 200, color = "black", options = {}) {
    return await fromRect(edgeLength, edgeLength, color, options);
  }
  async function fromCircle(radius = 100, color = "black", options = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = radius * 2;
    canvas.height = radius * 2;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    return await fromContext2D(ctx, options);
  }
  async function fromRect(width = 200, height = 200, color = "black", options = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    return await fromContext2D(ctx, options);
  }

  exports.CirclePacker = CirclePacker;
  exports.fromBlob = fromBlob;
  exports.fromCanvas = fromCanvas;
  exports.fromCircle = fromCircle;
  exports.fromContext2D = fromContext2D;
  exports.fromImage = fromImage;
  exports.fromImageData = fromImageData;
  exports.fromRect = fromRect;
  exports.fromSquare = fromSquare;
  exports.fromURL = fromURL;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
