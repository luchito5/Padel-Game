// ============================================================
//  Padel Power — juego, HUD y pantallas
//  Regla de composición: nada se posiciona "a ojo". Todo el texto
//  vertical pasa por Flujo (ver layout.js), que avanza el cursor
//  con el alto real de lo que dibuja. Por eso nada se superponga.
// ============================================================

var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

// -------------------------------------------------------
// Corazones
// -------------------------------------------------------

function dibujarCorazon(x, y, size, color) {
  var radio = size * 0.32;

  function silueta() {
    ctx.beginPath();
    ctx.moveTo(x - radio, y - radio * 0.4);
    ctx.lineTo(x + radio, y - radio * 0.4);
    ctx.lineTo(x + radio * 1.5, y + radio * 0.6);
    ctx.lineTo(x, y + size * 0.7);
    ctx.lineTo(x - radio * 1.5, y + radio * 0.6);
    ctx.closePath();
  }

  silueta();
  ctx.fillStyle = css([30, 18, 28]);
  ctx.fill();

  silueta();
  ctx.fillStyle = css(color);
  ctx.fill();

  circulo(ctx, x - radio, y - radio * 0.3, radio, css(color), true);
  circulo(ctx, x + radio, y - radio * 0.3, radio, css(color), true);
  circulo(ctx, x - radio * 0.5, y - radio * 0.75, Math.max(1.5, radio / 3),
    rgba([255, 224, 228], 0.95), true);
}

function dibujarCorazonVacio(x, y, size) {
  var radio = size * 0.32;
  var col = css([162, 178, 198]);
  circulo(ctx, x - radio, y - radio * 0.3, radio, col, false);
  circulo(ctx, x + radio, y - radio * 0.3, radio, col, false);
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - radio, y - radio * 0.4);
  ctx.lineTo(x + radio, y - radio * 0.4);
  ctx.lineTo(x + radio * 1.5, y + radio * 0.6);
  ctx.lineTo(x, y + size * 0.7);
  ctx.lineTo(x - radio * 1.5, y + radio * 0.6);
  ctx.closePath();
  ctx.stroke();
}

// Fila de corazones centrada, como un solo bloque (nada se superpone).
function filaCorazones(cx, cy, cantidad, total, size) {
  var paso = size * 1.45;
  var anchoTotal = total * paso;
  for (var i = 0; i < total; i++) {
    var x = cx - anchoTotal / 2 + paso * i + paso / 2;
    if (i < cantidad) dibujarCorazon(x, cy, size, CFG.COLOR_VIDA);
    else dibujarCorazonVacio(x, cy, size);
  }
}

// -------------------------------------------------------
// Partículas
// -------------------------------------------------------

function particula(lista, x, y, vx, vy, vida, color, radioInicial) {
  lista.push({ x: x, y: y, vx: vx, vy: vy, vida: vida,
    vidaMax: vida, color: color, r: radioInicial });
}

