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
        const shapes = this.editor.getCurrentPageShapes();
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

      const depth = 5000
      const segments = 50; // Number of segments
      const segmentDepth = depth / segments;


      sketch.push();
      // Translate to the top-left corner of the shape
      sketch.translate(shapeX, shapeY, -depth);
      // Apply rotation around the Z-axis
      sketch.rotateZ(shape.rotation);


      sketch.translate(width / 2, height / 2, 0); // Move to the correct position

      // Draw each segment with increasing transparency
      for (let i = 0; i < segments; i++) {
        const hue = sketch.map(i, 0, segments - 1, 0, 360); // Transparency from opaque to more transparent
        sketch.colorMode(sketch.HSL)
        sketch.fill(hue, 100, 50);

        // Left side
        sketch.beginShape();
        sketch.vertex(-width / 2, -height / 2, segmentDepth * i);
        sketch.vertex(-width / 2, height / 2, segmentDepth * i);
        sketch.vertex(-width / 2, height / 2, segmentDepth * (i + 1));
        sketch.vertex(-width / 2, -height / 2, segmentDepth * (i + 1));
        sketch.endShape(sketch.CLOSE);

        // Right side
        sketch.beginShape();
        sketch.vertex(width / 2, -height / 2, segmentDepth * i);
        sketch.vertex(width / 2, height / 2, segmentDepth * i);
        sketch.vertex(width / 2, height / 2, segmentDepth * (i + 1));
        sketch.vertex(width / 2, -height / 2, segmentDepth * (i + 1));
        sketch.endShape(sketch.CLOSE);

        // Top side
        sketch.beginShape();
        sketch.vertex(-width / 2, -height / 2, segmentDepth * i);
        sketch.vertex(width / 2, -height / 2, segmentDepth * i);
        sketch.vertex(width / 2, -height / 2, segmentDepth * (i + 1));
        sketch.vertex(-width / 2, -height / 2, segmentDepth * (i + 1));
        sketch.endShape(sketch.CLOSE);

        // Bottom side
        sketch.beginShape();
        sketch.vertex(-width / 2, height / 2, segmentDepth * i);
        sketch.vertex(width / 2, height / 2, segmentDepth * i);
        sketch.vertex(width / 2, height / 2, segmentDepth * (i + 1));
        sketch.vertex(-width / 2, height / 2, segmentDepth * (i + 1));
        sketch.endShape(sketch.CLOSE);
      }
      sketch.pop(); // Restore the original drawing state
    });
  }
}

