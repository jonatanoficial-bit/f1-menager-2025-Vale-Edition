/* trackRenderer.js
 * Renderer único de pista (SVG) usado por Treino, Qualy e Corrida.
 * Responsável por:
 *  - carregar o SVG
 *  - selecionar o path principal (maior comprimento)
 *  - normalizar viewBox pelo bbox do path principal (corrige pista cortada/minúscula)
 *  - gerar pontos do path para animar carros
 *
 * Depende de window.TrackKeyMap.getTrackCandidates (trackKeyMap.js).
 */
(function () {
  async function fetchFirstOk(candidates, basePath) {
    let lastErr = null;
    for (const key of candidates) {
      try {
        const url = `${basePath}${key}.svg`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) { lastErr = new Error(`${url} (${res.status})`); continue; }
        return { key, svgText: await res.text() };
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Falha ao carregar SVG da pista.");
  }

  function pickMainPath(svgRoot) {
    const paths = Array.from(svgRoot.querySelectorAll("path"));
    if (!paths.length) throw new Error("Nenhum <path> encontrado no SVG.");
    let best = null;
    let bestLen = -1;
    for (const p of paths) {
      try {
        const len = p.getTotalLength();
        if (len > bestLen) { bestLen = len; best = p; }
      } catch {}
    }
    if (!best) throw new Error("Não foi possível detectar o path principal.");
    return best;
  }

  function normalizeViewBox(svgRoot, mainPath) {
    try {
      const bb = mainPath.getBBox();
      const pad = Math.max(20, Math.max(bb.width, bb.height) * 0.08);
      svgRoot.setAttribute("viewBox", `${bb.x - pad} ${bb.y - pad} ${bb.width + pad * 2} ${bb.height + pad * 2}`);
    } catch (e) {
      console.warn("[trackRenderer] getBBox/viewBox falhou:", e);
    }
    svgRoot.setAttribute("width", "100%");
    svgRoot.setAttribute("height", "100%");
    svgRoot.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }

  function styleMainPath(mainPath) {
    // Mantém o look do protótipo: traço claro, sem fill
    mainPath.style.fill = "none";
    mainPath.style.stroke = mainPath.style.stroke || "#e6e6e6";
    mainPath.style.strokeWidth = mainPath.style.strokeWidth || "2";
    mainPath.style.vectorEffect = "non-scaling-stroke";
  }

  function buildPathPoints(pathEl, samples) {
    const len = pathEl.getTotalLength();
    const pts = [];
    for (let i = 0; i < samples; i++) {
      const p = pathEl.getPointAtLength((i / samples) * len);
      pts.push({ x: p.x, y: p.y });
    }
    return pts;
  }

  async function renderTrack({ containerEl, rawTrackKey, basePath = "assets/tracks/", samples = 1400 }) {
    if (!containerEl) throw new Error("Container SVG não informado.");
    const keyMap = window.TrackKeyMap;
    const candidates = keyMap && keyMap.getTrackCandidates ? keyMap.getTrackCandidates(rawTrackKey) : [String(rawTrackKey || "").toLowerCase()];
    const { key, svgText } = await fetchFirstOk(candidates, basePath);

    containerEl.innerHTML = svgText;
    const svgRoot = containerEl.querySelector("svg");
    if (!svgRoot) throw new Error("SVG inválido: <svg> não encontrado.");

    const mainPath = pickMainPath(svgRoot);
    normalizeViewBox(svgRoot, mainPath);
    styleMainPath(mainPath);

    // camada de carros (se não existir)
    let carsLayer = svgRoot.querySelector("#cars-layer");
    if (!carsLayer) {
      carsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      carsLayer.setAttribute("id", "cars-layer");
      svgRoot.appendChild(carsLayer);
    }

    const points = buildPathPoints(mainPath, samples);

    return { resolvedKey: key, svgRoot, mainPath, carsLayer, points };
  }

  window.TrackRenderer = { renderTrack, buildPathPoints, normalizeViewBox, pickMainPath };
})();
