// Home and Contact background: slow, low-contrast folds of pink drawn by a full-screen shader.
// If WebGL or the CDN is unavailable, the page keeps its plain background.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('bg');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

const css = getComputedStyle(document.documentElement);
const color = (name) => new THREE.Color(css.getPropertyValue(name).trim());

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  t: { value: 0 },
  res: { value: new THREE.Vector2() },
  bg: { value: color('--bg') },
  soft: { value: color('--accent-soft') },
  accent: { value: color('--accent') },
};
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms,
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }',
  fragmentShader: `
    uniform float t; uniform vec2 res; uniform vec3 bg, soft, accent; varying vec2 vUv;
    void main() {
      vec2 p = vUv * vec2(res.x / res.y, 1.0) * 1.6;
      float f = 0.0;
      f += sin(p.x * 1.3 + t * 0.20 + sin(p.y * 1.7 + t * 0.15) * 1.4);
      f += sin(p.y * 2.1 - t * 0.17 + sin(p.x * 1.1 - t * 0.12) * 1.2);
      f = f * 0.25 + 0.5;
      vec3 c = mix(bg, soft, smoothstep(0.3, 0.95, f) * 0.75);
      c = mix(c, accent, smoothstep(0.85, 1.0, f) * 0.1);
      // Fade toward the plain background on the left, behind the text
      c = mix(bg, c, smoothstep(0.2, 0.9, vUv.x));
      gl_FragColor = vec4(c, 1.0);
    }`,
})));

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  uniforms.res.value.set(w, h);
}
addEventListener('resize', resize);
resize();

const t0 = performance.now();
function frame(now) {
  uniforms.t.value = (now - t0) / 1000;
  renderer.render(scene, camera);
  if (!still && !document.hidden) requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && !still) requestAnimationFrame(frame); });
requestAnimationFrame(frame);
