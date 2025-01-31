const Shape = class {
  constructor(ctx) {
    this.ctx = ctx
    this.points = []
  }
  vertex(x, y) {
    this.points.push([x, y])
  }
  render() {
    this.ctx.beginPath()
    for (let [x, y] of this.points)
      this.ctx.vertex(x, y)
  }
  close() {
    this.render()
    this.ctx.closePath()
    this.ctx.fill()
  }
  done() {
    this.render()
    this.ctx.fill()
  }
}

const Canvas = class {
  static mc() {
    return {
      left: false,
      right: false,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      scroll: 0,
      owned: false,
    }
  }
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.oldFontName = 'sans-serif'

    this.mc = null
    this.mcDefault = {}
    this.mouseAt = { x: 0, y: 0, left: false, right: false }
    this.translates = [{ x: 0, y: 0 }]

    let mouseAt = this.mouseAt
    let getCoordinate = e => {
      let { left, top } = canvas.getBoundingClientRect()
      mouseAt.x = e.clientX - left
      mouseAt.y = e.clientY - top
      if (this.mc) {
        this.mc.dx += e.movementX
        this.mc.dy += e.movementY
      }
    }

    canvas.addEventListener('click', e => {
      e.preventDefault()
    }, false)
    canvas.addEventListener('dragstart', e => {
      e.preventDefault()
    }, false)
    canvas.addEventListener('contextmenu', e => {
      e.preventDefault()
    }, false)
    canvas.addEventListener('mousedown', e => {
      e.preventDefault()
      getCoordinate(e)
      if (e.button === 0)
        mouseAt.left = true
      else if (e.button === 2)
        mouseAt.right = true
    }, false)
    canvas.addEventListener('mousemove', e => {
      getCoordinate(e)
    }, false)
    canvas.addEventListener('mouseup', e => {
      getCoordinate(e)
      if (e.button === 0)
        mouseAt.left = false
      else if (e.button === 2)
        mouseAt.right = false
    }, false)
    canvas.addEventListener('mousewheel', e => {
      if (this.mc) {
        this.mc.scroll += e.wheelDelta / -120 || e.detail || 0
      }
    }, false)
  }
  clip(x, y, w, h) {
    let last = this.translates[this.translates.length - 1]
    this.translates.push({ x: x + last.x, y: y + last.y })
    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.beginPath()
    this.ctx.rect(0, 0, w, h)
    this.ctx.clip()
  }
  translate(x, y) {
    let last = this.translates[this.translates.length - 1]
    this.translates.push({ x: x + last.x, y: y + last.y })
    this.ctx.save()
    this.ctx.translate(x, y)
  }
  pop() {
    this.ctx.restore()
    this.translates.pop()
  }
  mouse(mc, x, y, w, h, check = null) {
    let t = this.translates[this.translates.length - 1]
    x += t.x
    y += t.y
    if (this.mc && this.mc !== mc) return
    let mi = this.mouseAt.x >= x && this.mouseAt.x < x + w
          && this.mouseAt.y >= y && this.mouseAt.y < y + h
    mc.hover = mi && (!check || check(this.mouseAt))
    let isOwned = mc.hover || this.mc
    if (!isOwned) return
    if (isOwned && !mc.owned) {
      mc.dx = mc.dx || 0
      mc.dy = mc.dy || 0
      mc.scroll = mc.scroll || 0
      mc.owned = true
    }

    mc.x = this.mouseAt.x - t.x
    mc.y = this.mouseAt.y - t.y
    mc.left = this.mouseAt.left
    mc.right = this.mouseAt.right
    this.mc = mc
  }
  mouseClear(x, y, w, h, check = null) {
    this.mouse(this.mcDefault, x, y, w, h, check)
  }
  reset(width, height) {
    if (this.mc === true) {
      this.mc = null
    } else if (this.mc && !this.mc.left) {
      this.mc.owned = false
      this.mc.hover = false
      this.mc = null
    }

    let needsUpdate =
      width !== this.canvas.width ||
      height !== this.canvas.height
    if (needsUpdate) {
      this.canvas.width = width
      this.canvas.height = height
      this.ctx.textBaseline = 'middle'
    } else {
      this.ctx.clearRect(0, 0, width, height)
    }
    return [width, height, needsUpdate]
  }
  cursor(cursor) {
    this.canvas.style.cursor = cursor
  }
  fill(color) {
    this.ctx.fillStyle = color
  }
  alpha(amount) {
    this.ctx.globalAlpha = amount
  }
  rect(x, y, w, h) {
    this.ctx.fillRect(x, y, w, h)
  }
  rectLineVertical(x, y1, y2, t) {
    this.ctx.fillRect(x - t / 2, y1, t, y2 - y1)
  }
  rectLineHorizontal(x1, x2, y, t) {
    this.ctx.fillRect(x1, y - t / 2, x2 - x1, t)
  }
  image(source, x, y, w, h) {
    this.ctx.drawImage(source, x, y, w, h)
  }
  circle(x, y, r) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, r, 0, 2 * Math.PI)
    this.ctx.fill()
  }
  triangle(x1, y1, x2, y2, x3, y3) {
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.lineTo(x3, y3)
    this.ctx.fill()
  }
  quad(x1, y1, x2, y2, x3, y3, x4, y4) {
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.lineTo(x3, y3)
    this.ctx.lineTo(x4, y4)
    this.ctx.fill()
  }
  createShape() {
    return new Shape(this.ctx)
  }
  font(size, name = this.oldFontName) {
    this.ctx.font = size + 'px ' + (this.oldFontName = name)
  }
  text(text, x, y) {
    this.ctx.fillText(text, x, y)
  }
}

module.exports = Canvas
