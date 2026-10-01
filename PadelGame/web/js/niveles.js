// Las velocidades están escaladas al tamaño de cancha (1280x800).
// El ratio entre niveles se mantiene igual que en la versión anterior.
var NIVELES = [
  {
    nivel: 1, rival: 'Ramiro', titulo: 'El Novato',
    color: [150, 150, 150], ai_speed: Math.round(335 * 0.90), ball_speed: 402,
    factorErrores: Math.min(0.28, 0 + 0.05), ia_reaccion: 0.24, ia_desvio: 0, alcance_ia: 1.0, ia_potencia: 0,
    mision_b: { tipo: 'rebotes', desc: 'Rebotar la pelota 5 veces en las paredes', target: 5 }
  },
  {
    nivel: 2, rival: 'Coach Vero', titulo: 'La Profe',
    color: [120, 120, 230], ai_speed: Math.round(415 * 0.90), ball_speed: 431,
    factorErrores: Math.min(0.28, 0.08 + 0.05), ia_reaccion: 0.21, ia_desvio: 0, alcance_ia: 1.05, ia_potencia: 0,
    mision_b: { tipo: 'poderes', desc: 'Usar tu poder 2 veces', target: 2 }
  },
  {
    nivel: 3, rival: 'Tito', titulo: 'La Máquina',
    color: [230, 120, 120], ai_speed: Math.round(549 * 0.90), ball_speed: 461,
    factorErrores: Math.min(0.28, 0.15 + 0.05), ia_reaccion: 0.19, ia_desvio: 0.45, alcance_ia: 1.10, ia_potencia: 0,
    mision_b: { tipo: 'power_goal', desc: 'Anotar un gol con tu poder activo', target: 1 }
  },
  {
    nivel: 4, rival: 'Sasha', titulo: 'La Fiera',
    color: [210, 120, 220], ai_speed: 683, ball_speed: 490,
    factorErrores: 0.17, ia_reaccion: 0.12, ia_desvio: 0.75, alcance_ia: 1.3, ia_potencia: 65,
    mision_b: { tipo: 'rebotes', desc: 'Rebotar la pelota 8 veces en las paredes', target: 8 }
  },
  {
    nivel: 5, rival: 'El Campeón', titulo: 'La Leyenda',
    color: [255, 205, 60], ai_speed: 817, ball_speed: 525,
    factorErrores: 0.13, ia_reaccion: 0.06, ia_desvio: 0.9, alcance_ia: 1.5, ia_potencia: 90,
    mision_b: { tipo: 'poderes', desc: 'Usar tu poder 3 veces', target: 3 }
  }
];

var MISION_GANAR = { tipo: 'ganar', desc: 'Ganar el partido' };
var MISION_PERFECTO = { tipo: 'perfecto', desc: 'Ganar sin darle ningún punto al rival' };

function obtenerNivel(indice) { return NIVELES[indice]; }

function misionesDelNivel(datos) {
  var misiones = [];
  [MISION_GANAR, MISION_PERFECTO].forEach(function (base) {
    var m = JSON.parse(JSON.stringify(base));
    m.done = false;
    m.target = null;
    misiones.push(m);
  });
  if (datos.mision_b) {
    var mb = JSON.parse(JSON.stringify(datos.mision_b));
    mb.done = false;
    misiones.push(mb);
  }
  return misiones;
}

function puntosParaGanar() { return CFG.PUNTOS_PARA_GANAR; }