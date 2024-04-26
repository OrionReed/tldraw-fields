// This worker will handle calculating the distance field
self.onmessage = (e) => {
  const { width, height, gridSize, shapes } = e.data;
  const distanceField = Array(Math.ceil(width / gridSize)).fill(1000)
    .map(() => Array(Math.ceil(height / gridSize)).fill(1000));

  shapes.forEach((shape) => {
    const { bounds, position, geo } = shape;
    const min = { x: bounds.minX + position.x, y: bounds.minY + position.y };
    const max = { x: bounds.maxX + position.x, y: bounds.maxY + position.y };

    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        const isInBounds = min.x < x && x < max.x && min.y < y && y < max.y;
        if (isInBounds) {
          distanceField[Math.floor(x / gridSize)][Math.floor(y / gridSize)] = 0;
          continue;
        }
        const maxDist = 255;
        const isFarFromBounds = x < min.x - maxDist || x > max.x + maxDist || y < min.y - maxDist || y > max.y + maxDist;
        if (isFarFromBounds) {
          continue;
        }

        // Assuming getPointInShapeSpace and distanceToPoint are pure functions and provided in the message
        const pointInShapeSpace = { x: x - shape.x, y: y - shape.y } // getPointInShapeSpace(shape, { x, y });
        console.log('geo', geo)
        const dist = geo.distanceToPoint(pointInShapeSpace, true);
        const currentVal = distanceField[Math.floor(x / gridSize)][Math.floor(y / gridSize)];
        distanceField[Math.floor(x / gridSize)][Math.floor(y / gridSize)] = Math.min(currentVal, dist);
      }
    }
  });

  // Post the results back to the main thread
  self.postMessage({ distanceField });
};

// NON-WORKER CALCULATION FUNCTION
// calcDistanceField(sketch: p5, shapes: TLShape[]) {
//   shapes.forEach((shape) => {
//     const geo = this.editor.getShapeGeometry(shape.id)
//     const bounds = geo.bounds
//     const min: VecLike = { x: bounds.minX + shape.x, y: bounds.minY + shape.y }
//     const max: VecLike = { x: bounds.maxX + shape.x, y: bounds.maxY + shape.y }
//     for (let x = 0; x < sketch.width; x += this.gridSize) {
//       for (let y = 0; y < sketch.height; y += this.gridSize) {
//         const isInBounds = min.x < x && x < max.x && min.y < y && y < max.y
//         if (isInBounds) {
//           this.distanceField[Math.floor(x / this.gridSize)][Math.floor(y / this.gridSize)] = 0;
//           continue
//         }
//         const maxDist = 255
//         const isFarFromBounds = x < min.x - maxDist || x > max.x + maxDist || y < min.y - maxDist || y > max.y + maxDist
//         if (isFarFromBounds) {
//           continue
//         }

//         const pointInShapeSpace = this.editor.getPointInShapeSpace(shape, { x, y })
//         const dist = geo.distanceToPoint(pointInShapeSpace, true)
//         const currentVal = this.distanceField[Math.floor(x / this.gridSize)][Math.floor(y / this.gridSize)];
//         this.distanceField[Math.floor(x / this.gridSize)][Math.floor(y / this.gridSize)] = Math.min(currentVal, dist);
//       }
//     }
//   });
// }