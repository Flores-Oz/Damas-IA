import Phaser from "phaser";
import type { Piece } from "../../core/Piece";
import { GAME_THEME } from "../ui/GameTheme";

export class PieceRenderer {

    private readonly scene: Phaser.Scene;

    constructor(
        scene: Phaser.Scene
    ) {
        this.scene = scene;
    }

    public render(
        x: number,
        y: number,
        piece: Piece,
        tileSize: number
    ): void {
        const radius = tileSize * 0.35;
        const isHuman = piece.player === "human";
        const fillColor = isHuman
            ? GAME_THEME.humanPiece
            : GAME_THEME.aiPiece;
        const edgeColor = isHuman
            ? GAME_THEME.humanEdge
            : GAME_THEME.aiEdge;

        this.scene.add.circle(
            x + 2,
            y + 4,
            radius + 1,
            0x000000,
            0.38
        );

        this.scene.add.circle(
            x,
            y,
            radius,
            fillColor
        ).setStrokeStyle(3, edgeColor);

        this.scene.add.circle(
            x,
            y,
            radius - 7,
            fillColor,
            0
        ).setStrokeStyle(2, edgeColor, 0.58);

        this.scene.add.ellipse(
            x - radius * 0.2,
            y - radius * 0.3,
            radius * 0.95,
            radius * 0.38,
            0xffffff,
            isHuman ? 0.2 : 0.09
        );

        if (piece.king) {
            this.scene.add.circle(
                x,
                y,
                radius - 10,
                GAME_THEME.gold,
                0.2
            );

            this.scene.add.text(
                x,
                y + 1,
                "♛",
                {
                    fontFamily: "Georgia, serif",
                    fontSize: `${Math.round(tileSize * 0.48)}px`,
                    color: isHuman
                        ? "#62471f"
                        : "#f6d896"
                }
            ).setOrigin(0.5);
        }
    }
}
