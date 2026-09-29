/* Paquet three.js réduit au strict nécessaire pour le globe (ocean-globe.js) et les transitions 3D (activity-transition-3d.js).
   Usage : node scripts/build-three-globe.mjs  →  vendor/three/three.globe.min.js
   Ajouter ici toute nouvelle classe three utilisée par ocean-globe.js ou activity-transition-3d.js. */
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const names=['AdditiveBlending','BackSide','BufferAttribute','BufferGeometry','CanvasTexture','ClampToEdgeWrapping','Color','CustomBlending','DoubleSide','DynamicDrawUsage','Float32BufferAttribute','InstancedBufferAttribute','InstancedBufferGeometry','LinearFilter','LinearMipmapLinearFilter','Line','LineBasicMaterial','LineSegments','Mesh','NoColorSpace','OneFactor','OneMinusSrcAlphaFactor','NormalBlending','OrthographicCamera','PerspectiveCamera','PlaneGeometry','Points','Raycaster','RepeatWrapping','Scene','ShaderMaterial','SphereGeometry','SRGBColorSpace','Texture','TextureLoader','Vector2','Vector3','WebGLRenderer','WebGLRenderTarget'];
await build({
  stdin:{contents:`export {${names.join(',')}} from 'three';`,resolveDir:root,loader:'js'},
  bundle:true,minify:true,format:'esm',target:'es2020',legalComments:'none',
  banner:{js:'/* three.js r186 (MIT, © 2010-2026 three.js authors) — sous-ensemble pour le globe Ocean Buddy, voir scripts/build-three-globe.mjs */'},
  outfile:path.join(root,'vendor/three/three.globe.min.js')
});
console.log('vendor/three/three.globe.min.js');
