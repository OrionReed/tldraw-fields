import { Editor, JsonArray, TLDrawShape, TLShape, TLShapeId, Vec, VecLike, useEditor } from "@tldraw/tldraw";
import p5 from "p5";

export class FuzzyCanvas {
  editor: Editor
  p5Instance: p5
  distanceField: number[][]
  gridSize = 4;

  constructor() {
    this.editor = window.editor as Editor
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.p5Instance = new p5((sketch: p5) => {
      sketch.setup = () => {
        sketch.createCanvas(width, height);
        sketch.background(255);
      };
      sketch.draw = () => {
        sketch.background(255); // Clear the background each frame
        const shapes = this.editor.getCurrentPageRenderingShapesSorted();
        this.clearDistanceField();
        this.calcDistanceField(sketch, shapes);
        this.drawDistanceField();
      };
    });

    this.editor.store.onAfterChange = (_a, next, _b) => {
      if (next.typeName !== "shape") return
      this.p5Instance.redraw();
    }
    this.clearDistanceField();
  }

  clearDistanceField() {
    this.distanceField = Array(Math.ceil(this.p5Instance.width / this.gridSize)).fill(1000)
      .map(() => Array(Math.ceil(this.p5Instance.height / this.gridSize)).fill(1000));
  }

  drawDistanceField() {
    const sketch = this.p5Instance
    sketch.colorMode(sketch.HSL);
    sketch.loadPixels();
    const fillColor = (dist: number) => {
      const alpha = sketch.map(dist, 0, 255, 1, 0);
      const N = 40; // Distance change interval
      const Y = 40; // Hue change amount
      const hue = 255 - ((Math.floor(dist / N) * Y) % 256);

      return sketch.color(hue, 50, 50, alpha);
    }

    for (let x = 0; x < sketch.width; x += this.gridSize) {
      for (let y = 0; y < sketch.height; y += this.gridSize) {
        const currentDistance = this.distanceField[Math.floor(x / this.gridSize)][Math.floor(y / this.gridSize)];
        const index = ((x + y) * sketch.width + (x + y)) * this.gridSize;
        const color = fillColor(currentDistance)
        sketch.pixels[index] = sketch.red(color);
        sketch.pixels[index + 1] = sketch.green(color);
        sketch.pixels[index + 2] = sketch.blue(color);
        sketch.pixels[index + 3] = sketch.alpha(color);

        sketch.fill(fillColor(currentDistance));
        sketch.noStroke();
        sketch.rect(x, y, this.gridSize, this.gridSize);
      }
    }
  }


  calcDistanceField(sketch: p5, shapes: TLShape[]) {
    shapes.forEach((shape) => {
      const geo = this.editor.getShapeGeometry(shape.id)
      const bounds = geo.bounds
      const min: VecLike = { x: bounds.minX + shape.x, y: bounds.minY + shape.y }
      const max: VecLike = { x: bounds.maxX + shape.x, y: bounds.maxY + shape.y }
      for (let x = 0; x < sketch.width; x += this.gridSize) {
        for (let y = 0; y < sketch.height; y += this.gridSize) {
          const isInBounds = min.x < x && x < max.x && min.y < y && y < max.y
          if (isInBounds) {
            this.distanceField[Math.floor(x / this.gridSize)][Math.floor(y / this.gridSize)] = 0;
            continue
          }
          const maxDist = 255
          const isFarFromBounds = x < min.x - maxDist || x > max.x + maxDist || y < min.y - maxDist || y > max.y + maxDist
          if (isFarFromBounds) {
            continue
          }

          const pointInShapeSpace = this.editor.getPointInShapeSpace(shape, { x, y })
          const dist = geo.distanceToPoint(pointInShapeSpace, true)
          const currentVal = this.distanceField[Math.floor(x / this.gridSize)][Math.floor(y / this.gridSize)];
          this.distanceField[Math.floor(x / this.gridSize)][Math.floor(y / this.gridSize)] = Math.min(currentVal, dist);
        }
      }
    });
  }
}