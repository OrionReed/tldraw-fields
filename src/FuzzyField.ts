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
      };
      sketch.draw = () => {
        sketch.background(255); // Clear the background each frame
        const shapes = this.editor.getCurrentPageShapes();
        this.drawUnderlay(sketch, shapes);
      };
    });

    this.editor.store.onAfterChange = (_a, next, _b) => {
      if (next.typeName !== "shape") return
      // this.p5Instance.redraw();
    }
  }

  drawUnderlay(sketch: p5, shapes: TLShape[]) {
    const cam = this.editor.getCamera()

    shapes.forEach((shape) => {
      const geo = this.editor.getShapeGeometry(shape.id)
      const vertices = geo.vertices
      const shapeX = (shape.x + cam.x) - (sketch.width) / 2;
      const shapeY = (shape.y + cam.y) - sketch.height / 2;

      const depth = 10000
      sketch.push();
      // Translate to the top-left corner of the shape
      sketch.translate(shapeX, shapeY,);
      sketch.rotateZ(shape.rotation);
      sketch.colorMode(sketch.HSL)
      sketch.stroke(90, 50, 40)
      sketch.fill(90, 50, 50);
      sketch.beginShape();
      for (let i = 0; i < vertices.length; i++) {
        const nextIndex = (i + 1) % vertices.length;
        sketch.beginShape();
        sketch.vertex(vertices[i].x, vertices[i].y, 0);
        sketch.vertex(vertices[nextIndex].x, vertices[nextIndex].y, 0);
        sketch.vertex(vertices[nextIndex].x, vertices[nextIndex].y, -depth);
        sketch.vertex(vertices[i].x, vertices[i].y, -depth);
        sketch.endShape(sketch.CLOSE);
      }
      sketch.pop(); // Restore the original drawing state
    });
  }
}

