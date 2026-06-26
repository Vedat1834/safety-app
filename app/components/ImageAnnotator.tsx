"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X, Save, Circle, Square, ArrowRight, Trash2, MousePointer2, ZoomIn, ZoomOut, Maximize, Hand, Undo, Camera } from "lucide-react";

interface ImageAnnotatorProps {
    onSave: (imageDataUrl: string) => void;
    onCancel: () => void;
    initialImage?: string;
}

type ToolType = 'select' | 'pan' | 'arrow' | 'rect' | 'circle' | 'line';

interface Shape {
    id: string;
    type: ToolType;
    x: number;
    y: number;
    w: number; // width or endX
    h: number; // height or endY
    color: string;
    thickness: number; // thickness in pixels
}

export default function ImageAnnotator({ onSave, onCancel, initialImage }: ImageAnnotatorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [uploadedFile, setUploadedFile] = useState<string | null>(initialImage || null);

    // Layout State
    const [containerSize, setContainerSize] = useState<{ width: number | string, height: number | string } | null>(null);

    // Tools State
    const [tool, setTool] = useState<ToolType>('arrow');
    const [color, setColor] = useState('#ef4444'); // Red default
    const [thickness, setThickness] = useState(5); // Default stroke thickness
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

    // Viewport State
    const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });

    // Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Screen coordinates
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);

    // Load Image
    useEffect(() => {
        if (uploadedFile) {
            const img = new Image();
            img.src = uploadedFile;
            img.onload = () => {
                setImage(img);
            };
        }
    }, [uploadedFile]);

    // Recalculate Fit when image loads
    useEffect(() => {
        if (image && containerRef.current) {
            // Small timeout to allow DOM to calculate layout
            setTimeout(() => handleFitToScreen(image), 100);
        }
    }, [image]);

    // VIEWPORT UTILS
    const handleFitToScreen = (img: HTMLImageElement = image!) => {
        if (!containerRef.current || !img) return;

        const cWidth = containerRef.current.clientWidth;
        const cHeight = containerRef.current.clientHeight;

        if (!cWidth || !cHeight) return;

        // Calculate scale to fit
        const scaleX = cWidth / img.width;
        const scaleY = cHeight / img.height;
        const scale = Math.min(scaleX, scaleY) * 0.98; // 98% fit

        // Center
        const x = (cWidth - img.width * scale) / 2;
        const y = (cHeight - img.height * scale) / 2;

        setViewport({ x, y, scale });
    };

    const handleZoom = (delta: number) => {
        setViewport(prev => ({ ...prev, scale: Math.max(0.1, prev.scale + delta) }));
    };

    const handleUndo = () => {
        if (shapes.length > 0) {
            setShapes(prev => prev.slice(0, -1));
            setSelectedShapeId(null);
        }
    };

    // COORDINATE CONVERSION
    const screenToWorld = (screenX: number, screenY: number) => {
        return {
            x: (screenX - viewport.x) / viewport.scale,
            y: (screenY - viewport.y) / viewport.scale
        };
    };

    // Render Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !image) return;

        // Resize canvas to fill container
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply Viewport Transform
        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.scale, viewport.scale);

        // 1. Draw Image
        ctx.drawImage(image, 0, 0);

        // 2. Draw Shapes
        const allShapes = currentShape ? [...shapes, currentShape] : shapes;

        allShapes.forEach(shape => {
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = (shape.thickness || 5) / viewport.scale; // Maintain visual thickness
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();

            if (shape.id === selectedShapeId) {
                ctx.shadowColor = "blue";
                ctx.shadowBlur = 10;
            } else {
                ctx.shadowBlur = 0;
            }

            if (shape.type === 'rect') {
                ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
            } else if (shape.type === 'circle') {
                const radius = Math.sqrt(Math.pow(shape.w, 2) + Math.pow(shape.h, 2));
                ctx.arc(shape.x, shape.y, Math.abs(radius), 0, 2 * Math.PI);
                ctx.stroke();
            } else if (shape.type === 'line' || shape.type === 'arrow') {
                ctx.moveTo(shape.x, shape.y);
                const endX = shape.x + shape.w;
                const endY = shape.y + shape.h;
                ctx.lineTo(endX, endY);
                ctx.stroke();

                if (shape.type === 'arrow') {
                    const headLength = 15 / viewport.scale; // Scale arrowhead
                    const angle = Math.atan2(endY - shape.y, endX - shape.x);
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
                    ctx.stroke();
                }
            }
        });

        ctx.restore();

    }, [image, shapes, currentShape, selectedShapeId, viewport, containerSize]); // Dep on containerSize

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => { if (ev.target?.result) setUploadedFile(ev.target.result as string); };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Hit Detection (World Coordinates)
    const getShapeAt = (wx: number, wy: number) => {
        for (let i = shapes.length - 1; i >= 0; i--) {
            const s = shapes[i];

            // Simple logic for selection tolerance
            const tolerance = 10 / viewport.scale;

            let minX = s.x;
            let minY = s.y;
            let maxX = s.x + (s.type === 'rect' || s.type === 'circle' ? s.w : s.w);
            let maxY = s.y + (s.type === 'rect' || s.type === 'circle' ? s.h : s.h);

            if (s.type === 'line' || s.type === 'arrow') {
                minX = Math.min(s.x, s.x + s.w) - tolerance;
                maxX = Math.max(s.x, s.x + s.w) + tolerance;
                minY = Math.min(s.y, s.y + s.h) - tolerance;
                maxY = Math.max(s.y, s.y + s.h) + tolerance;
            } else if (s.type === 'circle') {
                const radius = Math.sqrt(Math.pow(s.w, 2) + Math.pow(s.h, 2));
                const dist = Math.sqrt(Math.pow(wx - s.x, 2) + Math.pow(wy - s.y, 2));
                if (Math.abs(dist - radius) < tolerance) return s;
                continue;
            } else {
                // Rect
                if (s.w < 0) { minX = s.x + s.w; maxX = s.x; }
                if (s.h < 0) { minY = s.y + s.h; maxY = s.y; }
            }

            if (wx >= minX && wx <= maxX && wy >= minY && wy <= maxY) {
                return s;
            }
        }
        return null;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = screenToWorld(screenX, screenY);

        setIsDragging(true);
        setDragStart({ x: screenX, y: screenY });

        if (tool === 'pan') {
            return;
        }

        if (tool === 'select') {
            const hit = getShapeAt(worldPos.x, worldPos.y);
            if (hit) {
                setSelectedShapeId(hit.id);
            } else {
                setSelectedShapeId(null);
            }
        } else {
            // New Shape
            setSelectedShapeId(null);
            setCurrentShape({
                id: Math.random().toString(36),
                type: tool,
                x: worldPos.x,
                y: worldPos.y,
                w: 0,
                h: 0,
                color,
                thickness
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        const dx = screenX - dragStart.x;
        const dy = screenY - dragStart.y;

        if (tool === 'pan') {
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: screenX, y: screenY });
            return;
        }

        if (tool === 'select' && selectedShapeId) {
            const worldDx = dx / viewport.scale;
            const worldDy = dy / viewport.scale;

            setShapes(shapes.map(s => {
                if (s.id === selectedShapeId) {
                    return { ...s, x: s.x + worldDx, y: s.y + worldDy };
                }
                return s;
            }));
            setDragStart({ x: screenX, y: screenY });
        } else if (currentShape) {
            const worldPos = screenToWorld(screenX, screenY);
            setCurrentShape({
                ...currentShape,
                w: worldPos.x - currentShape.x,
                h: worldPos.y - currentShape.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (currentShape) {
            setShapes([...shapes, currentShape]);
            setCurrentShape(null);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;
        const worldPos = screenToWorld(screenX, screenY);

        setIsDragging(true);
        setDragStart({ x: screenX, y: screenY });

        if (tool === 'pan') {
            return;
        }

        if (tool === 'select') {
            const hit = getShapeAt(worldPos.x, worldPos.y);
            if (hit) {
                setSelectedShapeId(hit.id);
            } else {
                setSelectedShapeId(null);
            }
        } else {
            setSelectedShapeId(null);
            setCurrentShape({
                id: Math.random().toString(36),
                type: tool,
                x: worldPos.x,
                y: worldPos.y,
                w: 0,
                h: 0,
                color,
                thickness
            });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || e.touches.length !== 1 || !canvasRef.current) return;
        const touch = e.touches[0];
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;

        const dx = screenX - dragStart.x;
        const dy = screenY - dragStart.y;

        if (tool === 'pan') {
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: screenX, y: screenY });
            return;
        }

        if (tool === 'select' && selectedShapeId) {
            const worldDx = dx / viewport.scale;
            const worldDy = dy / viewport.scale;

            setShapes(shapes.map(s => {
                if (s.id === selectedShapeId) {
                    return { ...s, x: s.x + worldDx, y: s.y + worldDy };
                }
                return s;
            }));
            setDragStart({ x: screenX, y: screenY });
        } else if (currentShape) {
            const worldPos = screenToWorld(screenX, screenY);
            setCurrentShape({
                ...currentShape,
                w: worldPos.x - currentShape.x,
                h: worldPos.y - currentShape.y
            });
        }
    };

    const handleTouchEnd = () => {
        handleMouseUp();
    };

    const handleDelete = () => {
        if (selectedShapeId) {
            setShapes(shapes.filter(s => s.id !== selectedShapeId));
            setSelectedShapeId(null);
        }
    };

    const handleSave = () => {
        if (!image) return;
        
        // Scale down to max 1024px to prevent LocalStorage quota exceeded errors on mobile/tablet browsers
        const maxDim = 1024;
        let targetWidth = image.width;
        let targetHeight = image.height;
        
        if (targetWidth > maxDim || targetHeight > maxDim) {
            if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
                targetWidth = maxDim;
            } else {
                targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
                targetHeight = maxDim;
            }
        }

        const scale = targetWidth / image.width;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        // Draw scaled image
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

        // Draw scaled shapes
        shapes.forEach(shape => {
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = (shape.thickness || 5) * scale;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();

            const sx = shape.x * scale;
            const sy = shape.y * scale;
            const sw = shape.w * scale;
            const sh = shape.h * scale;

            if (shape.type === 'rect') {
                ctx.strokeRect(sx, sy, sw, sh);
            } else if (shape.type === 'circle') {
                const radius = Math.sqrt(Math.pow(sw, 2) + Math.pow(sh, 2));
                ctx.arc(sx, sy, Math.abs(radius), 0, 2 * Math.PI);
                ctx.stroke();
            } else if (shape.type === 'line' || shape.type === 'arrow') {
                ctx.moveTo(sx, sy);
                const endX = sx + sw;
                const endY = sy + sh;
                ctx.lineTo(endX, endY);
                ctx.stroke();

                if (shape.type === 'arrow') {
                    const headLength = 25 * scale;
                    const angle = Math.atan2(sh, sw);
                    ctx.beginPath();
                    const ex = sx + sw;
                    const ey = sy + sh;

                    ctx.moveTo(ex, ey);
                    ctx.lineTo(ex - headLength * Math.cos(angle - Math.PI / 6), ey - headLength * Math.sin(angle - Math.PI / 6));
                    ctx.moveTo(ex, ey);
                    ctx.lineTo(ex - headLength * Math.cos(angle + Math.PI / 6), ey - headLength * Math.sin(angle + Math.PI / 6));
                    ctx.stroke();
                }
            }
        });

        onSave(tempCanvas.toDataURL('image/jpeg', 0.85));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ease-out w-[95vw] h-[90vh] max-w-7xl max-h-[900px]"
            >
                <div className="p-3 border-b flex justify-between items-center bg-gray-50 flex-none h-12">
                    <h3 className="font-bold text-gray-800">Fotoğraf Düzenleyici</h3>
                    <button onClick={onCancel} className="p-1 hover:bg-gray-200 rounded-full"><X className="size-5" /></button>
                </div>

                <div className="flex-1 relative bg-gray-900 overflow-hidden" ref={containerRef}>
                    {!uploadedFile ? (
                        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                            <div className="space-y-4">
                                <Upload className="size-12 mx-auto mb-2 opacity-50" />
                                <p className="mb-2 text-lg font-medium">Bir fotoğraf yükleyin veya çekin</p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                    <label className="cursor-pointer bg-[#FFD600] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#FACE15] transition-all flex items-center gap-2 shadow-lg shadow-yellow-500/10">
                                        <Camera className="size-4" />
                                        Fotoğraf Çek
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                                    </label>
                                    <label className="cursor-pointer bg-gray-800 text-white border border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-700 transition-all flex items-center gap-2">
                                        <Upload className="size-4" />
                                        Dosya Seç
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                className={`block touch-none ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
                            />

                            <div className="absolute bottom-4 left-4 flex gap-2">
                                <button onClick={() => handleZoom(0.1)} className="p-2 bg-white/90 rounded shadow hover:bg-white text-gray-700" title="Yakınlaştır"><ZoomIn className="size-5" /></button>
                                <button onClick={() => handleZoom(-0.1)} className="p-2 bg-white/90 rounded shadow hover:bg-white text-gray-700" title="Uzaklaştır"><ZoomOut className="size-5" /></button>
                                <button onClick={() => handleFitToScreen()} className="p-2 bg-white/90 rounded shadow hover:bg-white text-gray-700" title="Ekrana Sığdır"><Maximize className="size-5" /></button>
                            </div>
                        </>
                    )}
                </div>

                {uploadedFile && (
                    <div className="p-3 border-t bg-white flex flex-col gap-3 flex-none h-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <button onClick={() => setTool('select')} className={`p-2 rounded ${tool === 'select' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-100'}`} title="Seç (Taşı)"><MousePointer2 className="size-5" /></button>
                                <button onClick={() => setTool('pan')} className={`p-2 rounded ${tool === 'pan' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-100'}`} title="Kaydır (Pan)"><Hand className="size-5" /></button>
                                <div className="w-px bg-gray-300 mx-2"></div>
                                <button onClick={() => setTool('arrow')} className={`p-2 rounded ${tool === 'arrow' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`} title="Ok"><ArrowRight className="size-5" /></button>
                                <button onClick={() => setTool('rect')} className={`p-2 rounded ${tool === 'rect' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`} title="Kare"><Square className="size-5" /></button>
                                <button onClick={() => setTool('circle')} className={`p-2 rounded ${tool === 'circle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`} title="Daire"><Circle className="size-5" /></button>
                            </div>

                            <div className="flex gap-2 items-center">
                                <button onClick={() => setColor('#ef4444')} className={`size-6 rounded-full bg-red-500 border-2 ${color === '#ef4444' ? 'border-gray-900' : 'border-transparent'}`}></button>
                                <button onClick={() => setColor('#eab308')} className={`size-6 rounded-full bg-yellow-500 border-2 ${color === '#eab308' ? 'border-gray-900' : 'border-transparent'}`}></button>
                                <button onClick={() => setColor('#22c55e')} className={`size-6 rounded-full bg-green-500 border-2 ${color === '#22c55e' ? 'border-gray-900' : 'border-transparent'}`}></button>
                                <div className="w-px bg-gray-300 mx-2"></div>

                                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Kalınlık:</span>
                                    <input 
                                        type="range" 
                                        min="2" 
                                        max="20" 
                                        value={thickness} 
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setThickness(val);
                                            if (selectedShapeId) {
                                                setShapes(shapes.map(s => s.id === selectedShapeId ? { ...s, thickness: val } : s));
                                            }
                                        }}
                                        className="w-16 accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-gray-700 w-7 text-center">{thickness}px</span>
                                </div>
                                <div className="w-px bg-gray-300 mx-2"></div>

                                <button onClick={handleUndo} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Geri Al"><Undo className="size-5" /></button>

                                <button
                                    onClick={handleDelete}
                                    className={`p-2 rounded ${selectedShapeId ? 'text-red-600 hover:bg-red-50' : 'text-gray-300 cursor-not-allowed'}`}
                                    disabled={!selectedShapeId}
                                    title="Seçili Şekli Sil"
                                >
                                    <Trash2 className="size-5" />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => { setShapes([]); /* redraw */ }} className="text-xs text-gray-400 hover:text-red-500 underline">Tümünü Sıfırla</button>
                                <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-sm">
                                    <Save className="size-4" /> Tamamla
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
