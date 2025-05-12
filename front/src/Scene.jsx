import { Stage, Layer, Rect, Image } from "react-konva";
import { useEffect, useRef, useState } from "react";
import gameStore from "./gameStore";
import { observer } from "mobx-react-lite";
import useImage from 'use-image';
import './Scene.scss';

export default observer(() => {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [bg] = useImage('/img/bg.webp', 'anonymous');
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
        };
        render();
        return () => cancelAnimationFrame(frameId);
    }, []);

    const scale = 1;
    const players = gameStore.getInterpolatedPlayers();
    const map = gameStore.getInterpolatedMap();
    const me = players[gameStore.username] || { x: 0, y: 0 };

    const bgScale = (size.height * 1.5) / bgSize.h;
    const bgWidth = bgSize.w * bgScale;
    const bgHeight = bgSize.h * bgScale;
    const bgX = -size.width - ((me.x / 5) * scale);
    const bgY = -size.height / 1.2 - ((me.y / 5) * scale);

    const fps = JSON.parse(gameStore.frames).length;
    const tps = JSON.parse(gameStore.tiks).length;

    return (
        <div className='Scene' style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            <div className='Scene_info'>
                FPS: {fps}<br />
                TPS: {tps}
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
                        <Image image={bg} x={bgX + bgWidth - 1} y={bgY} width={bgWidth} height={bgHeight} />
                    </Layer>
                )}

                <Layer shadowForStrokeEnabled={false}>
                    {map.map((obj, i) => (
                        <Rect
                            key={`map-${i}`}
                            x={obj.x * scale}
                            y={obj.y * scale}
                            width={obj.width * scale}
                            height={obj.height * scale}
                            offsetX={(obj.width * scale) / 2}
                            offsetY={(obj.height * scale) / 2}
                            rotation={(obj.angle * 180) / Math.PI}
                            fill={{
                                'wall': '#fff2',
                                'floor': '#AAA',
                                'trampoline': '#22F',
                                'pike': '#f00'
                            }[obj.type]}
                        />
                    ))}

                    {Object.entries(players).map(([username, { x, y }]) => (
                        <Rect
                            key={username}
                            x={x * scale}
                            y={y * scale}
                            width={20}
                            height={20}
                            offsetX={10}
                            offsetY={10}
                            fill={username === gameStore.username ? 'red' : 'blue'}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
});
