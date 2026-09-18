import Phaser from "phaser";
import { GameScene } from "./game/scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,

    width: 800,
    height: 600,

    backgroundColor: "#1a1a1a",

    scene: [
        GameScene
    ]
};

new Phaser.Game(config);