# Documentación Técnica — Agente por Objetivos (Minimax)
### Proyecto: Damas IA · Segundo Semestre 2026

---

## Índice

1. [Contexto del proyecto](#1-contexto-del-proyecto)
2. [Arquitectura de agentes](#2-arquitectura-de-agentes)
3. [¿Qué es Minimax?](#3-qué-es-minimax)
4. [Implementación paso a paso](#4-implementación-paso-a-paso)
   - 4.1 [Punto de entrada — `chooseMove()`](#41-punto-de-entrada--choosemove)
   - 4.2 [Simulación de movimientos — `simulateMove()`](#42-simulación-de-movimientos--simulatemove)
   - 4.3 [Función de evaluación — `evaluate()`](#43-función-de-evaluación--evaluate)
   - 4.4 [Algoritmo Minimax — `minimax()`](#44-algoritmo-minimax--minimax)
5. [Estructuras de soporte](#5-estructuras-de-soporte)
   - 5.1 [`Board.clone()`](#51-boardclone)
   - 5.2 [`Board.applyMove()`](#52-boardapplymove)
6. [Regla de empate por 40 movimientos](#6-regla-de-empate-por-40-movimientos)
7. [Comparación: Reactivo vs. Objetivos](#7-comparación-reactivo-vs-objetivos)
8. [Limitaciones y posibles mejoras](#8-limitaciones-y-posibles-mejoras)

---

## 1. Contexto del proyecto

El proyecto implementa el juego de **damas inglesas** (8×8) con dos tipos de agentes de IA que el usuario puede seleccionar desde la interfaz:

| Agente | Tipo | Archivo |
|---|---|---|
| Agente Reactivo | Condición–Acción | `ReactiveAgent.ts` |
| Agente por Objetivos | Búsqueda Minimax | `GoalAgent.ts` |

Ambos implementan la interfaz común `Agent`:

```typescript
export interface Agent {
    chooseMove(gameState: GameState): Move | null;
}
```

Esto permite intercambiarlos sin modificar el motor del juego (`GameScene.ts`).

---

## 2. Arquitectura de agentes

```
             Agent (interfaz)
             chooseMove(gameState): Move | null
                    │
          ┌─────────┴─────────┐
          │                   │
   ReactiveAgent          GoalAgent
   (condición-acción)    (Minimax)
          │                   │
   4 reglas:             chooseMove()
   1. Capturar               │
   2. Coronar            simulateMove()
   3. Escapar                │
   4. Avanzar            minimax()
   default: moves[0]         │
                         evaluate()
```

El `GameScene` llama a `aiAgent.chooseMove(gameState)` sin saber qué agente está ejecutando. Esta abstracción es el patrón **Strategy** (polimorfismo de interfaz).

---

## 3. ¿Qué es Minimax?

Minimax es un algoritmo de **búsqueda adversarial** para juegos de dos jugadores de suma cero. Su premisa:

- El jugador **maximizador** (IA) quiere la puntuación más **alta**.
- El jugador **minimizador** (humano) quiere la puntuación más **baja**.
- Ambos juegan de forma **óptima** dentro del árbol de búsqueda.

### Árbol de búsqueda (profundidad = 2)

```
                 Estado actual (IA mueve)
                /         |         \
           Move A       Move B     Move C        ← maximizar
           /    \       /    \       /   \
        A1      A2    B1     B2   C1     C2      ← minimizar
        │        │     │      │    │      │
      eval    eval   eval   eval  eval  eval
```

El algoritmo retrocede (backpropagation) puntuaciones: el minimizador elige el mínimo en su nivel; el maximizador elige el máximo en el suyo.

La IA elige el movimiento raíz cuya hoja tiene la puntuación más alta después de que el humano haya respondido de forma óptima.

---

## 4. Implementación paso a paso

### 4.1 Punto de entrada — `chooseMove()`

```typescript
public chooseMove(gameState: GameState): Move | null {

    const player = gameState.getCurrentPlayer();
    const moves = CheckersRules.getAllValidMoves(gameState.board, player);

    if (moves.length === 0) return null;

    let bestMove: Move | null = null;
    let bestScore = -Infinity;

    for (const move of moves) {

        const resultingBoards = this.simulateMove(gameState.board, move);

        let moveScore = -Infinity;

        for (const resultingBoard of resultingBoards) {
            const score = this.minimax(
                resultingBoard,
                this.getOpponent(player),  // siguiente turno: humano
                player,                    // quién es el maximizador
                this.maxDepth - 1          // profundidad = 3 niveles más
            );
            moveScore = Math.max(moveScore, score);
        }

        if (moveScore > bestScore) {
            bestScore = moveScore;
            bestMove = move;
        }
    }

    return bestMove;
}
```

**Puntos clave:**
- `maxDepth = 4` → la IA analiza hasta **4 niveles** de movimientos futuros.
- `simulateMove()` puede devolver **múltiples tableros** porque una captura puede continuar (capturas múltiples).
- Se elige el `move` raíz con el mayor `moveScore`.

---

### 4.2 Simulación de movimientos — `simulateMove()`

Este método resuelve un problema crítico: **el tablero real no debe modificarse** durante la búsqueda.

```typescript
private simulateMove(board: Board, move: Move): Board[] {

    const simulation = board.clone();   // copia independiente
    simulation.applyMove(move);         // aplica el movimiento

    // Movimiento simple (sin captura) → un solo tablero resultado
    if (move.captured === undefined) {
        return [simulation];
    }

    // Si hubo coronación → la secuencia de capturas termina
    const originalPiece = board.getCell(move.from.row, move.from.column);
    const movedPiece    = simulation.getCell(move.to.row, move.to.column);

    if (originalPiece !== null && !originalPiece.king && movedPiece!.king) {
        return [simulation];
    }

    // Buscar capturas adicionales desde la nueva posición
    const nextCaptures = CheckersRules.getCapturesForPiece(
        simulation, move.to.row, move.to.column
    );

    if (nextCaptures.length === 0) return [simulation];

    // Expandir cada captura adicional recursivamente
    const results: Board[] = [];
    for (const nextCapture of nextCaptures) {
        results.push(...this.simulateMove(simulation, nextCapture));
    }

    return results;
}
```

**¿Por qué devuelve un array?**

En damas, una captura puede encadenarse con otras. Si la pieza puede capturar de 3 formas distintas:

```
        ●  ←  pieza IA después de primera captura
       / \
     B1   B2       ← segunda captura posible
     │     │
    C1    C2       ← tercera captura posible
```

`simulateMove()` expande **todas las ramas** y devuelve los tableros finales de cada secuencia. Minimax evalúa todos y elige el mejor.

---

### 4.3 Función de evaluación — `evaluate()`

Cuando se alcanza la profundidad máxima o un estado terminal, se puntúa el tablero:

```typescript
private evaluate(board: Board, maximizingPlayer: Player): number {

    let score = 0;

    for (let row = 0; row < Board.SIZE; row++) {
        for (let col = 0; col < Board.SIZE; col++) {

            const piece = board.getCell(row, col);
            if (piece === null) continue;

            // Reina (dama) vale 3 puntos, ficha normal vale 1
            let value = piece.king ? 3 : 1;

            // Bono de posición: fichas normales más cerca de coronar valen más
            if (!piece.king) {
                if (piece.player === "ai") {
                    value += row * 0.1;           // IA avanza hacia fila 7
                } else {
                    value += (Board.SIZE - 1 - row) * 0.1;  // humano avanza hacia fila 0
                }
            }

            // Suma si es aliada, resta si es enemiga
            if (piece.player === maximizingPlayer) {
                score += value;
            } else {
                score -= value;
            }
        }
    }

    return score;
}
```

**Tabla de valores:**

| Pieza | Valor base | Bono máximo de posición | Total máximo |
|---|---|---|---|
| Ficha normal | 1 | 0.7 (fila 7) | 1.7 |
| Dama (king) | 3 | 0 (no aplica) | 3.0 |

Esto hace que el agente **prefiera coronar** porque una dama vale casi el doble que dos fichas en fila inicial.

---

### 4.4 Algoritmo Minimax — `minimax()`

```typescript
private minimax(
    board: Board,
    currentPlayer: Player,    // quién mueve ahora en este nodo
    maximizingPlayer: Player, // quién es la IA (constante)
    depth: number
): number {

    const moves = CheckersRules.getAllValidMoves(board, currentPlayer);

    // ─── Casos base ────────────────────────────────────────────────
    if (depth === 0 || moves.length === 0) {

        // Sin movimientos → el jugador actual pierde
        if (moves.length === 0) {
            return currentPlayer === maximizingPlayer ? -1000 : 1000;
        }

        // Profundidad agotada → evaluar tablero
        return this.evaluate(board, maximizingPlayer);
    }

    // ─── Nodo maximizador (turno de la IA) ─────────────────────────
    if (currentPlayer === maximizingPlayer) {

        let bestScore = -Infinity;

        for (const move of moves) {
            for (const board of this.simulateMove(board, move)) {
                const score = this.minimax(board, opponent, maximizingPlayer, depth - 1);
                bestScore = Math.max(bestScore, score);
            }
        }

        return bestScore;
    }

    // ─── Nodo minimizador (turno del humano) ───────────────────────
    let bestScore = Infinity;

    for (const move of moves) {
        for (const board of this.simulateMove(board, move)) {
            const score = this.minimax(board, opponent, maximizingPlayer, depth - 1);
            bestScore = Math.min(bestScore, score);
        }
    }

    return bestScore;
}
```

**Casos terminales:**

| Condición | Valor retornado |
|---|---|
| `depth === 0` | `evaluate()` — heurística |
| `moves.length === 0` y es turno del maximizador | `-1000` (IA pierde) |
| `moves.length === 0` y es turno del minimizador | `+1000` (IA gana) |

**Flujo de un turno completo:**

```
chooseMove()
    │
    ├── Para cada move raíz:
    │       simulateMove() → tablero(s) resultado
    │       minimax(tablero, HUMANO, IA, 3)
    │           │
    │           ├── Para cada move del humano:
    │           │       simulateMove() → tablero(s)
    │           │       minimax(tablero, IA, IA, 2)
    │           │           │
    │           │           ├── Para cada move de la IA:
    │           │           │       simulateMove() → tablero(s)
    │           │           │       minimax(tablero, HUMANO, IA, 1)
    │           │           │           │
    │           │           │           └── minimax(tablero, IA, IA, 0)
    │           │           │                   → evaluate()
    │           │           └── MAX de scores
    │           └── MIN de scores
    └── Elegir move con MAX score
```

---

## 5. Estructuras de soporte

### 5.1 `Board.clone()`

```typescript
public clone(): Board {
    const clonedBoard = new Board();

    for (let row = 0; row < Board.SIZE; row++) {
        for (let col = 0; col < Board.SIZE; col++) {
            const piece = this.getCell(row, col);

            clonedBoard.setCell(row, col,
                piece === null
                    ? null
                    : { player: piece.player, king: piece.king }  // deep copy
            );
        }
    }

    return clonedBoard;
}
```

> [!IMPORTANT]
> El `clone()` hace una **copia profunda** de cada `Piece` (nuevo objeto `{ player, king }`), no una referencia. Sin esto, modificar el tablero simulado afectaría el tablero real.

### 5.2 `Board.applyMove()`

```typescript
public applyMove(move: Move): void {
    this.movePiece(move.from.row, move.from.column, move.to.row, move.to.column);

    if (move.captured) {
        this.removePiece(move.captured.row, move.captured.column);
    }

    if (this.shouldPromote(move.to.row, move.to.column)) {
        this.promotePiece(move.to.row, move.to.column);
    }
}
```

Aplica un `Move` completo: traslado + eliminación de capturada + promoción si corresponde. Solo se usa dentro de la simulación; el juego real usa `executeMove()` en `GameScene`.

---

## 6. Regla de empate por 40 movimientos

Para evitar partidas infinitas (especialmente entre damas/reyes), se implementó en `GameState`:

```typescript
private movesWithoutProgress = 0;
private readonly drawLimit = 40;

public registerProgress(captured: boolean, promoted: boolean): void {
    if (captured || promoted) {
        this.movesWithoutProgress = 0;  // hubo progreso → resetear
        return;
    }
    this.movesWithoutProgress++;        // sin progreso → acumular
}

public isDraw(): boolean {
    return this.movesWithoutProgress >= this.drawLimit;
}
```

**Lógica de registro:** se llama una vez por turno completo (incluyendo capturas múltiples), no una vez por captura individual.

```
Turno con captura múltiple (3 capturas):
  executeMove() × 3   → cada uno marca turnHadCapture = true
  finishTurn()        → registerProgress(true, false) → contador = 0

Turno sin captura ni coronación:
  executeMove() × 1   → ningún flag activado
  finishTurn()        → registerProgress(false, false) → contador++
```

---

## 7. Comparación: Reactivo vs. Objetivos

| Característica | Agente Reactivo | Agente por Objetivos |
|---|---|---|
| **Tipo** | Condición–Acción | Búsqueda adversarial |
| **Horizonte** | Estado actual únicamente | 4 niveles hacia el futuro |
| **Modelo del oponente** | No modela al humano | Asume que el humano juega óptimo |
| **Reglas** | 4 reglas + default | Función de evaluación |
| **Captura** | Sí (Regla 1) | Sí (maximiza score) |
| **Coronación** | Sí (Regla 2) | Sí (king = 3 pts vs 1) |
| **Velocidad** | Instantánea | ~500 ms por turno (profundidad 4) |
| **Fortaleza** | Media | Alta |
| **Explotable** | Sí (no anticipa) | Difícil (anticipa 4 turnos) |

### Decisión de ejemplo

```
Situación:
  □ □ □ □
    ●       ← IA, puede capturar hacia derecha
      ○     ← humano capturado
  ●         ← IA, puede avanzar

Reactivo:   elige captura (Regla 1 → CAPTURAR)
Minimax:    evalúa AMBOS caminos a 4 niveles
            puede elegir avanzar si la captura
            lleva a una posición peor para la IA
```

El Minimax puede en ocasiones **no capturar** si anticipar la respuesta del humano lleva a un resultado global mejor.

---

## 8. Limitaciones y posibles mejoras

### Limitaciones actuales

| Limitación | Impacto |
|---|---|
| Profundidad fija (4) | En finales con pocas piezas podría profundizar más |
| Sin poda Alfa-Beta | Evalúa nodos que Alfa-Beta eliminaría → más lento |
| Sin tabla de transposición | Puede evaluar el mismo estado varias veces |
| Minimax no considera empate interno | El agente no sabe que se acerca a las 40 jugadas |

### Mejoras posibles (no implementadas)

**Poda Alfa-Beta** — reduciría el árbol de búsqueda hasta un 50%:

```
minimax(α, β):
    if score >= β: return score  // poda β (rama del maximizador)
    if score <= α: return score  // poda α (rama del minimizador)
```

**Profundidad dinámica** — aumentar `maxDepth` cuando quedan pocas piezas:

```typescript
const remainingPieces = board.countPieces("ai") + board.countPieces("human");
const depth = remainingPieces <= 6 ? 6 : 4;
```

**Función de evaluación extendida** — añadir términos como control del centro, piezas protegidas o movilidad.

---

> **Archivos relevantes del proyecto:**
> - [`GoalAgent.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/agents/GoalAgent.ts) — Minimax completo
> - [`ReactiveAgent.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/agents/ReactiveAgent.ts) — Agente reactivo
> - [`Agent.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/agents/Agent.ts) — Interfaz común
> - [`Board.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/core/Board.ts) — `clone()` y `applyMove()`
> - [`GameState.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/core/GameState.ts) — Regla de empate
