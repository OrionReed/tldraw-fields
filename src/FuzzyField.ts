import { Editor, TLShape, react, throttle } from '@tldraw/tldraw'
import p5 from 'p5'

type AssosiativeDistFunc = (oldDist: number, newDist: number) => number

const inverseDistanceWeighting: AssosiativeDistFunc = (oldDist, newDist) => {
  const weight = 1 / (newDist + 1) // Adding 1 to avoid division by zero
  const currentWeight = 1 / (oldDist + 1)
  const totalWeight = weight + currentWeight
  return (weight * newDist + currentWeight * oldDist) / totalWeight
}

const weightedDistance: AssosiativeDistFunc = (oldDist, newDist) => {
  const alpha = 0.1
  return alpha * oldDist + (1 - alpha) * newDist
}

const exponentialSmoothing: AssosiativeDistFunc = (oldDist, newDist) => {
  const smoothingFactor = 0.1 // Smaller values result in smoother transitions
  return smoothingFactor * newDist + (1 - smoothingFactor) * oldDist
}

const minDistance: AssosiativeDistFunc = (oldDist, newDist) => {
  return Math.min(oldDist, newDist)
}

export class FuzzyField {
  editor: Editor
  p5Instance: p5
  distanceField: number[][]
  width: number
  height: number
  gridSize = 6
  distFunc: AssosiativeDistFunc = minDistance

  constructor(editor: Editor) {
    this.editor = editor
    this.width = window.innerWidth
    this.height = window.innerHeight

    this.p5Instance = new p5((sketch: p5) => {
      sketch.setup = () => {
        sketch.createCanvas(this.width, this.height)
        sketch.background(255)
      }

      sketch.draw = () => {
        sketch.background(255) // Clear the background each frame
        this.clearDistanceField()
        this.calcDistanceField(sketch)
        this.drawDistanceField()
      }
    })

    this.clearDistanceField()
  }

  clearDistanceField() {
    const width = Math.ceil(this.width / this.gridSize)
    const height = Math.ceil(this.height / this.gridSize)
    this.distanceField = new Array(width)

    for (let i = 0; i < width; i++) {
      this.distanceField[i] = new Array(height).fill(1000)
    }
  }

  drawDistanceField() {
    const sketch = this.p5Instance
    sketch.colorMode(sketch.HSL)
    sketch.loadPixels()
    const fillColor = (dist: number) => {
      const alpha = sketch.map(dist, 0, 255, 1, 0)
      const N = 40 // Distance change interval
      const Y = 40 // Hue change amount
      const hue = 255 - ((Math.floor(dist / N) * Y) % 256)

      return sketch.color(hue, 50, 50, alpha)
    }

    for (let x = 0; x < sketch.width; x += this.gridSize) {
      for (let y = 0; y < sketch.height; y += this.gridSize) {
        const currentDistance =
          this.distanceField[Math.floor(x / this.gridSize)][Math.floor(y / this.gridSize)]
        const index = ((x + y) * sketch.width + (x + y)) * this.gridSize
        const color = fillColor(currentDistance)
        sketch.pixels[index] = sketch.red(color)
        sketch.pixels[index + 1] = sketch.green(color)
        sketch.pixels[index + 2] = sketch.blue(color)
        sketch.pixels[index + 3] = sketch.alpha(color)

        sketch.fill(fillColor(currentDistance))
        sketch.noStroke()
        sketch.rect(x, y, this.gridSize, this.gridSize)
      }
    }
  }

  calcDistanceField(sketch: p5) {
    let shape: TLShape
    const shapes = this.editor.getCurrentPageShapes()
    const { x: cx, y: cy } = this.editor.getCamera()

    for (let x = 0; x < sketch.width; x += this.gridSize) {
      for (let y = 0; y < sketch.height; y += this.gridSize) {
        for (let i = 0; i < shapes.length; i++) {
          shape = shapes[i]
          const geo = this.editor.getShapeGeometry(shape.id)
          const pointInShapeSpace = this.editor.getPointInShapeSpace(shape, {
            x: x - cx,
            y: y - cy,
          })
          const dist = geo.distanceToPoint(pointInShapeSpace, true)
          const oldDist = this.getDistance(x, y)

          this.setDistance(x, y, this.distFunc(oldDist, dist))
        }
      }
    }
  }
  setDistance(x: number, y: number, value: number) {
    this.distanceField[Math.floor(x / this.gridSize)][Math.floor(y / this.gridSize)] = value
  }
  getDistance(x: number, y: number) {
    return this.distanceField[Math.floor(x / this.gridSize)][Math.floor(y / this.gridSize)]
  }
}