function actualizarParticulas(lista, dt) {
  for (var i = lista.length - 1; i >= 0; i--) {
    var p = lista[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 180 * dt;
    p.vida -= dt;
    if (p.vida <= 0) lista.splice(i, 1);
  }
}

function dibujarParticulas(lista) {
  var original = ctx.globalAlpha;
  for (var i = 0; i < lista.length; i++) {
    var p = lista[i];
    var t = Math.max(0, p.vida / p.vidaMax);
    ctx.globalAlpha = Math.min(1, 0.85 * t);
    ctx.fillStyle = css(p.color);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.r * (0.5 + 0.5 * t)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = original;
}

// ============================================================
// Estado del partido
// ============================================================

function estadoPartido(char, nivel, vidas, nivelIdx) {
var jug = new Jugador(CFG.CENTRO - 160, CFG.LAT_CENTRO, false);
var rival = new Jugador(CFG.CENTRO + 160, CFG.LAT_CENTRO, true);
// En los niveles altos el rival tiene más alcance: llega a pelotas que
// el jugador no alcanza.
if (nivel.alcance_ia) {
  rival.alcance_base = rival.alcance_base * nivel.alcance_ia;
  rival.alcance = rival.alcance_base;
}
  var pelota = new Pelota();
  pelota.vel_base = nivel.ball_speed;
  pelota.reset(1.0);

  return {
    char: char,
    nivel: nivel,
    nivel_idx: nivelIdx,
    jug: jug,
    rival: rival,
    pelota: pelota,
    pts_jug: 0,
    pts_rival: 0,
    misiones: misionesDelNivel(nivel),
    cont: { rebotes: 0, poderes: 0, power_goal: 0 },
    mordida_pendiente: 0,
    efectos: { rafaga: 0, reflejo: 0, viento: 0, perfume: 0 },
    cargas: CARGAS_PODER,
    cooldown: 0,
    serve_pausa: 0,
    mensaje_gol: '',
    mensaje_t: 0,
    andando_jug: false,
    particulas: [],
    terminado: false,
    gano: false,
    estrellas: 0
  };
}

function poderActivo(partido) {
  if (partido.mordida_pendiente > 0) return true;
  var keys = Object.keys(partido.efectos);
  for (var i = 0; i < keys.length; i++) {
    if (partido.efectos[keys[i]] > 0) return true;
  }
  return false;
}

function activarPoder(partido) {
  if (partido.cooldown > 0 || partido.cargas <= 0) return false;
  partido.cargas -= 1;
  partido.cooldown = ENFRIAMIENTO_PODER;
  partido.cont.poderes += 1;
  var key = partido.char.poderKey;
  if (key === 'mordida') {
    partido.mordida_pendiente = 1;
  } else {
    partido.efectos[key] = DURACIONES[key];
  }
  return true;
}

function actualizarPoderes(partido, dt) {
  if (partido.cooldown > 0) partido.cooldown = Math.max(0, partido.cooldown - dt);
  partido.jug.aplicarViento(partido.efectos.viento > 0);
  var keys = Object.keys(partido.efectos);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (partido.efectos[k] > 0) partido.efectos[k] = Math.max(0, partido.efectos[k] - dt);
  }
}

function verificarMisiones(partido, ptsFinal) {
  for (var i = 0; i < partido.misiones.length; i++) {
    var m = partido.misiones[i];
    if (m.done) continue;
    if (m.tipo === 'ganar') {
      m.done = ptsFinal >= puntosParaGanar();
    } else if (m.tipo === 'perfecto') {
      m.done = ptsFinal >= puntosParaGanar() && partido.pts_rival === 0;
    } else if (m.tipo === 'rebotes') {
      if (partido.cont.rebotes >= m.target) m.done = true;
    } else if (m.tipo === 'poderes') {
      if (partido.cont.poderes >= m.target) m.done = true;
    } else if (m.tipo === 'power_goal') {
      if (partido.cont.power_goal >= m.target) m.done = true;
    }
  }
}

function contarEstrellas(partido) {
  var n = 0;
  for (var i = 0; i < partido.misiones.length; i++) {
    if (partido.misiones[i].done) n++;
  }
  return n;
}

function vidasActuales(partido) {
  return partido._vidas_disp || 0;
}

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

// ============================================================
// HUD  (franja 0 .. CFG.HUD_ALTURA, tres filas que no se pisan)
// ============================================================

var HUD = {
  R1: 8,     // nivel / marcador / etiqueta poder
  R2: 42,    // vidas / pips / cargas
  R3: 71,    // misiones / estado del poder
  IZQ: 24,
  DER: 1256
};

function chipMision(x, y, m) {
  var etiquetas = {
    ganar: 'GANAR', perfecto: 'PERFECTO', rebotes: 'REBOTES',
    poderes: 'PODERES', power_goal: 'POWER GOAL'
  };
  var etiqueta = etiquetas[m.tipo] || 'MISION';
  var alto = 20;
  var w = anchoTexto(etiqueta, F_MIN) + 34;

  panel(x, y, w, alto, {
    relleno: m.done ? rgba(CFG.COLOR_VERDE, 0.16) : rgba([255, 255, 255], 0.7),
    borde: m.done ? rgba(CFG.COLOR_VERDE, 0.75) : rgba([168, 186, 208], 0.6),
    grosor: 1.5,
    radio: alto / 2,
    sombra: false,
    brillo: false
  });

  if (m.done) checkIcon(x + 6, y + 3, 14);
  else checkVacio(x + 6, y + 3, 14);

  texto(etiqueta, F_MIN, m.done ? css(CFG.COLOR_VERDE) : css(CFG.COLOR_TEXTO_SUAVE),
    x + 26, y + 1, false, false);

  return x + w + 10;
}

function dibujarHud(partido) {
  var nivel = partido.nivel;
  var char = partido.char;
  var alto = CFG.HUD_ALTURA;

  // Fondo del panel con gradiente
  var panelGrad = ctx.createLinearGradient(0, 0, 0, alto);
  panelGrad.addColorStop(0, css([252, 253, 255]));
  panelGrad.addColorStop(1, css([216, 230, 245]));
  ctx.fillStyle = panelGrad;
  ctx.fillRect(0, 0, CFG.ANCHO, alto);
  ctx.fillStyle = rgba([150, 180, 214], 0.9);
  ctx.fillRect(0, alto - 3, CFG.ANCHO, 3);
  ctx.fillStyle = rgba([206, 220, 238], 0.9);
  ctx.fillRect(0, alto - 6, CFG.ANCHO, 1);

  // ---- Fila 1 ----
  textoSombra('NIVEL ' + nivel.nivel + ' / ' + NIVELES.length, F_MUY_CHICA,
    css(CFG.COLOR_TEXTO), HUD.IZQ, HUD.R1, false, false);
  textoDerechaSombra(char.poderNombre, F_MUY_CHICA, css(char.color), HUD.DER, HUD.R1);

  // Marcador central: se dibuja con fuente grande y su propia sombra.
  var marcador = pad2(partido.pts_jug) + '  :  ' + pad2(partido.pts_rival);
  textoSombra(marcador, F_HUD, css(CFG.COLOR_TEXTO), CFG.CENTRO, HUD.R1 - 4,
    true, false);

  // ---- Fila 2 ----
  filaCorazones(HUD.IZQ + 44, HUD.R2 + 12, vidasActuales(partido),
    CFG.VIDAS_INICIALES, 18);

  // Pips: jugador a la izquierda del marcador, rival a la derecha.
  var total = puntosParaGanar();
  var paso = 18;
  var pipsY = HUD.R2 + 11;
  for (var i = 0; i < total; i++) {
    var xJ = CFG.CENTRO - 46 - (total - 1 - i) * paso;
    var xR = CFG.CENTRO + 46 + i * paso;
    circulo(ctx, xJ, pipsY, 5.5, i < partido.pts_jug ? css(char.color) : rgba([176, 192, 212], 0.6), true);
    circulo(ctx, xR, pipsY, 5.5, i < partido.pts_rival ? css(nivel.color) : rgba([176, 192, 212], 0.6), true);
  }

  // Cargas de poder, pegadas al borde derecho.
  var cargaAncho = 32, cargaH = 20, cargaGap = 8;
  var cargasX0 = HUD.DER - (CARGAS_MAX * cargaAncho + (CARGAS_MAX - 1) * cargaGap);
  for (var c = 0; c < CARGAS_MAX; c++) {
    var cx = cargasX0 + c * (cargaAncho + cargaGap);
    var cy = HUD.R2 + 1;
    panel(cx, cy, cargaAncho, cargaH, {
      relleno: rgba([255, 255, 255], 0.72),
      borde: rgba([168, 186, 208], 0.65),
      grosor: 1.5, radio: 6, sombra: false, brillo: false
    });
    if (c < partido.cargas) {
      ctx.fillStyle = rgba(char.color, 0.32);
      ctx.beginPath();
      ctx.roundRect(cx + 2, cy + 2, cargaAncho - 4, cargaH - 4, 4);
      ctx.fill();
      ctx.fillStyle = css(char.color);
      ctx.beginPath();
      ctx.roundRect(cx + 4, cy + 4, cargaAncho - 8, cargaH - 8, 3);
      ctx.fill();
    }
  }

  // ---- Fila 3 ----
  var mx = HUD.IZQ;
  var limiteMisiones = cargasX0 - 20;
  for (var m2 = 0; m2 < partido.misiones.length; m2++) {
    if (mx > limiteMisiones) break;
    mx = chipMision(mx, HUD.R3, partido.misiones[m2]);
  }

  if (partido.cooldown > 0) {
    textoDerecha('RECARGANDO ' + partido.cooldown.toFixed(1) + 's', F_MUY_CHICA,
      css(CFG.COLOR_TEXTO_SUAVE), HUD.DER, HUD.R3);
  } else {
    var pulso = 0.5 + 0.5 * Math.sin(tnow() * 4);
    var colorListo = 'rgb(' + Math.round(200 + 55 * pulso) + ',' +
      Math.round(170 + 30 * pulso) + ',90)';
    textoDerecha('PODER LISTO · E', F_MUY_CHICA, colorListo, HUD.DER, HUD.R3);
  }
}

// ============================================================
// Dibujo del partido
// ============================================================

// Las etiquetas del jugador y del rival se empujan hacia los lados para
// que nunca se pisen entre sí aunque ambos estén junto a la red.
// Además se separan de la espalda del jugador que la lleva, así el
// nombre nunca cae sobre el propio sprite ni sobre el dorsal del rival.
function etiquetaLateral(sx, lado, u) {
  var sep = 34 + (u || 1) * 26;
  var x = sx + lado * sep;
  var borde = CFG.CENTRO + (lado > 0 ? 110 : -110);
  if (lado > 0) x = Math.max(x, borde);
  else x = Math.min(x, borde);
  return Math.max(120, Math.min(CFG.ANCHO - 120, x));
}

function dibujarPartido(partido, vidas) {
  partido._vidas_disp = vidas;
  dibujarCancha(ctx, partido.nivel.color);
  dibujarHud(partido);

  var char = partido.char;
  var nivel = partido.nivel;
  var pelota = partido.pelota;
  var jug = partido.jug;
  var rival = partido.rival;
  var poder = poderActivo(partido);

  // ---- Jugador (espalda) ----
  var pj = proyeccionJugador(jug);
  var u = CFG.escalaPj(pj.t);
  var phiJ = jug.enSwing() ? 1.0 - jug.swing_t / CFG.SWING_DUR : 0.0;
  dibujarJugadorVista(ctx, pj.x, pj.y, u, char.color, true, false, poder,
    phiJ, jug.swing_lado, partido.andando_jug, undefined, partido.nivel_idx + 1);
  var rj = posicionRaqueta(pj.x, pj.y, u, jug.swing_lado, phiJ);
  dibujarRaqueta(ctx, rj.x, rj.y, u, poder);

  // Etiqueta del golpe: pegada a la raqueta y por debajo del nombre.
  if (phiJ > 0.12) {
    var etiqueta = jug.swing_lado > 0 ? 'DRIVE' : 'REVES';
    etiquetaGlobo(etiqueta, F_MUY_CHICA, css(char.color),
      rj.x + (jug.swing_lado > 0 ? 48 * u : -48 * u), rj.y - 36 * u);
  }

  // ---- Rival (de frente) ----
  var pr = proyeccionJugador(rival);
  var ur = CFG.escalaPj(pr.t);
  var phiR = rival.enSwing() ? 1.0 - rival.swing_t / CFG.SWING_DUR : 0.0;
  var colorIa = nivel.color;
  var aturdido = partido.efectos.perfume > 0;
  dibujarJugadorVista(ctx, pr.x, pr.y, ur, colorIa, false, aturdido, false,
    phiR, rival.swing_lado, true, undefined, nivel.nivel);
  var rr = posicionRaqueta(pr.x, pr.y, ur, rival.swing_lado, phiR);
  dibujarRaqueta(ctx, rr.x, rr.y, ur, false);

  // ---- Nombres ----
  etiquetaGlobo(char.apodo, F_MUY_CHICA, css(char.color),
    etiquetaLateral(pj.x, -1, u), pj.y - 124 * u);
  etiquetaGlobo(nivel.rival, F_MUY_CHICA, css(colorIa),
    etiquetaLateral(pr.x, 1, ur), pr.y - 124 * ur);

  // ---- Red: va después de los jugadores, así tapa las piernas de
  // quien esté pegado a ella y nadie parece atravesarla. ----
  dibujarRed(ctx);

  // ---- Efectos activos sobre el jugador ----
  var ef = Flujo(0, pj.y + 78 * u, 400);
  ef.cx = etiquetaLateral(pj.x, -1, u);
  if (partido.efectos.rafaga > 0) {
    ef.centro('RÁFAGA ' + partido.efectos.rafaga.toFixed(1) + 's', F_MUY_CHICA,
      css(char.color), 2);
  }
  if (partido.efectos.reflejo > 0) {
    ef.centro('REFLEJO ' + partido.efectos.reflejo.toFixed(1) + 's', F_MUY_CHICA,
      css([92, 104, 236]), 2);
  }
  if (partido.efectos.viento > 0) {
    ef.centro('VIENTO ' + partido.efectos.viento.toFixed(1) + 's', F_MUY_CHICA,
      css([54, 152, 84]), 2);
  }
  if (partido.mordida_pendiente > 0) {
    ef.centro('MORDIDA LISTA', F_MUY_CHICA, css([244, 132, 36]), 2);
  }

  // ---- Rival aturdido ----
  if (aturdido) {
    textoSombra('ATURDIDO ' + partido.efectos.perfume.toFixed(1) + 's', F_MUY_CHICA,
      css(CFG.COLOR_ROJO), etiquetaLateral(pr.x, 1, ur), pr.y + 74 * ur, true, false);
  }

  // ---- Pelota ----
  var bp = CFG.proyectar(pelota.x, pelota.y);
  var poderBola = pelota.power_shot;
  var radioB = Math.max(6, pelota.radio * bp.s * 2.6 + (poderBola ? 5 : 0));

  // La estela se proyecta acá: dibujarPelota sólo conoce coordenadas
  // de pantalla, no de cancha.
  var hist = [];
  for (var hi = 0; hi < pelota.historial.length; hi++) {
    var ph = pelota.historial[hi];
    var pp = CFG.proyectar(ph[0], ph[1]);
    hist.push([pp.x, pp.y, ph[2], pp.s]);
  }

  dibujarPelota(ctx, bp.x, bp.y, radioB,
    poderBola ? CFG.COLOR_PELOTA_POWER : CFG.COLOR_PELOTA, poderBola, hist);

  if (pelota.quieta) {
    var pulsoSaca = 0.5 + 0.5 * Math.sin(tnow() * 6);
    ctx.strokeStyle = rgba([255, 255, 255], 0.28 + 0.28 * pulsoSaca);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, radioB + 12 + pulsoSaca * 6, 0, Math.PI * 2);
    ctx.stroke();
    textoSombra('SACA', F_MEDIA, css([255, 255, 255]),
      bp.x, bp.y - radioB - 30 - 6 * pulsoSaca, true, false);
  }

  // ---- Mensaje de gol (siempre en el centro real de la cancha) ----
  if (partido.mensaje_gol && partido.mensaje_t > 0) {
    var colorM = partido.mensaje_gol === 'PUNTO!' ? css(CFG.COLOR_VERDE) : css(CFG.COLOR_ROJO);
    var mp = CFG.proyectar(CFG.CENTRO, CFG.LAT_CENTRO);
    var grosor = Math.max(1, (partido.mensaje_t / 1.4) * 90);
    circulo(ctx, mp.x, mp.y - 40, grosor + 40, rgba([180, 255, 220], 0.4), false);
    circulo(ctx, mp.x, mp.y - 40, grosor + 40, rgba([255, 255, 255], 0.3), false);
    textoSombra(partido.mensaje_gol, F_GRANDE, colorM, mp.x, mp.y - 40, true, true);
  }

  dibujarParticulas(partido.particulas);
  dibujarVignette(ctx);

  // ---- Pista inferior, en su propia franja ----
  pistaInferior('A / D lateral   ·   W / S avanzar   ·   E = poder   ·   ESC = menú');
}

