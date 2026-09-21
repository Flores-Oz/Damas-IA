import Phaser from "phaser";
import { GameScene } from "./game/scenes/GameScene";
import "./style.css";

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,

    width: 800,
    height: 600,

    parent: "app",

    backgroundColor: "#090d14",

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },

    scene: [
        GameScene
    ]
};

const game = new Phaser.Game(config);

if (import.meta.env.DEV) {
    Object.assign(window, {
        __DAMAS_GAME__: game
    });
}
