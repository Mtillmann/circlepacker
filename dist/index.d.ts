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
    background: string | boolean;
    useMainThread: boolean;
    reuseWorker: boolean;
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
    worker: Worker | null;
    constructor(options?: Partial<Options>);
    getCircleColor(imageData: ImageData, x: number, y: number): string | boolean;
    pack(imageData: ImageData, imageWidth: number): Promise<Circle[]>;
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
declare function fromImage(image: HTMLImageElement, options?: Partial<Options>): Promise<CirclePacker>;
declare function fromImageData(imageData: ImageData, imageWidth: number, options?: Partial<Options>): Promise<CirclePacker>;
declare function fromContext2D(ctx: CanvasRenderingContext2D, options?: Partial<Options>): Promise<CirclePacker>;
declare function fromCanvas(canvas: HTMLCanvasElement, options?: Partial<Options>): Promise<CirclePacker>;
declare function fromSquare(edgeLength?: number, color?: string, options?: Partial<Options>): Promise<CirclePacker>;
declare function fromCircle(radius?: number, color?: string, options?: Partial<Options>): Promise<CirclePacker>;
declare function fromRect(width?: number, height?: number, color?: string, options?: Partial<Options>): Promise<CirclePacker>;

export { type Circle, CirclePacker, type ExportOptions, type Options, fromBlob, fromCanvas, fromCircle, fromContext2D, fromImage, fromImageData, fromRect, fromSquare, fromURL };
