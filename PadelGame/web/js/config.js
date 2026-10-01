// ============================================================
//  Padel Power — Configuración global
//  Todo el juego usa estas medidas. La pantalla es de 1280x800 y
//  las zonas quedan fijas para que ningún elemento se pise con otro.
// ============================================================

var FONT_FAMILY = '"Trebuchet MS", "Segoe UI", system-ui, -apple-system, sans-serif';

// Escala tipográfica. Los tamaños son "altos de línea": el alto real
// de un texto se calcula con esta cifra, así el flujo vertical nunca miente.
var FUENTES = {
  titulo: '84px ' + FONT_FAMILY,
  grande: '58px ' + FONT_FAMILY,
  media: '38px ' + FONT_FAMILY,
  hud: '34px ' + FONT_FAMILY,
  normal: '26px ' + FONT_FAMILY,
  chica: '23px ' + FONT_FAMILY,
  muyChica: '20px ' + FONT_FAMILY,
  min: '17px ' + FONT_FAMILY
};

// Atajos que usa el resto de los archivos.
var F_TITULO = FUENTES.titulo;
var F_GRANDE = FUENTES.grande;
var F_MEDIA = FUENTES.media;
var F_HUD = FUENTES.hud;
var F_NORMAL = FUENTES.normal;
var F_CHICA = FUENTES.chica;
var F_MUY_CHICA = FUENTES.muyChica;
var F_MIN = FUENTES.min;

