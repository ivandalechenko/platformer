import { Stage, Layer, Rect, Image, Group } from "react-konva";
import { useEffect, useRef, useState } from "react";
import gameStore from "./gameStore";
import { observer } from "mobx-react-lite";
import useImage from 'use-image';
import './Scene.scss';
import pingService from "./pingService";

export default observer(() => {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [bg] = useImage('/img/bgMeme.png', 'anonymous');
    const [face] = useImage('/img/face.jpg', 'anonymous');
    const [bgSize, setBgSize] = useState({ w: 0, h: 0 });

    const stageRef = useRef();

    useEffect(() => {
        if (bg) setBgSize({ w: bg.width, h: bg.height });
    }, [bg]);

    useEffect(() => {
        const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        let frameId;
        const render = () => {
            gameStore.addFrame();
            stageRef.current?.batchDraw();
            frameId = requestAnimationFrame(render);
            // gameStore.getInterpolatedPlayers()
        };
        render();
        return () => cancelAnimationFrame(frameId);
    }, []);

    const scale = 1;

    // const map = gameStore.getInterpolatedMap();
    const players = gameStore.getInterpolatedPlayers();
    const me = players[gameStore.username] || { x: 0, y: 0 };

    const bgScale = (size.height * 1.5) / bgSize.h;
    const bgWidth = bgSize.w * bgScale;
    const bgHeight = bgSize.h * bgScale;
    const bgX = -size.width + ((me.x / 2) * scale);
    const bgY = -size.height / 1.2 + ((me.y / 2) * scale);

    const fps = JSON.parse(gameStore.frames).length;
    const tps = JSON.parse(gameStore.tiks).length;

    return (
        <div className='Scene' style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            <div className='Scene_info'>
                FPS: {fps}
                <br />
                TPS: {tps}
                <br />
                PING: {pingService.ping} SPING: {Math.ceil(gameStore.smoothedPing)}
                <br />
                PLAYERS: {Object.keys(players).length}
                <br />
                SNPCOUNT: {gameStore.snapshots.length}
                <br />
                RENDERDELAY: {gameStore.renderDelay.toFixed(2)}
                <br />
                NOW: {Date.now()}
                <br />
                NOW-RDL: {Date.now() - gameStore.renderDelay}
                <br />
                (NOW-RDL) - (FIRST_TS): {(Date.now() - gameStore.renderDelay) - gameStore.snapshots[0]?.timestamp}
            </div>

            <Stage
                ref={stageRef}
                width={size.width}
                height={size.height}
                x={-me.x * scale + size.width / 2}
                y={-me.y * scale + size.height / 2}
                shadowForStrokeEnabled={false}
                perfectDrawEnabled={false}
            >
                {bg && (
                    <Layer shadowForStrokeEnabled={false}>
                        <Image image={bg} x={bgX} y={bgY} width={bgWidth} height={bgHeight} />
                    </Layer>
                )}

                <Layer shadowForStrokeEnabled={false}>
                    {JSON.parse(gameStore.map).map((obj, i) => {

                        // console.log(obj);
                        return <Rect
                            key={`map-${i}`}
                            x={(obj.x) * scale}
                            y={(obj.y) * scale}
                            width={obj.w * scale}
                            height={obj.h * scale}
                            rotation={obj.rotation} // ← уже в градусах
                            fill={{
                                'wall': '#fff2',
                                'floor': '#AAA',
                                'trampoline': '#22F',
                                'pike': '#f00'
                            }[obj.type] || 'gray'}
                        />
                    })}


                    {face && Object.entries(players).map(([username, { x, y }]) => {
                        const color = `hsla(${+username.replace('user', '') % 360}, 100%, 50%, 0.5)`;

                        return (
                            <Group
                                key={username}
                                x={x * scale}
                                y={y * scale}
                                offsetX={10}
                                offsetY={20}
                            >
                                <Image
                                    image={face}
                                    width={20}
                                    height={40}
                                />
                                <Rect
                                    width={20}
                                    height={40}
                                    fill={color}
                                />
                            </Group>
                        );
                    })}

                </Layer>
            </Stage>
        </div>
    );
});
