# Padel Power

Juego de padel arcade hecho en **HTML5 + Canvas + JavaScript puro**, sin librerías ni instalación.
Resolución interna de **1280×800**, con el HUD fijo arriba, la pista de ayuda abajo y la cancha
ocupando toda la franja del medio. Todo el diseño vertical de los textos pasa por un flujo
(`Flujo`) que mide el alto real de cada línea, por eso nada se superpone aunque cambie el tamaño
de la pantalla.

---

## Requisitos

- Un navegador moderno: **Chrome, Edge o Firefox** (usa `roundRect`, `Math.hypot` y Canvas 2D).
- No hace falta instalar nada: no hay `npm`, ni `requirements.txt`, ni build.

## Cómo ejecutarlo

Opción 1 — abrir el archivo directamente:

1. Entrá a la carpeta `web`.
2. Doble clic en `index.html`.

Opción 2 — con un servidor local (recomendado si el navegador bloquea algo):

```bash
python -m http.server 8000 --directory web
```

Después abrí <http://localhost:8000/>.

## Controles

| Acción | Teclado |
| --- | --- |
| Moverse a los lados | `A` / `D` o `←` / `→` |
| Avanzar / retroceder | `W` / `S` o `↑` / `↓` |
| Usar el poder | `E` |
| Confirmar / continuar | `Enter` |
| Volver al menú | `Esc` |

El golpe se hace **solo** cuando la pelota entra en el alcance de tu raqueta: vos te ocupás de
posicionarte. El rival juega con una IA que predice la pelota y va a buscarla.

## Cómo se juega

- **Partidos al mejor de 3 puntos.** Si perdés un partido perdés una de tus 3 vidas; si llegás a
  0 vidas se termina la partida y vas al ranking final.
- **5 niveles**, cada uno con un rival y una velocidad más alta:
  El Novato (Ramiro), La Profe (Coach Vero), La Máquina (Tito), La Fiera (Sasha) y
  La Leyenda (El Campeón).
- **Misiones:** cada nivel pide 3 cosas (ganar, ganar sin que el rival haga un punto, y una misión
  extra: rebotar, usar el poder o hacer un gol con el poder activo). Cada misión cumplida es una
  estrella. Hay 15 estrellas en total.
- **Poderes:** arrancás con 2 cargas y se recargan hasta 4 (una por partido ganado). Después de
  activar un poder tenés 5 segundos de espera.

| Personaje | Apodo | Poder | Efecto |
| --- | --- | --- | --- |
| Luciano Odasso | LUCO | RÁFAGA | Velocidad de movimiento +80% durante 6 s |
| Nicolas Fortunato | LA FIGURA | REFLEJO | Ralentiza la pelota 40% durante 6 s |
| Milagros Carranza | ESCUALO | MORDIDA | El próximo golpe es un power shot muy rápido |
| Aixa Silva | SILVANDO | VIENTO | Alcance de la raqueta +50% durante 8 s |
| Roque Temoche | PERFUMITO | PERFUME | Aturde al rival 4 s (no se puede mover) |

## Estructura del proyecto

```
PadelGame/
├── README.md
└── web/                     <- la versión que se juega en el navegador
    ├── index.html
    ├── style.css
    └── js/
        ├── config.js       medidas, colores y proyección de la cancha
        ├── layout.js       Flujo vertical, medición de texto, paneles y pildoras
        ├── personajes.js   personajes y poderes
        ├── niveles.js      niveles, rivales y misiones
        ├── fisica.js       jugadores y pelota (rebotes, golpes, saque)
        ├── ia.js           lógica del rival
        ├── sprites.js      cancha, jugadores, raquetas, pelota y efectos
        └── game.js         bucle principal, HUD y pantallas
```

Los scripts se cargan en ese orden porque cada uno usa lo del anterior. `config.js` y
`layout.js` tienen que ir primeros: son la base de medidas y de dibujo.

## Cómo está armado

- **Un solo lugar con las medidas** (`config.js`): `CFG.ANCHO/ALTO`, zonas del HUD, de la cancha y
  de la pista, más las funciones `proyectar()`, `profundidad()` y `escala()` que convierten las
  coordenadas de la cancha (x = profundidad, y = lateral) a pantalla.
- **Composición sin superposiciones** (`layout.js`): `Flujo(x, y, ancho)` lleva un cursor vertical
  que avanza con el alto real de cada texto. También hay `envolver()` y `fuenteAjustada()` para que
  las descripciones largas entren siempre en su panel.
- **Gráficos** (`sprites.js`): todo se dibuja con primitivas de Canvas, sin imágenes externas. El
  fondo, la red, las paredes y el piso tienen textura y degradados; la pelota deja estela y glow.

## Prompts usados

Crear un videojuego de Padel donde se enfrente un jugador contra una ia, el jugador comienza como principiante y a medida que vaya gando partidas subira de nivel

A medida que el jugador vaya ganando partidas la dificultad de los niveles debera ir mejorando 

Debe haber 5 personajes para que el jugador seleccione
-Luco poder de rafaga
-La figura poder de reflejo
-Escualo poder de mordida
-Silvando poder de viento
-Perfumito poder de perfume


## Integrantes

- Aixa Silva
- Milagros Carranza
- Luciano Odasso
- Nicolas Fortunato
- Roque Temoche