var CFG = {
  // ---------------- Pantalla ----------------
  ANCHO: 1280,
  ALTO: 800,

  // ---------------- Zonas fijas ----------------
  // El HUD ocupa la franja superior. Debajo, la cancha. Abajo, la
  // pista de ayuda. Ninguna de las tres se pisa con las otras.
  HUD_ALTURA: 96,
  PISTA_ALTURA: 46,
  PISTA_Y: 800 - 46,          // 754
  MARGEN: 40,

  // ---------------- Cancha (coordenadas de juego) ----------------
  COURT_X: 40,
  COURT_Y: 96,
  COURT_W: 1200,
  COURT_H: 800 - 96,          // 704

  GOL_IZQ: 40,
  GOL_DER: 1240,
  PARED_SUP: 96,
  PARED_INF: 800,
  CENTRO: 640,                // centro en el eje de profundidad
  LAT_CENTRO: (96 + 800) / 2, // centro lateral real (448)
  LAT_HALF: (800 - 96) / 2,   // semi-altura lateral real (352)

  // ---------------- Vista con profundidad ----------------
  // t = 0 -> cerca de la cámara (abajo, grande)
  // t = 1 -> lejos de la cámara (arriba, chico)
  VISTA_TOP: 132,
  VISTA_BOT: 700,
  VISTA_CX: 640,
  HALF_LAT_FRONT: 600,        // semiancho en pantalla a t=0  (40  .. 1240)
  HALF_LAT_BACK: 302,         // semiancho en pantalla a t=1  (338 .. 942)
  ESCALA_ART: 1.2,            //.multiplicador de arte sobre la escala real
  GROSOR_PARED_CERCA: 32,
  GROSOR_PARED_LEJOS: 10,
  ALTURA_PARED_TRASERA: 36,   // arranca justo donde termina el HUD
  ALTURA_RED: 44,

  // ---------------- Física ----------------
  RADIO_PELOTA: 13,
  RADIO_JUGADOR: 27,
  VEL_PELOTA_BASE: 429,
  VEL_PELOTA_INCREMENTO: 29,
  VEL_PELOTA_MAX: 750,
  VEL_POWER_SHOT: 1045,

  VEL_JUGADOR: 480,
  VEL_JUGADOR_RAFAGA: 830,
  ALCANCE_BASE: 92,
  VIENTO_MULT_ALTO: 1.5,

  SWING_DUR: 0.32,
  GOLPE_COOLDOWN: 0.35,
  ANGULO_MAX: 0.9,

  PUNTOS_PARA_GANAR: 3,
  VIDAS_INICIALES: 3,

  // ---------------- Inteligencia artificial ----------------
  // nobody's land: franja en la que no puede pararse nadie. La red
  // está en el centro y los jugadores se quedan a un lado de ella.
  BORDE_RED: 44,
  // Dónde espera el rival (a cuántos píxeles de su propio_goal line).
  IA_BASE_DEFENSIVA: 220,  // donde espera cuando la pelota está quieta o se aleja
  IA_MARGEN_GOLPE: 55,    // cuánto se separa de la pelota para golpearla
  IA_MARGEN_GOL: 70,      // no se pega nunca al poste de gol
  IA_MIRROR: 0.4,         // cuánto copia la posición lateral del jugador
  // La IA no ve el futuro: juega con la pelota como estaba hace este
  // tiempo (segundos). Es lo que hace que se le puedan ganar puntos.
  IA_REACCION: 0.17,

  // ---------------- Colores ----------------
  COLOR_FONDO: [232, 240, 247],
  COLOR_CANCHA: [104, 166, 130],
  COLOR_CANCHA_MEDIO: [146, 192, 162],
  COLOR_CANCHA_LEJOS: [188, 216, 198],
  COLOR_PARED: [205, 222, 238],
  COLOR_LINEA: [255, 255, 255],
  COLOR_LINEA_SUAVE: [228, 240, 233],
  COLOR_NET: [255, 214, 92],
  COLOR_NET_MALLA: [250, 252, 255],
  COLOR_PELOTA: [255, 255, 255],
  COLOR_PELOTA_POWER: [255, 122, 40],
  COLOR_TEXTO: [30, 42, 60],
  COLOR_TEXTO_SUAVE: [104, 120, 142],
  COLOR_VERDE: [40, 150, 92],
  COLOR_ROJO: [222, 78, 78],
  COLOR_ORO: [230, 158, 38],
  COLOR_VIDA: [235, 82, 104],
  COLOR_SOMBRA: [60, 76, 92],
  COLOR_BRILLO: [255, 255, 255],

  COLOR_ARENA_TOP: [214, 231, 244],
  COLOR_ARENA_BOT: [241, 249, 253],
  COLOR_ARENA_LUZ: [255, 244, 210],
  COLOR_VIDRIO_SOMBRA: [174, 200, 228],
  COLOR_VIDRIO_LUZ: [240, 248, 255],

  // ---------------- UI ----------------
  // Área útil para textos y paneles: deja 60px de aire a cada lado.
  UI_MARGEN: 60,
  get UI_ANCHO() { return this.ANCHO - this.UI_MARGEN * 2; },   // 1160
  get UI_CX() { return this.ANCHO / 2; },                        // 640
  UI_Y: 40,            // borde superior del área útil
  UI_Y_BOT: 754,       // donde empieza la pista inferior

  // ---------------- Proyección ----------------
  profundidad: function (x) {
    return Math.max(0, Math.min(1, (x - this.COURT_X) / this.COURT_W));
  },

  // Semiancho en pantalla a profundidad t.
  escala: function (t) {
    return this.HALF_LAT_FRONT + (this.HALF_LAT_BACK - this.HALF_LAT_FRONT) * t;
  },

  proyectar: function (x, y) {
    var t = this.profundidad(x);
    var h = this.escala(t);
    var latFrac = (y - this.LAT_CENTRO) / this.LAT_HALF;
    return {
      x: this.VISTA_CX + latFrac * h,
      y: this.VISTA_BOT - t * (this.VISTA_BOT - this.VISTA_TOP),
      s: h / this.HALF_LAT_FRONT,
      t: t
    };
  },

  // Escala de arte de un personaje en profundidad t.
  escalaPj: function (t) {
    return (this.escala(t) / this.HALF_LAT_FRONT) * this.ESCALA_ART;
  }
};

// ============================================================
//  Utilidades de color
// ============================================================

function css(c) {
  return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
}

function rgba(c, a) {
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
}

function tono(c, mult, off) {
  if (off === undefined) off = 0;
  return [
    Math.max(0, Math.min(255, Math.round(c[0] * mult) + off)),
    Math.max(0, Math.min(255, Math.round(c[1] * mult) + off)),
    Math.max(0, Math.min(255, Math.round(c[2] * mult) + off))
  ];
}

function oscurecer(c, n) {
  return [Math.max(0, c[0] - n), Math.max(0, c[1] - n), Math.max(0, c[2] - n)];
}

function mezclar(a, b, p) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * p),
    Math.round(a[1] + (b[1] - a[1]) * p),
    Math.round(a[2] + (b[2] - a[2]) * p)
  ];
}