import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, 755, "Damas IA — Documentación Técnica de Arquitectura y Agente Reactivo")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(40, 747, 572, 747)

        # Footer
        page_text = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(572, 35, page_text)
        self.drawString(40, 35, "Primer Proyecto IA - Segundo Semestre 2026")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 47, 572, 47)
        self.restoreState()

def build_pdf():
    pdf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "Documentacion_Damas_IA.pdf"))
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=25,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#475569"),
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0369a1"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderPadding=6,
        spaceAfter=8,
        spaceBefore=4
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e40af"),
        backColor=colors.HexColor("#eff6ff"),
        borderColor=colors.HexColor("#3b82f6"),
        borderWidth=1,
        borderPadding=6,
        spaceAfter=8,
        spaceBefore=6
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("Damas IA: Arquitectura, Motor y Agente Reactivo", title_style))
    story.append(Paragraph("Memoria Técnica de Construcción, Decisiones de Diseño y Guía de Modificaciones", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2563eb"), spaceAfter=12))

    # Meta Info Table
    meta_data = [
        [
            Paragraph("<b>Proyecto:</b> Damas con Inteligencia Artificial", body_style),
            Paragraph("<b>Ciclo:</b> Segundo Semestre 2026", body_style)
        ],
        [
            Paragraph("<b>Stack:</b> TypeScript, Phaser 3, Vite", body_style),
            Paragraph("<b>Estado:</b> Sprint 1 Finalizado (Reglas + Agente Reactivo)", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[266, 266])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Section 1
    story.append(Paragraph("1. Principio Fundamental: Desacoplamiento Phaser vs. Motor", h1_style))
    story.append(Paragraph(
        "Desde la concepción del proyecto se estableció una distinción rigurosa: <b>Phaser no sabe jugar damas</b>. "
        "Phaser es exclusivamente la capa de visualización e interacción de entrada/salida (I/O). Toda la lógica formal "
        "del juego reside en un motor agnóstico en TypeScript puro, sin referencias a Phaser.",
        body_style
    ))
    story.append(Paragraph(
        "<i>«El motor calcula qué es legal; el agente decide qué jugada prefiere; Phaser simplemente refleja el estado resultante y recibe clics.»</i>",
        callout_style
    ))
    story.append(Paragraph(
        "Esta separación permite que tanto el agente reactivo como futuros algoritmos (Minimax) evalúen partidas "
        "sin necesidad de simular sprites o interfaces gráficas, consumiendo únicamente el estado del juego (<code>GameState</code>).",
        body_style
    ))

    # Section 2
    story.append(Paragraph("2. Módulos y Responsabilidades del Sistema", h1_style))
    modules_data = [
        [Paragraph("<b>Capa / Archivo</b>", body_style), Paragraph("<b>Responsabilidad Primaria</b>", body_style)],
        [Paragraph("<code>core/Piece.ts</code>", body_style), Paragraph("Tipos de jugador (<code>'human' | 'ai'</code>) y pieza (<code>player, king: boolean</code>).", body_style)],
        [Paragraph("<code>core/Move.ts</code>", body_style), Paragraph("Coordenadas <code>from</code>, <code>to</code> y ficha capturada opcional (<code>captured</code>).", body_style)],
        [Paragraph("<code>core/Board.ts</code>", body_style), Paragraph("Matriz 8x8, verificación de bordes, coronaciones, eliminación y clonación profunda.", body_style)],
        [Paragraph("<code>core/GameState.ts</code>", body_style), Paragraph("Controlador del estado: tablero activo, turno (<code>currentPlayer</code>) y cálculo de ganador.", body_style)],
        [Paragraph("<code>rules/CheckersRules.ts</code>", body_style), Paragraph("Movimientos simples, capturas, toma obligatoria global y reyes bidireccionales.", body_style)],
        [Paragraph("<code>agents/Agent.ts</code>", body_style), Paragraph("Interfaz polimórfica base: <code>chooseMove(gameState): Move | null</code>.", body_style)],
        [Paragraph("<code>agents/ReactiveAgent.ts</code>", body_style), Paragraph("Agente basado en reglas condición–acción (Captura > Corona > Amenaza > Avance).", body_style)],
        [Paragraph("<code>game/scenes/GameScene.ts</code>", body_style), Paragraph("Escena Phaser: interacción con mouse, orquestación física y temporizadores visibles.", body_style)],
        [Paragraph("<code>game/board/BoardRenderer.ts</code>", body_style), Paragraph("Renderizado de casillas, fichas, coronas (♛) y recuadros verdes de resaltado.", body_style)]
    ]
    mod_table = Table(modules_data, colWidths=[160, 372])
    mod_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(mod_table)

    # Section 3
    story.append(Paragraph("3. Cronología de Reglas y Mecánicas Implementadas (Sprint 1)", h1_style))
    story.append(Paragraph("• <b>Movimiento Diagonal y Tablero 8x8:</b> Solo se juega sobre casillas oscuras <code>(row + column) % 2 !== 0</code>. Fichas normales avanzan 1 casilla diagonal.", bullet_style))
    story.append(Paragraph("• <b>Capturas y Eliminación:</b> Salto de 2 casillas sobre pieza enemiga. Al completarse, la ficha es retirada de la matriz mediante <code>board.removePiece()</code>.", bullet_style))
    story.append(Paragraph("• <b>Toma Obligatoria Global (<code>hasAnyCapture</code>):</b> Si cualquier ficha del jugador en turno puede capturar, se bloquean todos los movimientos simples del jugador. No se requiere lógica en la vista: el motor devuelve únicamente las capturas legales.", bullet_style))
    story.append(Paragraph("• <b>Captura Múltiple Encadenada:</b> Tras un salto, se evalúa <code>getCapturesForPiece</code> sobre la nueva coordenada. Si hay saltos subsiguientes, se asigna <code>forcedPiece</code> y se retiene el turno en la misma ficha.", bullet_style))
    story.append(Paragraph("• <b>Coronación y Reyes (<code>king: boolean</code>):</b> Al llegar a la fila opuesta (0 para blanco, 7 para negro), la pieza corona (♛) y puede desplazarse o capturar en las 4 diagonales. Si corona en un salto, la jugada termina ahí por regla explícita.", bullet_style))
    story.append(Paragraph("• <b>Fin de Partida (<code>getWinner</code>):</b> Se pierde por aniquilación total de fichas (<code>countPieces === 0</code>) o por bloqueo/ahogado (<code>getAllValidMoves().length === 0</code>).", bullet_style))
    story.append(Paragraph("• <b>Pausas Visuales para la IA (500 ms):</b> Se integró <code>this.time.delayedCall(500, ...)</code> en Phaser para que las decisiones y saltos múltiples de la computadora sean visibles y comprensibles para el usuario.", bullet_style))
    story.append(Paragraph("• <b>Clonación de Tableros (<code>Board.clone</code>):</b> Duplicación profunda de celdas e instancias de piezas para sustentar la simulación de estados hipotéticos en Minimax sin alterar la partida real.", bullet_style))

    # Section 4
    story.append(Paragraph("4. Arquitectura Interna del Agente Reactivo Simple", h1_style))
    story.append(Paragraph(
        "El <code>ReactiveAgent</code> satisface estrictamente la definición académica de Russell & Norvig: "
        "opera como un sistema de producción basado en reglas <b>Condición–Acción</b> evaluadas en orden de prioridad fija:",
        body_style
    ))
    
    rules_table_data = [
        [Paragraph("<b>Prioridad</b>", body_style), Paragraph("<b>Regla</b>", body_style), Paragraph("<b>Condición (Percepción)</b>", body_style), Paragraph("<b>Acción Ejecutada</b>", body_style)],
        [Paragraph("<b>1</b>", body_style), Paragraph("Captura", body_style), Paragraph("<code>move.captured !== undefined</code>", body_style), Paragraph("Ejecuta el salto de captura.", body_style)],
        [Paragraph("<b>2</b>", body_style), Paragraph("Coronación", body_style), Paragraph("Ficha normal alcanza fila 0 o 7.", body_style), Paragraph("Mueve hacia la casilla de coronación.", body_style)],
        [Paragraph("<b>3</b>", body_style), Paragraph("Evasión", body_style), Paragraph("<code>isPieceThreatened() === true</code>", body_style), Paragraph("Mueve la ficha amenazada para escapar.", body_style)],
        [Paragraph("<b>4</b>", body_style), Paragraph("Avance", body_style), Paragraph("Ficha normal que puede avanzar.", body_style), Paragraph("Prioriza la ficha más adelantada (<code>findAdvanceMove</code>).", body_style)],
        [Paragraph("<b>5</b>", body_style), Paragraph("Default", body_style), Paragraph("Ninguna condición anterior activa.", body_style), Paragraph("Ejecuta primer movimiento legal (<code>moves[0]</code>).", body_style)]
    ]
    r_table = Table(rules_table_data, colWidths=[55, 80, 200, 197])
    r_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(r_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Limitaciones Deliberadas del Agente Reactivo:</b>", body_style))
    story.append(Paragraph("1. <b>Ceguera hacia el futuro (Horizonte = 0):</b> Al intentar salvar una ficha amenazada (Regla 3), la mueve al primer destino legal disponible sin verificar si ese nuevo casillero también está amenazado.", bullet_style))
    story.append(Paragraph("2. <b>Vulnerabilidad a celadas / señuelos:</b> Si el jugador le ofrece una pieza como sacrificio para descolocarlo, el agente la comerá obligatoriamente por sus reglas y caerá en la trampa.", bullet_style))
    story.append(Paragraph("3. <b>Ausencia de función de utilidad global:</b> No calcula balances de piezas ni probabilidades de victoria; sus decisiones son puramente inmediatas.", bullet_style))

    # Section 5
    story.append(Paragraph("5. Guía de Modificaciones Rápidas (Respuestas a Evaluadores)", h1_style))
    story.append(Paragraph(
        "Si los evaluadores o el docente solicitan ajustes en la lógica, aquí está exactamente dónde y cómo intervenir:",
        body_style
    ))

    story.append(Paragraph("A. Si piden que la captura sea opcional (no obligatoria):", h2_style))
    story.append(Paragraph(
        "En <code>src/rules/CheckersRules.ts</code>, dentro de <code>getValidMoves()</code>, eliminar la condición <code>if (playerMustCapture) return captures;</code> y en su lugar retornar <code>[...captures, ...this.getNormalMoves(board, row, column)]</code>.",
        body_style
    ))

    story.append(Paragraph("B. Si piden cambiar el perfil del agente (más defensivo o conservador):", h2_style))
    story.append(Paragraph(
        "En <code>src/agents/ReactiveAgent.ts</code>, dentro de <code>chooseMove()</code>, basta con intercambiar el orden de evaluación: colocar la <b>Regla 3 (Evasión)</b> antes de la <b>Regla 2 (Coronación)</b>, o priorizar fichas que permanezcan en bordes protectores.",
        body_style
    ))

    story.append(Paragraph("C. Si piden cambiar la velocidad de juego de la IA:", h2_style))
    story.append(Paragraph(
        "En <code>src/game/scenes/GameScene.ts</code>, modificar los valores de <code>500</code> en <code>this.time.delayedCall(500, ...)</code> a <code>200</code> (ultrarrápido) o <code>1000</code> (pausado didáctico).",
        body_style
    ))

    story.append(Paragraph("D. Si piden que las reinas vuelen a cualquier distancia (Damas Internacionales):", h2_style))
    story.append(Paragraph(
        "En <code>src/rules/CheckersRules.ts</code>, en <code>getNormalMoves</code> y <code>getCaptureMoves</code>, en vez de desplazarse solo 1 o 2 casillas fijas, iterar con un bucle <code>while (board.isInside(...))</code> en cada diagonal hasta topar con obstáculo.",
        body_style
    ))

    # Section 6
    story.append(Paragraph("6. Cuadro Comparativo: Agente Reactivo vs. Agente por Objetivos (Minimax)", h1_style))
    comp_data = [
        [Paragraph("<b>Criterio</b>", body_style), Paragraph("<b>Agente Reactivo Simple (S1)</b>", body_style), Paragraph("<b>Agente por Objetivos / Minimax (S2)</b>", body_style)],
        [Paragraph("<b>Filosofía</b>", body_style), Paragraph("Reglas Condición–Acción (If-Then).", body_style), Paragraph("Búsqueda adversarial en árbol de estados.", body_style)],
        [Paragraph("<b>Horizonte</b>", body_style), Paragraph("Inmediato (t = 0). No predice.", body_style), Paragraph("Profundidad d (t = 1, 2, ... d). Anticipa al rival.", body_style)],
        [Paragraph("<b>Evaluación</b>", body_style), Paragraph("Precedencia fija de reglas cualitativas.", body_style), Paragraph("Función heurística cuantitativa (material + posición).", body_style)],
        [Paragraph("<b>Uso de Recursos</b>", body_style), Paragraph("Tiempo O(1), Memoria O(1). Instantáneo.", body_style), Paragraph("Tiempo O(b^d), requiere poda Alfa-Beta para optimizar.", body_style)],
        [Paragraph("<b>Comportamiento</b>", body_style), Paragraph("Mecánico, agresivo pero explotable.", body_style), Paragraph("Estratégico, precavido y capaz de tender trampas.", body_style)]
    ]
    comp_table = Table(comp_data, colWidths=[110, 210, 212])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(comp_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generado con éxito en: {pdf_path}")

if __name__ == "__main__":
    build_pdf()
