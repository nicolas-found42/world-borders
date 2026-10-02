import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import { AmbientLight, DirectionalLight, MeshPhongMaterial, Vector3, BufferGeometry, Float32BufferAttribute, LineSegments, LineBasicMaterial } from 'three';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import type { Territory } from './types';
import { globeGeometry } from './geometry.mjs';

type Land = Feature<Polygon | MultiPolygon>;
interface Props {
  territories: Territory[]; land: Land[]; resetToken: number; focus: string | null;
  borders: boolean; onHover: (name: string | null) => void; onReady: () => void;
}
export default function GlobeView({ territories, land, resetToken, focus, borders, onHover, onReady }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ width: 1200, height: 700 });
  const [ready, setReady] = useState(false);
  const ocean = useMemo(() => new MeshPhongMaterial({ color: '#101e2a', shininess: 10, specular: '#2a4553' }), []);
  const landMaterial = useMemo(() => new MeshPhongMaterial({ color: '#243745', shininess: 1 }), []);
  const territoryMaterials = useMemo(() => new Map(territories.map(f => [f.properties.id,
    new MeshPhongMaterial({ color: f.properties.color, shininess: 2, transparent: true, opacity: focus && focus !== f.properties.id ? 0.23 : 0.94 }),
  ])), [territories, focus]);
  const data = useMemo(() => [...land.map(f => ({ ...f, properties: { id: 'land', color: '#243745' } })), ...territories].map(f => ({ ...f, geometry: globeGeometry(f.geometry) })), [land, territories]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (ready && globe.current) {
      const controls = globe.current.controls() as { enableDamping: boolean; update: () => void };
      // Drain residual user-drag inertia before resetting the camera. Otherwise
      // OrbitControls can keep nudging it after the reset tween has finished.
      controls.enableDamping = false; controls.update(); controls.enableDamping = true;
      globe.current.pointOfView({ lat: 35, lng: -103, altitude: size.width < 700 ? 2.65 : 2.15 }, 850);
    }
  }, [ready, resetToken, size.width]);
  const initialize = useCallback(() => {
    const g = globe.current;
    if (!g) return;
    g.lights([new AmbientLight('#e2eff6', 1.4), (() => {
      const light = new DirectionalLight('#f6eee5', 1.8); light.position.set(-200, 250, 350); return light;
    })()]);
    const controls = g.controls() as { enablePan: boolean; enableDamping: boolean; dampingFactor: number; minDistance: number; maxDistance: number; autoRotate: boolean };
    controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 135; controls.maxDistance = 600; controls.autoRotate = false;
    // A subtle geographic grid, with segments following the spherical surface.
    const vertices: number[] = [];
    const point = (lat: number, lng: number) => {
      const c = g.getCoords(lat, lng, 0.0005); return new Vector3(c.x, c.y, c.z);
    };
    const segment = (a: Vector3, b: Vector3) => vertices.push(...a.toArray(), ...b.toArray());
    for (let lat = -60; lat <= 60; lat += 30) for (let lng = -180; lng < 180; lng += 2) segment(point(lat, lng), point(lat, lng + 2));
    for (let lng = -180; lng < 180; lng += 30) for (let lat = -88; lat < 88; lat += 2) segment(point(lat, lng), point(lat + 2, lng));
    const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    const grid = new LineSegments(geometry, new LineBasicMaterial({ color: '#668393', transparent: true, opacity: 0.13 }));
    grid.name = 'geographic-grid'; g.scene().add(grid);
    setReady(true); onReady();
  }, [onReady]);
  useEffect(() => () => { ocean.dispose(); landMaterial.dispose(); }, [ocean, landMaterial]);
  useEffect(() => () => territoryMaterials.forEach(material => material.dispose()), [territoryMaterials]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = [...territoryMaterials.values()].map(material => ({ material, opacity: material.opacity }));
    targets.forEach(({material}) => { material.opacity = 0; });
    let frame: number; let start: number | undefined;
    const fade = (time: number) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / 400);
      targets.forEach(({material, opacity}) => { material.opacity = opacity * (1 - (1 - progress) ** 3); });
      if (progress < 1) frame = requestAnimationFrame(fade);
    };
    frame = requestAnimationFrame(fade);
    return () => cancelAnimationFrame(frame);
  }, [territoryMaterials]);
  return <div className="globe-canvas" ref={container} aria-label="Interactive historical globe. Drag to orbit and scroll to zoom.">
    <Globe ref={globe} width={size.width} height={size.height}
      backgroundColor="rgba(0,0,0,0)" globeMaterial={ocean}
      showAtmosphere atmosphereColor="#609aa5" atmosphereAltitude={0.12}
      polygonsData={data} polygonAltitude={f => (f as Territory).properties.id === 'land' ? 0.001 : 0.003}
      polygonCapMaterial={f => territoryMaterials.get((f as Territory).properties.id) ?? landMaterial}
      polygonCapColor={f => {
        const p = (f as Territory).properties;
        return p.color + (focus && focus !== p.id && p.id !== 'land' ? '35' : 'e8');
      }}
      polygonSideColor="" polygonStrokeColor={f => {
        const p = (f as Territory).properties;
        return p.id === 'land' || !borders ? null : `${p.color}ee`;
      }} polygonCapCurvatureResolution={3} polygonsTransitionDuration={0}
      onPolygonHover={f => onHover(f && (f as Territory).properties.id !== 'land' ? (f as Territory).properties.name : null)}
      onZoom={pov => {
        if (!container.current) return;
        container.current.dataset.cameraLat = String(pov.lat);
        container.current.dataset.cameraLng = String(pov.lng);
        container.current.dataset.cameraAltitude = String(pov.altitude);
      }}
      onGlobeReady={initialize} animateIn={false}
    />
  </div>;
}
