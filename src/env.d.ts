// .glsl / .vert / .frag を文字列として import するための型 (vite-plugin-glsl)
/// <reference types="vite-plugin-glsl/ext" />

// Astro の astro-jsx.d.ts が `/// <reference lib="dom" />` で lib.dom を強制的に読み込むため、
// worker-configuration.d.ts (workerd runtime types) の CacheStorage 宣言は DOM の interface に負ける。
// Cloudflare Workers 固有の `caches.default` を使えるよう、DOM の CacheStorage に追加する。
interface CacheStorage {
	readonly default: Cache;
}
