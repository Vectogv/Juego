# EcoRecicla — Arquitectura del juego

## Índice

1. [Estructura del proyecto](#1-estructura-del-proyecto)
2. [Arquitectura general](#2-arquitectura-general)
3. [Flujo del juego (máquina de estados)](#3-flujo-del-juego-máquina-de-estados)
4. [Funciones de lógica del tablero](#4-funciones-de-lógica-del-tablero)
5. [Componentes](#5-componentes)
6. [Sistema de animaciones](#6-sistema-de-animaciones)
7. [Estados visuales de una celda](#7-estados-visuales-de-una-celda)
8. [Sistema de puntuación](#8-sistema-de-puntuación)
9. [Adaptación responsive](#9-adaptación-responsive)
10. [Glosario de animaciones CSS](#10-glosario-de-animaciones-css)

---

## 1. Estructura del proyecto

```
mi-juego/
├── index.html                     # Entry point HTML (Vite)
├── package.json                   # Dependencias: React 19 + Vite 8
├── vite.config.js                 # Configuración Vite
│
├── src/
│   ├── main.jsx                   # Punto de entrada React
│   ├── App.jsx                    # Renderiza <Match3Game />
│   ├── Match3Game.jsx             # ★ Componente principal (lógica + UI)
│   │
│   ├── components/
│   │   └── Caneca.jsx             # Caneca de reciclaje con imagen PNG
│   │
│   ├── styles/
│   │   └── Match3.css             # Todos los estilos y animaciones
│   │
│   └── assets/
│       ├── plastico.png           # Imagen caneca amarilla (plástico)
│       ├── papelcarton.png        # Imagen caneca azul (papel/cartón)
│       ├── vidrio.png             # Imagen caneca verde (vidrio)
│       └── fondo.png              # Imagen de fondo (no usada en match-3)
│
├── docs/
│   └── arquitectura.md            # ★ Este archivo
│
└── dist/                          # Build de producción
```

---

## 2. Arquitectura general

El juego es un **match-3 tipo Candy Crush** con temática de reciclaje.

```
┌─────────────────────────────────────────────────┐
│                  m3-root                        │
│  ┌─────────────── m3-header ───────────────┐    │
│  │  Título  [Puntos] [Reciclados] [Récord]  │    │
│  │           [barra de combo]               │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌────────────── m3-board-area ─────────────┐    │
│  │                                           │    │
│  │   ┌────────── m3-board (Grid 8×8) ────┐  │    │
│  │   │  [🧴] [🥤] [🍾] [🥃] [📄] [📦] ... │  │    │
│  │   │  ...                                │  │    │
│  │   │  ...                                │  │    │
│  │   └────────────────────────────────────┘  │    │
│  │                                           │    │
│  │   [fly-ghost] ← elementos position:fixed  │    │
│  │   que vuelan hacia las canecas            │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────── m3-bins ─────────────────┐    │
│  │   [Caneca Plástico] [Caneca Papel] [Caneca Vidrio] │
│  │   (imágenes PNG plastico.png, papelcarton.png, vidrio.png) │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 19.x | Componentes, hooks, estado |
| **Vite** | 8.x | Build, dev server, HMR |
| **CSS3** | — | Grid, Flexbox, keyframes, transitions |

### Datos del juego

| Concepto | Valor |
|---|---|
| Tamaño del tablero | 8×8 (64 celdas) |
| Tipos de ficha | 6 (2 por categoría) |
| Categorías | 3 (plástico, vidrio, papel) |
| Canecas | 3 con imágenes PNG |
| Combinación mínima | 3 fichas iguales en línea |

---

## 3. Flujo del juego (máquina de estados)

```
                  ┌──────────┐
                  │  loading │  ← se genera el tablero
                  └────┬─────┘
                       │
                       ▼
                  ┌──────────┐
           ┌─────→│   idle   │  ← esperando click del jugador
           │      └────┬─────┘
           │           │
           │      ┌────▼─────┐
           │      │ selected │  ← click en ficha A (se ilumina)
           │      └────┬─────┘
           │           │ click ficha B adyacente
           │           ▼
           │      ┌──────────┐
           │      │   swap   │  ← animación de intercambio (200ms)
           │      └────┬─────┘
           │           │
           │      ┌────▼────────┐          ┌──────────┐
           │      │ detectMatches│────NO──→│ swapback │  ← sacudida (400ms)
           │      └────┬────────┘          └────┬─────┘
           │           │                        │
           │      ┌────▼──────────┐             │
           │      │  highlight    │  ← brillo dorado (450ms)
           │      └────┬──────────┘
           │           │
           │      ┌────▼──────┐
           │      │    fly    │  ← fantasmas vuelan a caneca (750ms)
           │      └────┬──────┘
           │           │
           │      ┌────▼──────┐
           │      │   fall    │  ← gravedad + relleno (450ms)
           │      └────┬──────┘
           │           │
           │      ┌────▼────────────┐
           │      │ detectMatches   │
           │      └────┬────────────┘
           │           │
           │      ┌────▼────┐
           │      │ ¿match? │────SÍ──→ highlight (combo + 1)
           │      └────┬────┘
           │           │ NO
           │      ┌────▼──────────┐
           │      │ hasValidMove? │
           │      └────┬──────────┘
           │           │
           │      ┌────▼─────┐
           │      │ shuffle? │
           │      └────┬─────┘
           │           │
           └───────────┘
```

### Transiciones en código (`Match3Game.jsx:212-301`)

La función `doMove()` orquesta toda la secuencia:

```javascript
const doMove = useCallback(async (r1, c1, r2, c2) => {
  // 1. Intercambiar fichas (swap)
  // 2. Detectar coincidencias
  // 3. Si no hay: devolver fichas (swapback)
  // 4. Si hay: entrar en bucle de cascada
  //    4a. highlight → fly → fall → detectMatches
  //    4b. Si hay nuevo match: repetir (combo + 1)
  //    4c. Si no hay match: salir del bucle
  // 5. Verificar si hay movimientos válidos
  // 6. Si no: shuffle
  // 7. Volver a idle
}, [calcFlyData]);
```

Cada fase usa `await delay(N)` para dar tiempo a React de renderizar y a las animaciones CSS de completarse.

---

## 4. Funciones de lógica del tablero

### 4.1 `buildBoard()` — Generación inicial

Genera un tablero 8×8 evitando combinaciones de 3+ fichas iguales.

```javascript
function buildBoard() {
  // Por cada celda (r, c):
  //   1. Prohibir el tipo que forme trio horizontal (c-2, c-1)
  //   2. Prohibir el tipo que forme trio vertical (r-2, r-1)
  //   3. Elegir aleatoriamente entre los tipos no prohibidos
}
```

### 4.2 `findMatches(board)` — Detección de combinaciones

Escanea filas y columnas buscando rachas de 3+ fichas con el mismo `typeIdx`.

**Algoritmo**: por cada fila/columna, encuentra el inicio de una racha y expande hasta que el tipo cambie. Si la longitud ≥ 3, todas esas celdas se agregan a un `Set` (evita duplicados en formas L, T).

```javascript
function findMatches(board) {
  const matched = new Set();
  // Scan horizontal: for each row, find runs of same typeIdx ≥ 3
  // Scan vertical: for each column, find runs of same typeIdx ≥ 3
  return matched; // Set de strings "fila,columna"
}
```

### 4.3 `swapPieces(board, r1, c1, r2, c2)` — Intercambio

Crea una copia del tablero e intercambia las fichas en `(r1,c1)` y `(r2,c2)`. Incluye null safety.

```javascript
function swapPieces(board, r1, c1, r2, c2) {
  const next = board.map(row => [...row]);
  const a = next[r1][c1];   // puede ser null
  const b = next[r2][c2];   // puede ser null
  next[r1][c1] = b ? { ...b, row: r1, col: c1 } : null;
  next[r2][c2] = a ? { ...a, row: r2, col: c2 } : null;
  return next;
}
```

### 4.4 `removeAndFill(board, matchedKeys)` — Eliminar, gravedad y relleno

1. Marca las celdas coincidentes como `null`
2. Por cada columna: recolecta fichas no nulas de arriba a abajo
3. Las recoloca desde la fila inferior hacia arriba (gravedad)
4. Las filas vacías restantes se rellenan con fichas nuevas aleatorias

Devuelve `{ board, moved }` donde `moved` es un `Set` con las posiciones de fichas que cayeron o son nuevas (para la animación `new-cell`).

### 4.5 `hasValidMove(board)` — Validación de movimientos

Pruea cada par adyacente (horizontal y vertical). Si algún intercambio produce un match, hay al menos un movimiento válido.

```javascript
function hasValidMove(board) {
  // 8×8 × 2 direcciones = 128 pruebas de findMatches
}
```

### 4.6 `shuffleBoard(board)` — Revolver tablero

Baraja aleatoriamente las fichas del tablero asignándoles nuevas posiciones con IDs nuevos.

---

## 5. Componentes

### 5.1 `Match3Game.jsx` — Componente principal

| Responsabilidad | Detalle |
|---|---|
| Estado del juego | `board`, `phase`, `score`, `combo`, `selected`, etc. |
| Lógica del juego | `doMove()`, `handleCellClick()`, `resetGame()` |
| Cálculo de vuelo | `calcFlyData()` mide posiciones para fantasmas |
| Refs | `boardRef`, `cellRefs`, `binRefs`, `busy`, `mountedRef` |

**Estados manejados con `useState`** (15 estados):

```javascript
const [board, setBoard] = useState(null);       // Tablero 8×8
const [phase, setPhase] = useState('loading');   // Fase del juego
const [selected, setSelected] = useState(null);  // Ficha seleccionada
const [score, setScore] = useState(0);           // Puntuación actual
const [bestScore, setBestScore] = useState(0);   // Récord (localStorage)
const [combo, setCombo] = useState(0);           // Contador de combo
const [matches, setMatches] = useState(new Set());// Celdas en match
const [flyData, setFlyData] = useState(null);    // Datos de vuelo
const [celebBins, setCelebBins] = useState([]);  // Canecas celebrando
const [showComboPopup, setShowComboPopup] = useState(false);
const [totalMatched, setTotalMatched] = useState(0);
const [swapCells, setSwapCells] = useState(null); // Celdas intercambiándose
const [newCells, setNewCells] = useState(new Set());// Celdas que cayeron
```

**Refs** (valores que persisten entre renders):

| Ref | Propósito |
|---|---|
| `boardRef` | Referencia mutable al tablero (evita stale closures en `async`) |
| `cellRefs` | Mapa `id → DOM element` para medir posiciones de `getBoundingClientRect()` |
| `binRefs` | Mapa `categoría → DOM element` para las canecas |
| `busy` | Lock para evitar `doMove()` concurrentes |
| `comboRef` | Contador de combo mutable en el bucle async |
| `mountedRef` | Flag de componente montado (cancela operaciones al desmontar) |

### 5.2 `Caneca.jsx` — Caneca de reciclaje

| Prop | Tipo | Descripción |
|---|---|---|
| `caneca` | `{ category, label }` | Define qué imagen mostrar |
| `celebrating` | `boolean` | Activa animación de celebración |
| `setRef` | `(cat, el) => void` | Callback para registrar el DOM |

Carga las imágenes con `new URL(...)` para compatibilidad con Vite:

```javascript
const BIN_IMAGES = {
  plastico: new URL('../assets/plastico.png', import.meta.url).href,
  papel: new URL('../assets/papelcarton.png', import.meta.url).href,
  vidrio: new URL('../assets/vidrio.png', import.meta.url).href,
};
```

### 5.3 `App.jsx` — Punto de entrada

```javascript
export default function App() {
  return <Match3Game />;
}
```

---

## 6. Sistema de animaciones

### 6.1 Animaciones en celda

| Estado | Clase CSS | Animación | Duración |
|---|---|---|---|
| Seleccionada | `.selected` | `m3Pulse` (pulso dorado infinito) | ∞ |
| Match | `.matched` | `m3MatchGlow` (brillo dorado) | 450ms |
| Swap válido | `.swapping` + `[data-phase="swap"]` | `m3SwapPop` (encoger/crecer) | 200ms |
| Swap inválido | `.swapping` + `[data-phase="swapback"]` | `m3Shake` (sacudida) | 350ms |
| Caída nueva | `.new-cell` | `m3FallIn` (caída desde arriba) | 400ms |
| Volando | `.flying` | opacity 0 + transition | 200ms |

### 6.2 Fantasmas voladores (fly ghost)

Cuando se forma un match, se crean elementos `position:fixed` que:

1. Se posicionan exactamente donde estaba la ficha (`left`, `top`, `width`, `height` desde `getBoundingClientRect()`)
2. Tienen variables CSS `--tx` y `--ty` que representan la distancia hasta la caneca
3. La animación `m3FlyToBin` los mueve con `translate(var(--tx), var(--ty))` mientras se encogen a `scale(0.2)` y rotan `720deg`
4. Al terminar (forwards), se quedan con `opacity: 0`

```
Posición inicial                Posición final
┌──────┐                        ┌──────────┐
│  🧴  │  ──────────────────→   │  Caneca  │
│  (en │    scale(1)→(0.2)      │  Plástico│
│  grid│    rotate 720°         │          │
│  8×8)│    opacity 1→0         └──────────┘
└──────┘
     \── tx ────────────────────→/
     \────────── ty ─────────────────────────→/
```

### 6.3 Celebración de caneca

Cuando fichas llegan volando a una caneca:

1. `.m3-caneca.celebrating` → animación `m3Celebrate` (rebote scale 1→1.2→0.95→1.15→1)
2. `.m3-caneca-glow` → animación `m3CelebrateGlow` (destello radial que se expande y desvanece)

### 6.4 Popup de combo

Aparece en el centro del tablero con animación `m3ComboAppear`:
- Entra escalando desde `scale(0.3)`
- Rebota (1.15 → 0.95 → 1.05)
- Se desvanece mientras sube ligeramente

---

## 7. Estados visuales de una celda

Cada celda del tablero puede tener múltiples clases simultáneas:

```javascript
let className = 'm3-cell';
if (isSelected)    className += ' selected';   // pulso dorado
if (isMatched)     className += ' matched';     // brillo de match
if (isSwapping)    className += ' swapping';    // intercambio
if (fly)           className += ' flying';      // oculta (vuela fantasma)
if (newCells.has)  className += ' new-cell';    // caída animada
```

Orden de prioridad visual: `flying > selected > matched > swapping > new-cell`

---

## 8. Sistema de puntuación

```
Puntos por match = fichas × 10 × multiplicador

Multiplicador:
  Combo 1 (primer match): ×1
  Combo 2 (cadena):       ×4  (2 × 2)
  Combo 3 (cadena):       ×6  (3 × 2)
  Combo N:                ×N×2

Ejemplo:
  4 fichas en combo 1 → 4 × 10 × 1  = 40 pts
  3 fichas en combo 2 → 3 × 10 × 4  = 120 pts
  5 fichas en combo 3 → 5 × 10 × 6  = 300 pts
```

El récord se guarda en `localStorage` con clave `match3-best`.

---

## 9. Adaptación responsive

### Media queries

| Query | Ajuste |
|---|---|
| `max-width: 480px` | Canecas más pequeñas (70×85), gap reducido, tablero más compacto |
| `min-height: 800px` | Tablero más grande (proporcional a la altura) |
| `max-height: 600px` | Header compacto, canecas pequeñas (60×70) |

### Unidades utilizadas

| Unidad | Uso |
|---|---|
| `clamp(min, pref, max)` | Tamaños de fuente, dimensiones, gaps |
| `min(92vw, 500px)` | Ancho máximo del tablero |
| `vw` | Tamaño de canecas, gaps |
| `vh` | Tablero en pantallas altas |

---

## 10. Glosario de animaciones CSS

| Animación | Tipo | Propósito |
|---|---|---|
| `m3Pulse` | `keyframes` + `infinite` | Pulso dorado en ficha seleccionada |
| `m3MatchGlow` | `keyframes` + 1 iteration | Brillo de coincidencia 3+ |
| `m3SwapPop` | `keyframes` + 1 iteration | Contracción/expansión en swap |
| `m3Shake` | `keyframes` + 1 iteration | Sacudida cuando el swap no forma match |
| `m3FallIn` | `keyframes` + 1 iteration | Caída desde arriba de fichas nuevas |
| `m3FlyToBin` | `keyframes` + 1 iteration | Trayectoria del fantasma hacia la caneca |
| `m3Celebrate` | `keyframes` + 1 iteration | Rebote de celebración de la caneca |
| `m3CelebrateGlow` | `keyframes` + 1 iteration | Destello radial detrás de la caneca |
| `m3ComboAppear` | `keyframes` + `forwards` | Popup de cadena que aparece y se desvanece |
| `m3Spin` | `keyframes` + `infinite` | Spinner de carga |
| `transition` | `transform`, `box-shadow`, `opacity` | Transiciones suaves en hover/active/flying |

---
