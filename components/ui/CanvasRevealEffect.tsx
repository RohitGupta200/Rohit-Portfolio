"use client";
import { cn } from "@/lib/utils";
import * as THREE from "three";
import React, { useEffect, useRef, useState } from "react";

export const CanvasRevealEffect = ({
  animationSpeed = 0.4,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      width / -2, width / 2,
      height / 2, height / -2,
      -1000, 1000
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    // Create ShaderMaterial
    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: `
      precision mediump float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
      fragmentShader: `
      precision mediump float;
      in vec2 fragCoord;

      uniform float u_time;
      uniform float u_opacities[10];
      uniform vec3 u_colors[6];
      uniform float u_total_size;
      uniform float u_dot_size;
      uniform vec2 u_resolution;
      out vec4 fragColor;
      float PHI = 1.61803398874989484820459;
      float random(vec2 xy) {
          return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
      }
      float map(float value, float min1, float max1, float min2, float max2) {
          return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
      }
      void main() {
          vec2 st = fragCoord.xy;
          float opacity = step(0.0, st.x);
          opacity *= step(0.0, st.y);

          vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

          float frequency = 5.0;
          float show_offset = random(st2);
          float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency) + 1.0);
          opacity *= u_opacities[int(rand * 10.0)];
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

          vec3 color = u_colors[int(show_offset * 6.0)];

          fragColor = vec4(color, opacity);
          fragColor.rgb *= fragColor.a;
      }
      `,
      uniforms: {
        u_time: { value: 0 },
        u_opacities: { value: opacities },
        u_colors: { value: colors.map(c => new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255)) },
        u_total_size: { value: 4 },
        u_dot_size: { value: dotSize ?? 2 },
        u_resolution: { value: new THREE.Vector2(width, height) }
      },
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });

    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(2, 2);
    const plane = new THREE.Mesh(geometry, shaderMaterial);
    scene.add(plane);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      shaderMaterial.uniforms.u_time.value += 0.016; // Update time uniform
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      shaderMaterial.dispose();
    };
  }, [animationSpeed, opacities, colors, dotSize]);

  return (
    <div className={cn("h-full relative bg-white w-full", containerClassName)} ref={containerRef}>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-[84%]" />
      )}
    </div>
  );
};
