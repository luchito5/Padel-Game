function Jugador(x, y, es_ia) {
  this.x = x;
  this.y = y;
  this.es_ia = es_ia;
  this.radio = CFG.RADIO_JUGADOR;
  this.alcance = CFG.ALCANCE_BASE;
  this.alcance_base = this.alcance;
  this.swing_t = 0;
  this.golpe_t = 0;
  this.swing_lado = 1;
  this._t = 0;
}

Jugador.prototype.mover = function (dx, dy, dt) {
  this.x += dx * dt;
  this.y += dy * dt;
  this._clamp();
};

Jugador.prototype._clamp = function () {
  var m = 22;
  var min_x, max_x;
  // La red ocupa el centro de la cancha: nadie puede pararse encima.
  if (this.es_ia) {
    min_x = CFG.CENTRO + CFG.BORDE_RED;
    max_x = CFG.COURT_X + CFG.COURT_W - 40;
  } else {
    min_x = CFG.COURT_X + 40;
    max_x = CFG.CENTRO - CFG.BORDE_RED;
  }
  this.x = Math.max(min_x, Math.min(max_x, this.x));
  this.y = Math.max(CFG.COURT_Y + m, Math.min(CFG.COURT_Y + CFG.COURT_H - m, this.y));
};

Jugador.prototype.aplicarViento = function (activo) {
  this.alcance = this.alcance_base * (activo ? CFG.VIENTO_MULT_ALTO : 1.0);
};

Jugador.prototype.actualizarTiempos = function (dt) {
  this.swing_t = Math.max(0, this.swing_t - dt);
  this.golpe_t = Math.max(0, this.golpe_t - dt);
  this._t += dt;
};

Jugador.prototype.enSwing = function () {
  return this.swing_t > 0;
};

Jugador.prototype.iniciarGolpe = function (lado) {
  this.swing_t = CFG.SWING_DUR;
  this.golpe_t = CFG.GOLPE_COOLDOWN;
  this.swing_lado = lado;
};

function Pelota() {
  this.radio = CFG.RADIO_PELOTA;
  this.vel_base = CFG.VEL_PELOTA_BASE;
  this.reset(1.0);
}

Pelota.prototype.reset = function (dir_x) {
  this.x = CFG.CENTRO;
  this.y = CFG.LAT_CENTRO;
  var angulo = (Math.random() - 0.5) * 1.2;
  this.vx = Math.cos(angulo) * (dir_x > 0 ? 1 : -1);
  this.vy = Math.sin(angulo);
  this.normalizar();
  this.vel = this.vel_base;
  this.power_shot = false;
  this.quieta = true;
  this.tiempo = 1.0;
  this._px = this.x;
  this._py = this.y;
  this.historial = [];
};

Pelota.prototype.normalizar = function () {
  var norma = Math.hypot(this.vx, this.vy);
  if (norma === 0) { this.vx = 1; this.vy = 0; return; }
  this.vx /= norma;
  this.vy /= norma;
};

Pelota.prototype.update = function (dt, mod) {
  this._px = this.x;
  this._py = this.y;
  if (this.quieta) {
    this.tiempo -= dt;
    if (this.tiempo <= 0) this.quieta = false;
    return 0;
  }
  var vel = this.vel * mod;
  this.x += this.vx * vel * dt;
  this.y += this.vy * vel * dt;
  this.historial.push([this.x, this.y, this.power_shot]);
  if (this.historial.length > 9) this.historial.shift();

  var paredes = 0;
  if (this.y - this.radio < CFG.PARED_SUP) {
    this.y = CFG.PARED_SUP + this.radio;
    this.vy = Math.abs(this.vy);
    paredes += 1;
  } else if (this.y + this.radio > CFG.PARED_INF) {
    this.y = CFG.PARED_INF - this.radio;
    this.vy = -Math.abs(this.vy);
    paredes += 1;
  }
  return paredes;
};

Pelota.prototype.gol = function () {
  if (this.x - this.radio < CFG.GOL_IZQ) return 'rival';
  if (this.x + this.radio > CFG.GOL_DER) return 'jugador';
  return null;
};

Pelota.prototype.golpear = function (dir_x, rel_y, poder) {
  var rel = Math.max(-1, Math.min(1, rel_y));
  var angulo = rel * CFG.ANGULO_MAX;
  this.vx = Math.cos(angulo) * dir_x;
  this.vy = Math.sin(angulo);
  this.normalizar();
  this._px = this.x;
  this._py = this.y;
  this.historial = [];

  if (poder) {
    this.power_shot = true;
    this.vel = Math.max(this.vel, CFG.VEL_POWER_SHOT);
  } else {
    this.power_shot = false;
    // Cada golpe la acelera un poco más. Cuando llega al tope sigue
    // acelerando: en una pelea larga ya no la puede devolver nadie,
    // así el tanto siempre termina.
    this.vel = this.vel < CFG.VEL_PELOTA_MAX
      ? Math.min(this.vel + CFG.VEL_PELOTA_INCREMENTO, CFG.VEL_PELOTA_MAX)
      : this.vel * 1.07;
  }
};