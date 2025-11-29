import React, { useRef, useState, useEffect } from 'react';

interface ColorWheelProps {
    initialColor: number[]; // RGB array [r, g, b]
    onChange: (rgb: number[]) => void;
    size?: number;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
    initialColor,
    onChange,
    size = 192
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [pickerPos, setPickerPos] = useState({ x: size / 2, y: size / 2 });

    // Convert RGB to HSV
    const rgbToHsv = (r: number, g: number, b: number) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        const s = max === 0 ? 0 : d / max;
        const v = max;
        let h = 0;
        if (d !== 0) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h, s, v };
    };

    // Convert HSV to RGB
    const hsvToRgb = (h: number, s: number, v: number): number[] => {
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        let r = 0, g = 0, b = 0;
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

    // Draw color wheel
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2;

        // Draw color wheel
        for (let angle = 0; angle < 360; angle += 1) {
            const startAngle = (angle - 1) * Math.PI / 180;
            const endAngle = angle * Math.PI / 180;

            for (let r = 0; r < radius; r += 1) {
                const sat = r / radius;
                const hue = angle / 360;
                const [red, green, blue] = hsvToRgb(hue, sat, 1);

                ctx.beginPath();
                ctx.arc(centerX, centerY, r, startAngle, endAngle);
                ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }, [size]);

    // Initialize picker position from initial color
    useEffect(() => {
        const { h, s } = rgbToHsv(initialColor[0], initialColor[1], initialColor[2]);
        const angle = h * 2 * Math.PI;
        const distance = s * (size / 2);
        const x = size / 2 + distance * Math.cos(angle);
        const y = size / 2 + distance * Math.sin(angle);
        setPickerPos({ x, y });
    }, [initialColor, size]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        updateColor(e);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) {
            updateColor(e);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const updateColor = (e: React.MouseEvent<HTMLDivElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = size / 2;
        const centerY = size / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = size / 2;

        // Constrain to circle
        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx);
            const constrainedX = centerX + maxRadius * Math.cos(angle);
            const constrainedY = centerY + maxRadius * Math.sin(angle);
            setPickerPos({ x: constrainedX, y: constrainedY });

            const hue = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI);
            const sat = 1;
            const rgb = hsvToRgb(hue, sat, 1);
            onChange(rgb);
        } else {
            setPickerPos({ x, y });

            const angle = Math.atan2(dy, dx);
            const hue = (angle + Math.PI) / (2 * Math.PI);
            const sat = distance / maxRadius;
            const rgb = hsvToRgb(hue, sat, 1);
            onChange(rgb);
        }
    };

    return (
        <div
            className="relative inline-block cursor-pointer select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ width: size, height: size }}
        >
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="rounded-full"
            />
            {/* White picker circle */}
            <div
                className="absolute w-6 h-6 border-4 border-white rounded-full shadow-lg pointer-events-none"
                style={{
                    left: pickerPos.x - 12,
                    top: pickerPos.y - 12,
                    transition: isDragging ? 'none' : 'all 0.1s ease',
                }}
            />
        </div>
    );
};
