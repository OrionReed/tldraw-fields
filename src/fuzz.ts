import { Editor, JsonArray, TLDrawShape, TLShapeId, useEditor } from "@tldraw/tldraw";
import p5 from "p5";

export class FuzzyCanvas {
  editor: Editor
  p5Instance: p5
  constructor() {
    this.editor = window.editor as Editor
    console.log('constructing fuzzy canvas');

    this.p5Instance = new p5((sketch: p5) => {
      sketch.setup = () => {
        sketch.createCanvas(window.innerWidth, window.innerHeight);
        // canvas.parent('root'); // Specify the parent element's ID
        sketch.background(255);
      };
      sketch.draw = () => {
        sketch.background(255); // Clear the background each frame
        const shapes = this.editor.getCurrentPageShapes();
        this.drawHeatmap(sketch, shapes);
      };
    });

    this.editor.store.onAfterChange = (prev, next, _) => {
      if (next.typeName === "pointer") return
      if (next.typeName === "instance") return
      console.log('changing');
      this.p5Instance.redraw();

      // const shapes = this.editor.getCurrentPageShapes()
      // this.p5Instance.clear();
      // Object.values(shapes).forEach(shape => {
      //   const x = shape.x
      //   const y = shape.y
      //   this.p5Instance.fill('orange'); // Set fill color to blue
      //   this.p5Instance.rect(x, y, shape.props.w, shape.props.h); // Draw an ellipse at the shape's position
      // });
      // return;
    }

  }
  drawHeatmap(sketch: p5, shapes: TLDrawShape[]) {
    const gridSize = 20; // Adjust for performance vs quality
    for (let x = 0; x < sketch.width; x += gridSize) {
      for (let y = 0; y < sketch.height; y += gridSize) {
        let minDist = Infinity;
        shapes.forEach(shape => {
          // Calculate distances to the edges of the rectangle
          const leftEdge = shape.x;
          const rightEdge = shape.x + shape.props.w;
          const topEdge = shape.y;
          const bottomEdge = shape.y + shape.props.h;

          // Find the closest x and y coordinates on the rectangle to the point (x, y)
          const closestX = Math.max(leftEdge, Math.min(x, rightEdge));
          const closestY = Math.max(topEdge, Math.min(y, bottomEdge));

          // Calculate the distance from the point to the closest point on the rectangle
          const dist = sketch.dist(x, y, closestX, closestY);

          // Update minDist if this is the closest rectangle so far
          minDist = Math.min(minDist, dist);
        });

        // Map the minimum distance to an alpha value for the heatmap
        const alpha = sketch.map(minDist, 0, 200, 255, 0); // Adjust distance range and alpha mapping as needed
        sketch.fill(255, 100, 0, alpha); // Adjust color as needed
        sketch.noStroke();
        sketch.rect(x, y, gridSize, gridSize);
      }
    }
  }
}