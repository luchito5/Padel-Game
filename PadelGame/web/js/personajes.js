var PERSONAJES = [
  {
    nombre: 'Luciano Odasso',
    apodo: 'LUCO',
    color: [80, 160, 255],
    poderNombre: 'RAFAGA',
    poderDesc: 'Velocidad de movimiento +80% durante 6 seg.',
    poderKey: 'rafaga'
  },
  {
    nombre: 'Nicolas Fortunato',
    apodo: 'LA FIGURA',
    color: [120, 90, 220],
    poderNombre: 'REFLEJO',
    poderDesc: 'Ralentiza la pelota 40% durante 6 seg.',
    poderKey: 'reflejo'
  },
  {
    nombre: 'Milagros Carranza',
    apodo: 'ESCUALO',
    color: [70, 200, 210],
    poderNombre: 'MORDIDA',
    poderDesc: 'El próximo golpe es un power shot super rápido.',
    poderKey: 'mordida'
  },
  {
    nombre: 'Aixa Silva',
    apodo: 'SILVANDO',
    color: [70, 210, 120],
    poderNombre: 'VIENTO',
    poderDesc: 'Alcance de la raqueta +50% durante 8 seg.',
    poderKey: 'viento'
  },
  {
    nombre: 'Roque Temoche',
    apodo: 'PERFUMITO',
    color: [240, 150, 70],
    poderNombre: 'PERFUME',
    poderDesc: 'Aturde al rival durante 4 seg (no se mueve).',
    poderKey: 'perfume'
  }
];

var DURACIONES = {
  rafaga: 6.0,
  reflejo: 6.0,
  viento: 8.0,
  perfume: 4.0
};

var REFLEJO_MULT = 0.6;
var CARGAS_PODER = 2;
var CARGAS_MAX = 4;
var ENFRIAMIENTO_PODER = 5.0;