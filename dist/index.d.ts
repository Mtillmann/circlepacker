type Circle = {
    radius: number;
    x?: number;
    y?: number;
    color?: string;
};

type ExportOptions = {
    scale?: number;
    quality?: number;
    format?: string;
};

type Options = {
    spacing: number;
    numCircles: number;
    minRadius: number;
    maxRadius: number;
    higherAccuracy: boolean;
    colors: string | Array<string>;
    minAlpha: number;
};

declare class CirclePacker {
    defaultOptions: Options;
    defaultExportOptions: ExportOptions;
    options: Partial<Options>;
    spareCircles: Circle[];
    placedCircles: Circle[];
    dims: {
        width: number;
        height: number;
    };
    constructor(options?: Partial<Options>);
    isFilled(imageData: ImageData, x: number, y: number): boolean;
    isCircleInside(imageData: ImageData, x: number, y: number, r: number): boolean;
    touchesPlacedCircle(x: number, y: number, r: number): boolean;
    dist(x1: number, y1: number, x2: number, y2: number): number;
    getCircleColor(imageData: ImageData, x: number, y: number): string | boolean;
    render(imageData: ImageData, imageWidth: number): Circle[];
    asSVGString(): string;
    asSVG(): SVGElement;
    asCanvas(options?: ExportOptions): HTMLCanvasElement;
    asImageData(options?: ExportOptions): ImageData;
    asBlob(options?: ExportOptions): Promise<Blob>;
    asBlobURL(options?: ExportOptions): Promise<string>;
    asDataURL(options?: ExportOptions): string;
    asArray(): Circle[];
}
declare function fromBlob(blob: Blob, options?: Partial<Options>): Promise<CirclePacker>;
declare function fromURL(url: string | URL, options?: Partial<Options>): Promise<CirclePacker>;
declare function fromImage(image: HTMLImageElement, options?: Partial<Options>): CirclePacker;
declare function fromImageData(imageData: ImageData, imageWidth: number, options?: Partial<Options>): CirclePacker;
declare function fromContext2D(ctx: CanvasRenderingContext2D, options?: Partial<Options>): CirclePacker;
declare function fromCanvas(canvas: HTMLCanvasElement, options?: Partial<Options>): CirclePacker;
declare function fromSquare(edgeLength?: number, color?: string, options?: Partial<Options>): CirclePacker;
declare function fromCircle(radius?: number, color?: string, options?: Partial<Options>): CirclePacker;
declare function fromRect(width?: number, height?: number, color?: string, options?: Partial<Options>): CirclePacker;

export { type Circle, CirclePacker, type ExportOptions, type Options, fromBlob, fromCanvas, fromCircle, fromContext2D, fromImage, fromImageData, fromRect, fromSquare, fromURL };
