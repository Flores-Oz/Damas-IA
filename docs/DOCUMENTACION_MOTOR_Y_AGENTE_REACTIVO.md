# Damas IA: Arquitectura, Motor y Agente Reactivo
**Memoria Técnica de Construcción, Decisiones de Diseño y Guía de Modificaciones**  
*Primer Proyecto de Inteligencia Artificial — Segundo Semestre 2026*

---

## 1. Principio Fundamental: Desacoplamiento Phaser vs. Motor

Desde la concepción del proyecto se estableció una distinción rigurosa: **Phaser no sabe jugar damas**. 

- **Phaser 3** es exclusivamente la capa de visualización e interacción de entrada/salida (I/O). Se encarga de dibujar el canvas, los círculos de las fichas, los textos y escuchar eventos de clic del mouse.
- **Motor de Damas (TypeScript puro):** Toda la lógica formal reside en módulos agnósticos que no importan Phaser (`Board.ts`, `Piece.ts`, `Move.ts`, `GameState.ts`, `CheckersRules.ts`).

> **Regla de oro de la arquitectura:**  
> *El motor calcula qué es legal; el agente decide qué jugada prefiere; Phaser simplemente refleja el estado resultante y recibe clics.*

---

## 2. Mapa de Módulos y Responsabilidades