function pistaInferior(txt) {
  var y = CFG.PISTA_Y;
  var g = ctx.createLinearGradient(0, y, 0, CFG.ALTO);
  g.addColorStop(0, rgba([24, 40, 62], 0));
  g.addColorStop(1, rgba([24, 40, 62], 0.22));
  ctx.fillStyle = g;
  ctx.fillRect(0, y, CFG.ANCHO, CFG.PISTA_ALTURA);
  texto(txt, F_MUY_CHICA, rgba([236, 244, 255], 0.9), CFG.CENTRO, y + 14, true, false);
}

// ============================================================
// Lógica del partido
// ============================================================

function pasoPartido(partido, dt, keys) {
  var nivel = partido.nivel;
  var pelota = partido.pelota;
  var jug = partido.jug;
  var rival = partido.rival;

  var velJugador = CFG.VEL_JUGADOR;
  if (partido.efectos.rafaga > 0) velJugador = CFG.VEL_JUGADOR_RAFAGA;

  // W / flecha arriba = avanzar hacia la red (subir en profundidad).
  var dx = 0, dy = 0;
  if (keys.has('ArrowUp') || keys.has('KeyW')) dx += 1;
  if (keys.has('ArrowDown') || keys.has('KeyS')) dx -= 1;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) dy -= 1;
  if (keys.has('ArrowRight') || keys.has('KeyD')) dy += 1;
  var moviendo = (dx !== 0 || dy !== 0);
  partido.andando_jug = moviendo;
  if (moviendo) jug.mover(dx * velJugador, dy * velJugador, dt);

  actualizarParticulas(partido.particulas, dt);

  // Polvareda de los pies.
  if (moviendo && Math.random() < 0.8) {
    var pjProj = proyeccionJugador(jug);
    particula(partido.particulas,
      pjProj.x + (Math.random() * 2 - 1) * 24 * CFG.ESCALA_ART,
      pjProj.y + 52 * CFG.ESCALA_ART + (Math.random() * 2 - 1) * 6,
      (Math.random() * 2 - 1) * 34,
      -40 - Math.random() * 30,
      0.30 + Math.random() * 0.30,
      [206, 206, 196], CFG.ESCALA_ART * 3.5);
  }
  if (Math.random() < 0.45) {
    var prProj = proyeccionJugador(rival);
    var ue = CFG.escalaPj(prProj.t);
    particula(partido.particulas,
      prProj.x + (Math.random() * 2 - 1) * 20 * ue,
      prProj.y + 50 * ue,
      (Math.random() * 2 - 1) * 24,
      -30 - Math.random() * 22,
      0.25 + Math.random() * 0.25,
      [180, 184, 180], 3.0 * ue);
  }

  moverJugadorIa(rival, pelota, dt, nivel.ai_speed,
    partido.efectos.perfume > 0,
    nivel.factorErrores === undefined ? 0.15 : nivel.factorErrores,
    nivel.ia_reaccion === undefined ? CFG.IA_REACCION : nivel.ia_reaccion);

  actualizarPoderes(partido, dt);
  jug.actualizarTiempos(dt);
  rival.actualizarTiempos(dt);

  var mod = partido.efectos.reflejo > 0 ? REFLEJO_MULT : 1.0;
  var rebotes = pelota.update(dt, mod);
  if (rebotes) partido.cont.rebotes += rebotes;

  if (partido.mensaje_t > 0) partido.mensaje_t -= dt;

  if (partido.serve_pausa > 0) {
    partido.serve_pausa -= dt;
    return;
  }

  if (!pelota.quieta) {
    var pares = [[jug, -1, 1], [rival, 1, -1]];
    for (var i = 0; i < 2; i++) {
      var j = pares[i][0];
      var dirHacia = pares[i][1];
      var dirSalida = pares[i][2];
      if (j.golpe_t > 0) continue;
      var dist = Math.hypot(pelota.x - j.x, pelota.y - j.y);
      var inReach = dist <= j.radio + j.alcance + pelota.radio;
      var vieneHacia = (pelota.vx * dirHacia) > 0;
      // Regla del padel: hay quePegarle antes de que la pelota cruce la red.
      // Si no, los dos se quedan pegados a la red y el tanto nunca termina.
      var enMiLado = dirHacia < 0 ? pelota.x < CFG.CENTRO : pelota.x > CFG.CENTRO;
      if (inReach && vieneHacia && enMiLado) {
        var lado = pelota.y >= j.y ? 1 : -1;
        j.iniciarGolpe(lado);
        var rel = (pelota.y - j.y) / Math.max(1, j.alcance);
        // En los niveles altos el rival no devuelve la pelota donde cae:
        // la manda al lado de la cancha más alejado del jugador.
        if (j === rival && nivel.ia_desvio) {
          var lejos = jug.y < CFG.LAT_CENTRO ? 1 : -1;
          rel = lejos * nivel.ia_desvio;
        }
        var esPower = (j === jug) && partido.mordida_pendiente > 0;
        if (esPower) partido.mordida_pendiente = 0;
        pelota.golpear(dirSalida, rel, esPower);
        // En los niveles altos el rival devuelve más fuerte: el jugador
        // tiene menos tiempo para reaccionar.
        if (j === rival && nivel.ia_potencia) pelota.vel += nivel.ia_potencia;
      }
    }

    var gol = pelota.gol();
    if (gol) {
      var gx = pelota.x, gy = pelota.y;
      if (gol === 'jugador') {
        partido.pts_jug += 1;
        if (poderActivo(partido)) partido.cont.power_goal += 1;
        partido.mensaje_gol = 'PUNTO!';
        pelota.reset(-1.0);              // quien ganó saca
      } else {
        partido.pts_rival += 1;
        partido.mensaje_gol = 'PUNTO DEL RIVAL';
        pelota.reset(1.0);
      }
      partido.mensaje_t = 1.4;
      partido.serve_pausa = 0.9;
      var proyGol = CFG.proyectar(gx, gy);
      var coloresConfeti = [[255, 205, 60], [80, 214, 122], [240, 120, 120],
        [120, 160, 255], [255, 255, 255]];
      for (var cf = 0; cf < 22; cf++) {
        particula(partido.particulas, proyGol.x, proyGol.y,
          Math.random() * 340 - 170,
          -280 - Math.random() * 240,
          0.40 + Math.random() * 0.50,
          coloresConfeti[Math.floor(Math.random() * coloresConfeti.length)],
          3.0 + Math.random() * 2.5);
      }
    }
  }

  if (partido.mensaje_t > 0) partido.mensaje_t -= dt;

  verificarMisiones(partido, partido.pts_jug);

  var total = puntosParaGanar();
  if (partido.pts_jug >= total) {
    partido.terminado = true;
    partido.gano = true;
    verificarMisiones(partido, partido.pts_jug);
    partido.estrellas = contarEstrellas(partido);
  } else if (partido.pts_rival >= total) {
    partido.terminado = true;
    partido.gano = false;
  }
}

