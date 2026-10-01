function _predY(pelota, x_meta) {
  if (pelota.vx === 0) return pelota.y;

  var min_y = CFG.PARED_SUP + pelota.radio;
  var max_y = CFG.PARED_INF - pelota.radio;
  var altura = max_y - min_y;
  if (altura <= 0) return pelota.y;

  var pendiente = pelota.vy / pelota.vx;
  var dx = x_meta - pelota.x;
  var y_ext = pelota.y + pendiente * dx;

  var periodo = 2.0 * altura;
  var t = (y_ext - min_y) % periodo;
  if (t > altura) t = periodo - t;
  return min_y + t;
}

// El rival juega como en padel de verdad: espera en el fondo de su
// mitad y se mueve de lado para cubrir. Si se queda en la red le regala
// el tanto al jugador, y si persigue la pelota desde atrás nunca la
// alcanza (la pelota es siempre más rápida).
function moverJugadorIa(jug, pelota, dt, velocidad, aturdido, factorErrores, reaccion) {
  if (aturdido) return;

  // Reacción: el rival juega con la pelota tal como estaba hace un
  // instante, no con la de ahora. Sin esto anticipa todo y es
  // imposible ganarle.
  var espera = reaccion === undefined ? CFG.IA_REACCION : reaccion;
  jug._mem_t = (jug._mem_t || 0) + dt;
  if (!jug._mem || jug._mem_t >= espera) {
    jug._mem_t = 0;
    jug._mem = { x: pelota.x, y: pelota.y, vx: pelota.vx, vy: pelota.vy, quieta: pelota.quieta };
  }
  var vista = jug._mem;

  var defensa = CFG.GOL_DER - CFG.IA_BASE_DEFENSIVA;
  var x_meta = defensa;
  var y_meta;

  if (vista.quieta) {
    y_meta = CFG.LAT_CENTRO;
  } else if (vista.vx > 0) {
    // la pelota viene hacia su mitad: sale a cortarla y cubre el punto
    // de paso. Cuanto más lenta, más se adelanta; si viene rápida se
    // queda atrás para no quedarse sin cobertura.
    var cierre = Math.max(0, Math.min(1, 1 - (pelota.vel - 380) / 420));
    x_meta = defensa - 170 * cierre;
    y_meta = _predY(vista, x_meta);
  } else {
    // la pelota se va: se repliega a defender, copiando al jugador
    y_meta = CFG.LAT_CENTRO + (vista.y - CFG.LAT_CENTRO) * CFG.IA_MIRROR;
  }

  x_meta = Math.max(CFG.CENTRO + CFG.BORDE_RED + 20,
    Math.min(x_meta, CFG.GOL_DER - CFG.IA_MARGEN_GOL));

  if (isNaN(y_meta)) y_meta = CFG.LAT_CENTRO;
  if (isNaN(x_meta)) x_meta = defensa;

  // Error de lectura: se equivoca de punto de pasada según el nivel.
  var prueba = jug._err;
  if (prueba === undefined || prueba === null || Math.random() < 0.04) {
    var tope = (factorErrores === undefined ? 0.15 : factorErrores) * CFG.LAT_HALF;
    jug._err = (Math.random() * 2 - 1) * tope;
  }
  y_meta += jug._err;

  x_meta += Math.sin(jug._t * 1.6) * 7;
  y_meta += Math.cos(jug._t * 0.9) * 11;

  var dx = x_meta - jug.x;
  var dy = y_meta - jug.y;
  var dist = Math.hypot(dx, dy);
  var paso = Math.min(velocidad * dt, dist);
  if (paso > 0) {
    jug.x += dx / dist * paso;
    jug.y += dy / dist * paso;
    jug._clamp();
  }
}