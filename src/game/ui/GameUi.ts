import Phaser from "phaser";
import type { Player } from "../../core/Piece";
import { GAME_THEME } from "./GameTheme";

export class GameUi {

    private readonly scene: Phaser.Scene;

    constructor(
        scene: Phaser.Scene
    ) {
        this.scene = scene;
    }

    public renderBackground(): void {
        this.scene.add.rectangle(
            400,
            300,
            800,
            600,
            GAME_THEME.background
        );

        this.scene.add.circle(
            90,
            80,
            180,
            GAME_THEME.gold,
            0.035
        );

        this.scene.add.circle(
            730,
            540,
            230,
            GAME_THEME.aiPiece,
            0.055
        );
    }

    public renderAgentSelection(
        onReactive: () => void,
        onGoal: () => void
    ): void {
        this.renderBackground();

        this.scene.add.text(
            400,
            88,
            "DAMAS IA",
            {
                fontFamily: "Georgia, serif",
                fontSize: "52px",
                fontStyle: "bold",
                color: GAME_THEME.text,
                letterSpacing: 5
            }
        ).setOrigin(0.5);

        this.scene.add.rectangle(
            400,
            134,
            88,
            3,
            GAME_THEME.gold
        );

        this.scene.add.text(
            400,
            174,
            "ELIGE A TU OPONENTE",
            {
                fontFamily: "Arial, sans-serif",
                fontSize: "15px",
                color: GAME_THEME.textMuted,
                letterSpacing: 3
            }
        ).setOrigin(0.5);

        this.createButton(
            400,
            285,
            "AGENTE REACTIVO",
            "Decisiones rápidas basadas en reglas",
            onReactive
        );

        this.createButton(
            400,
            400,
            "AGENTE MINIMAX",
            "Planificación estratégica por objetivos",
            onGoal
        );

        this.scene.add.text(
            400,
            520,
            "Las fichas claras comienzan la partida",
            {
                fontFamily: "Arial, sans-serif",
                fontSize: "14px",
                color: GAME_THEME.textMuted
            }
        ).setOrigin(0.5);
    }

    public renderHud(
        currentPlayer: Player,
        agentName: string,
        humanPieces: number,
        aiPieces: number
    ): void {
        this.scene.add.rectangle(
            400,
            24,
            512,
            34,
            GAME_THEME.surface,
            0.96
        ).setStrokeStyle(1, GAME_THEME.border);

        this.scene.add.text(
            156,
            24,
            currentPlayer === "human"
                ? "TU TURNO"
                : "TURNO DE LA IA",
            {
                fontFamily: "Arial, sans-serif",
                fontSize: "14px",
                fontStyle: "bold",
                color:
                    currentPlayer === "human"
                        ? "#f0cd88"
                        : "#e58b91"
            }
        ).setOrigin(0, 0.5);

        this.scene.add.text(
            400,
            24,
            `${humanPieces}  —  ${aiPieces}`,
            {
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                color: GAME_THEME.text
            }
        ).setOrigin(0.5);

        this.scene.add.text(
            644,
            24,
            agentName.toUpperCase(),
            {
                fontFamily: "Arial, sans-serif",
                fontSize: "12px",
                color: GAME_THEME.textMuted
            }
        ).setOrigin(1, 0.5);
    }

    public renderGameOver(
        message: string,
        subtitle: string,
        onRestart: () => void,
        onMenu: () => void
    ): void {
        this.scene.add.rectangle(
            400,
            300,
            800,
            600,
            0x05070a,
            0.68
        );

        this.scene.add.rectangle(
            400,
            300,
            500,
            330,
            GAME_THEME.surface,
            0.98
        ).setStrokeStyle(2, GAME_THEME.gold);

        this.scene.add.text(
            400,
            205,
            message,
            {
                fontFamily: "Georgia, serif",
                fontSize: "38px",
                fontStyle: "bold",
                color: GAME_THEME.text
            }
        ).setOrigin(0.5);

        this.scene.add.text(
            400,
            250,
            subtitle,
            {
                fontFamily: "Arial, sans-serif",
                fontSize: "15px",
                color: GAME_THEME.textMuted
            }
        ).setOrigin(0.5);

        this.createCompactButton(
            400,
            320,
            "JUGAR DE NUEVO",
            onRestart
        );

        this.createCompactButton(
            400,
            390,
            "VOLVER AL MENÚ",
            onMenu
        );
    }

    private createButton(
        x: number,
        y: number,
        label: string,
        description: string,
        onClick: () => void
    ): void {
        const button = this.scene.add.rectangle(
            x,
            y,
            430,
            86,
            GAME_THEME.surfaceRaised
        );

        button
            .setStrokeStyle(2, GAME_THEME.border)
            .setInteractive({ useHandCursor: true });

        const title = this.scene.add.text(
            x,
            y - 12,
            label,
            {
                fontFamily: "Arial, sans-serif",
                fontSize: "18px",
                fontStyle: "bold",
                color: GAME_THEME.text,
                letterSpacing: 1
            }
        ).setOrigin(0.5);

        const detail = this.scene.add.text(
            x,
            y + 18,
            description,
            {
                fontFamily: "Arial, sans-serif",
                fontSize: "13px",
                color: GAME_THEME.textMuted
            }
        ).setOrigin(0.5);

        button.on("pointerover", () => {
            button
                .setFillStyle(0x263247)
                .setStrokeStyle(2, GAME_THEME.gold);
            title.setColor("#f0cd88");
        });

        button.on("pointerout", () => {
            button
                .setFillStyle(GAME_THEME.surfaceRaised)
                .setStrokeStyle(2, GAME_THEME.border);
            title.setColor(GAME_THEME.text);
        });

        button.on("pointerdown", (
            _pointer: Phaser.Input.Pointer,
            _localX: number,
            _localY: number,
            event: Phaser.Types.Input.EventData
        ) => {
            event.stopPropagation();
            button.disableInteractive();
            title.setAlpha(0.5);
            detail.setAlpha(0.5);
            onClick();
        });
    }

    private createCompactButton(
        x: number,
        y: number,
        label: string,
        onClick: () => void
    ): void {
        const button = this.scene.add.rectangle(
            x,
            y,
            290,
            48,
            GAME_THEME.surfaceRaised
        );

        button
            .setStrokeStyle(1, GAME_THEME.border)
            .setInteractive({ useHandCursor: true });

        const text = this.scene.add.text(
            x,
            y,
            label,
            {
                fontFamily: "Arial, sans-serif",
                fontSize: "15px",
                fontStyle: "bold",
                color: GAME_THEME.text,
                letterSpacing: 1
            }
        ).setOrigin(0.5);

        button.on("pointerover", () => {
            button
                .setFillStyle(0x263247)
                .setStrokeStyle(2, GAME_THEME.gold);
            text.setColor("#f0cd88");
        });

        button.on("pointerout", () => {
            button
                .setFillStyle(GAME_THEME.surfaceRaised)
                .setStrokeStyle(1, GAME_THEME.border);
            text.setColor(GAME_THEME.text);
        });

        button.on("pointerdown", (
            _pointer: Phaser.Input.Pointer,
            _localX: number,
            _localY: number,
            event: Phaser.Types.Input.EventData
        ) => {
            event.stopPropagation();
            button.disableInteractive();
            onClick();
        });
    }
}
