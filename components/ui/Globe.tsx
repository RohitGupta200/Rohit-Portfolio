"use client";
import { useEffect, useRef, useState } from "react";
import { Color, Scene, Fog, PerspectiveCamera, Vector3, WebGLRenderer, MeshBasicMaterial, Mesh, SphereGeometry, Line, LineBasicMaterial, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, ArcCurve, LineSegments, Vector3 as ThreeVector3, AmbientLight, DirectionalLight, PointLight } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import countries from "@/data/globe.json";

const RING_PROPAGATION_SPEED = 3;
const aspect = 1.2;
const cameraZ = 300;

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

export function Globe({ globeConfig, data }: WorldProps) {
  const [globeData, setGlobeData] = useState<
    | {
        size: number;
        order: number;
        color: (t: number) => string;
        lat: number;
        lng: number;
      }[]
    | null
  >(null);

  const globeRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const defaultProps = {
    pointSize: 1,
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
    globeColor: "#1d072e",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  useEffect(() => {
    if (globeRef.current) {
      initThreeJs();
      buildData();
      buildMaterial();
    }
  }, [globeRef.current]);

  const initThreeJs = () => {
    const canvas = globeRef.current!;
    const scene = new Scene();
    scene.fog = new Fog(0xffffff, 400, 2000);
    sceneRef.current = scene;

    const camera = new PerspectiveCamera(50, aspect, 180, 1800);
    camera.position.z = cameraZ;
    cameraRef.current = camera;

    const renderer = new WebGLRenderer({ canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0xffaaff, 0);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = cameraZ;
    controls.maxDistance = cameraZ;
    controls.autoRotateSpeed = 1;
    controls.autoRotate = true;
    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI - Math.PI / 3;
    controlsRef.current = controls;

    animate();

    window.addEventListener('resize', onWindowResize);
  };

  const buildMaterial = () => {
    if (!globeRef.current || !sceneRef.current) return;

    // Assuming you want to use a material for the globe here
    const globeMaterial = new MeshBasicMaterial({ color: new Color(globeConfig.globeColor) });
    // Update other material properties as needed
  };

  const buildData = () => {
    const arcs = data;
    let points = [];
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      const rgb = hexToRgb(arc.color) as { r: number; g: number; b: number };
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
        lat: arc.startLat,
        lng: arc.startLng,
      });
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
        lat: arc.endLat,
        lng: arc.endLng,
      });
    }

    // Remove duplicates for the same lat and lng
    const filteredPoints = points.filter(
      (v, i, a) =>
        a.findIndex((v2) =>
          ["lat", "lng"].every(
            (k) => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"]
          )
        ) === i
    );

    setGlobeData(filteredPoints);
  };

  const startAnimation = () => {
    if (!globeData) return;

    // Add animations, arcs, points here based on your data
  };

  const animate = () => {
    requestAnimationFrame(animate);

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      if (controlsRef.current) controlsRef.current.update();
    }
  };

  const onWindowResize = () => {
    if (rendererRef.current && cameraRef.current) {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    }
  };

  useEffect(() => {
    startAnimation();
    return () => {
      window.removeEventListener('resize', onWindowResize);
    };
  }, [globeData]);

  return <canvas ref={globeRef} />;
}

export function World(props: WorldProps) {
  const { globeConfig, data } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const scene = new Scene();
      scene.fog = new Fog(0xffffff, 400, 2000);

      const camera = new PerspectiveCamera(50, aspect, 180, 1800);
      camera.position.z = cameraZ;

      const renderer = new WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor(0xffaaff, 0);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.minDistance = cameraZ;
      controls.maxDistance = cameraZ;
      controls.autoRotateSpeed = 1;
      controls.autoRotate = true;
      controls.minPolarAngle = Math.PI / 3.5;
      controls.maxPolarAngle = Math.PI - Math.PI / 3;

      const ambientLight = new AmbientLight(globeConfig.ambientLight || "#ffffff", 0.6);
      scene.add(ambientLight);

      const directionalLight1 = new DirectionalLight(globeConfig.directionalLeftLight || "#ffffff", 0.8);
      directionalLight1.position.set(-400, 100, 400);
      scene.add(directionalLight1);

      const directionalLight2 = new DirectionalLight(globeConfig.directionalTopLight || "#ffffff", 0.8);
      directionalLight2.position.set(-200, 500, 200);
      scene.add(directionalLight2);

      const pointLight = new PointLight(globeConfig.pointLight || "#ffffff", 0.8);
      pointLight.position.set(-200, 500, 200);
      scene.add(pointLight);

      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        controls.update();
      };

      animate();

      const onWindowResize = () => {
        if (camera && renderer) {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
      };

      window.addEventListener('resize', onWindowResize);

      return () => {
        window.removeEventListener('resize', onWindowResize);
      };
    }
  }, [canvasRef.current, globeConfig, data]);

  return (
    <>
      <canvas ref={canvasRef} />
      {/* Render the Globe component as a child here */}
      <Globe globeConfig={globeConfig} data={data} />
    </>
  );
}

export function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
  const arr = [];
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (arr.indexOf(r) === -1) arr.push(r);
  }

  return arr;
}
