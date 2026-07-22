/**
 * VELYX Vite Adapter Plugin
 * Developed by Florynx Labs
 * Enables compiling .vx components seamlessly within Vite applications.
 */

import { compile } from '@velyx/compiler';

export function velyxPlugin() {
  return {
    name: 'vite-plugin-velyx',
    transform(code: string, id: string) {
      if (!id.endsWith('.vx')) {
        return null;
      }

      const compiled = compile(code, { filename: id });

      return {
        code: compiled.code,
        map: null
      };
    }
  };
}

export default velyxPlugin;
