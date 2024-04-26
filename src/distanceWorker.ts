self.onmessage = (e) => {
  const { shapes, y, width, gridSize } = e.data;
  const results = [];

  for (let x = 0; x < width; x += gridSize) {
    let minDist = Infinity;
    for (const shape of shapes) {
      // Simplified distance calculation, assuming you have bounds or similar
      const dist = Math.random(); // Placeholder for actual distance calculation
      if (dist < minDist) minDist = dist;
    }
    results.push({ x, y, minDist });
  }

  postMessage({ y, results });
};