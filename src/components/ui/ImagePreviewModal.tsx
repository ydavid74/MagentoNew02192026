import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  Move,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt?: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  imageAlt,
}: ImagePreviewModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;
  const SCALE_STEP = 0.1;

  // Reset state when modal opens/closes or image changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, imageUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "+":
        case "=":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
          e.preventDefault();
          handleZoomOut();
          break;
        case "0":
          e.preventDefault();
          resetZoom();
          break;
        case "r":
        case "R":
          e.preventDefault();
          handleRotate();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "ArrowLeft":
          e.preventDefault();
          setPosition((prev) => ({ ...prev, x: prev.x + 50 }));
          break;
        case "ArrowRight":
          e.preventDefault();
          setPosition((prev) => ({ ...prev, x: prev.x - 50 }));
          break;
        case "ArrowUp":
          e.preventDefault();
          setPosition((prev) => ({ ...prev, y: prev.y + 50 }));
          break;
        case "ArrowDown":
          e.preventDefault();
          setPosition((prev) => ({ ...prev, y: prev.y - 50 }));
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
      setScale(newScale);
    },
    [scale]
  );

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Control functions
  const handleZoomIn = () => {
    setScale((prev) => Math.min(MAX_SCALE, prev + SCALE_STEP));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(MIN_SCALE, prev - SCALE_STEP));
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = imageAlt || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isFullscreen
            ? "max-w-none max-h-none w-screen h-screen"
            : "max-w-6xl max-h-[95vh]"
        } p-0 overflow-hidden bg-black`}
        ref={containerRef}
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Header Controls */}
          <div className="absolute top-4 left-4 right-4 z-[100] flex justify-between items-center bg-black/50 backdrop-blur-sm rounded-lg p-2">
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= MIN_SCALE}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 min-w-[120px]">
                <span className="text-white text-sm">
                  {Math.round(scale * 100)}%
                </span>
                <Slider
                  value={[scale]}
                  onValueChange={([value]) => setScale(value)}
                  min={MIN_SCALE}
                  max={MAX_SCALE}
                  step={SCALE_STEP}
                  className="w-20"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= MAX_SCALE}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-white/30 mx-2" />

              {/* Rotation */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotate}
                className="text-white hover:bg-white/20"
                title="Rotate (R)"
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              {/* Reset */}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="text-white hover:bg-white/20"
                title="Reset (0)"
              >
                <Move className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Download */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
                title="Fullscreen (F)"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {/* Close */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden relative cursor-move"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: isDragging ? "grabbing" : scale > 1 ? "grab" : "default",
              zIndex: 1,
              minHeight: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-white text-lg">Loading...</div>
              </div>
            )}

            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-white text-lg">Failed to load image</div>
              </div>
            )}

            <img
              ref={imageRef}
              src={imageUrl}
              alt={imageAlt || "Product image"}
              className="select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? "none" : "transform 0.2s ease-out",
                maxWidth: "90vw",
                maxHeight: "90vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                zIndex: 1,
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          </div>

          {/* Footer Info */}
          <div className="absolute bottom-4 left-4 right-4 z-[100]">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 text-white text-sm">
              <div className="flex justify-between items-center">
                <span>{imageAlt || "Image"}</span>
                <div className="flex gap-4 text-xs text-white/70">
                  <span>Zoom: {Math.round(scale * 100)}%</span>
                  <span>Rotation: {rotation}°</span>
                  <span>Scale: {scale.toFixed(2)}x</span>
                </div>
              </div>
              <div className="text-xs text-white/50 mt-1">
                Use mouse wheel to zoom, drag to pan, or use keyboard shortcuts
                (+, -, 0, R, F, arrows, Esc)
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
