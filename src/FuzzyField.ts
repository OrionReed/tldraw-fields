import { Editor, TLShape } from "@tldraw/tldraw";
import p5 from "p5";


export class FuzzyField {
  editor: Editor
  p5Instance: p5
  width: number
  height: number

  constructor(editor: Editor) {
    this.editor = editor
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.p5Instance = new p5((sketch: p5) => {
      sketch.setup = () => {
        sketch.createCanvas(this.width, this.height, sketch.WEBGL);
        sketch.background(255);
      };
      sketch.draw = () => {
        sketch.background(255); // Clear the background each frame
        const shapes = this.editor.getCurrentPageRenderingShapesSorted();
        this.drawUnderlay(sketch, shapes);
      };
    });

    this.editor.store.onAfterChange = (_a, next, _b) => {
      if (next.typeName !== "shape") return
      this.p5Instance.redraw();
    }
  }

  drawUnderlay(sketch: p5, shapes: TLShape[]) {
    const cam = this.editor.getCamera()

    shapes.forEach((shape) => {
      const geo = this.editor.getShapeGeometry(shape.id)
      const width = geo.bounds.w
      const height = geo.bounds.h
      const shapeX = (shape.x + cam.x) - (sketch.width) / 2;
      const shapeY = (shape.y + cam.y) - sketch.height / 2;

      const depth = 1000
      sketch.push();
      // Translate to the top-left corner of the shape
      sketch.translate(shapeX, shapeY, -depth / 2);
      // Apply rotation around the Z-axis
      sketch.rotateZ(shape.rotation);

      sketch.translate(width / 2, height / 2, 0); // Move to the correct position
      sketch.fill(51, 204, 255); // Set the color to blue
      sketch.box(width, height, depth); // Draw a cube with size 50
      sketch.pop(); // Restore the original drawing state
    });
  }
}

