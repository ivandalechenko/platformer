import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Text } from 'react-konva';

const gridSize = 50;

const colorByType = {
    floor: '#000',
    wall: '#0008',
    spawnPoint: '#2F2',
    trampoline: '#22F',
    pike: '#f22'
};

export default function Editor() {
    const [objects, setObjects] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedType, setSelectedType] = useState('floor');
    const fileInputRef = useRef(null);
    const trRef = useRef(null);
    const rectRefs = useRef({});

    const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });


    useEffect(() => {
        if (selectedId && trRef.current && rectRefs.current[selectedId]) {
            trRef.current.nodes([rectRefs.current[selectedId]]);
            trRef.current.getLayer().batchDraw();
        }
    }, [selectedId, objects]);

    const addObject = () => {
        const id = Date.now();
        rectRefs.current[id] = null;
        setObjects([
            ...objects,
            {
                id,
                x: 100,
                y: 100,
                w: 100,
                h: 50,
                rotation: 0,
                type: selectedType
            }
        ]);
    };

    const removeObject = (id) => {
        delete rectRefs.current[id];
        setObjects(objects.filter(obj => obj.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const exportMap = () => {
        const matterFormat = objects.map(obj => {
            const angle = (obj.rotation || 0) * (Math.PI / 180);

            // считаем смещение от верхнего левого угла до центра с учётом поворота
            const dx = obj.w / 2;
            const dy = obj.h / 2;
            const cx = obj.x + dx * Math.cos(angle) - dy * Math.sin(angle);
            const cy = obj.y + dx * Math.sin(angle) + dy * Math.cos(angle);

            return {
                type: obj.type,
                w: obj.w,
                h: obj.h,
                angle,
                x: cx,
                y: cy
            };
        });

        const json = JSON.stringify(matterFormat, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'matter-map.json';
        a.click();
        URL.revokeObjectURL(url);
    };



    const importMap = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const data = JSON.parse(reader.result);

            const parsed = data.map(obj => {
                const id = Date.now() + Math.random();
                const angle = obj.angle || 0;

                // пересчёт центра в верхний левый угол с учётом поворота
                const dx = -(obj.w / 2);
                const dy = -(obj.h / 2);
                const x = obj.x + dx * Math.cos(angle) - dy * Math.sin(angle);
                const y = obj.y + dx * Math.sin(angle) + dy * Math.cos(angle);

                return {
                    id,
                    x,
                    y,
                    w: obj.w,
                    h: obj.h,
                    rotation: angle * (180 / Math.PI),
                    type: obj.type || 'floor'
                };
            });

            setObjects(parsed);
        };

        reader.readAsText(file);
    };




    return (
        <>
            <div style={{ position: 'fixed', top: 10, left: 10, zIndex: 1 }}>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    {Object.keys(colorByType).map(type => (
                        <option key={type}>{type}</option>
                    ))}
                </select>
                <button onClick={addObject}>+ Add</button>
                <button onClick={exportMap}>💾 Export</button>
                <button onClick={() => fileInputRef.current.click()}>📂 Import</button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={importMap}
                />
            </div>

            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                x={cameraPos.x}
                y={cameraPos.y}
                draggable
                onDragStart={(e) => {
                    if (e.target === e.target.getStage()) {
                        isPanning.current = true;
                        panStart.current = { x: e.evt.clientX, y: e.evt.clientY };
                    }
                }}
                onDragEnd={(e) => {
                    if (isPanning.current) {
                        const dx = e.evt.clientX - panStart.current.x;
                        const dy = e.evt.clientY - panStart.current.y;
                        setCameraPos({ x: cameraPos.x + dx, y: cameraPos.y + dy });
                        isPanning.current = false;
                    }
                }}
                onMouseDown={(e) => {
                    if (e.target === e.target.getStage()) {
                        setSelectedId(null);
                    }
                }}
            >
                <Layer>
                    {/* Grid */}
                    {Array.from({ length: window.innerWidth / gridSize }).map((_, i) => (
                        <Rect key={`v${i}`} x={i * gridSize} y={0} width={1} height={window.innerHeight} fill="#eee" />
                    ))}
                    {Array.from({ length: window.innerHeight / gridSize }).map((_, i) => (
                        <Rect key={`h${i}`} x={0} y={i * gridSize} width={window.innerWidth} height={1} fill="#eee" />
                    ))}

                    {/* Objects */}
                    {objects.map((obj, i) => {
                        const isSelected = obj.id === selectedId;

                        return (
                            <>
                                <Rect
                                    key={obj.id}
                                    ref={node => (rectRefs.current[obj.id] = node)}
                                    x={obj.x}
                                    y={obj.y}
                                    width={obj.w}
                                    height={obj.h}
                                    rotation={obj.rotation || 0}
                                    fill={colorByType[obj.type]}
                                    stroke="black"
                                    strokeWidth={1}
                                    cornerRadius={2}
                                    draggable
                                    onClick={(e) => {
                                        e.cancelBubble = true;
                                        setSelectedId(obj.id);
                                    }}
                                    onContextMenu={(e) => {
                                        e.evt.preventDefault();
                                        removeObject(obj.id);
                                    }}
                                    onDragEnd={(e) => {
                                        const newObjs = [...objects];
                                        newObjs[i] = {
                                            ...obj,
                                            x: e.target.x(),
                                            y: e.target.y(),
                                            w: obj.w,
                                            h: obj.h,
                                            rotation: e.target.rotation()
                                        };
                                        setObjects(newObjs);
                                    }}
                                    onTransformEnd={(e) => {
                                        const node = rectRefs.current[obj.id];
                                        const scaleX = node.scaleX();
                                        const scaleY = node.scaleY();
                                        const newW = node.width() * scaleX;
                                        const newH = node.height() * scaleY;
                                        node.scaleX(1);
                                        node.scaleY(1);

                                        const newObjs = [...objects];
                                        newObjs[i] = {
                                            ...obj,
                                            x: node.x(),
                                            y: node.y(),
                                            w: newW,
                                            h: newH,
                                            rotation: node.rotation()
                                        };
                                        setObjects(newObjs);
                                    }}
                                />
                                {isSelected && (
                                    <Text
                                        x={obj.x}
                                        y={obj.y - 20}
                                        text={`${Math.round(obj.w)}×${Math.round(obj.h)} @ ${Math.round(obj.rotation || 0)}°`}
                                        fontSize={14}
                                        fill="black"
                                        rotation={obj.rotation || 0}
                                    />
                                )}
                            </>
                        );
                    })}


                    {/* Transformer */}
                    <Transformer
                        ref={trRef}
                        rotateEnabled={true}
                        enabledAnchors={[
                            'top-left', 'top-right',
                            'bottom-left', 'bottom-right',
                            'top-center', 'bottom-center',
                            'middle-left', 'middle-right'
                        ]}
                        boundBoxFunc={(oldBox, newBox) => newBox}
                    />
                </Layer>
            </Stage>
        </>
    );
}
