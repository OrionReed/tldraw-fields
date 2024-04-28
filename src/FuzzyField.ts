import { Editor, Geometry2d, TLShape, VecLike } from "@tldraw/tldraw";
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
      sketch.preload = () => {
        fogShader = sketch.createShader(fogVertexShader, fogFragmentShader);
      }
      sketch.setup = () => {
        sketch.createCanvas(this.width, this.height, sketch.WEBGL);
        const bufferOpts = {
          width: sketch.width,
          height: sketch.height,
        }
        layer = sketch.createFramebuffer(bufferOpts) as unknown as p5.Framebuffer; // eww
      };
      sketch.draw = () => {
        sketch.background(255);
        const shapes = this.editor.getCurrentPageShapes();
        layer.begin();
        sketch.clear();
        sketch.lights();
        sketch.scale(1, -1, 1); // flip y for framebuffer

        this.drawUnderlay(sketch, shapes);
        layer.end();

        // Apply fog to the scene
        const fogColor = sketch.color('#fff');
        sketch.shader(fogShader);
        fogShader.setUniform('fog', [sketch.red(fogColor), sketch.green(fogColor), sketch.blue(fogColor)]);
        fogShader.setUniform('img', layer.color);
        fogShader.setUniform('depth', layer.depth);
        sketch.rect(0, 0, sketch.width, sketch.height);
      };
    });
  }

  drawUnderlay(sketch: p5, shapes: TLShape[]) {
    const depth = 10000
    sketch.colorMode(sketch.HSL)
    const geoColor: p5.Color = sketch.color(190, 50, 50)
    const strokeColor: p5.Color = sketch.color(190, 50, 30)

    const cam = this.editor.getCamera()
    let previousShape: TLShape | null = null
    shapes.forEach((shape) => {
      const geo = this.editor.getShapeGeometry(shape.id)
      const closedCurve = shape.type !== 'arrow' && geo.isClosed

      const vertices = geo.vertices
      const shapeX = (shape.x + cam.x) - sketch.width / 2;
      const shapeY = (shape.y + cam.y) - sketch.height / 2;

      sketch.push();
      sketch.translate(shapeX, shapeY);
      sketch.rotateZ(shape.rotation);
      sketch.stroke(strokeColor)
      sketch.fill(geoColor);
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
      if (previousShape) {
        this.drawRope(sketch, shape, geo, previousShape, this.editor.getShapeGeometry(previousShape.id));
      }
      sketch.pop();
      previousShape = shape
    });
  }

  /** Returns the vector from the center of the first shape to the center of the second shape, accounting for rotation */
  centerToCenter(from: TLShape, to: TLShape): VecLike {
    const fromGeo = this.editor.getShapeGeometry(from);
    const toGeo = this.editor.getShapeGeometry(to);

    // Calculate center positions of each shape
    const fromCenterX = from.x + (fromGeo.bounds.w / 2) * Math.cos(from.rotation) - (fromGeo.bounds.h / 2) * Math.sin(from.rotation);
    const fromCenterY = from.y + (fromGeo.bounds.w / 2) * Math.sin(from.rotation) + (fromGeo.bounds.h / 2) * Math.cos(from.rotation);
    const toCenterX = to.x + (toGeo.bounds.w / 2) * Math.cos(to.rotation) - (toGeo.bounds.h / 2) * Math.sin(to.rotation);
    const toCenterY = to.y + (toGeo.bounds.w / 2) * Math.sin(to.rotation) + (toGeo.bounds.h / 2) * Math.cos(to.rotation);

    // Return the vector from the center of 'from' to the center of 'to'
    return {
      x: toCenterX - fromCenterX,
      y: toCenterY - fromCenterY,
    };
  }

  drawRope(sketch: p5, shape: TLShape, shapeGeo: Geometry2d, toShape: TLShape) {
    const segments = 20; // Number of segments in the rope
    const sag = 1000; // How much the rope sags
    const strokeWeight = 20; // how thick the lines are
    const strokeColor: p5.Color = sketch.color(250, 50, 50);

    sketch.push(); // Save the current drawing state

    // Adjust for the shape's position and rotation
    sketch.translate(shapeGeo.bounds.w / 2, shapeGeo.bounds.h / 2);
    sketch.rotateZ(-shape.rotation);

    const centerVec = this.centerToCenter(shape, toShape);

    sketch.stroke(strokeColor);
    sketch.strokeWeight(strokeWeight); // Set a thick stroke
    sketch.noFill();

    sketch.beginShape();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = sketch.lerp(0, centerVec.x, t);
      const y = sketch.lerp(0, centerVec.y, t);
      const parabola = sag * Math.sin(Math.PI * t); // Simple parabolic equation for sag
      const col = sketch.lerpColor(strokeColor, sketch.color('red'), t);
      sketch.stroke(col);
      sketch.vertex(x, y, -parabola);
    }
    sketch.endShape();
    sketch.pop(); // Restore the original drawing state
  }
}