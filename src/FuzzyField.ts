import { Editor, TLShape } from "@tldraw/tldraw";
import p5 from "p5";

import fogVertexShader from './glsl/fog.vert?raw';
import fogFragmentShader from './glsl/fog.frag?raw';



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
      let layer: p5.Framebuffer
      let fogShader: p5.Shader
      let fog: p5.Color
      sketch.preload = () => {
        fogShader = sketch.createShader(fogVertexShader, fogFragmentShader);
      }
      sketch.setup = () => {
        sketch.createCanvas(this.width, this.height, sketch.WEBGL);
        const bufferOpts = {
          width: sketch.width,
          height: sketch.height,
          // format: sketch.RGBA,
          // type: sketch.UNSIGNED_BYTE
        }
        layer = sketch.createFramebuffer(bufferOpts) as unknown as p5.Framebuffer; // eww
        fog = sketch.color('#fff');
        // sketch.noStroke();
      };
      sketch.draw = () => {
        sketch.background(255); // Clear the background each frame
        const shapes = this.editor.getCurrentPageShapes();
        layer.begin();
        sketch.clear();
        sketch.lights();
        sketch.scale(1, -1, 1); // flip y for framebuffer

        this.drawUnderlay(sketch, shapes);
        layer.end();

        // Apply fog to the scene
        sketch.shader(fogShader);
        fogShader.setUniform('fog', [sketch.red(fog), sketch.green(fog), sketch.blue(fog)]);
        fogShader.setUniform('img', layer.color);
        fogShader.setUniform('depth', layer.depth);
        sketch.rect(0, 0, sketch.width, sketch.height);
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
      const closedCurve = shape.type !== 'arrow' && geo.isClosed

      const vertices = geo.vertices
      const shapeX = (shape.x + cam.x) - (sketch.width) / 2;
      const shapeY = (shape.y + cam.y) - sketch.height / 2;

      const depth = 10000
      sketch.push();
      sketch.translate(shapeX, shapeY,);
      sketch.rotateZ(shape.rotation);
      sketch.colorMode(sketch.HSL)
      sketch.stroke(190, 50, 30)
      sketch.fill(190, 50, 50);
      sketch.beginShape();
      const numSides = closedCurve ? vertices.length : vertices.length - 1
      for (let i = 0; i < numSides; i++) {
        const nextIndex = (i + 1) % vertices.length;
        sketch.beginShape();
        sketch.vertex(vertices[i].x, vertices[i].y, 0);
        sketch.vertex(vertices[nextIndex].x, vertices[nextIndex].y, 0);
        sketch.vertex(vertices[nextIndex].x, vertices[nextIndex].y, -depth);
        sketch.vertex(vertices[i].x, vertices[i].y, -depth);
        sketch.endShape(sketch.CLOSE);
      }
      sketch.pop();
    });
  }
}

