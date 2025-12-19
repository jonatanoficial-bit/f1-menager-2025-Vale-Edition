/* trackKeyMap.js
 * Normaliza nomes de pista vindos de URL/menus para o nome do arquivo SVG em assets/tracks/.
 * Estratégia:
 *  - normalização (lowercase, remove acentos, troca espaços/hífens por _)
 *  - tabela de aliases comuns (pt/en)
 *  - fallback: retorna lista de candidatos para o renderer tentar em ordem
 */
(function () {
  function stripAccents(str) {
    try { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    catch { return str; }
  }

  function clean(raw) {
    return stripAccents(String(raw || ""))
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/-+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  }

  // Mapeamento de aliases -> nome "canônico" (que o renderer tentará primeiro)
  const ALIAS = {
    // Bahrain
    "bahrain": "bahrain",
    "bahrein": "bahrain",

    // Australia
    "australia": "australia",
    "melbourne": "australia",

    // Saudi / Jeddah
    "saudiarabia": "saudi_arabia",
    "saudi_arabia": "saudi_arabia",
    "arabia_saudita": "saudi_arabia",
    "jeddah": "saudi_arabia",

    // UK / Britain / Silverstone
    "greatbritain": "britain",
    "great_britain": "britain",
    "uk": "britain",
    "united_kingdom": "britain",
    "britain": "britain",
    "silverstone": "britain",

    // USA variants
    "united_states": "estados_unidos",
    "usa": "estados_unidos",
    "estados_unidos": "estados_unidos",
    "miami": "miami",
    "austin": "austin",
    "las_vegas": "las_vegas",
    "vegas": "las_vegas",

    // Others common dual-language
    "spain": "espanha",
    "espanha": "espanha",
    "japan": "japan",
    "china": "china",
    "monaco": "monaco",
    "canada": "canada",
    "brazil": "brazil",
    "brasil": "brazil",
    "mexico": "mexico",
    "hungary": "hungria",
    "hungria": "hungria",
    "belgium": "belgica",
    "belgica": "belgica",
    "azerbaijan": "azerbaijan",
    "abudhabi": "abu_dhabi",
    "abu_dhabi": "abu_dhabi",
    "catar": "catar",
    "qatar": "catar",
    "holanda": "holanda",
    "netherlands": "holanda"
  };

  function getTrackCandidates(rawKey) {
    const k = clean(rawKey);
    const primary = ALIAS[k] || k;

    // candidatos adicionais (caso existam arquivos duplicados no assets/tracks/)
    const candidates = [];
    const pushUnique = (v) => { if (v && !candidates.includes(v)) candidates.push(v); };

    pushUnique(primary);
    // variações comuns
    pushUnique(primary.replace(/_/g, ""));          // abu_dhabi -> abudhabi
    pushUnique(primary.replace(/_/g, "-"));         // abu_dhabi -> abu-dhabi (se houver)
    pushUnique(primary.replace(/_/g, ""));          // repetido, mas mantemos unique
    pushUnique(k);                                  // original limpo
    pushUnique(k.replace(/_/g, ""));                 // sem underscore

    // Algumas pistas no seu assets têm versões pt/en simultâneas; tentamos também.
    // ex: belgium/belgica, bahrain/bahrein, etc.
    if (primary === "bahrain") pushUnique("bahrein");
    if (primary === "belgica") pushUnique("belgium");
    if (primary === "espanha") pushUnique("spain");
    if (primary === "hungria") pushUnique("hungary");
    if (primary === "abu_dhabi") pushUnique("abudhabi");
    if (primary === "saudi_arabia") pushUnique("arabia_saudita");

    return candidates;
  }

  window.TrackKeyMap = { clean, getTrackCandidates };
})();