| Capa | Archivo | Responsabilidad Primaria |
| :--- | :--- | :--- |
| **Core** | [`Piece.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/core/Piece.ts) | Define los tipos `Player` (`"human" \| "ai"`) y la interfaz `Piece` (`{ player, king: boolean }`). |
| **Core** | [`Move.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/core/Move.ts) | Coordenadas de origen (`from`), destino (`to`) y pieza capturada opcional (`captured`). |
| **Core** | [`Board.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/core/Board.ts) | Matriz 8x8, límites, coronaciones, eliminación de piezas y clonación profunda (`clone()`). |
| **Core** | [`GameState.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/core/GameState.ts) | Estado de partida: tablero activo, alternancia de turnos y cálculo de ganador. |
| **Reglas** | [`CheckersRules.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/rules/CheckersRules.ts) | Movimientos simples, capturas, toma obligatoria global y reinas en 4 diagonales. |
| **Agentes** | [`Agent.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/agents/Agent.ts) | Contrato base polimórfico: `chooseMove(gameState): Move \| null`. |
| **Agentes** | [`ReactiveAgent.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/agents/ReactiveAgent.ts) | Sistema de reglas condición–acción (Captura > Corona > Evasión > Avance > Default). |
| **Juego** | [`GameScene.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/game/scenes/GameScene.ts) | Escena Phaser: interacción con mouse, orquestación física y temporizadores visibles (500 ms). |
| **Juego** | [`BoardRenderer.ts`](file:///c:/Users/Ozzca/OneDrive/Documentos/Segundo%20Semestre%202026/Primer%20Proyecto%20IA/damas-ia/src/game/board/BoardRenderer.ts) | Renderizado gráfico: casillas oscuras/claras, fichas, coronas (♛) y recuadros verdes. |

---

## 3. Cronología de Reglas y Mecánicas Implementadas (Sprint 1)

1. **Movimiento Diagonal y Tablero 8x8:**  
   Se juega únicamente en casillas oscuras `(row + column) % 2 !== 0`. Fichas peón avanzan 1 casilla diagonal hacia el campo rival.
2. **Captura Individual y Eliminación:**  
   Salto de 2 casillas sobre pieza contraria aterrizando en casilla vacía. Se retira la pieza comida mediante `board.removePiece()`.
3. **Toma Obligatoria Global (`hasAnyCapture`):**  
   Si cualquier ficha del jugador en turno puede comer, todas las jugadas simples quedan bloqueadas. El motor solo devuelve capturas en `getAllValidMoves()`.
4. **Capturas Múltiples Encadenadas:**  
   Tras un salto, `CheckersRules.getCapturesForPiece()` evalúa si la misma ficha en su nueva posición puede volver a saltar. Si es así, se activa `forcedPiece` y se mantiene el turno en esa ficha.
5. **Coronación y Reyes (`king: boolean`):**  
   Al alcanzar el extremo opuesto (fila 0 para blancas, 7 para negras), la ficha corona y adquiere movimiento y captura en las 4 diagonales.
6. **Fin de Partida (`getWinner`):**  
   Se pierde por aniquilación total de fichas (`countPieces === 0`) o por bloqueo/ahogado (`getAllValidMoves().length === 0`).
7. **Pausas Visuales para la IA:**  
   Se incluyeron retrasos de 500 ms mediante `this.time.delayedCall(500, ...)` en Phaser para que los saltos de la IA sean perceptibles y comprensibles para el usuario.
8. **Clonación Profunda (`Board.clone()`):**  
   Copia por valor de cada celda y ficha, requisito indispensable para el Sprint 2 de Minimax.

---

## 4. Arquitectura del Agente Reactivo Simple

El `ReactiveAgent` cumple la definición teórica de Russell & Norvig: opera como un sistema de producción basado en reglas **Condición–Acción** evaluadas en orden de prioridad fija sobre el estado presente:

```text
ESTADO ACTUAL (GameState)
     │
     ▼
Movimientos Legales (CheckersRules.getAllValidMoves)
     │
     ├── REGLA 1: ¿Existe captura?
     │              └── SÍ ──► Ejecutar captura
     │
     ├── REGLA 2: ¿Puede coronar?
     │              └── SÍ ──► Mover hacia coronación
     │
     ├── REGLA 3: ¿Ficha propia amenazada? (isPieceThreatened)
     │              └── SÍ ──► Mover la ficha en peligro
     │
     ├── REGLA 4: ¿Fichas normales que puedan avanzar? (findAdvanceMove)
     │              └── SÍ ──► Avanzar la ficha más cercana a la meta
     │
     └── REGLA POR DEFECTO:
                    └── Primer movimiento legal disponible (moves[0])
```

### Limitaciones Deliberadas del Agente Reactivo
- **Horizonte Temporal Cero (t = 0):** No predice el futuro ni anticipa qué hará el humano después.
- **Vulnerable a trampas y señuelos:** Si el jugador le ofrece una pieza como sacrificio, el agente la comerá obligatoriamente y caerá en la emboscada.
- **Evasión sin verificación de destino seguro:** Si una ficha está amenazada, la mueve al primer destino legal disponible sin comprobar si esa casilla también es vulnerable.

---

## 5. Guía de Modificaciones Rápidas (Cheat Sheet para Evaluadores)

Si durante la sustentación o evaluación los profesores solicitan cambios de comportamiento:

### A. Si piden que la captura NO sea obligatoria (Damas Casuales):
- **Archivo:** `src/rules/CheckersRules.ts`
- **Cambio:** En `getValidMoves()`, eliminar `if (playerMustCapture) return captures;` y retornar `[...captures, ...this.getNormalMoves(board, row, column)]`.

### B. Si piden que el Agente sea más Defensivo:
- **Archivo:** `src/agents/ReactiveAgent.ts`
- **Cambio:** En `chooseMove()`, colocar la evaluación de `escapeMove` (Regla 3) antes de `promotionMove` (Regla 2).

### C. Si piden cambiar la velocidad de la IA:
- **Archivo:** `src/game/scenes/GameScene.ts`
- **Cambio:** En `runAiTurn()` y `executeAiMove()`, modificar `500` ms por el valor deseado (ej. `200` para rápido, `1000` para modo presentación).

### D. Si piden "Reinas Voladoras" (Damas Internacionales):
- **Archivo:** `src/rules/CheckersRules.ts`
- **Cambio:** En `getNormalMoves` y `getCaptureMoves`, usar un bucle `while (board.isInside(...))` en cada diagonal para permitir desplazamiento a cualquier distancia hasta topar con un obstáculo.

### E. Si piden expandir el tablero a 10x10:
- **Archivos:** `src/core/Board.ts` (cambiar `SIZE = 10` y filas iniciales) y `src/game/board/BoardRenderer.ts` (ajustar `tileSize = 50`).

---

## 6. Comparativa: Agente Reactivo vs. Agente por Objetivos (Minimax)

| Criterio | Agente Reactivo Simple (Sprint 1) | Agente por Objetivos / Minimax (Sprint 2) |
| :--- | :--- | :--- |
| **Filosofía** | Reglas Condición–Acción (*If-Then*). | Búsqueda adversarial en árbol de estados. |
| **Horizonte** | Inmediato ($t = 0$). No predice. | Profundidad $d$ ($t = 1, 2, \dots, d$). Anticipa respuestas. |
| **Evaluación** | Precedencia cualitativa de reglas. | Función heurística cuantitativa (material + posición). |
| **Consumo de CPU** | $O(1)$ tiempo y memoria. Instantáneo. | Exponencial $O(b^d)$, mitigado con Poda Alfa-Beta. |
| **Comportamiento** | Mecánico, agresivo pero predecible y explotable. | Estratégico, previsor y capaz de tender celadas. |
