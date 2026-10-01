// ============================================================
//  Padel Power — Layout
//  Herramientas de composición. La regla del juego:
//  NUNCA se escribe en una coordenada "a ojo". Todo pasa por Flujo,
//  que lleva un cursor vertical y avanza solo con el alto real de lo
//  que acaba de dibujar. Por construcción dos elementos no pueden pisarse.
// ============================================================

// Alto de línea de una fuente. Las fuentes son del tipo "26px familia",
// así que el número inicial ES el alto de línea.
function altoFuente(fuente) {
  var n = parseFloat(fuente);
  return isNaN(n) ? 20 : n;
}

function anchoTexto(t, fuente) {
  ctx.font = fuente;
  return ctx.measureText(String(t)).width;
}

// -------------------------------------------------------
// Pintado de texto
// -------------------------------------------------------

// Pintor único. alineacion: 'left' | 'center' | 'right'.
// centradoY usa la altura real de la fuente, no un número fijo.
function pintar(t, fuente, color, x, y, alineacion, centradoY, sombra) {
  ctx.font = fuente;
  ctx.textAlign = alineacion;
  var yy = y;
  if (centradoY) ctx.textBaseline = 'middle';
  else ctx.textBaseline = 'top';
  if (sombra) {
    ctx.fillStyle = rgba([70, 88, 112], 0.55);
    ctx.fillText(String(t), x + 2, yy + 2);
  }
  ctx.fillStyle = color;
  ctx.fillText(String(t), x, yy);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}

function texto(t, fuente, color, x, y, centradoX, centradoY) {
  pintar(t, fuente, color, x, y, centradoX ? 'center' : 'left', centradoY, false);
}

function textoSombra(t, fuente, color, x, y, centradoX, centradoY) {
  pintar(t, fuente, color, x, y, centradoX ? 'center' : 'left', centradoY, true);
}

function textoDerecha(t, fuente, color, xDerecha, y) {
  pintar(t, fuente, color, xDerecha, y, 'right', false, false);
}

function textoDerechaSombra(t, fuente, color, xDerecha, y) {
  pintar(t, fuente, color, xDerecha, y, 'right', false, true);
}

// -------------------------------------------------------
// Ajuste de texto
// -------------------------------------------------------

// Devuelve una fuente más chica hasta que el texto entre en anchoMax.
// Se usa para descripciones largas, así jamás se salen del panel.
function fuenteAjustada(t, fuente, anchoMax, minimoPx) {
  var base = altoFuente(fuente);
  var piso = minimoPx || 15;
  var f = base;
  ctx.font = f + 'px ' + FONT_FAMILY;
  while (f > piso && ctx.measureText(String(t)).width > anchoMax) {
    f -= 1;
    ctx.font = f + 'px ' + FONT_FAMILY;
  }
  return f + 'px ' + FONT_FAMILY;
}

