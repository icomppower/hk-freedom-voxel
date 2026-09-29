// Node resolve hook: the game's importmap ('three', 'three/addons/') for headless runs of the sim modules.
import { pathToFileURL } from 'node:url';
import { resolve as res } from 'node:path';
const ROOT = res(import.meta.dirname, '../..');
const THREE = pathToFileURL(res(ROOT, 'vendor/three/three.module.js')).href;
const ADDONS = pathToFileURL(res(ROOT, 'vendor/three/addons')).href + '/';
export async function resolve(spec, ctx, next) {
  if (spec === 'three') return { url: THREE, shortCircuit: true };
  if (spec.startsWith('three/addons/')) return { url: ADDONS + spec.slice(13), shortCircuit: true };
  return next(spec, ctx);
}