// ============================================================
// Fondos de pantalla
// ============================================================

function fondoPantalla(tinte) {
  var g = ctx.createLinearGradient(0, 0, 0, CFG.ALTO);
  g.addColorStop(0, css(CFG.COLOR_ARENA_TOP));
  g.addColorStop(0.5, css(CFG.COLOR_ARENA_BOT));
  g.addColorStop(1, css(CFG.COLOR_ARENA_TOP));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.ANCHO, CFG.ALTO);

  blitGlow(ctx, [176, 210, 240], CFG.VISTA_CX - 320, 140, 420);
  blitGlow(ctx, [198, 226, 248], CFG.VISTA_CX + 380, 200, 460);
  if (tinte) blitGlow(ctx, tinte, CFG.VISTA_CX, CFG.ALTO - 180, 520);

  // Motas de luz
  var t = tnow();
  for (var i = 0; i < 110; i++) {
    var px = (i * 337.7) % CFG.ANCHO;
    var py = (i * 211.3) % (CFG.ALTO - 120) + 40;
    var a = 0.14 + 0.26 * (0.5 + 0.5 * Math.sin(t * 1.5 + i));
    ctx.fillStyle = rgba([255, 255, 255], a);
    ctx.beginPath();
    ctx.arc(px, py, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Botón de menú con brillo cuando está seleccionado.
function boton(cx, y, w, h, etiqueta, sel, acento) {
  var x = cx - w / 2;
  if (sel) {
    blitGlow(ctx, CFG.COLOR_ORO, cx, y + h / 2, h * 1.15);
    // indicador
    var indica = 0.5 + 0.5 * Math.sin(tnow() * 4);
    circulo(ctx, x + 30, y + h / 2, 8 + indica, rgba(CFG.COLOR_ORO, 0.9), true);
    circulo(ctx, x + 30, y + h / 2, 4, css([255, 252, 240]), true);
  }
  panel(x, y, w, h, {
    relleno: sel ? rgba([255, 250, 234], 0.97) : rgba([252, 253, 255], 0.9),
    borde: sel ? rgba(CFG.COLOR_ORO, 0.9) : rgba([176, 194, 216], 0.7),
    grosor: sel ? 3 : 2,
    radio: 20
  });
  textoSombra(etiqueta, F_MEDIA, sel ? acento : css(CFG.COLOR_TEXTO),
    cx, y + h / 2, true, true);
  return y + h;
}

// -------------------------------------------------------
// MENÚ
// -------------------------------------------------------

var INTEGRANTES = [
  'Aixa Silva', 'Milagros Carranza', 'Luciano Odasso',
  'Nicolas Fortunato', 'Roque Temoche'
];

function pantallaMenu(opcion) {
  fondoPantalla([254, 209, 80]);

  var cx = CFG.CENTRO;

  // Título
  blitGlow(ctx, [255, 214, 96], cx, 150, 300);
  textoSombra('PADEL POWER', F_TITULO, css(CFG.COLOR_ORO), cx, 104, true, false);

  var f = Flujo(CFG.UI_MARGEN, 206, CFG.UI_ANCHO);
  f.centro('Niveles · Misiones · Poderes', F_CHICA, css(CFG.COLOR_TEXTO_SUAVE), 0);
  separador(cx - 160, 248, 320, rgba([170, 188, 210], 0.6));

  // Los dos personajes que van a pelear, a los lados de los botones.
  var prevU = 0.9;
  var prevY = 452;
  dibujarJugadorVista(ctx, 196, prevY, prevU, PERSONAJES[0].color, true, false,
    false, 0, 1, true, 1.2);
  dibujarRaqueta(ctx, 196 + 16 * prevU, prevY - 40 * prevU, prevU, false);
  dibujarJugadorVista(ctx, 1084, prevY, prevU, NIVELES[NIVELES.length - 1].color,
    false, false, false, 0, -1, true, 1.2);
  dibujarRaqueta(ctx, 1084 - 16 * prevU, prevY - 40 * prevU, prevU, false);
  textoSombra(PERSONAJES[0].apodo, F_MUY_CHICA, css(PERSONAJES[0].color),
    196, prevY - 124 * prevU, true, false);
  textoSombra('LA LEYENDA', F_MUY_CHICA, css(NIVELES[NIVELES.length - 1].color),
    1084, prevY - 124 * prevU, true, false);

  // Botones
  var by = 306;
  by = boton(cx, by, 440, 70, 'NUEVO JUEGO', opcion === 0, css(CFG.COLOR_ORO)) + 22;
  by = boton(cx, by, 440, 70, 'SALIR', opcion === 1, css(CFG.COLOR_ROJO));

  // Pie
  var p = Flujo(CFG.UI_MARGEN, 596, CFG.UI_ANCHO);
  p.centro('Usa las flechas para elegir y ENTER para confirmar', F_MUY_CHICA,
    css(CFG.COLOR_TEXTO_SUAVE), 34);
  separador(cx - 200, 640, 400, rgba([170, 188, 210], 0.5));
  p.centro('Integrantes: ' + INTEGRANTES.join(' · '), F_MIN,
    css(CFG.COLOR_TEXTO_SUAVE), 8);
  p.centro('HTML5 + Canvas · sin instalación · 1280x800', F_MIN,
    rgba(CFG.COLOR_TEXTO_SUAVE, 0.75), 0);
}

// -------------------------------------------------------
// SELECCIÓN DE PERSONAJE
// -------------------------------------------------------

function pantallaSeleccion(idx) {
  fondoPantalla([188, 212, 236]);

  var cx = CFG.CENTRO;
  var f = Flujo(CFG.UI_MARGEN, 40, CFG.UI_ANCHO);
  f.centro('ELEGÍ TU JUGADOR', F_GRANDE, css(CFG.COLOR_TEXTO), 6);
  f.centro('← / → para cambiar   ·   ENTER para elegir', F_MUY_CHICA,
    css(CFG.COLOR_TEXTO_SUAVE), 0);

  // ---- Tarjetas ----
  var n = PERSONAJES.length;
  var anchoC = 208, gap = 20, altoC = 310;
  var x0 = (CFG.ANCHO - (n * anchoC + (n - 1) * gap)) / 2;
  var yC = 160;

  for (var i = 0; i < n; i++) {
    var p = PERSONAJES[i];
    var sel = i === idx;
    var x = x0 + i * (anchoC + gap);

    if (sel) blitGlow(ctx, p.color, x + anchoC / 2, yC + 150, 190);

    panel(x, yC, anchoC, altoC, {
      relleno: sel ? rgba([255, 253, 250], 0.98) : rgba([252, 253, 255], 0.9),
      borde: sel ? rgba(CFG.COLOR_ORO, 0.9) : rgba([186, 202, 222], 0.7),
      grosor: sel ? 3 : 2,
      radio: 20
    });

    // Cinta superior de color
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, yC, anchoC, altoC, 20);
    ctx.clip();
    ctx.fillStyle = rgba(p.color, 0.9);
    ctx.fillRect(x, yC, anchoC, 7);
    ctx.fillStyle = rgba(p.color, 0.16);
    ctx.fillRect(x, yC + 7, anchoC, 34);
    ctx.restore();

    // Retrato
    var u = 0.85;
    var sy = yC + 196;
    dibujarJugadorVista(ctx, x + anchoC / 2, sy, u, p.color, true, false,
      false, 0, 1, sel, i * 0.7);

    // texts de la tarjeta (flujo propio, anclado abajo)
    var ct = Flujo(x + 16, yC + 236, anchoC - 32);
    ct.centro(p.apodo, F_CHICA, css(p.color), 2);
    ct.centro(p.nombre, F_MIN, css(CFG.COLOR_TEXTO_SUAVE), 0);

    if (sel) {
      textoSombra('★ ELEGIDO', F_MIN, css(CFG.COLOR_ORO),
        x + anchoC / 2, yC + 30, true, false);
    }
  }

  // ---- Panel de detalle ----
  var pres = PERSONAJES[idx];
  var py = 490, ph = 236;
  panelColor(CFG.UI_MARGEN, py, CFG.UI_ANCHO, ph, pres.color);

  var d = Flujo(CFG.UI_MARGEN + 40, py + 20, CFG.UI_ANCHO - 80);
  d.centro(pres.nombre + '  ·  ' + pres.apodo, F_MEDIA, css(pres.color), 12);

  d.centro('PODER: ' + pres.poderNombre, F_CHICA, css(CFG.COLOR_ORO), 8);
  d.parrafoCentrado(pres.poderDesc, F_CHICA, css(CFG.COLOR_TEXTO), 18);

  // Pips de carga de poder
  var pipAncho = 34, pipH = 20, pipGap = 10;
  var pipsN = CARGAS_MAX;
  var pipsX0 = cx - (pipsN * pipAncho + (pipsN - 1) * pipGap) / 2;
  for (var c = 0; c < pipsN; c++) {
    var px = pipsX0 + c * (pipAncho + pipGap);
    var lleno = c < CARGAS_PODER;
    panel(px, d.y, pipAncho, pipH, {
      relleno: rgba([255, 255, 255], 0.8),
      borde: rgba(lleno ? pres.color : [176, 192, 212], 0.6),
      grosor: 1.5, radio: 6, sombra: false, brillo: false
    });
    ctx.fillStyle = lleno ? css(pres.color) : rgba([214, 224, 236], 0.9);
    ctx.beginPath();
    ctx.roundRect(px + (lleno ? 5 : 4), d.y + (lleno ? 5 : 4),
      pipAncho - (lleno ? 10 : 8), pipH - (lleno ? 10 : 8), 3);
    ctx.fill();
  }
  d.salto(pipH + 12);

  d.centro('Tenés ' + CARGAS_PODER + ' cargas al empezar y recuperás +1 por nivel superado (máximo ' +
    CARGAS_MAX + ')', F_MIN, css(CFG.COLOR_TEXTO_SUAVE), 0);
}

// -------------------------------------------------------
// INTRO DEL NIVEL
// -------------------------------------------------------

function pantallaIntro(nivel, vidas, char) {
  fondoPantalla([202, 226, 208]);

  var cx = CFG.CENTRO;
  var f = Flujo(CFG.UI_MARGEN, 36, CFG.UI_ANCHO);
  f.centro('NIVEL ' + nivel.nivel + ' DE ' + NIVELES.length, F_MEDIA,
    css(CFG.COLOR_TEXTO), 6);
  f.centro(nivel.rival + ' — ' + nivel.titulo, F_GRANDE, css(nivel.color), 0);

  // ---- Panel izquierdo: el enfrentamiento ----
  var pLx = CFG.UI_MARGEN, pLy = 180, pLw = 560, pLh = 360;
  panel(CFG.UI_MARGEN, pLy, pLw, pLh, { borde: rgba([176, 194, 216], 0.6) });
  textoSombra('EL ENCUENTRO', F_CHICA, css(CFG.COLOR_ORO),
    pLx + pLw / 2, pLy + 18, true, false);

  var vs = [
    { t: 'VOS', color: char.color, atras: true },
    { t: nivel.rival, color: nivel.color, atras: false }
  ];
  for (var i = 0; i < 2; i++) {
    var cw = 230;
    var cxx = pLx + 20 + i * (cw + 60);
    var cyy = pLy + 60;
    var ch = pLh - 80;
    if (vs[i].atras) blitGlow(ctx, vs[i].color, cxx + cw / 2, cyy + ch - 60, 150);
    panel(cxx, cyy, cw, ch, {
      relleno: rgba([252, 253, 255], 0.92),
      borde: rgba(vs[i].color, 0.6), grosor: 2, radio: 16
    });
    textoSombra(vs[i].t, F_CHICA, css(vs[i].color), cxx + cw / 2, cyy + 12, true, false);

    var u = 0.8;
    var sy = cyy + ch - 96;
    dibujarJugadorVista(ctx, cxx + cw / 2, sy, u, vs[i].color, vs[i].atras, false,
      false, 0, 1, true, i * 0.9);

    var nf = Flujo(cxx + 12, cyy + ch - 52, cw - 24);
    nf.centro(i === 0 ? char.apodo : nivel.titulo, F_MIN, css(vs[i].color), 0);
  }
  textoSombra('VS', F_MEDIA, css(CFG.COLOR_ORO),
    pLx + 20 + 230 + 30, pLy + pLh / 2, true, true);

  // ---- Panel derecho: misiones ----
  var pRx = 660, pRw = 1220 - 660;
  panel(pRx, pLy, pRw, pLh, { borde: rgba([176, 194, 216], 0.6) });
  textoSombra('MISIONES DEL NIVEL', F_CHICA, css(CFG.COLOR_ORO),
    pRx + pRw / 2, pLy + 18, true, false);
  separador(pRx + 30, pLy + 50, pRw - 60, rgba([170, 188, 210], 0.45));

  var mf = Flujo(pRx + 34, pLy + 66, pRw - 68);
  var misiones = misionesDelNivel(nivel);
  for (var mi = 0; mi < misiones.length; mi++) {
    circulo(ctx, mf.x + 8, mf.y + 9, 5, css(CFG.COLOR_ORO), true);
    var textoM = misiones[mi].desc;
    var fm = mf;
    fm.x = mf.x + 26;
    fm.cx = fm.x + (fm.ancho - 26) / 2;
    fm.parrafo(textoM, F_MUY_CHICA, css(CFG.COLOR_TEXTO), 10, 'centro');
    mf.y = fm.y;
  }
  mf.salto(8);
  separador(pRx + 30, mf.y, pRw - 60, rgba([170, 188, 210], 0.45));
  mf.salto(20);
  mf.centro('Primero en llegar a ' + puntosParaGanar() + ' puntos gana el nivel',
    F_MIN, css(CFG.COLOR_TEXTO_SUAVE), 0);

  // ---- Barra inferior: vidas y poder ----
  var b = Flujo(CFG.UI_MARGEN + 40, 566, CFG.UI_ANCHO - 80);
  b.centro('TUS VIDAS', F_MIN, css(CFG.COLOR_TEXTO_SUAVE), 10);
  filaCorazones(cx, b.y + 16, vidas, CFG.VIDAS_INICIALES, 22);
  b.salto(46);

  separador(cx - 220, b.y, 440, rgba([170, 188, 210], 0.5));
  b.salto(22);
  b.centro('TU PODER: ' + char.poderNombre, F_CHICA, css(char.color), 6);
  b.parrafoCentrado(char.poderDesc, F_MUY_CHICA, css(CFG.COLOR_TEXTO), 0);

  // ---- Pie ----
  textoSombra('ENTER para jugar   ·   ESC para el menú', F_MUY_CHICA,
    css(CFG.COLOR_TEXTO), cx, 720, true, false);
}

// -------------------------------------------------------
// FIN DE NIVEL
// -------------------------------------------------------

function pantallaFinNivel(partido, vidas, esVictoriaFinal) {
  var cx = CFG.CENTRO;
  var colorFondo = partido.gano ? [202, 232, 212] : [244, 206, 202];
  fondoPantalla(partido.gano ? [150, 216, 172] : [226, 128, 112]);

  if (partido.gano) pantallaVictoria(partido, esVictoriaFinal);
  else pantallaDerrota(partido, vidas);
}

function pantallaVictoria(partido, esVictoriaFinal) {
  var cx = CFG.CENTRO;
  var f = Flujo(CFG.UI_MARGEN, 44, CFG.UI_ANCHO);
  f.centro('¡NIVEL SUPERADO!', F_GRANDE, css(CFG.COLOR_VERDE), 6);
  f.centro('Venciste a ' + partido.nivel.rival + ' (' + partido.nivel.titulo + ')',
    F_CHICA, css(CFG.COLOR_TEXTO), 6);
  f.centro('Resultado ' + partido.pts_jug + ' — ' + partido.pts_rival, F_MEDIA,
    css(CFG.COLOR_TEXTO), 0);

  // ---- Trofeo y estrellas ----
  var lx = 60, ly = 224, lw = 380, lh = 300;
  panel(lx, ly, lw, lh, { borde: rgba([176, 194, 216], 0.6) });
  var t = tnow();

  var trofeoBase = dibujarTrofeo(ctx, lx + lw / 2, 296, 1.05);

  var estrellasY = trofeoBase + 62;
  textoSombra('ESTRELLAS DEL NIVEL', F_MIN, css(CFG.COLOR_TEXTO_SUAVE),
    lx + lw / 2, ly + 18, true, false);
  for (var i = 0; i < 3; i++) {
    var ex = lx + lw / 2 + (i - 1) * 84;
    if (i < partido.estrellas) {
      blitGlow(ctx, [255, 205, 60], ex, estrellasY, 54);
      estrella(ctx, ex, estrellasY, 26, [255, 205, 60]);
    } else {
      estrella(ctx, ex, estrellasY, 26, [168, 180, 196]);
    }
  }

  // ---- Misiones ----
  var rx = 470, rw = 1220 - rx;
  panel(rx, ly, rw, lh, { borde: rgba([176, 194, 216], 0.6) });
  textoSombra('MISIONES', F_CHICA, css(CFG.COLOR_ORO), rx + rw / 2, ly + 18, true, false);
  separador(rx + 34, ly + 52, rw - 68, rgba([170, 188, 210], 0.45));

  var m = Flujo(rx + 40, ly + 68, rw - 80);
  for (var mi = 0; mi < partido.misiones.length; mi++) {
    var mis = partido.misiones[mi];
    if (mis.done) checkIcon(m.x, m.y + 2, 20);
    else checkVacio(m.x, m.y + 2, 20);
    var fila = m;
    fila.x = m.x + 32;
    fila.cx = fila.x + (fila.ancho - 32) / 2;
    fila.parrafo(mis.desc, F_MUY_CHICA,
      mis.done ? css(CFG.COLOR_VERDE) : css(CFG.COLOR_TEXTO_SUAVE), 16, 'centro');
    m.y = fila.y;
  }

  // ---- Cierre ----
  var p = Flujo(CFG.UI_MARGEN, 560, CFG.UI_ANCHO);
  if (esVictoriaFinal) {
    p.centro('¡TODOS LOS NIVELES SUPERADOS!', F_GRANDE, css(CFG.COLOR_ORO), 12);
    p.centro('ENTER para ver el ranking final', F_CHICA, css(CFG.COLOR_TEXTO), 0);
  } else {
    p.centro('ENTER para el siguiente nivel', F_MEDIA, css(CFG.COLOR_TEXTO), 10);
    p.centro('Carga de poder recuperada: +1', F_MUY_CHICA, css(CFG.COLOR_ORO), 0);
  }

  separador(cx - 200, 700, 400, rgba([170, 188, 210], 0.5));
  textoSombra('ESC para volver al menú', F_MIN, css(CFG.COLOR_TEXTO_SUAVE), cx, 716, true, false);
}

function pantallaDerrota(partido, vidas) {
  var cx = CFG.CENTRO;
  var f = Flujo(CFG.UI_MARGEN, 60, CFG.UI_ANCHO);
  f.centro('PERDISTE EL NIVEL', F_GRANDE, css(CFG.COLOR_ROJO), 10);
  f.centro('Resultado ' + partido.pts_jug + ' — ' + partido.pts_rival, F_MEDIA,
    css(CFG.COLOR_TEXTO), 0);

  // Marca de derrota
  circulo(ctx, cx, 290, 58, rgba(CFG.COLOR_ROJO, 0.12), true);
  circulo(ctx, cx, 290, 46, css([255, 214, 100]), false);
  linea(ctx, cx - 20, 268, cx + 20, 312, css([255, 214, 100]), 6);
  linea(ctx, cx + 20, 268, cx - 20, 312, css([255, 214, 100]), 6);

  var p = Flujo(CFG.UI_MARGEN, 380, CFG.UI_ANCHO);
  if (vidas > 0) {
    p.centro('Te quedan ' + vidas + (vidas === 1 ? ' vida' : ' vidas'), F_MEDIA,
      css(CFG.COLOR_VIDA), 14);
    filaCorazones(cx, p.y + 22, vidas, CFG.VIDAS_INICIALES, 24);
    p.salto(60);

    separador(cx - 200, p.y, 400, rgba([170, 188, 210], 0.5));
    p.salto(24);
    p.centro('TRUCO', F_MIN, css(CFG.COLOR_ORO), 8);
    p.centro('Mirá las misiones del HUD y usá tu poder en el momento justo:',
      F_CHICA, css(CFG.COLOR_TEXTO), 4);
    p.centro('golpear de drive o de reves depende de dónde esté la pelota.',
      F_CHICA, css(CFG.COLOR_TEXTO), 18);
    p.centro('ENTER para reintentar el nivel', F_MEDIA, css(CFG.COLOR_TEXTO), 0);
  } else {
    p.centro('TE QUEDASTE SIN VIDAS', F_GRANDE, css(CFG.COLOR_ROJO), 12);
    p.centro('Mejor suerte la próxima vez', F_CHICA, css(CFG.COLOR_TEXTO_SUAVE), 24);
    p.centro('ENTER para ver el ranking final', F_MEDIA, css(CFG.COLOR_TEXTO), 0);
  }

  textoSombra('Podés cambiar de personaje en el menú  ·  ESC para volver',
    F_MIN, css(CFG.COLOR_TEXTO_SUAVE), cx, 720, true, false);
}

// -------------------------------------------------------
// RANKING FINAL
// -------------------------------------------------------

function pantallaRanking(estrellas, vidas, victoria) {
  fondoPantalla(victoria ? [214, 186, 110] : [219, 152, 142]);

  var cx = CFG.CENTRO;
  var f = Flujo(CFG.UI_MARGEN, 56, CFG.UI_ANCHO);
  f.centro(victoria ? '¡CAMPEÓN!' : 'GAME OVER', F_TITULO,
    victoria ? css(CFG.COLOR_ORO) : css(CFG.COLOR_ROJO), 10);
  f.centro(victoria
    ? 'Completaste los ' + NIVELES.length + ' niveles'
    : 'Vidas agotadas — mejor suerte la próxima vez',
    F_MEDIA, css(CFG.COLOR_TEXTO), 0);

  var total = 3 * NIVELES.length;

  // ---- Panel de estrellas ----
  var px = 290, py = 214, pw = 700, ph = 264;
  panel(px, py, pw, ph, { borde: rgba([186, 202, 222], 0.75), grosor: 2, radio: 22 });
  textoSombra('ESTRELLAS TOTALES', F_MEDIA, css(CFG.COLOR_ORO), cx, py + 22, true, false);

  barraProgreso(px + 44, py + 74, pw - 88, 26, estrellas / Math.max(1, total),
    rgba([226, 234, 245], 0.95), css(CFG.COLOR_ORO));
  textoSombra(Math.round((estrellas / Math.max(1, total)) * 100) + '%', F_CHICA,
    css(CFG.COLOR_TEXTO), cx, py + 76, true, false);

  // Fila de las 15 estrellas (las que faltan, apagadas).
  separador(px + 44, py + 126, pw - 88, rgba([170, 188, 210], 0.4));
  var nEst = total;
  var pasoE = (pw - 88) / nEst;
  var radioE = Math.min(20, pasoE * 0.42);
  for (var i = 0; i < nEst; i++) {
    var ex = px + 44 + pasoE * i + pasoE / 2;
    if (i < estrellas) {
      blitGlow(ctx, [255, 205, 60], ex, py + 168, 40);
      estrella(ctx, ex, py + 168, radioE, [255, 205, 60]);
    } else {
      estrella(ctx, ex, py + 168, radioE, [186, 198, 214]);
    }
  }

  textoSombra(estrellas + ' / ' + total, F_GRANDE, css(CFG.COLOR_ORO),
    cx, py + 202, true, false);

  // ---- Rango ----
  var titulo, colorRango;
  if (estrellas === total) {
    titulo = 'LEYENDA DEL PADEL'; colorRango = css(CFG.COLOR_ORO);
  } else if (estrellas >= Math.floor(total * 2 / 3)) {
    titulo = 'SEMIFINALISTA'; colorRango = css(CFG.COLOR_ORO);
  } else if (estrellas >= Math.floor(total / 3)) {
    titulo = 'JUGADOR CLASIFICADO'; colorRango = css(CFG.COLOR_TEXTO);
  } else {
    titulo = 'AMATEUR'; colorRango = css(CFG.COLOR_TEXTO);
  }

  var rx = 390, ry = 506, rw = 500, rh = 122;
  panel(rx, ry, rw, rh, { borde: rgba(colorRango, 0.45), radio: 20 });
  textoSombra('RANGO', F_MIN, css(CFG.COLOR_TEXTO_SUAVE), cx, ry + 18, true, false);
  textoSombra(titulo, F_MEDIA, colorRango, cx, ry + 46, true, false);

  separador(cx - 200, 668, 400, rgba([170, 188, 210], 0.5));
  textoSombra('ENTER para volver al menú', F_MEDIA, css(CFG.COLOR_TEXTO), cx, 686, true, false);
  textoSombra('¡Gracias por jugar Padel Power!', F_MIN, css(CFG.COLOR_TEXTO_SUAVE),
    cx, 730, true, false);
}

// -------------------------------------------------------
// DESPEDIDA
// -------------------------------------------------------

function pantallaSalir() {
  fondoPantalla([200, 214, 234]);
  var f = Flujo(CFG.UI_MARGEN, 220, CFG.UI_ANCHO);
  f.centro('¡GRACIAS POR JUGAR!', F_TITULO, css(CFG.COLOR_ORO), 14);
  f.centro('Podés cerrar esta pestaña para terminar.', F_MEDIA,
    css(CFG.COLOR_TEXTO), 0);
  f.salto(10);
  f.centro('ENTER o ESC para volver al menú', F_CHICA,
    css(CFG.COLOR_TEXTO_SUAVE), 0);

  separador(CFG.CENTRO - 200, 420, 400, rgba([170, 188, 210], 0.6));

  var g = Flujo(CFG.UI_MARGEN + 60, 452, CFG.UI_ANCHO - 120);
  g.centro('PADEL POWER fue hecho por:', F_CHICA, css(CFG.COLOR_TEXTO_SUAVE), 14);
  for (var i = 0; i < INTEGRANTES.length; i++) {
    g.centro(INTEGRANTES[i], F_CHICA, css(CFG.COLOR_TEXTO), 6);
  }
  g.salto(14);
  g.centro('HTML5 + Canvas · sin dependencias · 1280x800', F_MIN,
    rgba(CFG.COLOR_TEXTO_SUAVE, 0.8), 0);
}

// ============================================================
// Bucle principal
// ============================================================

var keys = new Set();
var justPressed = new Set();

var CONTROLES = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA',
  'KeyS', 'KeyD', 'KeyE', 'Enter', 'Escape'];