// Parte un texto en varias líneas que entran en anchoMax.
function envolver(t, fuente, anchoMax) {
  ctx.font = fuente;
  var palabras = String(t).split(/\s+/).filter(Boolean);
  if (!palabras.length) return [''];
  var lineas = [];
  var actual = '';
  for (var i = 0; i < palabras.length; i++) {
    var prueba = actual ? actual + ' ' + palabras[i] : palabras[i];
    if (actual && ctx.measureText(prueba).width > anchoMax) {
      lineas.push(actual);
      actual = palabras[i];
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

// -------------------------------------------------------
// Flujo vertical
// -------------------------------------------------------
// cursor: la coordenada Y donde empieza el próximo elemento.
//        Cada método dibuja y deja el cursor justo debajo.

// Se puede usar con o sin "new": siempre devuelve el objeto flujo.
function Flujo(x, y, ancho) {
  var f = Object.create(Flujo.prototype);
  f.x = x;
  f.ancho = ancho;
  f.cx = x + ancho / 2;
  f.xDer = x + ancho;
  f.y = y;
  return f;
}

// Mueve el cursor sin dibujar.
Flujo.prototype.salto = function (dy) {
  this.y += dy;
  return this;
};

// Fija el cursor en una Y absoluta.
Flujo.prototype.a = function (y) {
  this.y = y;
  return this;
}

// Deja un hueco fijo (para_elements que ya se dibujaron antes).
Flujo.prototype.reservar = function (alto, gap) {
  this.y += alto + (gap || 0);
  return this;
};

// Texto centrado.
Flujo.prototype.centro = function (t, fuente, color, gap, sinSombra) {
  var h = altoFuente(fuente);
  if (sinSombra) texto(t, fuente, color, this.cx, this.y, true, false);
  else textoSombra(t, fuente, color, this.cx, this.y, true, false);
  this.y += h + (gap === undefined ? 8 : gap);
  return this;
};

// Texto alineado a la izquierda.
Flujo.prototype.linea = function (t, fuente, color, gap, sinSombra) {
  var h = altoFuente(fuente);
  if (sinSombra) texto(t, fuente, color, this.x, this.y, false, false);
  else textoSombra(t, fuente, color, this.x, this.y, false, false);
  this.y += h + (gap === undefined ? 8 : gap);
  return this;
};

// Texto alineado a la derecha.
Flujo.prototype.der = function (t, fuente, color, gap, sinSombra) {
  var h = altoFuente(fuente);
  if (sinSombra) textoDerecha(t, fuente, color, this.xDer, this.y);
  else textoDerechaSombra(t, fuente, color, this.xDer, this.y);
  this.y += h + (gap === undefined ? 8 : gap);
  return this;
}

// Párrafo justificado a la izquierda, con salto de línea automático.
// Nunca se sale del ancho del flujo.
Flujo.prototype.parrafo = function (t, fuente, color, gap, alineacion) {
  var lineas = envolver(t, fuente, this.ancho);
  var h = altoFuente(fuente);
  var interlineado = h * 1.28;
  for (var i = 0; i < lineas.length; i++) {
    if (alineacion === 'centro') {
      texto(lineas[i], fuente, color, this.cx, this.y, true, false);
    } else {
      texto(lineas[i], fuente, color, this.x, this.y, false, false);
    }
    this.y += interlineado;
  }
  this.y += (gap === undefined ? 8 : gap);
  return this;
}

// Párrafo centrado que además encoge la fuente si hace falta.
Flujo.prototype.parrafoCentrado = function (t, fuente, color, gap) {
  var f = fuenteAjustada(t, fuente, this.ancho);
  return this.parrafo(t, f, color, gap, 'centro');
}

// headed: subtítulo pequeño en dorado + texto de cuerpo.
Flujo.prototype.titulo = function (t, gap) {
  return this.centro(t, F_CHICA, css(CFG.COLOR_ORO), gap === undefined ? 14 : gap);
}

// -------------------------------------------------------
// Paneles y pildoras
// -------------------------------------------------------

// Panel de vidrio: relleno claro, borde suave y sombra proyectada.
function panel(x, y, w, h, o) {
  o = o || {};
  var r = o.radio === undefined ? 18 : o.radio;
  var relleno = o.relleno || rgba([252, 253, 255], 0.94);
  var borde = o.borde || rgba([150, 172, 198], 0.55);
  var grosor = o.grosor === undefined ? 2 : o.grosor;

  ctx.save();
  if (o.sombra !== false) {
    ctx.shadowColor = rgba([36, 58, 88], 0.22);
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
  }
  ctx.fillStyle = relleno;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  if (o.brillo !== false) {
    // luz en el borde superior
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.clip();
    var g = ctx.createLinearGradient(0, y, 0, y + Math.min(h * 0.5, 60));
    g.addColorStop(0, rgba([255, 255, 255], 0.55));
    g.addColorStop(1, rgba([255, 255, 255], 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, Math.min(h * 0.5, 60));
    ctx.restore();
  }

  if (grosor > 0) {
    ctx.strokeStyle = borde;
    ctx.lineWidth = grosor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
  }
}

// Panel con borde del color del personaje.
function panelColor(x, y, w, h, color) {
  panel(x, y, w, h, {
    borde: rgba(color, 0.7),
    grosor: 2,
    radio: 18
  });
  // filete de color en el borde superior
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.clip();
  ctx.fillStyle = rgba(color, 0.85);
  ctx.fillRect(x, y, w, 6);
  ctx.restore();
}

// Línea divisoria horizontal.
function separador(x, y, w, color) {
  ctx.fillStyle = color || rgba([170, 188, 210], 0.45);
  ctx.fillRect(x, y, w, 1);
}

// Etiqueta flotante: texto centrado con una pastilla oscura detrás.
// Sirve para los nombres y los avisos que van encima de la cancha:
// se leen siempre, aunque caigan sobre un sprite.
function etiquetaGlobo(t, fuente, color, x, y) {
  var h = altoFuente(fuente);
  var w = Math.min(CFG.ANCHO - 24, anchoTexto(t, fuente) + 22);
  var x0 = Math.round(x - w / 2);
  ctx.fillStyle = rgba([22, 34, 52], 0.40);
  ctx.beginPath();
  ctx.roundRect(x0, Math.round(y - 2), Math.round(w), Math.round(h + 6), 8);
  ctx.fill();
  texto(t, fuente, color, x, y, true, false);
  return w;
}

// Icono de check verde para misiones cumplidas.
function checkIcon(x, y, tam) {
  var r = tam / 2;
  ctx.fillStyle = css(CFG.COLOR_VERDE);
  ctx.beginPath();
  ctx.roundRect(x, y, tam, tam, r * 0.45);
  ctx.fill();
  ctx.strokeStyle = rgba([235, 250, 240], 0.95);
  ctx.lineWidth = Math.max(2, tam * 0.17);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + tam * 0.22, y + tam * 0.52);
  ctx.lineTo(x + tam * 0.43, y + tam * 0.73);
  ctx.lineTo(x + tam * 0.79, y + tam * 0.27);
  ctx.stroke();
}

// Casillero vacío para misiones pendientes.
function checkVacio(x, y, tam) {
  ctx.strokeStyle = rgba([150, 166, 188], 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, tam, tam, tam * 0.22);
  ctx.stroke();
}

// Barra de progreso redondeada.
function barraProgreso(x, y, w, h, fraccion, colorFondo, colorRelleno) {
  var r = h / 2;
  ctx.fillStyle = colorFondo || rgba([226, 234, 245], 0.95);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  var relleno = Math.max(0, Math.min(1, fraccion));
  if (relleno > 0) {
    var anchoReal = Math.max(h, w * relleno);
    ctx.fillStyle = colorRelleno || css(CFG.COLOR_ORO);
    ctx.beginPath();
    ctx.roundRect(x, y, anchoReal, h, r);
    ctx.fill();
  }
  ctx.strokeStyle = rgba([160, 178, 200], 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, r);
  ctx.stroke();
}

// Trofeo del final de nivel.
function dibujarTrofeo(ctx_, cx, cy, escalaTrofeo) {
  var s = escalaTrofeo || 1;
  var w = 54 * s, h = 66 * s;
  var base = cy + h;

  // resplandor
  blitGlow(ctx, [255, 205, 60], cx, cy + h * 0.2, 120 * s);

  // asas
  ctx.strokeStyle = css([255, 214, 100]);
  ctx.lineWidth = Math.max(3, 8 * s);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx - w * 0.72, cy + h * 0.10, h * 0.22, Math.PI * 0.5, Math.PI * 1.6);
  ctx.moveTo(cx + w * 0.72, cy + h * 0.10);
  ctx.arc(cx + w * 0.72, cy + h * 0.10, h * 0.22, Math.PI * 1.5, Math.PI * 0.4);
  ctx.stroke();

  // cuenco
  ctx.fillStyle = css([42, 34, 22]);
  ctx.beginPath();
  ctx.moveTo(cx - w, cy);
  ctx.lineTo(cx + w, cy);
  ctx.lineTo(cx + w * 0.34, cy - h);
  ctx.lineTo(cx - w * 0.34, cy - h);
  ctx.closePath();
  ctx.fill();
  var g = ctx.createLinearGradient(cx - w, cy - h, cx + w, cy);
  g.addColorStop(0, css([255, 236, 160]));
  g.addColorStop(0.5, css([255, 205, 60]));
  g.addColorStop(1, css([214, 150, 34]));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.93, cy - h * 0.06);
  ctx.lineTo(cx + w * 0.93, cy - h * 0.06);
  ctx.lineTo(cx + w * 0.31, cy - h * 0.94);
  ctx.lineTo(cx - w * 0.31, cy - h * 0.94);
  ctx.closePath();
  ctx.fill();
  // brillo
  ctx.strokeStyle = rgba([255, 250, 220], 0.6);
  ctx.lineWidth = Math.max(1, 3 * s);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.86, cy - h * 0.08);
  ctx.lineTo(cx - w * 0.32, cy - h * 0.88);
  ctx.stroke();
  // Estrella en el cuenco
  estrella(ctx, cx, cy - h * 0.42, 11 * s, [255, 252, 230]);

  // cuello
  ctx.fillStyle = css([240, 196, 62]);
  ctx.fillRect(cx - w * 0.13, cy - h - 12 * s, w * 0.26, 14 * s);
  ctx.fillStyle = css([198, 140, 30]);
  ctx.fillRect(cx - w * 0.42, cy - h - 20 * s, w * 0.84, 9 * s);
  // base
  ctx.fillStyle = css([42, 34, 22]);
  ctx.beginPath();
  ctx.roundRect(cx - w * 0.62, base, w * 1.24, 14 * s, 4 * s);
  ctx.fill();
  ctx.fillStyle = css([150, 106, 32]);
  ctx.beginPath();
  ctx.roundRect(cx - w * 0.58, base + 2 * s, w * 1.16, 9 * s, 3 * s);
  ctx.fill();
  return base + 14 * s;
}