var _glowCache = {};
var _starCache = {};
var _fondoCache = null;
var _vigCache = null;

function tnow() {
  return ((typeof performance !== 'undefined') ? performance.now() : Date.now()) / 1000;
}

function elipse(ctx, cx, cy, rx, ry, color, relleno) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
  if (relleno) { ctx.fillStyle = color; ctx.fill(); }
  else { ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, ry * 0.05); ctx.stroke(); }
}

function circulo(ctx, cx, cy, r, color, relleno) {
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(0.5, r), 0, Math.PI * 2);
  if (relleno) { ctx.fillStyle = color; ctx.fill(); }
  else { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); }
}

function linea(ctx, x1, y1, x2, y2, color, ancho) {
  ctx.strokeStyle = color;
  ctx.lineWidth = ancho;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function radialGlow(color, r) {
  var key = color.join(',') + '_' + r;
  if (_glowCache[key]) return _glowCache[key];
  var c = document.createElement('canvas');
  c.width = c.height = r * 2;
  var g = c.getContext('2d');
  var grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, rgba(color, 0.6));
  grad.addColorStop(0.55, rgba(color, 0.22));
  grad.addColorStop(1, rgba(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, r * 2, r * 2);
  _glowCache[key] = c;
  return c;
}

function blitGlow(ctx, color, cx, cy, r) {
  ctx.drawImage(radialGlow(color, r), cx - r, cy - r);
}

function estrella(ctx, cx, cy, r, color) {
  var key = css(color) + '_' + r;
  if (!_starCache[key]) {
    var c = document.createElement('canvas');
    c.width = c.height = Math.ceil(r * 2 + 2);
    var g = c.getContext('2d');
    g.beginPath();
    for (var i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / 5;
      var rr = (i % 2 === 0) ? r : r * 0.44;
      var px = r + 1 + Math.cos(ang) * rr;
      var py = r + 1 + Math.sin(ang) * rr;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillStyle = css(color);
    g.fill();
    _starCache[key] = c;
  }
  ctx.drawImage(_starCache[key], cx - r - 1, cy - r - 1);
}

function proyeccionJugador(jug) {
  return CFG.proyectar(jug.x, jug.y);
}

// -------------------------------------------------------
// Raqueta
// -------------------------------------------------------

function posicionRaqueta(sx, sy, u, lado, phi) {
  var p = Math.max(0, Math.min(1, phi));
  return {
    x: sx + (Math.sin(Math.PI * p) * 34 + 16) * u * lado,
    y: sy - 40 * u - Math.sin(Math.PI * p) * 14 * u
  };
}

function dibujarRaqueta(ctx, rx, ry, u, poder) {
  var cabeza = { x: rx - 7 * u, y: ry - 7 * u };
  var cx = cabeza.x, cy = cabeza.y;
  var w = Math.max(18, 48 * u);
  var h = Math.max(26, 64 * u);

  // Mango (madera con agarre en espiral)
  ctx.fillStyle = css([122, 84, 46]);
  ctx.beginPath();
  ctx.roundRect(rx + 2 * u, ry + 18 * u, 7 * u, 22 * u, 3 * u);
  ctx.fill();
  ctx.strokeStyle = css([84, 54, 28]);
  ctx.lineWidth = Math.max(1, 1.6 * u);
  for (var i = 0; i < 4; i++) {
    var py = ry + 19 * u + i * 5 * u;
    ctx.beginPath();
    ctx.moveTo(rx + 2.5 * u, py);
    ctx.lineTo(rx + 8.5 * u, py + 2.5 * u);
    ctx.stroke();
  }
  // Guardacabo
  ctx.fillStyle = css([64, 76, 98]);
  ctx.beginPath();
  ctx.roundRect(rx + 1.5 * u, ry + 13 * u, 8 * u, 6 * u, 2 * u);
  ctx.fill();

  if (poder) {
    blitGlow(ctx, [255, 226, 120], cx, cy - 5 * u, 60 * u);
    elipse(ctx, cx, cy - 5 * u, w / 2 + 7 * u, h / 2 + 8 * u, rgba([255, 240, 160], 0.9), true);
  }

  // Marco
  elipse(ctx, cx, cy, w / 2 + 5 * u, h / 2 + 5 * u, css([96, 120, 142]), true);
  elipse(ctx, cx, cy, w / 2, h / 2, css([152, 178, 198]), true);
  // Cara interna
  elipse(ctx, cx, cy, w / 2 - 4 * u, h / 2 - 5 * u, css([214, 231, 246]), true);

  // Cuerdas
  var gx0 = cx - w / 2 + 4 * u, gx1 = cx + w / 2 - 4 * u;
  var gy0 = cy - h / 2 + 4 * u, gy1 = cy + h / 2 - 4 * u;
  ctx.strokeStyle = rgba([168, 190, 210], 0.85);
  ctx.lineWidth = Math.max(1, 1 * u);
  ctx.beginPath();
  for (var gx = gx0; gx <= gx1; gx += Math.max(3, 5 * u)) {
    ctx.moveTo(gx, gy0); ctx.lineTo(gx, gy1);
  }
  for (var gy = gy0; gy <= gy1; gy += Math.max(3, 5 * u)) {
    ctx.moveTo(gx0, gy); ctx.lineTo(gx1, gy);
  }
  ctx.stroke();

  // Brillo especular
  ctx.strokeStyle = rgba([255, 255, 255], 0.9);
  ctx.lineWidth = Math.max(1, 2.4 * u);
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + 7 * u, cy - h / 2 + 5 * u);
  ctx.lineTo(cx - w / 2 + 7 * u, cy - h / 2 + 24 * u);
  ctx.stroke();

  if (poder) {
    ctx.strokeStyle = css([255, 214, 90]);
    ctx.lineWidth = Math.max(2, 3.4 * u);
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// -------------------------------------------------------
// Personaje visto desde atrás (tu jugador) o de frente (el rival)
// -------------------------------------------------------

function dibujarJugadorVista(ctx, sx, sy, u, color, atras, aturdido, poder, swingPhi, swingLado, andando, tiempo, numero) {
  if (tiempo === undefined) tiempo = tnow();

  var pelo = [58, 42, 35];
  var peloOsc = [36, 25, 21];
  var piel = [228, 182, 144];
  var pielOsc = [198, 150, 114];
  var zapata = [244, 242, 248];
  var perfil = [14, 20, 30];

  var oscuro = tono(color, 0.60);
  var luz = tono(color, 1.32);
  var media = tono(color, 0.86);

  var paso = Math.sin(tiempo * 9.0);
  var amp = (andando ? 8.0 : 2.6) * u;
  var bob = Math.abs(paso) * (andando ? 3.5 : 1.0) * u;
  sy = sy - bob;

  // ---- Sombra en el piso (doble, suave) ----
  elipse(ctx, sx, sy + 54 * u, 46 * u, 9 * u, rgba([10, 22, 16], 0.30), true);
  elipse(ctx, sx, sy + 54 * u, 32 * u, 6 * u, rgba([18, 38, 28], 0.26), true);

  // ---- Piernas con paso animado ----
  for (var leg = 0; leg < 2; leg++) {
    var lado = leg === 0 ? -1 : 1;
    var ox = (leg === 0 ? -paso : paso) * amp;
    var lx = sx + lado * 9 * u + ox;
    ctx.fillStyle = css(media);
    ctx.beginPath();
    ctx.roundRect(lx - 7 * u, sy + 12 * u, 14 * u, 13 * u, 3 * u);
    ctx.fill();
    ctx.fillStyle = css(piel);
    ctx.fillRect(lx - 6 * u, sy + 25 * u, 12 * u, 14 * u);
    ctx.strokeStyle = css(pielOsc);
    ctx.lineWidth = Math.max(1, 2 * u);
    ctx.beginPath();
    ctx.moveTo(lx, sy + 25 * u);
    ctx.lineTo(lx, sy + 39 * u);
    ctx.stroke();
    ctx.fillStyle = css([235, 240, 245]);
    ctx.fillRect(lx - 6 * u, sy + 38 * u, 12 * u, 4 * u);
    ctx.fillStyle = css([70, 82, 100]);
    ctx.beginPath();
    ctx.roundRect(lx - 8 * u, sy + 39 * u, 20 * u, 12 * u, 3 * u);
    ctx.fill();
    ctx.fillStyle = css(zapata);
    ctx.beginPath();
    ctx.roundRect(lx - 7 * u, sy + 40 * u, 16 * u, 8 * u, 3 * u);
    ctx.fill();
    circulo(ctx, lx + lado * 4 * u, sy + 46 * u, Math.max(2, 3 * u), css(zapata), true);
    circulo(ctx, lx + lado * 4 * u, sy + 46 * u, Math.max(1, 1.5 * u), css([60, 70, 90]), true);
  }

  // ---- Short con costados ----
  ctx.fillStyle = css(perfil);
  ctx.beginPath();
  ctx.roundRect(sx - 29 * u, sy + 7 * u, 58 * u, 14 * u, 6 * u);
  ctx.fill();
  ctx.fillStyle = css(oscuro);
  ctx.beginPath();
  ctx.roundRect(sx - 27 * u, sy + 8 * u, 54 * u, 12 * u, 5 * u);
  ctx.fill();
  ctx.strokeStyle = css(luz);
  ctx.lineWidth = Math.max(1, 2 * u);
  ctx.beginPath();
  ctx.moveTo(sx - 8 * u, sy + 9 * u);
  ctx.lineTo(sx - 8 * u, sy + 18 * u);
  ctx.moveTo(sx + 8 * u, sy + 9 * u);
  ctx.lineTo(sx + 8 * u, sy + 18 * u);
  ctx.stroke();

  // ---- Torso con sombreado esferico ----
  elipse(ctx, sx, sy - 4 * u, 34 * u, 35 * u, css(perfil), true);
  elipse(ctx, sx, sy - 4 * u, 31 * u, 32 * u, css(color), true);
  elipse(ctx, sx, sy + 12 * u, 26 * u, 13 * u, css(media), true);
  elipse(ctx, sx - 25 * u, sy - 6 * u, 7 * u, 22 * u, css(oscuro), true);
  elipse(ctx, sx + 25 * u, sy - 6 * u, 7 * u, 22 * u, css(oscuro), true);
  elipse(ctx, sx - 12 * u, sy - 22 * u, 15 * u, 13 * u, css(luz), true);
  elipse(ctx, sx - 12 * u, sy - 22 * u, 11 * u, 9 * u, css(luz), true);

  // Dorsal del equipo
  if (numero) {
    ctx.font = Math.max(9, Math.round(15 * u)) + 'px ' + FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(luz, 0.85);
    ctx.fillText(String(numero), sx, sy - 20 * u);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  elipse(ctx, sx, sy - 4 * u, 31 * u, 32 * u, css(perfil), false);

  // Detalles laterales
  ctx.strokeStyle = css(luz);
  ctx.lineWidth = Math.max(1, 2 * u);
  ctx.beginPath();
  ctx.moveTo(sx - 24 * u, sy - 26 * u);
  ctx.lineTo(sx - 24 * u, sy + 20 * u);
  ctx.moveTo(sx + 24 * u, sy - 26 * u);
  ctx.lineTo(sx + 24 * u, sy + 20 * u);
  ctx.stroke();

  // Logotipo
  circulo(ctx, sx, sy - 8 * u, 7 * u, css(perfil), true);
  circulo(ctx, sx, sy - 8 * u, 5 * u, css(luz), true);
  circulo(ctx, sx, sy - 8 * u, 2 * u, css(color), true);

  // ---- Hombros y cuello ----
  for (var h = 0; h < 2; h++) {
    var hside = h === 0 ? -1 : 1;
    var hsx = sx + hside * 29 * u;
    circulo(ctx, hsx, sy - 27 * u, 12 * u, css(perfil), true);
    circulo(ctx, hsx, sy - 27 * u, 10 * u, css(color), true);
    elipse(ctx, hsx, sy - 27 * u, 10 * u, 10 * u, css(tono(color, 0.7)), false);
  }
  ctx.fillStyle = css(piel);
  ctx.fillRect(sx - 4 * u, sy - 44 * u, 8 * u, 9 * u);
  ctx.fillStyle = css(pielOsc);
  ctx.fillRect(sx - 4 * u, sy - 40 * u, 8 * u, 3 * u);

  // ---- Brazos (con codo) hacia la raqueta ----
  for (var a = 0; a < 2; a++) {
    var side = a === 0 ? -1 : 1;
    var hsxx = sx + side * 27 * u;
    var ex, ey, ex2, ey2, seg;
    var sway = Math.sin(tiempo * 9.0) * 3 * u * side;
    if (side === swingLado) {
      ex = sx + (side * 20 + swingLado * 18) * u;
      ey = sy - 38 * u - Math.sin(Math.PI * swingPhi) * 16 * u;
      ex2 = sx + side * 12 * u;
      ey2 = sy - 26 * u - Math.sin(Math.PI * swingPhi) * 6 * u;
      seg = [[hsxx, sy - 24 * u], [ex2, ey2], [ex, ey]];
    } else {
      ex = sx + side * 16 * u + sway;
      ey = sy - 16 * u;
      seg = [[hsxx + sway * 0.3, sy - 26 * u],
        [sx + side * 14 * u + sway, sy - 12 * u],
        [ex, ey]];
    }
    var pasadas = [[Math.max(4, 10 * u), perfil], [Math.max(3, 7 * u), color],
      [Math.max(2, 4 * u), tono(color, 1.2)]];
    for (var pl = 0; pl < 3; pl++) {
      ctx.strokeStyle = css(pasadas[pl][1]);
      ctx.lineWidth = pasadas[pl][0];
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(seg[0][0], seg[0][1]);
      ctx.lineTo(seg[1][0], seg[1][1]);
      ctx.lineTo(seg[2][0], seg[2][1]);
      ctx.stroke();
    }
    circulo(ctx, seg[2][0], seg[2][1], Math.max(2, 6 * u), css(perfil), true);
    circulo(ctx, seg[2][0], seg[2][1], Math.max(2, 5 * u), css(piel), true);
  }

  // ---- Cabeza ----
  circulo(ctx, sx + 1 * u, sy - 54 * u, 18 * u, css(perfil), true);
  circulo(ctx, sx, sy - 55 * u, 16 * u, css(piel), true);
  circulo(ctx, sx - 6 * u, sy - 60 * u, 6 * u, css(tono(piel, 1.15)), true);

  if (atras) {
    // Visto de espaldas: pelo, nuca y orejas
    circulo(ctx, sx, sy - 60 * u, 17 * u, css(pelo), true);
    circulo(ctx, sx, sy - 54 * u, 13 * u, css(piel), true);
    // franja del pelo
    ctx.strokeStyle = css(tono(pelo, 1.5));
    ctx.lineWidth = Math.max(2, 4 * u);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(sx, sy - 61 * u, 11 * u, 0, Math.PI);
    ctx.stroke();
    // cinta del pelo
    ctx.strokeStyle = css(luz);
    ctx.lineWidth = Math.max(1.5, 3 * u);
    ctx.beginPath();
    ctx.arc(sx, sy - 60 * u, 16 * u, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    circulo(ctx, sx, sy - 60 * u, 17 * u, css(perfil), false);
    circulo(ctx, sx - 15 * u, sy - 54 * u, 3 * u, css(piel), true);
    circulo(ctx, sx + 15 * u, sy - 54 * u, 3 * u, css(piel), true);
  } else {
    // Visto de frente: flequillo y cara
    ctx.strokeStyle = css(pelo);
    ctx.lineWidth = Math.max(4, 9 * u);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(sx, sy - 61 * u, 18 * u, Math.PI, Math.PI * 2);
    ctx.stroke();
    var fringes = [-10, 2, 9];
    for (var f = 0; f < 3; f++) {
      circulo(ctx, sx + fringes[f] * u, sy - 59 * u, Math.max(2, 4 * u), css(pelo), true);
    }
    circulo(ctx, sx - 16 * u, sy - 54 * u, 4 * u, css(piel), true);
    circulo(ctx, sx + 16 * u, sy - 54 * u, 4 * u, css(piel), true);
    if (aturdido) {
      var offs = [[-7, -1], [7, 1]];
      for (var o = 0; o < 2; o++) {
        var x0 = sx + offs[o][0] * u;
        var y0 = sy - 57 * u;
        linea(ctx, x0 - 3 * u, y0 - 3 * u, x0 + 3 * u, y0 + 3 * u, css([20, 20, 28]), Math.max(1, 2 * u));
        linea(ctx, x0 + 3 * u, y0 - 3 * u, x0 - 3 * u, y0 + 3 * u, css([20, 20, 28]), Math.max(1, 2 * u));
      }
      for (var k = 0; k < 3; k++) {
        var ang = tiempo * 4 + k * 2.1;
        circulo(ctx, sx + Math.cos(ang) * 26 * u, sy - 70 * u + Math.sin(ang) * 6 * u,
          Math.max(2, 3 * u), css([255, 235, 150]), true);
      }
    } else {
      for (var e = 0; e < 2; e++) {
        var eof = e === 0 ? -7 : 7;
        var exx = sx + eof * u;
        var eyy = sy - 56 * u;
        circulo(ctx, exx, eyy, Math.max(2, 3.2 * u), css([255, 255, 255]), true);
        circulo(ctx, exx, eyy, Math.max(1, 1.9 * u), css([26, 30, 44]), true);
        circulo(ctx, exx - 1 * u, eyy - 1 * u, Math.max(1, 0.9 * u), css([255, 255, 255]), true);
      }
      ctx.strokeStyle = css(peloOsc);
      ctx.lineWidth = Math.max(1, 2 * u);
      ctx.beginPath();
      ctx.moveTo(sx - 10 * u, sy - 62 * u);
      ctx.lineTo(sx - 3 * u, sy - 60 * u);
      ctx.moveTo(sx + 3 * u, sy - 60 * u);
      ctx.lineTo(sx + 10 * u, sy - 62 * u);
      ctx.stroke();
      ctx.strokeStyle = css(tono(piel, 0.82));
      ctx.lineWidth = Math.max(1, 1 * u);
      ctx.beginPath();
      ctx.moveTo(sx - 1 * u, sy - 51 * u);
      ctx.lineTo(sx + 1 * u, sy - 48 * u);
      ctx.stroke();
      ctx.strokeStyle = css([150, 84, 82]);
      ctx.lineWidth = Math.max(1, 2 * u);
      ctx.beginPath();
      ctx.arc(sx, sy - 40 * u, 5 * u, 0.15, Math.PI - 0.15);
      ctx.stroke();
      circulo(ctx, sx - 11 * u, sy - 50 * u, Math.max(1, 1.6 * u), css([222, 140, 128]), true);
      circulo(ctx, sx + 11 * u, sy - 50 * u, Math.max(1, 1.6 * u), css([222, 140, 128]), true);
    }
  }

  if (poder) {
    blitGlow(ctx, [255, 236, 140], sx, sy - 18 * u, 108 * u);
    elipse(ctx, sx, sy - 18 * u, 62 * u, 78 * u, rgba([255, 236, 160], 0.55), false);
    for (var sp = 0; sp < 4; sp++) {
      var sang = tiempo * 3.2 + sp * 1.57;
      circulo(ctx, sx + Math.cos(sang) * 60 * u, sy - 18 * u + Math.sin(sang) * 28 * u,
        Math.max(2, 3.4 * u), css([255, 255, 210]), true);
    }
  }
}

// -------------------------------------------------------
// Pelota
// historia: [[xPx, yPx, esPower, escala], ...] YA proyectada a pantalla.
// (Proyectar adentro es imposible: aquí no se conocen las coordenadas
//  de la cancha, solo las de pantalla.)
// -------------------------------------------------------

function dibujarPelota(ctx, bx, by, radio, color, poder, historia) {
  radio = Math.max(5, radio);

  // Estela: posiciones ya proyectadas, con el tamaño de cada punto.
  if (historia && historia.length) {
    for (var i = 0; i < historia.length; i++) {
      var h = historia[i];
      var t = (i + 1) / historia.length;
      var rr = Math.max(1.5, radio * (0.28 + 0.62 * t) * (h[3] || 1));
      ctx.fillStyle = rgba(h[2] ? CFG.COLOR_PELOTA_POWER : [255, 255, 255], 0.30 * t);
      circulo(ctx, h[0], h[1], rr, ctx.fillStyle, true);
    }
  }

  // Raya de velocidad (motion blur) siguiendo la trayectoria
  if (historia && historia.length >= 2) {
    var prev = historia[historia.length - 2];
    var ddx = bx - prev[0];
    var ddy = by - prev[1];
    var dnorm = Math.hypot(ddx, ddy);
    if (dnorm > 10 && radio > 5) {
      var ux = ddx / dnorm;
      var uy = ddy / dnorm;
      ctx.strokeStyle = css(color);
      ctx.lineCap = 'round';
      var segs = [[2.9, 3.5], [1.8, 2]];
      for (var si = 0; si < segs.length; si++) {
        ctx.lineWidth = segs[si][1];
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - ux * radio * segs[si][0], by - uy * radio * segs[si][0]);
        ctx.stroke();
      }
    }
  }

  // Sombra proyectada en el piso
  ctx.fillStyle = rgba([8, 18, 12], 0.28);
  ctx.beginPath();
  ctx.ellipse(bx, by + radio * 0.28, radio * 0.85, radio * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Resplandor si es un power shot
  if (poder) {
    blitGlow(ctx, [255, 150, 50], bx, by, radio * 4.5);
    var tp = tnow();
    for (var sk = 0; sk < 3; sk++) {
      var sang = tp * 10 + sk * (2 * Math.PI / 3);
      circulo(ctx, bx + Math.cos(sang) * radio * 1.9,
        by + Math.sin(sang) * radio * 1.9, Math.max(1.5, radio * 0.24),
        css([255, 200, 80]), true);
    }
  }

  // Cuerpo con contorno
  circulo(ctx, bx, by, radio, css([18, 24, 34]), true);
  circulo(ctx, bx, by, radio - 1, css(color), true);

  // Media luna de sombra (abajo)
  ctx.fillStyle = css(tono(color, 0.60));
  ctx.beginPath();
  for (var a1 = 185; a1 <= 375; a1 += 10) {
    var r1 = (a1 - 180) * Math.PI / 180;
    var px1 = bx + Math.cos(r1) * (radio - 1.5);
    var py1 = by + Math.sin(r1) * (radio - 1.5);
    if (a1 === 185) ctx.moveTo(px1, py1);
    else ctx.lineTo(px1, py1);
  }
  ctx.lineTo(bx, by);
  ctx.closePath();
  ctx.fill();

  // Tono interior
  ctx.fillStyle = css(tono(color, 0.78));
  ctx.beginPath();
  for (var a2 = 205; a2 <= 355; a2 += 10) {
    var r2 = (a2 - 180) * Math.PI / 180;
    var px2 = bx + Math.cos(r2) * (radio - 3);
    var py2 = by + Math.sin(r2) * (radio - 3);
    if (a2 === 205) ctx.moveTo(px2, py2);
    else ctx.lineTo(px2, py2);
  }
  ctx.lineTo(bx, by);
  ctx.closePath();
  ctx.fill();

  // Costuras de la pelota
  if (radio >= 7) {
    ctx.strokeStyle = rgba(tono(color, 0.55), 0.8);
    ctx.lineWidth = Math.max(1, radio * 0.07);
    ctx.beginPath();
    ctx.arc(bx, by, radio * 0.62, -0.9, 0.5);
    ctx.moveTo(bx + radio * 0.55, by - radio * 0.42);
    ctx.arc(bx, by, radio * 0.62, 2.24, 3.64);
    ctx.stroke();
  }

  // Brillo especular
  circulo(ctx, bx - radio * 0.38, by - radio * 0.48, Math.max(1.5, radio * 0.3),
    rgba([255, 255, 255], 0.95), true);
  circulo(ctx, bx - radio * 0.46, by - radio * 0.6, Math.max(1, radio * 0.14),
    css([255, 255, 255]), true);
}

// ============================================================
// Escenario cacheado
// ============================================================

function cuadrante(t) {
  var h = CFG.escala(t);
  var y = CFG.VISTA_BOT - t * (CFG.VISTA_BOT - CFG.VISTA_TOP);
  return { lx: CFG.VISTA_CX - h, rx: CFG.VISTA_CX + h, y: y };
}

function construirFondo() {
  var c = document.createElement('canvas');
  c.width = CFG.ANCHO;
  c.height = CFG.ALTO;
  var g = c.getContext('2d');

  var ALTO_PARED = CFG.ALTURA_PARED_TRASERA;

  // ---- Arena ----
  var arena = g.createLinearGradient(0, 0, 0, CFG.ALTO);
  arena.addColorStop(0, css(CFG.COLOR_ARENA_TOP));
  arena.addColorStop(0.45, css(CFG.COLOR_ARENA_BOT));
  arena.addColorStop(1, css(CFG.COLOR_ARENA_TOP));
  g.fillStyle = arena;
  g.fillRect(0, 0, CFG.ANCHO, CFG.ALTO);

  g.drawImage(radialGlow([176, 210, 240], 320), CFG.VISTA_CX - 700, CFG.VISTA_TOP - 320);
  g.drawImage(radialGlow([198, 226, 248], 340), CFG.VISTA_CX + 200, CFG.VISTA_TOP - 340);
  g.drawImage(radialGlow([255, 236, 205], 260), CFG.VISTA_CX - 260, CFG.VISTA_TOP - 260);

  // ---- Piso con bandas de profundidad ----
  var bandas = 18;
  for (var i = bandas; i >= 1; i--) {
    var t0 = (i - 1) / bandas;
    var t1 = i / bandas;
    var p = 1.0 - 0.5 * ((i - 0.5) / bandas);
    var color = mezclar(CFG.COLOR_CANCHA_LEJOS, CFG.COLOR_CANCHA_MEDIO, p);
    if (i <= 4) color = mezclar(color, CFG.COLOR_CANCHA, (5 - i) / 4.0);
    var f = cuadrante(t1);
    var n = cuadrante(t0);
    g.fillStyle = css(color);
    g.beginPath();
    g.moveTo(f.lx, f.y);
    g.lineTo(f.rx, f.y);
    g.lineTo(n.rx, n.y);
    g.lineTo(n.lx, n.y);
    g.closePath();
    g.fill();
  }

  var le = cuadrante(1.0);
  var ce = cuadrante(0.0);

  // Luz central sobre la zona de juego
  g.drawImage(radialGlow([255, 246, 214], 420), CFG.VISTA_CX - 420, CFG.VISTA_BOT - 280 - 420);

  // Franjas de pulido del piso
  var tpasos = [0.0, 0.12, 0.24, 0.38, 0.54, 0.72];
  for (var k = 0; k < tpasos.length; k++) {
    var ta = cuadrante(tpasos[k]);
    var tb = cuadrante(Math.min(1, tpasos[k] + 0.10));
    g.fillStyle = rgba([255, 255, 255], Math.max(0.02, 0.055 - k * 0.007));
    g.beginPath();
    g.moveTo(ta.lx, ta.y);
    g.lineTo(ta.rx, ta.y);
    g.lineTo(tb.rx, tb.y);
    g.lineTo(tb.lx, tb.y);
    g.closePath();
    g.fill();
  }

  // Oscurecimiento en las esquinas frontales (focaliza el centro)
  for (var so = -1; so <= 1; so += 2) {
    g.fillStyle = rgba([16, 48, 40], 0.26);
    g.beginPath();
    g.moveTo(CFG.VISTA_CX + so * 12, ce.y);
    g.lineTo(CFG.VISTA_CX + so * 1400, ce.y);
    g.lineTo(CFG.VISTA_CX + so * 1700, ce.y - 170);
    g.lineTo(CFG.VISTA_CX + so * 20, ce.y - 240);
    g.closePath();
    g.fill();
  }

  // ---- Marca central ----
  var mcY = CFG.VISTA_BOT - 0.5 * (CFG.VISTA_BOT - CFG.VISTA_TOP);
  circulo(g, CFG.VISTA_CX, mcY, 56, rgba([255, 255, 255], 0.16), false);
  circulo(g, CFG.VISTA_CX, mcY, 33, rgba([255, 255, 255], 0.11), false);
  g.strokeStyle = rgba([255, 255, 255], 0.13);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(CFG.VISTA_CX - 8, mcY - 14);
  g.lineTo(CFG.VISTA_CX + 3, mcY + 11);
  g.moveTo(CFG.VISTA_CX + 8, mcY - 14);
  g.lineTo(CFG.VISTA_CX - 3, mcY + 11);
  g.moveTo(CFG.VISTA_CX - 6, mcY - 6);
  g.lineTo(CFG.VISTA_CX + 6, mcY - 6);
  g.stroke();

  function lineaL(ax, ay, bx, by, color, ancho) {
    g.strokeStyle = color;
    g.lineWidth = ancho;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
    g.stroke();
  }

  // ---- Líneas de cancha ----
  lineaL(le.lx, le.y, le.rx, le.y, rgba([255, 255, 255], 0.62), 3);
  lineaL(ce.lx, ce.y, ce.rx, ce.y, rgba([255, 255, 255], 0.70), 6);
  lineaL(le.lx, le.y, ce.lx, ce.y, rgba([255, 255, 255], 0.52), 2);
  lineaL(le.rx, le.y, ce.rx, ce.y, rgba([255, 255, 255], 0.52), 2);

  // Box de saque (líneas laterales)
  var factores = [0.5, -0.5];
  for (var fa = 0; fa < 2; fa++) {
    g.strokeStyle = rgba([255, 255, 255], 0.42);
    g.lineWidth = 2;
    g.beginPath();
    for (var pp = 0; pp <= 24; pp++) {
      var tt = pp / 24;
      var yy = ce.y - tt * (ce.y - le.y);
      var hh = CFG.escala(tt);
      var xx = CFG.VISTA_CX + CFG.LAT_HALF * factores[fa] * (hh / CFG.HALF_LAT_FRONT);
      if (pp === 0) g.moveTo(xx, yy);
      else g.lineTo(xx, yy);
    }
    g.stroke();
  }
  lineaL(CFG.VISTA_CX, ce.y, CFG.VISTA_CX, le.y, rgba([255, 255, 255], 0.44), 2);

  // Líneas transversales del box de saque
  var tq = [0.25, 0.75];
  for (var q = 0; q < 2; q++) {
    var qu = cuadrante(tq[q]);
    var mxs = CFG.LAT_HALF * 0.5 * (CFG.escala(tq[q]) / CFG.HALF_LAT_FRONT);
    lineaL(CFG.VISTA_CX - mxs, qu.y, CFG.VISTA_CX + mxs, qu.y, rgba([255, 255, 255], 0.36), 2);
  }

  // ---- Pared trasera (vidrio) ----
  var gLejos = CFG.GROSOR_PARED_LEJOS;
  var paredX = le.lx - gLejos;
  var paredW = le.rx - le.lx + gLejos * 2;
  var paredY = le.y - ALTO_PARED;
  var vg = g.createLinearGradient(0, paredY, 0, le.y);
  vg.addColorStop(0, rgba([186, 213, 239], 0.72));
  vg.addColorStop(0.5, rgba([214, 232, 248], 0.6));
  vg.addColorStop(1, rgba([240, 250, 255], 0.85));
  g.fillStyle = vg;
  g.fillRect(paredX, paredY, paredW, ALTO_PARED);
  g.fillStyle = rgba([248, 253, 255], 0.7);
  g.fillRect(paredX, paredY, paredW, 2);
  g.fillStyle = rgba([116, 146, 178], 0.25);
  g.fillRect(paredX, le.y - 3, paredW, 3);
  // marco de la pared
  g.strokeStyle = rgba([150, 176, 202], 0.4);
  g.lineWidth = 1;
  g.strokeRect(paredX + 0.5, paredY + 0.5, paredW - 1, ALTO_PARED - 1);
  // logo
  g.font = '17px ' + FONT_FAMILY;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = rgba([255, 255, 255], 0.32);
  g.fillText('P A D E L   P O W E R', paredX + paredW / 2, le.y - ALTO_PARED / 2);
  g.textAlign = 'left';
  g.textBaseline = 'top';

  // ---- Paredes laterales de vidrio con postes ----
  var gCerca = CFG.GROSOR_PARED_CERCA;
  var ps = [0.16, 0.38, 0.62, 0.84];
  for (var wn = -1; wn <= 1; wn += 2) {
    var gradV = g.createLinearGradient(le.lx + wn * gLejos, le.y, ce.lx + wn * gCerca, ce.y);
    gradV.addColorStop(0, rgba([216, 231, 247], 0.34));
    gradV.addColorStop(1, rgba([146, 180, 214], 0.62));
    g.fillStyle = gradV;
    g.beginPath();
    g.moveTo(le.lx + wn * gLejos, le.y);
    g.lineTo(le.lx, le.y);
    g.lineTo(ce.lx, ce.y);
    g.lineTo(ce.lx + wn * gCerca, ce.y);
    g.closePath();
    g.fill();
    // filo superior iluminado
    lineaL(le.lx + wn * gLejos, le.y, ce.lx + wn * gCerca, ce.y, rgba([242, 251, 255], 0.8), 2);
    // postes
    for (var pi2 = 0; pi2 < ps.length; pi2++) {
      var qp = cuadrante(ps[pi2]);
      var dx = (gCerca + (gLejos - gCerca) * ps[pi2]) * 0.5;
      lineaL(qp.lx + wn * dx, qp.y - 18, qp.lx + wn * dx, qp.y + 18, rgba([222, 236, 250], 0.62), 3);
    }
  }

  // ---- Red ----
  // La malla, la banda central y los postes NO se dibujan acá: van en
  // dibujarRed(), que se llama después de los jugadores para que la red
  // tape las piernas de quien esté cerca de ella (como en la vida real).
  var red = cuadrante(0.5);

  // sombra difusa de la red sobre el piso
  g.fillStyle = rgba([30, 64, 46], 0.16);
  g.beginPath();
  g.moveTo(red.lx, red.y + 4);
  g.lineTo(red.rx, red.y + 4);
  g.lineTo(red.rx + 34, red.y + 22);
  g.lineTo(red.lx - 34, red.y + 22);
  g.closePath();
  g.fill();
  lineaL(red.lx, red.y + 6, red.rx, red.y + 6, rgba([24, 54, 38], 0.4), 6);
  lineaL(red.lx, red.y + 7, red.rx, red.y + 7, rgba([255, 244, 200], 0.15), 1);

  // ---- Haces de luz desde las esquinas superiores ----
  for (var hz = -1; hz <= 1; hz += 2) {
    var baseX = hz < 0 ? CFG.COURT_X - 50 : CFG.COURT_X + CFG.COURT_W + 50;
    g.fillStyle = rgba([255, 252, 224], 0.055);
    g.beginPath();
    g.moveTo(baseX, 0);
    g.lineTo(baseX + hz * 160, 0);
    g.lineTo(CFG.VISTA_CX + hz * 170, CFG.VISTA_BOT - 70);
    g.lineTo(CFG.VISTA_CX + hz * 50, CFG.VISTA_BOT - 160);
    g.closePath();
    g.fill();
    g.fillStyle = rgba([255, 252, 224], 0.032);
    g.beginPath();
    g.moveTo(baseX, 0);
    g.lineTo(baseX + hz * 80, 0);
    g.lineTo(CFG.VISTA_CX + hz * 92, CFG.VISTA_BOT - 104);
    g.lineTo(CFG.VISTA_CX + hz * 38, CFG.VISTA_BOT - 132);
    g.closePath();
    g.fill();
  }

  return c;
}

function dibujarFondo(ctx) {
  if (_fondoCache === null || _fondoCache === undefined) _fondoCache = construirFondo();
  ctx.drawImage(_fondoCache, 0, 0);
}

// La red se dibuja DESPUÉS de los jugadores: así el que está cerca de
// ella tiene las piernas tapadas por la malla y se lee como "del otro
// lado de la red", en vez de parecer que la está atravesando.
function dibujarRed(ctx) {
  var red = cuadrante(0.5);
  var netTop = red.y - CFG.ALTURA_RED;
  var netBot = red.y;

  // panel de malla
  ctx.fillStyle = rgba([255, 255, 255], 0.07);
  ctx.fillRect(red.lx, netTop, red.rx - red.lx, netBot - netTop);

  // cuerdas verticales
  var colsN = 72;
  for (var cc = 0; cc <= colsN; cc++) {
    var fx = red.lx + (red.rx - red.lx) * cc / colsN;
    var al = (cc % 2 === 0) ? 0.30 : 0.19;
    linea(ctx, fx, netTop, fx, netBot, rgba([255, 255, 255], al), cc % 2 === 0 ? 2 : 1);
  }
  // entretejido horizontal
  var hs = [0.2, 0.42, 0.64, 0.86];
  for (var hw = 0; hw < hs.length; hw++) {
    var yhw = netTop + (netBot - netTop) * hs[hw];
    linea(ctx, red.lx, yhw, red.rx, yhw, rgba([255, 255, 255], 0.22), 1);
  }
  // cable superior
  linea(ctx, red.lx, netTop, red.rx, netTop, rgba([255, 255, 255], 0.92), 4);
  // banda central
  linea(ctx, CFG.VISTA_CX, netTop, CFG.VISTA_CX, netBot, rgba([255, 205, 90], 0.8),
    30 * CFG.escala(0.5) / CFG.HALF_LAT_FRONT);
  linea(ctx, CFG.VISTA_CX - 14, netTop - 3, CFG.VISTA_CX + 14, netTop - 3,
    rgba([255, 255, 255], 0.82), 2);

  // postes de la red
  var posts = [red.lx, red.rx];
  for (var po = 0; po < 2; po++) {
    var px_ = posts[po];
    ctx.fillStyle = rgba([60, 80, 104], 0.25);
    ctx.beginPath();
    ctx.roundRect(px_ - 9, netTop - 20, 18, 68, 5);
    ctx.fill();
    ctx.fillStyle = css([200, 216, 234]);
    ctx.beginPath();
    ctx.roundRect(px_ - 7, netTop - 18, 14, 64, 4);
    ctx.fill();
    ctx.fillStyle = css([228, 240, 252]);
    ctx.beginPath();
    ctx.roundRect(px_ - 4, netTop - 15, 8, 58, 3);
    ctx.fill();
    ctx.fillStyle = css([246, 251, 255]);
    ctx.fillRect(px_ - 2, netTop - 13, 2, 10);
    elipse(ctx, px_, netBot + 4, 10, 5, rgba([120, 140, 166], 0.4), true);
    elipse(ctx, px_, netBot + 3, 8, 4, css([156, 172, 194]), true);
  }
}

function construirVignette() {
  if (_vigCache !== null && _vigCache !== undefined) return _vigCache;
  var c = document.createElement('canvas');
  c.width = CFG.ANCHO;
  c.height = CFG.ALTO;
  var g = c.getContext('2d');
  var pasos = 16;
  var base = Math.min(CFG.ANCHO, CFG.ALTO) * 0.16;
  for (var k = 1; k < pasos; k++) {
    var t = k / pasos;
    g.strokeStyle = rgba([30, 42, 58], 0.30 * t * t);
    g.lineWidth = 8;
    g.beginPath();
    g.roundRect(base * t, base * t, CFG.ANCHO - 2 * base * t, CFG.ALTO - 2 * base * t,
      90 * t + 14);
    g.stroke();
  }
  _vigCache = c;
  return c;
}

function dibujarVignette(ctx) {
  ctx.drawImage(construirVignette(), 0, 0);
}

// Cancha + tinte del lado del rival + destellos de la red.
function dibujarCancha(ctx, colorRival) {
  dibujarFondo(ctx);

  // La mitad derecha (donde juega el rival) toma un tinte suave de su
  // color, para se de un vistazo de quien es quien.
  if (colorRival) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CFG.VISTA_CX, CFG.VISTA_TOP);
    ctx.lineTo(CFG.ANCHO, CFG.VISTA_TOP);
    ctx.lineTo(CFG.ANCHO, CFG.VISTA_BOT);
    ctx.lineTo(CFG.VISTA_CX, CFG.VISTA_BOT);
    ctx.closePath();
    ctx.clip();
    var grad = ctx.createLinearGradient(CFG.VISTA_CX, 0, CFG.ANCHO, 0);
    grad.addColorStop(0, rgba(colorRival, 0));
    grad.addColorStop(1, rgba(colorRival, 0.10));
    ctx.fillStyle = grad;
    ctx.fillRect(CFG.VISTA_CX, CFG.VISTA_TOP, CFG.ANCHO - CFG.VISTA_CX,
      CFG.VISTA_BOT - CFG.VISTA_TOP);
    ctx.restore();
  }

  // Destellos junto a la red
  var t = tnow();
  var red = cuadrante(0.5);
  for (var k = 0; k < 5; k++) {
    var fase = (t * 1.7 + k * 1.3) % 1.0;
    if (fase < 0.12) continue;
    var fx = red.lx + (red.rx - red.lx) * ((k + 0.3) / 5.5);
    var fy = red.y - CFG.ALTURA_RED + 6 - fase * 30;
    var alpha = 0.45 * (1.0 - (fase - 0.12) / 0.88);
    ctx.fillStyle = rgba([255, 240, 170], alpha);
    circulo(ctx, fx, fy, 3.5, ctx.fillStyle, true);
  }
}