window.addEventListener('keydown', function (e) {
  if (CONTROLES.indexOf(e.code) !== -1) e.preventDefault();
  keys.add(e.code);
  justPressed.add(e.code);
});
window.addEventListener('keyup', function (e) {
  keys.delete(e.code);
});
window.addEventListener('blur', function () {
  keys.clear();
});

var estado = 'menu';
var opcionMenu = 0;
var idxPersonaje = 0;
var run = { vidas: CFG.VIDAS_INICIALES, estrellas: 0, nivel: 0, char: null };
var partido = null;

function update(dt) {
  var enter = justPressed.has('Enter');
  var esc = justPressed.has('Escape');

  // ESC siempre vuelve al menú (salvo que ya estemos ahí).
  if (esc && estado !== 'menu' && estado !== 'salir') {
    estado = 'menu';
    run.nivel = 0;
    run.vidas = CFG.VIDAS_INICIALES;
    partido = null;
  }

  if (estado === 'menu') {
    if (justPressed.has('ArrowUp') || justPressed.has('KeyW')) opcionMenu = (opcionMenu - 1 + 2) % 2;
    if (justPressed.has('ArrowDown') || justPressed.has('KeyS')) opcionMenu = (opcionMenu + 1) % 2;
    if (enter) {
      if (opcionMenu === 1) estado = 'salir';
      else estado = 'select';
    }
    pantallaMenu(opcionMenu);
  } else if (estado === 'salir') {
    if (enter || esc) estado = 'menu';
    pantallaSalir();
  } else if (estado === 'select') {
    if (justPressed.has('ArrowLeft') || justPressed.has('KeyA')) {
      idxPersonaje = (idxPersonaje - 1 + PERSONAJES.length) % PERSONAJES.length;
    }
    if (justPressed.has('ArrowRight') || justPressed.has('KeyD')) {
      idxPersonaje = (idxPersonaje + 1) % PERSONAJES.length;
    }
    if (enter) {
      run.char = PERSONAJES[idxPersonaje];
      run.vidas = CFG.VIDAS_INICIALES;
      run.estrellas = 0;
      run.nivel = 0;
      partido = null;
      estado = 'intro';
    }
    pantallaSeleccion(idxPersonaje);
  } else if (estado === 'intro') {
    if (enter) {
      partido = estadoPartido(run.char, obtenerNivel(run.nivel), run.vidas, run.nivel);
      estado = 'play';
    }
    pantallaIntro(obtenerNivel(run.nivel), run.vidas, run.char);
  } else if (estado === 'play') {
    if (justPressed.has('KeyE')) activarPoder(partido);
    pasoPartido(partido, dt, keys);
    if (partido.terminado) {
      if (partido.gano) {
        run.estrellas += partido.estrellas;
        partido.cargas = Math.min(partido.cargas + 1, CARGAS_MAX);
      } else {
        run.vidas -= 1;
      }
      estado = 'fin_nivel';
    }
    dibujarPartido(partido, run.vidas);
  } else if (estado === 'fin_nivel') {
    if (enter) {
      if (partido.gano) {
        run.nivel += 1;
        estado = (run.nivel >= NIVELES.length) ? 'ranking' : 'intro';
      } else {
        estado = (run.vidas <= 0) ? 'ranking' : 'intro';
      }
    }
    var esFinal = partido.gano && run.nivel + 1 >= NIVELES.length;
    pantallaFinNivel(partido, run.vidas, esFinal);
  } else if (estado === 'ranking') {
    if (enter) {
      estado = 'menu';
      partido = null;
    }
    pantallaRanking(run.estrellas, run.vidas, run.nivel >= NIVELES.length);
  }

  justPressed.clear();
}

var ultimo = performance.now();
function frame(ahora) {
  var dt = Math.min(0.05, (ahora - ultimo) / 1000);
  ultimo = ahora;
  update(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);