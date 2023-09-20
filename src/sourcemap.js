const sourcemapScript = 'https://unpkg.com/source-map@0.7.3/dist/source-map.js';
const fetchDependency = () => {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');

    s.setAttribute('src', sourcemapScript);
    s.addEventListener('load', resolve);
    s.addEventListener('error', reject);

    document.head.appendChild(s);
  });
};
export const initializeConsumer = async () => await fetchDependency() && window.sourceMap?.SourceMapConsumer.initialize({
  'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm'
});
