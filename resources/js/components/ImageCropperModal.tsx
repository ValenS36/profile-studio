import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from 'lucide-react';
import { Button } from './ui/button';

interface ImageCropperModalProps {
  imageSrc: string;
  fileName?: string;
  onApply: (file: File) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({
  imageSrc,
  fileName = 'avatar.jpg',
  onApply,
  onCancel,
}: ImageCropperModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });

  // Reset when image changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [imageSrc]);

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: offsetStartRef.current.x + dx,
      y: offsetStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile / tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      offsetStartRef.current = { ...offset };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setOffset({
      x: offsetStartRef.current.x + dx,
      y: offsetStartRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleCropAndApply = () => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    // Viewport size in DOM
    const viewWidth = container.clientWidth;
    const viewHeight = container.clientHeight;
    const cropSize = Math.min(viewWidth, viewHeight) * 0.82; // 82% diameter circle
    const cropCenterX = viewWidth / 2;
    const cropCenterY = viewHeight / 2;

    // Base rendered size of image (before zoom & offset)
    const naturalWidth = img.naturalWidth || 500;
    const naturalHeight = img.naturalHeight || 500;

    // The image is rendered with object-fit: contain within the viewport, scaled by zoom
    // Let's compute scale ratio
    const imgAspect = naturalWidth / naturalHeight;
    const viewAspect = viewWidth / viewHeight;
    let baseDisplayWidth = viewWidth;
    let baseDisplayHeight = viewHeight;

    if (imgAspect > viewAspect) {
      baseDisplayWidth = viewWidth;
      baseDisplayHeight = viewWidth / imgAspect;
    } else {
      baseDisplayHeight = viewHeight;
      baseDisplayWidth = viewHeight * imgAspect;
    }

    const currentDisplayWidth = baseDisplayWidth * zoom;
    const currentDisplayHeight = baseDisplayHeight * zoom;

    // Center of image in viewport coordinates
    const imgCenterX = viewWidth / 2 + offset.x;
    const imgCenterY = viewHeight / 2 + offset.y;

    // Top-left of image in viewport coordinates
    const imgLeft = imgCenterX - currentDisplayWidth / 2;
    const imgTop = imgCenterY - currentDisplayHeight / 2;

    // Top-left of crop box in viewport coordinates
    const cropLeft = cropCenterX - cropSize / 2;
    const cropTop = cropCenterY - cropSize / 2;

    // Relative crop box in natural image coordinates
    const scaleFactor = naturalWidth / currentDisplayWidth;
    const naturalCropX = (cropLeft - imgLeft) * scaleFactor;
    const naturalCropY = (cropTop - imgTop) * scaleFactor;
    const naturalCropSize = cropSize * scaleFactor;

    // Output canvas: 512x512
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = 512;
    outputCanvas.height = 512;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    // Fill with smooth background in case edges are out
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      img,
      naturalCropX,
      naturalCropY,
      naturalCropSize,
      naturalCropSize,
      0,
      0,
      512,
      512
    );

    outputCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const baseName = fileName.replace(/\.[^/.]+$/, '');
        const newFile = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
        onApply(newFile);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="cropper-overlay" role="dialog" aria-modal="true" aria-label="Sesuaikan Foto Profil">
      <div className="cropper-modal">
        <header className="cropper-header">
          <div>
            <h3>Sesuaikan Ukuran Foto</h3>
            <p>Geser dan perbesar foto untuk menentukan area profil</p>
          </div>
          <button className="cropper-close" onClick={onCancel} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </header>

        <div
          ref={containerRef}
          className={`cropper-viewport ${isDragging ? 'is-dragging' : ''}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Inner image container */}
          <div
            className="cropper-image-wrapper"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Preview potongan"
              draggable={false}
              className="cropper-image"
            />
          </div>

          {/* Mask cutout (darkened outer with circular transparent cutout) */}
          <div className="cropper-mask" />
          <div className="cropper-guide-circle" />
        </div>

        {/* Controls */}
        <div className="cropper-controls">
          <div className="cropper-zoom-bar">
            <button
              aria-label="Perkecil"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              disabled={zoom <= 1}
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              aria-label="Perbesar foto"
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <button
              aria-label="Perbesar"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              disabled={zoom >= 3}
            >
              <ZoomIn size={16} />
            </button>
            <button aria-label="Reset posisi" title="Reset posisi" onClick={handleReset}>
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="cropper-actions">
            <Button variant="ghost" onClick={onCancel}>
              Batal
            </Button>
            <Button onClick={handleCropAndApply}>
              <Check size={16} /> Terapkan Foto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
