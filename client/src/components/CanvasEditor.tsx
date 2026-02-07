import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { Landmarks, Point } from "@/lib/angleCalculation";
import {
  calculateSNAAngle,
  classifySNAAngle,
  getClassificationColor,
  validateLandmarks,
} from "@/lib/angleCalculation";

interface CanvasEditorProps {
  imageUrl: string;
  onLandmarksChange: (landmarks: Landmarks) => void;
  initialLandmarks?: Landmarks;
}

const LANDMARK_RADIUS = 8;
const LANDMARK_COLORS = {
  S: "#3b82f6", // Blue
  N: "#8b5cf6", // Purple
  A: "#ec4899", // Pink
};

export default function CanvasEditor({
  imageUrl,
  onLandmarksChange,
  initialLandmarks,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [landmarks, setLandmarks] = useState<Landmarks | null>(initialLandmarks || null);
  const [selectedLandmark, setSelectedLandmark] = useState<keyof Landmarks | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setIsLoading(false);
    };
    img.onerror = () => {
      console.error("Failed to load image");
      setIsLoading(false);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Initialize landmarks if image is loaded and no landmarks provided
  useEffect(() => {
    if (image && !landmarks) {
      // Initialize with default positions (center of image)
      const centerX = image.width / 2;
      const centerY = image.height / 2;
      const newLandmarks: Landmarks = {
        S: { x: centerX - 50, y: centerY - 100 },
        N: { x: centerX, y: centerY - 50 },
        A: { x: centerX, y: centerY + 50 },
      };
      setLandmarks(newLandmarks);
      onLandmarksChange(newLandmarks);
    }
  }, [image, landmarks, onLandmarksChange]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw image
    ctx.drawImage(image, 0, 0);

    // Draw landmarks and connections
    if (landmarks && validateLandmarks(landmarks)) {
      // Draw lines
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);

      // Line SN
      ctx.beginPath();
      ctx.moveTo(landmarks.S.x, landmarks.S.y);
      ctx.lineTo(landmarks.N.x, landmarks.N.y);
      ctx.stroke();

      // Line NA
      ctx.beginPath();
      ctx.moveTo(landmarks.N.x, landmarks.N.y);
      ctx.lineTo(landmarks.A.x, landmarks.A.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // Draw angle arc
      if (validateLandmarks(landmarks)) {
        drawAngleArc(ctx, landmarks, zoom);
      }

      // Draw landmarks
      Object.entries(landmarks).forEach(([key, point]) => {
        const color = LANDMARK_COLORS[key as keyof Landmarks];
        const isSelected = selectedLandmark === key;

        // Draw point
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, LANDMARK_RADIUS / zoom, 0, Math.PI * 2);
        ctx.fill();

        // Draw selection ring
        if (isSelected) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2 / zoom;
          ctx.beginPath();
          ctx.arc(point.x, point.y, LANDMARK_RADIUS / zoom + 4 / zoom, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw label
        ctx.fillStyle = color;
        ctx.font = `${14 / zoom}px Arial`;
        ctx.fillText(key, point.x + LANDMARK_RADIUS / zoom + 5 / zoom, point.y - LANDMARK_RADIUS / zoom);
      });
    }

    ctx.restore();
  }, [image, landmarks, selectedLandmark, zoom, pan]);

  // Draw angle arc
  const drawAngleArc = (ctx: CanvasRenderingContext2D, landmarks: Landmarks, zoom: number) => {
    const { S, N, A } = landmarks;

    // Calculate vectors
    const v1 = { x: S.x - N.x, y: S.y - N.y };
    const v2 = { x: A.x - N.x, y: A.y - N.y };

    // Calculate angles
    const angle1 = Math.atan2(v1.y, v1.x);
    const angle2 = Math.atan2(v2.y, v2.x);

    // Draw arc
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.arc(N.x, N.y, 30 / zoom, angle1, angle2, angle2 > angle1 ? false : true);
    ctx.stroke();
  };

  // Handle canvas mouse events
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Check if clicking on a landmark
    let clicked = false;
    Object.entries(landmarks).forEach(([key, point]) => {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      if (distance < LANDMARK_RADIUS / zoom + 5) {
        setSelectedLandmark(key as keyof Landmarks);
        clicked = true;
      }
    });

    if (!clicked) {
      setSelectedLandmark(null);
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (selectedLandmark) {
      const newLandmarks = { ...landmarks };
      newLandmarks[selectedLandmark] = { x, y };
      setLandmarks(newLandmarks);
      onLandmarksChange(newLandmarks);
    } else if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: pan.x + dx / zoom, y: pan.y + dy / zoom });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (isLoading) {
    return (
      <Card className="w-full p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            title="Vergrößern"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            title="Verkleinern"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            title="Zurücksetzen"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">
            Zoom: {(zoom * 100).toFixed(0)}%
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="w-full cursor-move"
          />
        </div>
      </Card>

      {landmarks && validateLandmarks(landmarks) && (
        <Card className="p-4 space-y-3">
          <div className="text-sm font-medium">Landmarken-Positionen</div>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(landmarks).map(([key, point]) => (
              <div
                key={key}
                className="p-3 rounded-lg border border-border bg-muted/50 cursor-pointer hover:bg-muted"
                onClick={() => setSelectedLandmark(key as keyof Landmarks)}
                style={{
                  borderColor: LANDMARK_COLORS[key as keyof Landmarks],
                  borderWidth: selectedLandmark === key ? "2px" : "1px",
                }}
              >
                <div className="font-semibold text-sm mb-1">{key}</div>
                <div className="text-xs text-muted-foreground">
                  X: {Math.round(point.x)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Y: {Math.round(point.y)}
                </div>
              </div>
            ))}
          </div>

          {landmarks && validateLandmarks(landmarks) && (
            <div className="pt-4 border-t border-border">
              <div className="text-sm font-medium mb-2">SNA-Winkel</div>
              <div className="text-3xl font-bold">
                {calculateSNAAngle(landmarks).toFixed(1)}°
              </div>
              <div
                className="text-sm font-medium mt-2"
                style={{
                  color: getClassificationColor(classifySNAAngle(calculateSNAAngle(landmarks))),
                }}
              >
                {classifySNAAngle(calculateSNAAngle(landmarks)) === "retrognath"
                  ? "Retrognath (< 80°)"
                  : classifySNAAngle(calculateSNAAngle(landmarks)) === "normal"
                    ? "Normal (80-84°)"
                    : "Prognath (> 84°)"}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
