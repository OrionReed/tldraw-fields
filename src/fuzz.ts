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
    // Initialize a 2D array to accumulate heat values, each cell starts as an empty array
    let heatMap = Array(Math.ceil(sketch.width / gridSize)).fill(null)
      .map(() => Array(Math.ceil(sketch.height / gridSize)).fill(null)
        .map(() => []));

    shapes.forEach((shape, shapeIndex) => {
      for (let x = 0; x < sketch.width; x += gridSize) {
        for (let y = 0; y < sketch.height; y += gridSize) {
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

          // Map the distance to a heat value and add it to the cell's array
          const heat = sketch.map(dist, 0, 100, 1, 0); // Adjust distance range and mapping as needed
          heatMap[Math.floor(x / gridSize)][Math.floor(y / gridSize)].push(heat);
        }
      }
    });

    // Draw the heatmap based on accumulated heat in cells with contributions from at least 2 shapes
    for (let x = 0; x < sketch.width; x += gridSize) {
      for (let y = 0; y < sketch.height; y += gridSize) {
        const cell = heatMap[Math.floor(x / gridSize)][Math.floor(y / gridSize)];
        if (cell.length >= 2) { // Check if the cell has contributions from at least 2 shapes
          const totalHeat = cell.reduce((acc, val) => acc + val, 0);
          const alpha = sketch.map(totalHeat, 0, cell.length, 0, 255); // Adjust alpha based on total heat
          sketch.fill(0, 136, 255, alpha); // Adjust color as needed
          sketch.noStroke();
          sketch.rect(x, y, gridSize, gridSize);
        }
      }
    }
  }
}