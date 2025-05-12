import { Stage, Layer, Rect, Line, Image } from "react-konva";
import { useEffect, useState } from "react";
import gameStore from "./gameStore";
import { observer } from "mobx-react-lite";
import useImage from 'use-image';


export default observer(() => {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [, forceUpdate] = useState(0);
    const [bg] = useImage('/img/bg.webp', 'anonymous');
    const [bgSize, setBgSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        if (bg) setBgSize({ w: bg.width, h: bg.height });
    }, [bg]);
    // масштабируем фон по высоте, ширина авто
    const bgScale = (size.height * 1.5) / bgSize.h;
    const bgWidth = bgSize.w * bgScale;
    const bgHeight = bgSize.h * bgScale;


    useEffect(() => {
        const handleResize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        let frameId;
        const tick = () => {
            forceUpdate(n => n + 1);
            frameId = requestAnimationFrame(tick);
        };
        tick();
        return () => cancelAnimationFrame(frameId);
    }, []);

    const scale = 1;
    // const players = gameStore.getInterpolatedPlayers();
    const players = gameStore.getLastPlayers();
    const map = gameStore.getInterpolatedMap();

    const me = players[gameStore.username] || { x: 0, y: 0 };

    const bgX = -size.width - ((me.x / 5) * scale);
    const bgY = -size.height / 1.2 - ((me.y / 5) * scale);


    return (
        <div className='Scene' style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            {/* {
                JSON.stringify(bgSize)
            }-
            {
                JSON.stringify(size)
            } */}
            <Stage
                width={size.width}
                height={size.height}
                x={-me.x * scale + size.width / 2}
                y={-me.y * scale + size.height / 2}
            >

                {bg && <Layer>
                    <Image
                        image={bg}
                        x={bgX} // центрируем фон по X
                        y={bgY} // и по Y
                        width={bgWidth}
                        height={bgHeight}
                    />
                    <Image
                        image={bg}
                        x={bgX + bgWidth - 1} // центрируем фон по X
                        y={bgY} // и по Y
                        width={bgWidth}
                        height={bgHeight}
                    />
                </Layer>
                }

                <Layer>
                    {/* Map objects */}
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

                    {/* Players */}
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
