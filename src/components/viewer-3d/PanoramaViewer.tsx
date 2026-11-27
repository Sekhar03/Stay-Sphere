"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Info, AlertCircle, Compass } from "lucide-react";

export interface TourHotspot {
  pitch: number; // Vertical angle in degrees (-85 to 85)
  yaw: number;   // Horizontal angle in degrees (0 to 360)
  title: string;
  infoText?: string;
  targetTourId?: string;
}

interface PanoramaViewerProps {
  panoramaUrl?: string | null;
  hotspots?: TourHotspot[];
  title?: string;
  onHotspotClick?: (hotspot: TourHotspot) => void;
}

export default function PanoramaViewer({
  panoramaUrl,
  hotspots = [],
  title = "360° Virtual Tour",
  onHotspotClick,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<TourHotspot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!panoramaUrl || !containerRef.current) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(false);

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Check WebGL availability
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      setLoadError(true);
      setIsLoading(false);
      return;
    }

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Inverted Sphere for 360 panorama
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    let isUserInteracting = false;
    let onPointerDownMouseX = 0;
    let onPointerDownMouseY = 0;
    let lon = 0;
    let onPointerDownLon = 0;
    let lat = 0;
    let onPointerDownLat = 0;
    let phi = 0;
    let theta = 0;

    const texture = textureLoader.load(
      panoramaUrl,
      () => {
        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.error("Failed to load 360 panorama texture:", err);
        setLoadError(true);
        setIsLoading(false);
      }
    );

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 3. Hotspots
    const hotspotObjects: { mesh: THREE.Mesh; data: TourHotspot }[] = [];
    hotspots.forEach((spot) => {
      // Convert pitch and yaw to 3D Cartesian coordinates inside sphere
      const phiRad = THREE.MathUtils.degToRad(90 - spot.pitch);
      const thetaRad = THREE.MathUtils.degToRad(spot.yaw);
      const radius = 450;

      const x = radius * Math.sin(phiRad) * Math.cos(thetaRad);
      const y = radius * Math.cos(phiRad);
      const z = radius * Math.sin(phiRad) * Math.sin(thetaRad);

      const markerGeo = new THREE.RingGeometry(10, 16, 32);
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });

      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.set(x, y, z);
      markerMesh.lookAt(0, 0, 0);
      scene.add(markerMesh);
      hotspotObjects.push({ mesh: markerMesh, data: spot });
    });

    // 4. Mouse / Touch Interactions
    const onPointerDown = (event: PointerEvent) => {
      isUserInteracting = true;
      onPointerDownMouseX = event.clientX;
      onPointerDownMouseY = event.clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isUserInteracting) return;
      lon = (onPointerDownMouseX - event.clientX) * 0.15 + onPointerDownLon;
      lat = (event.clientY - onPointerDownMouseY) * 0.15 + onPointerDownLat;
    };

    const onPointerUp = () => {
      isUserInteracting = false;
    };

    const onWheel = (event: WheelEvent) => {
      const fov = camera.fov + event.deltaY * 0.05;
      camera.fov = THREE.MathUtils.clamp(fov, 30, 95);
      camera.updateProjectionMatrix();
    };

    const onPointerClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const meshes = hotspotObjects.map((h) => h.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = hotspotObjects.find((h) => h.mesh === intersects[0].object);
        if (hit) {
          setSelectedHotspot(hit.data);
          onHotspotClick?.(hit.data);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    domElement.addEventListener("wheel", onWheel);
    domElement.addEventListener("click", onPointerClick);

    // 5. Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      lat = Math.max(-85, Math.min(85, lat));
      phi = THREE.MathUtils.degToRad(90 - lat);
      theta = THREE.MathUtils.degToRad(lon);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      domElement.removeEventListener("wheel", onWheel);
      domElement.removeEventListener("click", onPointerClick);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [panoramaUrl, hotspots, onHotspotClick]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  if (!panoramaUrl || loadError) {
    return (
      <div className="relative w-full h-[450px] bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-300 p-6 border border-slate-800">
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-white">360° Virtual Tour Not Available</h3>
        <p className="text-sm text-slate-400 max-w-md text-center mt-1">
          {loadError
            ? "Unable to initialize WebGL rendering on this device or the panorama asset could not be loaded."
            : "The owner has not uploaded a 360° virtual tour or 3D model for this property yet. Please check standard photos below."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 group">
      {/* 360 Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium tracking-wide">Loading 360° Panoramic View...</p>
        </div>
      )}

      {/* Header Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-slate-700/60 text-xs font-medium">
        <Compass className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
        <span>{title}</span>
        <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">Drag to Look Around</span>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg text-white">
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-white"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Hotspot Info Popup */}
      {selectedHotspot && (
        <div className="absolute top-4 right-4 max-w-xs z-20 bg-slate-900/95 backdrop-blur-md border border-blue-500/40 rounded-xl p-4 text-white shadow-2xl animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-blue-400">
              <Info className="w-4 h-4 shrink-0" />
              <h4 className="font-semibold text-sm">{selectedHotspot.title}</h4>
            </div>
            <button
              onClick={() => setSelectedHotspot(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
            >
              ×
            </button>
          </div>
          {selectedHotspot.infoText && (
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {selectedHotspot.infoText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
