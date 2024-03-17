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
    const gridSize = 5; // Smaller grid size for a smoother effect
    let heatMap = Array(Math.ceil(sketch.width / gridSize)).fill(0)
      .map(() => Array(Math.ceil(sketch.height / gridSize)).fill(0));

    // Function to find the closest point on shape B from a point on shape A
    function findClosestPoint(point, shape) {
      let closestPoint = { x: shape.x, y: shape.y };
      let minDist = Infinity;
      // Assuming rectangular shapes, check each corner
      const corners = [
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.props.w, y: shape.y },
        { x: shape.x, y: shape.y + shape.props.h },
        { x: shape.x + shape.props.w, y: shape.y + shape.props.h }
      ];
      corners.forEach(corner => {
        const dist = sketch.dist(point.x, point.y, corner.x, corner.y);
        if (dist < minDist) {
          minDist = dist;
          closestPoint = corner;
        }
      });
      return closestPoint;
    }

    // Iterate over pairs of shapes to find and draw lines between their closest points
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const shapeA = shapes[i];
        const shapeB = shapes[j];
        // Find closest points between shapeA and shapeB
        const pointA = { x: shapeA.x + shapeA.props.w / 2, y: shapeA.y + shapeA.props.h / 2 }; // Center of shapeA
        const closestPointB = findClosestPoint(pointA, shapeB);
        const closestPointA = findClosestPoint(closestPointB, shapeA);

        // Check if the distance between closest points is within the threshold to draw a line
        const dist = sketch.dist(closestPointA.x, closestPointA.y, closestPointB.x, closestPointB.y);
        if (dist < 200) { // Proximity threshold
          // Here, instead of directly drawing, calculate the influence of this "line" on the heatmap
          // This is a placeholder for line influence logic
        }
      }
    }

    // Heatmap drawing logic (similar to previous examples, adjusted for line-driven heat values)
    // ...
  }
}