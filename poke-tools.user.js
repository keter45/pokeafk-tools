// ==UserScript==
// @name         PokeAFK Tools
// @namespace    pokeafk-tools
// @version      1.0.0
// @description  Ferramentas para o pokeAFK: filtros e tiers no mercado, no mapa e na ficha, recomendações de natureza, IVs e golpes, daily de treinadores e monitor de contas entre abas.
// @homepageURL  https://github.com/keter45/pokeafk-tools
// @supportURL   https://github.com/keter45/pokeafk-tools/issues
// @updateURL    https://raw.githubusercontent.com/keter45/pokeafk-tools/main/poke-tools.user.js
// @downloadURL  https://raw.githubusercontent.com/keter45/pokeafk-tools/main/poke-tools.user.js
// @match        https://pokeafk.io/*
// @run-at       document-idle
// @sandbox      JavaScript
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @noframes
// ==/UserScript==

// Gerado por build-userscript.mjs a partir de src/. Não edite este arquivo: edite src/ e rode
// node build-userscript.mjs.
(() => {
  'use strict';

  // ==== src/settings.js ====
  // ---- Módulos ----
  // Each part of the script can be turned off in the userscript manager's menu. The choice lives in
  // the manager's storage (shared by every tab and container) and applies on the next page load.
  const MODULES = {
    tiers: 'Tiers, filtros do mercado e ficha',
    daily: 'Daily de treinadores',
    monitor: 'Monitor de contas',
  };
  const MODULES_KEY = 'modules';
  const hasModuleStore = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

  function readModules() {
    try {
      const saved = hasModuleStore ? GM_getValue(MODULES_KEY, {}) : {};
      return Object.fromEntries(Object.keys(MODULES).map(id => [id, saved?.[id] !== false]));
    } catch {
      return Object.fromEntries(Object.keys(MODULES).map(id => [id, true]));
    }
  }

  const enabledModules = readModules();
  const moduleEnabled = id => enabledModules[id] !== false;

  if (hasModuleStore && typeof GM_registerMenuCommand === 'function') {
    for (const [id, label] of Object.entries(MODULES)) {
      const on = moduleEnabled(id);
      GM_registerMenuCommand(`${on ? '✅' : '⬜'} ${label}`, () => {
        const next = { ...readModules(), [id]: !on };
        GM_setValue(MODULES_KEY, next);
        const verb = on ? 'desligado' : 'ligado';
        if (confirm(`${label}: ${verb}. Recarregar a página para aplicar?`)) location.reload();
      });
    }
  }

  // Lets the old separate scripts know this one is installed, so they stay quiet.
  document.documentElement.dataset.pokeTools = '';

  // ==== src/data/guide.js ====
  // Gerado por build-data.mjs a partir de pokepedia-data.json e competitive-data.json. Não edite à mão.
  const MARKET_GUIDE = /* GUIDE_DATA_START */ {
    "sourceUrl": "https://pokeafk.io/pokepedia/",
    "competitiveSources": {"gen3Sets":"https://data.pkmn.cc/sets/gen3.json","gen2Sets":"https://data.pkmn.cc/sets/gen2.json","gen1Sets":"https://data.pkmn.cc/sets/gen1.json","gen3Tiers":"https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/gen3/formats-data.ts","gen3Random":"https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/random-battles/gen3/sets.json"},
    "tierThresholds": {"pve":{"S":75.3,"A":57.7,"B":47.2,"C":30,"D":0},"pvp":{"S":65,"A":53.5,"B":42.1,"C":28.4,"D":0}},
    "missingProfiles": [],
    "types": {"1":"grass/poison","2":"grass/poison","3":"grass/poison","4":"fire","5":"fire","6":"fire/flying","7":"water","8":"water","9":"water","10":"bug","11":"bug","12":"bug/flying","13":"bug/poison","14":"bug/poison","15":"bug/poison","16":"normal/flying","17":"normal/flying","18":"normal/flying","19":"normal","20":"normal","21":"normal/flying","22":"normal/flying","23":"poison","24":"poison","25":"electric","26":"electric","27":"ground","28":"ground","29":"poison","30":"poison","31":"poison/ground","32":"poison","33":"poison","34":"poison/ground","35":"normal","36":"normal","37":"fire","38":"fire","39":"normal","40":"normal","41":"poison/flying","42":"poison/flying","43":"grass/poison","44":"grass/poison","45":"grass/poison","46":"bug/grass","47":"bug/grass","48":"bug/poison","49":"bug/poison","50":"ground","51":"ground","52":"normal","53":"normal","54":"water","55":"water","56":"fighting","57":"fighting","58":"fire","59":"fire","60":"water","61":"water","62":"water/fighting","63":"psychic","64":"psychic","65":"psychic","66":"fighting","67":"fighting","68":"fighting","69":"grass/poison","70":"grass/poison","71":"grass/poison","72":"water/poison","73":"water/poison","74":"rock/ground","75":"rock/ground","76":"rock/ground","77":"fire","78":"fire","79":"water/psychic","80":"water/psychic","81":"electric/steel","82":"electric/steel","83":"normal/flying","84":"normal/flying","85":"normal/flying","86":"water","87":"water/ice","88":"poison","89":"poison","90":"water","91":"water/ice","92":"ghost/poison","93":"ghost/poison","94":"ghost/poison","95":"rock/ground","96":"psychic","97":"psychic","98":"water","99":"water","100":"electric","101":"electric","102":"grass/psychic","103":"grass/psychic","104":"ground","105":"ground","106":"fighting","107":"fighting","108":"normal","109":"poison","110":"poison","111":"ground/rock","112":"ground/rock","113":"normal","114":"grass","115":"normal","116":"water","117":"water","118":"water","119":"water","120":"water","121":"water/psychic","122":"psychic","123":"bug/flying","124":"ice/psychic","125":"electric","126":"fire","127":"bug","128":"normal","129":"water","130":"water/flying","131":"water/ice","132":"normal","133":"normal","134":"water","135":"electric","136":"fire","137":"normal","138":"rock/water","139":"rock/water","140":"rock/water","141":"rock/water","142":"rock/flying","143":"normal","144":"ice/flying","145":"electric/flying","146":"fire/flying","147":"dragon","148":"dragon","149":"dragon/flying","150":"psychic","151":"psychic","152":"grass","153":"grass","154":"grass","155":"fire","156":"fire","157":"fire","158":"water","159":"water","160":"water","161":"normal","162":"normal","163":"normal/flying","164":"normal/flying","165":"bug/flying","166":"bug/flying","167":"bug/poison","168":"bug/poison","169":"poison/flying","170":"water/electric","171":"water/electric","172":"electric","173":"normal","174":"normal","175":"normal","176":"normal/flying","177":"psychic/flying","178":"psychic/flying","179":"electric","180":"electric","181":"electric","182":"grass","183":"water","184":"water","185":"rock","186":"water","187":"grass/flying","188":"grass/flying","189":"grass/flying","190":"normal","191":"grass","192":"grass","193":"bug/flying","194":"water/ground","195":"water/ground","196":"psychic","197":"dark","198":"dark/flying","199":"water/psychic","200":"ghost","201":"psychic","202":"psychic","203":"normal/psychic","204":"bug","205":"bug/steel","206":"normal","207":"ground/flying","208":"steel/ground","209":"normal","210":"normal","211":"water/poison","212":"bug/steel","213":"bug/rock","214":"bug/fighting","215":"dark/ice","216":"normal","217":"normal","218":"fire","219":"fire/rock","220":"ice/ground","221":"ice/ground","222":"water/rock","223":"water","224":"water","225":"ice/flying","226":"water/flying","227":"steel/flying","228":"dark/fire","229":"dark/fire","230":"water/dragon","231":"ground","232":"ground","233":"normal","234":"normal","235":"normal","236":"fighting","237":"fighting","238":"ice/psychic","239":"electric","240":"fire","241":"normal","242":"normal","243":"electric","244":"fire","245":"water","246":"rock/ground","247":"rock/ground","248":"rock/dark","249":"psychic/flying","250":"fire/flying","251":"psychic/grass","252":"grass","253":"grass","254":"grass","255":"fire","256":"fire/fighting","257":"fire/fighting","258":"water","259":"water/ground","260":"water/ground","261":"dark","262":"dark","263":"normal","264":"normal","265":"bug","266":"bug","267":"bug/flying","268":"bug","269":"bug/poison","270":"water/grass","271":"water/grass","272":"water/grass","273":"grass","274":"grass/dark","275":"grass/dark","276":"normal/flying","277":"normal/flying","278":"water/flying","279":"water/flying","280":"psychic","281":"psychic","282":"psychic","283":"bug/water","284":"bug/flying","285":"grass","286":"grass/fighting","287":"normal","288":"normal","289":"normal","290":"bug/ground","291":"bug/flying","292":"bug/ghost","293":"normal","294":"normal","295":"normal","296":"fighting","297":"fighting","298":"normal","299":"rock","300":"normal","301":"normal","302":"dark/ghost","303":"steel","304":"steel/rock","305":"steel/rock","306":"steel/rock","307":"fighting/psychic","308":"fighting/psychic","309":"electric","310":"electric","311":"electric","312":"electric","313":"bug","314":"bug","315":"grass/poison","316":"poison","317":"poison","318":"water/dark","319":"water/dark","320":"water","321":"water","322":"fire/ground","323":"fire/ground","324":"fire","325":"psychic","326":"psychic","327":"normal","328":"ground","329":"ground/dragon","330":"ground/dragon","331":"grass","332":"grass/dark","333":"normal/flying","334":"dragon/flying","335":"normal","336":"poison","337":"rock/psychic","338":"rock/psychic","339":"water/ground","340":"water/ground","341":"water","342":"water/dark","343":"ground/psychic","344":"ground/psychic","345":"rock/grass","346":"rock/grass","347":"rock/bug","348":"rock/bug","349":"water","350":"water","351":"normal","352":"normal","353":"ghost","354":"ghost","355":"ghost","356":"ghost","357":"grass/flying","358":"psychic","359":"dark","360":"psychic","361":"ice","362":"ice","363":"ice/water","364":"ice/water","365":"ice/water","366":"water","367":"water","368":"water","369":"water/rock","370":"water","371":"dragon","372":"dragon","373":"dragon/flying","374":"steel/psychic","375":"steel/psychic","376":"steel/psychic","377":"rock","378":"ice","379":"steel","380":"dragon/psychic","381":"dragon/psychic","382":"water","383":"ground","384":"dragon/flying","385":"steel/psychic","386":"psychic"},
    "species": {
      "1": {"name":"Bulbasaur","finals":[3],"variants":["3-mega"]},
      "2": {"name":"Ivysaur","finals":[3],"variants":["3-mega"]},
      "3": {"name":"Venusaur","finals":[3],"variants":["3-mega"]},
      "4": {"name":"Charmander","finals":[6],"variants":["6-mega-x","6-mega-y"]},
      "5": {"name":"Charmeleon","finals":[6],"variants":["6-mega-x","6-mega-y"]},
      "6": {"name":"Charizard","finals":[6],"variants":["6-mega-x","6-mega-y"]},
      "7": {"name":"Squirtle","finals":[9],"variants":["9-mega"]},
      "8": {"name":"Wartortle","finals":[9],"variants":["9-mega"]},
      "9": {"name":"Blastoise","finals":[9],"variants":["9-mega"]},
      "10": {"name":"Caterpie","finals":[12]},
      "11": {"name":"Metapod","finals":[12]},
      "12": {"name":"Butterfree","finals":[12]},
      "13": {"name":"Weedle","finals":[15],"variants":["15-mega"]},
      "14": {"name":"Kakuna","finals":[15],"variants":["15-mega"]},
      "15": {"name":"Beedrill","finals":[15],"variants":["15-mega"]},
      "16": {"name":"Pidgey","finals":[18],"variants":["18-mega"]},
      "17": {"name":"Pidgeotto","finals":[18],"variants":["18-mega"]},
      "18": {"name":"Pidgeot","finals":[18],"variants":["18-mega"]},
      "19": {"name":"Rattata","finals":[20]},
      "20": {"name":"Raticate","finals":[20]},
      "21": {"name":"Spearow","finals":[22]},
      "22": {"name":"Fearow","finals":[22]},
      "23": {"name":"Ekans","finals":[24]},
      "24": {"name":"Arbok","finals":[24]},
      "25": {"name":"Pikachu","finals":[26]},
      "26": {"name":"Raichu","finals":[26]},
      "27": {"name":"Sandshrew","finals":[28]},
      "28": {"name":"Sandslash","finals":[28]},
      "29": {"name":"Nidoran♀","finals":[31]},
      "30": {"name":"Nidorina","finals":[31]},
      "31": {"name":"Nidoqueen","finals":[31]},
      "32": {"name":"Nidoran♂","finals":[34]},
      "33": {"name":"Nidorino","finals":[34]},
      "34": {"name":"Nidoking","finals":[34]},
      "35": {"name":"Clefairy","finals":[36]},
      "36": {"name":"Clefable","finals":[36]},
      "37": {"name":"Vulpix","finals":[38]},
      "38": {"name":"Ninetales","finals":[38]},
      "39": {"name":"Jigglypuff","finals":[40]},
      "40": {"name":"Wigglytuff","finals":[40]},
      "41": {"name":"Zubat","finals":[169]},
      "42": {"name":"Golbat","finals":[169]},
      "43": {"name":"Oddish","finals":[45,182]},
      "44": {"name":"Gloom","finals":[45,182]},
      "45": {"name":"Vileplume","finals":[45]},
      "46": {"name":"Paras","finals":[47]},
      "47": {"name":"Parasect","finals":[47]},
      "48": {"name":"Venonat","finals":[49]},
      "49": {"name":"Venomoth","finals":[49]},
      "50": {"name":"Diglett","finals":[51]},
      "51": {"name":"Dugtrio","finals":[51]},
      "52": {"name":"Meowth","finals":[53]},
      "53": {"name":"Persian","finals":[53]},
      "54": {"name":"Psyduck","finals":[55]},
      "55": {"name":"Golduck","finals":[55]},
      "56": {"name":"Mankey","finals":[57]},
      "57": {"name":"Primeape","finals":[57]},
      "58": {"name":"Growlithe","finals":[59]},
      "59": {"name":"Arcanine","finals":[59]},
      "60": {"name":"Poliwag","finals":[62,186]},
      "61": {"name":"Poliwhirl","finals":[62,186]},
      "62": {"name":"Poliwrath","finals":[62]},
      "63": {"name":"Abra","finals":[65],"variants":["65-mega"]},
      "64": {"name":"Kadabra","finals":[65],"variants":["65-mega"]},
      "65": {"name":"Alakazam","finals":[65],"variants":["65-mega"]},
      "66": {"name":"Machop","finals":[68]},
      "67": {"name":"Machoke","finals":[68]},
      "68": {"name":"Machamp","finals":[68]},
      "69": {"name":"Bellsprout","finals":[71]},
      "70": {"name":"Weepinbell","finals":[71]},
      "71": {"name":"Victreebel","finals":[71]},
      "72": {"name":"Tentacool","finals":[73]},
      "73": {"name":"Tentacruel","finals":[73]},
      "74": {"name":"Geodude","finals":[76]},
      "75": {"name":"Graveler","finals":[76]},
      "76": {"name":"Golem","finals":[76]},
      "77": {"name":"Ponyta","finals":[78]},
      "78": {"name":"Rapidash","finals":[78]},
      "79": {"name":"Slowpoke","finals":[80,199],"variants":["80-mega"]},
      "80": {"name":"Slowbro","finals":[80],"variants":["80-mega"]},
      "81": {"name":"Magnemite","finals":[82]},
      "82": {"name":"Magneton","finals":[82]},
      "83": {"name":"Farfetch'd","finals":[83]},
      "84": {"name":"Doduo","finals":[85]},
      "85": {"name":"Dodrio","finals":[85]},
      "86": {"name":"Seel","finals":[87]},
      "87": {"name":"Dewgong","finals":[87]},
      "88": {"name":"Grimer","finals":[89]},
      "89": {"name":"Muk","finals":[89]},
      "90": {"name":"Shellder","finals":[91]},
      "91": {"name":"Cloyster","finals":[91]},
      "92": {"name":"Gastly","finals":[94],"variants":["94-mega"]},
      "93": {"name":"Haunter","finals":[94],"variants":["94-mega"]},
      "94": {"name":"Gengar","finals":[94],"variants":["94-mega"]},
      "95": {"name":"Onix","finals":[208],"variants":["208-mega"]},
      "96": {"name":"Drowzee","finals":[97]},
      "97": {"name":"Hypno","finals":[97]},
      "98": {"name":"Krabby","finals":[99]},
      "99": {"name":"Kingler","finals":[99]},
      "100": {"name":"Voltorb","finals":[101]},
      "101": {"name":"Electrode","finals":[101]},
      "102": {"name":"Exeggcute","finals":[103]},
      "103": {"name":"Exeggutor","finals":[103]},
      "104": {"name":"Cubone","finals":[105]},
      "105": {"name":"Marowak","finals":[105]},
      "106": {"name":"Hitmonlee","finals":[106]},
      "107": {"name":"Hitmonchan","finals":[107]},
      "108": {"name":"Lickitung","finals":[108]},
      "109": {"name":"Koffing","finals":[110]},
      "110": {"name":"Weezing","finals":[110]},
      "111": {"name":"Rhyhorn","finals":[112]},
      "112": {"name":"Rhydon","finals":[112]},
      "113": {"name":"Chansey","finals":[242]},
      "114": {"name":"Tangela","finals":[114]},
      "115": {"name":"Kangaskhan","finals":[115],"variants":["115-mega"]},
      "116": {"name":"Horsea","finals":[230]},
      "117": {"name":"Seadra","finals":[230]},
      "118": {"name":"Goldeen","finals":[119]},
      "119": {"name":"Seaking","finals":[119]},
      "120": {"name":"Staryu","finals":[121]},
      "121": {"name":"Starmie","finals":[121]},
      "122": {"name":"Mr. Mime","finals":[122]},
      "123": {"name":"Scyther","finals":[212],"variants":["212-mega"]},
      "124": {"name":"Jynx","finals":[124]},
      "125": {"name":"Electabuzz","finals":[125]},
      "126": {"name":"Magmar","finals":[126]},
      "127": {"name":"Pinsir","finals":[127],"variants":["127-mega"]},
      "128": {"name":"Tauros","finals":[128]},
      "129": {"name":"Magikarp","finals":[130],"variants":["130-mega"]},
      "130": {"name":"Gyarados","finals":[130],"variants":["130-mega"]},
      "131": {"name":"Lapras","finals":[131]},
      "132": {"name":"Ditto","finals":[132]},
      "133": {"name":"Eevee","finals":[135,134,136,196,197]},
      "134": {"name":"Vaporeon","finals":[134]},
      "135": {"name":"Jolteon","finals":[135]},
      "136": {"name":"Flareon","finals":[136]},
      "137": {"name":"Porygon","finals":[233]},
      "138": {"name":"Omanyte","finals":[139]},
      "139": {"name":"Omastar","finals":[139]},
      "140": {"name":"Kabuto","finals":[141]},
      "141": {"name":"Kabutops","finals":[141]},
      "142": {"name":"Aerodactyl","finals":[142],"variants":["142-mega"]},
      "143": {"name":"Snorlax","finals":[143]},
      "144": {"name":"Articuno","finals":[144]},
      "145": {"name":"Zapdos","finals":[145]},
      "146": {"name":"Moltres","finals":[146]},
      "147": {"name":"Dratini","finals":[149]},
      "148": {"name":"Dragonair","finals":[149]},
      "149": {"name":"Dragonite","finals":[149]},
      "150": {"name":"Mewtwo","finals":[150]},
      "151": {"name":"Mew","finals":[151]},
      "152": {"name":"Chikorita","finals":[154]},
      "153": {"name":"Bayleef","finals":[154]},
      "154": {"name":"Meganium","finals":[154]},
      "155": {"name":"Cyndaquil","finals":[157]},
      "156": {"name":"Quilava","finals":[157]},
      "157": {"name":"Typhlosion","finals":[157]},
      "158": {"name":"Totodile","finals":[160]},
      "159": {"name":"Croconaw","finals":[160]},
      "160": {"name":"Feraligatr","finals":[160]},
      "161": {"name":"Sentret","finals":[162]},
      "162": {"name":"Furret","finals":[162]},
      "163": {"name":"Hoothoot","finals":[164]},
      "164": {"name":"Noctowl","finals":[164]},
      "165": {"name":"Ledyba","finals":[166]},
      "166": {"name":"Ledian","finals":[166]},
      "167": {"name":"Spinarak","finals":[168]},
      "168": {"name":"Ariados","finals":[168]},
      "169": {"name":"Crobat","finals":[169]},
      "170": {"name":"Chinchou","finals":[171]},
      "171": {"name":"Lanturn","finals":[171]},
      "172": {"name":"Pichu","finals":[26]},
      "173": {"name":"Cleffa","finals":[36]},
      "174": {"name":"Igglybuff","finals":[40]},
      "175": {"name":"Togepi","finals":[176]},
      "176": {"name":"Togetic","finals":[176]},
      "177": {"name":"Natu","finals":[178]},
      "178": {"name":"Xatu","finals":[178]},
      "179": {"name":"Mareep","finals":[181],"variants":["181-mega"]},
      "180": {"name":"Flaaffy","finals":[181],"variants":["181-mega"]},
      "181": {"name":"Ampharos","finals":[181],"variants":["181-mega"]},
      "182": {"name":"Bellossom","finals":[182]},
      "183": {"name":"Marill","finals":[184]},
      "184": {"name":"Azumarill","finals":[184]},
      "185": {"name":"Sudowoodo","finals":[185]},
      "186": {"name":"Politoed","finals":[186]},
      "187": {"name":"Hoppip","finals":[189]},
      "188": {"name":"Skiploom","finals":[189]},
      "189": {"name":"Jumpluff","finals":[189]},
      "190": {"name":"Aipom","finals":[190]},
      "191": {"name":"Sunkern","finals":[192]},
      "192": {"name":"Sunflora","finals":[192]},
      "193": {"name":"Yanma","finals":[193]},
      "194": {"name":"Wooper","finals":[195]},
      "195": {"name":"Quagsire","finals":[195]},
      "196": {"name":"Espeon","finals":[196]},
      "197": {"name":"Umbreon","finals":[197]},
      "198": {"name":"Murkrow","finals":[198]},
      "199": {"name":"Slowking","finals":[199]},
      "200": {"name":"Misdreavus","finals":[200]},
      "201": {"name":"Unown","finals":[201]},
      "202": {"name":"Wobbuffet","finals":[202]},
      "203": {"name":"Girafarig","finals":[203]},
      "204": {"name":"Pineco","finals":[205]},
      "205": {"name":"Forretress","finals":[205]},
      "206": {"name":"Dunsparce","finals":[206]},
      "207": {"name":"Gligar","finals":[207]},
      "208": {"name":"Steelix","finals":[208],"variants":["208-mega"]},
      "209": {"name":"Snubbull","finals":[210]},
      "210": {"name":"Granbull","finals":[210]},
      "211": {"name":"Qwilfish","finals":[211]},
      "212": {"name":"Scizor","finals":[212],"variants":["212-mega"]},
      "213": {"name":"Shuckle","finals":[213]},
      "214": {"name":"Heracross","finals":[214],"variants":["214-mega"]},
      "215": {"name":"Sneasel","finals":[215]},
      "216": {"name":"Teddiursa","finals":[217]},
      "217": {"name":"Ursaring","finals":[217]},
      "218": {"name":"Slugma","finals":[219]},
      "219": {"name":"Magcargo","finals":[219]},
      "220": {"name":"Swinub","finals":[221]},
      "221": {"name":"Piloswine","finals":[221]},
      "222": {"name":"Corsola","finals":[222]},
      "223": {"name":"Remoraid","finals":[224]},
      "224": {"name":"Octillery","finals":[224]},
      "225": {"name":"Delibird","finals":[225]},
      "226": {"name":"Mantine","finals":[226]},
      "227": {"name":"Skarmory","finals":[227]},
      "228": {"name":"Houndour","finals":[229],"variants":["229-mega"]},
      "229": {"name":"Houndoom","finals":[229],"variants":["229-mega"]},
      "230": {"name":"Kingdra","finals":[230]},
      "231": {"name":"Phanpy","finals":[232]},
      "232": {"name":"Donphan","finals":[232]},
      "233": {"name":"Porygon2","finals":[233]},
      "234": {"name":"Stantler","finals":[234]},
      "235": {"name":"Smeargle","finals":[235]},
      "236": {"name":"Tyrogue","finals":[107,106,237]},
      "237": {"name":"Hitmontop","finals":[237]},
      "238": {"name":"Smoochum","finals":[124]},
      "239": {"name":"Elekid","finals":[125]},
      "240": {"name":"Magby","finals":[126]},
      "241": {"name":"Miltank","finals":[241]},
      "242": {"name":"Blissey","finals":[242]},
      "243": {"name":"Raikou","finals":[243]},
      "244": {"name":"Entei","finals":[244]},
      "245": {"name":"Suicune","finals":[245]},
      "246": {"name":"Larvitar","finals":[248],"variants":["248-mega"]},
      "247": {"name":"Pupitar","finals":[248],"variants":["248-mega"]},
      "248": {"name":"Tyranitar","finals":[248],"variants":["248-mega"]},
      "249": {"name":"Lugia","finals":[249]},
      "250": {"name":"Ho-Oh","finals":[250]},
      "251": {"name":"Celebi","finals":[251]},
      "252": {"name":"Treecko","finals":[254],"variants":["254-mega"]},
      "253": {"name":"Grovyle","finals":[254],"variants":["254-mega"]},
      "254": {"name":"Sceptile","finals":[254],"variants":["254-mega"]},
      "255": {"name":"Torchic","finals":[257],"variants":["257-mega"]},
      "256": {"name":"Combusken","finals":[257],"variants":["257-mega"]},
      "257": {"name":"Blaziken","finals":[257],"variants":["257-mega"]},
      "258": {"name":"Mudkip","finals":[260],"variants":["260-mega"]},
      "259": {"name":"Marshtomp","finals":[260],"variants":["260-mega"]},
      "260": {"name":"Swampert","finals":[260],"variants":["260-mega"]},
      "261": {"name":"Poochyena","finals":[262]},
      "262": {"name":"Mightyena","finals":[262]},
      "263": {"name":"Zigzagoon","finals":[264]},
      "264": {"name":"Linoone","finals":[264]},
      "265": {"name":"Wurmple","finals":[267,269]},
      "266": {"name":"Silcoon","finals":[267]},
      "267": {"name":"Beautifly","finals":[267]},
      "268": {"name":"Cascoon","finals":[269]},
      "269": {"name":"Dustox","finals":[269]},
      "270": {"name":"Lotad","finals":[272]},
      "271": {"name":"Lombre","finals":[272]},
      "272": {"name":"Ludicolo","finals":[272]},
      "273": {"name":"Seedot","finals":[275]},
      "274": {"name":"Nuzleaf","finals":[275]},
      "275": {"name":"Shiftry","finals":[275]},
      "276": {"name":"Taillow","finals":[277]},
      "277": {"name":"Swellow","finals":[277]},
      "278": {"name":"Wingull","finals":[279]},
      "279": {"name":"Pelipper","finals":[279]},
      "280": {"name":"Ralts","finals":[282],"variants":["282-mega"]},
      "281": {"name":"Kirlia","finals":[282],"variants":["282-mega"]},
      "282": {"name":"Gardevoir","finals":[282],"variants":["282-mega"]},
      "283": {"name":"Surskit","finals":[284]},
      "284": {"name":"Masquerain","finals":[284]},
      "285": {"name":"Shroomish","finals":[286]},
      "286": {"name":"Breloom","finals":[286]},
      "287": {"name":"Slakoth","finals":[289]},
      "288": {"name":"Vigoroth","finals":[289]},
      "289": {"name":"Slaking","finals":[289]},
      "290": {"name":"Nincada","finals":[291,292]},
      "291": {"name":"Ninjask","finals":[291]},
      "292": {"name":"Shedinja","finals":[292]},
      "293": {"name":"Whismur","finals":[295]},
      "294": {"name":"Loudred","finals":[295]},
      "295": {"name":"Exploud","finals":[295]},
      "296": {"name":"Makuhita","finals":[297]},
      "297": {"name":"Hariyama","finals":[297]},
      "298": {"name":"Azurill","finals":[184]},
      "299": {"name":"Nosepass","finals":[299]},
      "300": {"name":"Skitty","finals":[301]},
      "301": {"name":"Delcatty","finals":[301]},
      "302": {"name":"Sableye","finals":[302],"variants":["302-mega"]},
      "303": {"name":"Mawile","finals":[303],"variants":["303-mega"]},
      "304": {"name":"Aron","finals":[306],"variants":["306-mega"]},
      "305": {"name":"Lairon","finals":[306],"variants":["306-mega"]},
      "306": {"name":"Aggron","finals":[306],"variants":["306-mega"]},
      "307": {"name":"Meditite","finals":[308],"variants":["308-mega"]},
      "308": {"name":"Medicham","finals":[308],"variants":["308-mega"]},
      "309": {"name":"Electrike","finals":[310],"variants":["310-mega"]},
      "310": {"name":"Manectric","finals":[310],"variants":["310-mega"]},
      "311": {"name":"Plusle","finals":[311]},
      "312": {"name":"Minun","finals":[312]},
      "313": {"name":"Volbeat","finals":[313]},
      "314": {"name":"Illumise","finals":[314]},
      "315": {"name":"Roselia","finals":[315]},
      "316": {"name":"Gulpin","finals":[317]},
      "317": {"name":"Swalot","finals":[317]},
      "318": {"name":"Carvanha","finals":[319],"variants":["319-mega"]},
      "319": {"name":"Sharpedo","finals":[319],"variants":["319-mega"]},
      "320": {"name":"Wailmer","finals":[321]},
      "321": {"name":"Wailord","finals":[321]},
      "322": {"name":"Numel","finals":[323],"variants":["323-mega"]},
      "323": {"name":"Camerupt","finals":[323],"variants":["323-mega"]},
      "324": {"name":"Torkoal","finals":[324]},
      "325": {"name":"Spoink","finals":[326]},
      "326": {"name":"Grumpig","finals":[326]},
      "327": {"name":"Spinda","finals":[327]},
      "328": {"name":"Trapinch","finals":[330]},
      "329": {"name":"Vibrava","finals":[330]},
      "330": {"name":"Flygon","finals":[330]},
      "331": {"name":"Cacnea","finals":[332]},
      "332": {"name":"Cacturne","finals":[332]},
      "333": {"name":"Swablu","finals":[334],"variants":["334-mega"]},
      "334": {"name":"Altaria","finals":[334],"variants":["334-mega"]},
      "335": {"name":"Zangoose","finals":[335]},
      "336": {"name":"Seviper","finals":[336]},
      "337": {"name":"Lunatone","finals":[337]},
      "338": {"name":"Solrock","finals":[338]},
      "339": {"name":"Barboach","finals":[340]},
      "340": {"name":"Whiscash","finals":[340]},
      "341": {"name":"Corphish","finals":[342]},
      "342": {"name":"Crawdaunt","finals":[342]},
      "343": {"name":"Baltoy","finals":[344]},
      "344": {"name":"Claydol","finals":[344]},
      "345": {"name":"Lileep","finals":[346]},
      "346": {"name":"Cradily","finals":[346]},
      "347": {"name":"Anorith","finals":[348]},
      "348": {"name":"Armaldo","finals":[348]},
      "349": {"name":"Feebas","finals":[350]},
      "350": {"name":"Milotic","finals":[350]},
      "351": {"name":"Castform","finals":[351]},
      "352": {"name":"Kecleon","finals":[352]},
      "353": {"name":"Shuppet","finals":[354],"variants":["354-mega"]},
      "354": {"name":"Banette","finals":[354],"variants":["354-mega"]},
      "355": {"name":"Duskull","finals":[356]},
      "356": {"name":"Dusclops","finals":[356]},
      "357": {"name":"Tropius","finals":[357]},
      "358": {"name":"Chimecho","finals":[358]},
      "359": {"name":"Absol","finals":[359],"variants":["359-mega"]},
      "360": {"name":"Wynaut","finals":[202]},
      "361": {"name":"Snorunt","finals":[362],"variants":["362-mega"]},
      "362": {"name":"Glalie","finals":[362],"variants":["362-mega"]},
      "363": {"name":"Spheal","finals":[365]},
      "364": {"name":"Sealeo","finals":[365]},
      "365": {"name":"Walrein","finals":[365]},
      "366": {"name":"Clamperl","finals":[367,368]},
      "367": {"name":"Huntail","finals":[367]},
      "368": {"name":"Gorebyss","finals":[368]},
      "369": {"name":"Relicanth","finals":[369]},
      "370": {"name":"Luvdisc","finals":[370]},
      "371": {"name":"Bagon","finals":[373],"variants":["373-mega"]},
      "372": {"name":"Shelgon","finals":[373],"variants":["373-mega"]},
      "373": {"name":"Salamence","finals":[373],"variants":["373-mega"]},
      "374": {"name":"Beldum","finals":[376],"variants":["376-mega"]},
      "375": {"name":"Metang","finals":[376],"variants":["376-mega"]},
      "376": {"name":"Metagross","finals":[376],"variants":["376-mega"]},
      "377": {"name":"Regirock","finals":[377]},
      "378": {"name":"Regice","finals":[378]},
      "379": {"name":"Registeel","finals":[379]},
      "380": {"name":"Latias","finals":[380]},
      "381": {"name":"Latios","finals":[381]},
      "382": {"name":"Kyogre","finals":[382]},
      "383": {"name":"Groudon","finals":[383]},
      "384": {"name":"Rayquaza","finals":[384]},
      "385": {"name":"Jirachi","finals":[385]},
      "386": {"name":"Deoxys","finals":[386]}
    },
    "profiles": {
      "3": {"id":3,"name":"Venusaur","types":["grass","poison"],"stats":{"hp":80,"atk":82,"def":83,"spa":100,"spd":100,"spe":80},"pve":{"tier":"S","score":77.8,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Quiet","Rash"],"moves":["SolarBeam","Razor Leaf","Sludge Bomb","Growth"],"note":"Dano estimado por segundo na caça: 186,4, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"A","score":58.5,"role":"special","priority":["spa","hp","def"],"natures":["Timid","Naive","Hasty"],"moves":["SolarBeam","Growth","Leech Seed","Sludge Bomb"],"note":"Duelo de referência: 51,5/100 (perfil especial). Gen 3: UUBL; set \"Disabler\" com 4/4 golpes por nível.","smogon":{"tier":"UUBL","covered":4,"slots":4}}},
      "6": {"id":6,"name":"Charizard","types":["fire","flying"],"stats":{"hp":78,"atk":84,"def":78,"spa":109,"spd":85,"spe":100},"pve":{"tier":"B","score":55.9,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Hasty"],"moves":["Flamethrower","Ember","Wing Attack","Fly"],"note":"Dano estimado por segundo na caça: 134,1. Usa dano físico e especial."},"pvp":{"tier":"B","score":48.1,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Sassy","Relaxed","Brave"],"moves":["Ember","Flamethrower","Wing Attack","Growl"],"note":"Duelo de referência: 54,7/100 (perfil misto). Gen 3: OU; set \"Mixed Attacker\" com 0/4 golpes por nível (faltam Fire Blast, Hidden Power Grass, Substitute / Dragon Claw, Focus Punch / Beat Up).","smogon":{"tier":"OU","covered":0,"slots":4}}},
      "9": {"id":9,"name":"Blastoise","types":["water"],"stats":{"hp":79,"atk":83,"def":100,"spa":85,"spd":105,"spe":78},"pve":{"tier":"B","score":57.3,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Quiet","Rash"],"moves":["Surf","Rain Dance","Waterfall","Water Gun"],"note":"Dano estimado por segundo na caça: 137,3, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"A","score":60,"role":"mixed","priority":["atk","spa","hp","spd"],"natures":["Sassy","Relaxed","Gentle"],"moves":["Bite","Skull Bash","Surf","Protect"],"note":"Duelo de referência: 65,1/100 (perfil misto). Gen 3: UU; set \"Standard\" com 2/4 golpes por nível (faltam Ice Beam, Rest).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "12": {"id":12,"name":"Butterfree","types":["bug","flying"],"stats":{"hp":60,"atk":45,"def":50,"spa":80,"spd":80,"spe":70},"pve":{"tier":"C","score":32.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Psybeam","Confusion","Silver Wind"],"note":"Dano estimado por segundo na caça: 77,4."},"pvp":{"tier":"D","score":20.8,"role":"special","priority":["spa","hp","spd"],"natures":["Calm","Modest","Rash"],"moves":["Gust","Psybeam","Stun Spore","Silver Wind"],"note":"Duelo de referência: 21,3/100 (perfil especial). Gen 3: ZU; set \"Double Powder\" com 2/4 golpes por nível (faltam Psychic, Hidden Power Fire).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "15": {"id":15,"name":"Beedrill","types":["bug","poison"],"stats":{"hp":65,"atk":80,"def":40,"spa":45,"spd":80,"spe":75},"pve":{"tier":"D","score":28.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Twineedle","Cut","Pin Missile","Agility"],"note":"Dano estimado por segundo na caça: 67,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":20.3,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Naughty"],"moves":["Twineedle","Fury Attack","Pin Missile","Pursuit"],"note":"Duelo de referência: 21,1/100 (perfil físico). Gen 3: ZU; set \"Choice Band\" com 1/4 golpes por nível (faltam Sludge Bomb, Hidden Power Bug / Hidden Power Rock, Brick Break).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "18": {"id":18,"name":"Pidgeot","types":["normal","flying"],"stats":{"hp":83,"atk":80,"def":75,"spa":70,"spd":70,"spe":91},"pve":{"tier":"C","score":41.3,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Gust","Quick Attack","Wing Attack","Tackle"],"note":"Dano estimado por segundo na caça: 99,1. Usa dano físico e especial."},"pvp":{"tier":"C","score":39.4,"role":"mixed","priority":["atk","spa","hp","spd"],"natures":["Brave","Naughty","Quiet"],"moves":["Quick Attack","Wing Attack","Gust","FeatherDance"],"note":"Duelo de referência: 44,6/100 (perfil misto). Gen 3: NU; set \"All-out Attacker\" com 1/4 golpes por nível (faltam Double-Edge, Aerial Ace / Hidden Power Flying, Hidden Power Ground / Return / Toxic / Facade).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "20": {"id":20,"name":"Raticate","types":["normal"],"stats":{"hp":55,"atk":81,"def":60,"spa":50,"spd":70,"spe":97},"pve":{"tier":"C","score":43.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Quick Attack","Tackle","Hyper Fang","Strength"],"note":"Dano estimado por segundo na caça: 103,2."},"pvp":{"tier":"C","score":29.7,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Adamant","Lonely"],"moves":["Quick Attack","Hyper Fang","Tail Whip","Pursuit"],"note":"Duelo de referência: 30,1/100 (perfil físico). Gen 3: NU; set \"Choice Band\" com 1/4 golpes por nível (faltam Double-Edge / Return, Shadow Ball, Hidden Power Ground).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "22": {"id":22,"name":"Fearow","types":["normal","flying"],"stats":{"hp":65,"atk":90,"def":65,"spa":61,"spd":61,"spe":100},"pve":{"tier":"B","score":51.5,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Drill Peck","Aerial Ace","Fury Attack","Agility"],"note":"Dano estimado por segundo na caça: 123,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":41.4,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Careful"],"moves":["Drill Peck","Leer","Fly","Aerial Ace"],"note":"Duelo de referência: 43,8/100 (perfil físico). Gen 3: RUBL; set \"Choice Band\" com 1/4 golpes por nível (faltam Quick Attack, Return, Hidden Power Ground).","smogon":{"tier":"RUBL","covered":1,"slots":4}}},
      "24": {"id":24,"name":"Arbok","types":["poison"],"stats":{"hp":60,"atk":85,"def":69,"spa":65,"spd":79,"spe":80},"pve":{"tier":"D","score":27.7,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Bite","Acid","Strength","Poison Sting"],"note":"Dano estimado por segundo na caça: 66,4. Usa dano físico e especial."},"pvp":{"tier":"C","score":38.1,"role":"physical","priority":["atk","hp"],"natures":["Adamant","Impish","Careful"],"moves":["Bite","Strength","Glare","Screech"],"note":"Duelo de referência: 40,1/100 (perfil físico). Gen 3: PU; set \"Offensive\" com 2/4 golpes por nível (faltam Sludge Bomb, Earthquake).","smogon":{"tier":"PU","covered":2,"slots":4}}},
      "26": {"id":26,"name":"Raichu","types":["electric"],"stats":{"hp":60,"atk":90,"def":55,"spa":90,"spd":80,"spe":100},"pve":{"tier":"B","score":55.7,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Thunderbolt","ThunderShock","Thunder","Quick Attack"],"note":"Dano estimado por segundo na caça: 133,4."},"pvp":{"tier":"B","score":43.9,"role":"special","priority":["spa","hp","def","spe"],"natures":["Mild","Modest","Quiet"],"moves":["ThunderShock","Thunderbolt","Light Screen","Thunder"],"note":"Duelo de referência: 44,8/100 (perfil especial). Gen 3: RU; set \"Wish\" com 2/4 golpes por nível (faltam Hidden Power Grass / Hidden Power Ice, Wish).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "28": {"id":28,"name":"Sandslash","types":["ground"],"stats":{"hp":75,"atk":100,"def":110,"spa":45,"spd":55,"spe":65},"pve":{"tier":"D","score":27.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Cut","Strength","Fury Swipes"],"note":"Dano estimado por segundo na caça: 65,2."},"pvp":{"tier":"D","score":23.8,"role":"physical","priority":["atk","hp","spd","spe"],"natures":["Adamant","Naughty","Careful"],"moves":["Slash","Fury Swipes","Strength","Sand-Attack"],"note":"Duelo de referência: 23,1/100 (perfil físico). Gen 3: UU; set \"Swords Dance\" com 0/4 golpes por nível (faltam Earthquake, Rock Slide / Rapid Spin, Hidden Power Bug / Rapid Spin, Swords Dance).","smogon":{"tier":"UU","covered":0,"slots":4}}},
      "31": {"id":31,"name":"Nidoqueen","types":["poison","ground"],"stats":{"hp":90,"atk":82,"def":87,"spa":75,"spd":85,"spe":76},"pve":{"tier":"C","score":31.3,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Double Kick","Bite","Surf","Body Slam"],"note":"Dano estimado por segundo na caça: 75,1. Usa dano físico e especial."},"pvp":{"tier":"C","score":39.7,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Lonely","Naughty"],"moves":["Tail Whip","Body Slam","Crunch","Surf"],"note":"Duelo de referência: 45,2/100 (perfil físico). Gen 3: UU; set \"Standard\" com 0/4 golpes por nível (faltam Earthquake, Shadow Ball, Sludge Bomb, Ice Beam).","smogon":{"tier":"UU","covered":0,"slots":4}}},
      "34": {"id":34,"name":"Nidoking","types":["poison","ground"],"stats":{"hp":81,"atk":92,"def":77,"spa":85,"spd":75,"spe":85},"pve":{"tier":"C","score":46.6,"role":"physical","priority":["atk"],"natures":["Brave","Lonely","Naughty"],"moves":["Thrash","Double Kick","Horn Attack","Peck"],"note":"Dano estimado por segundo na caça: 111,6."},"pvp":{"tier":"A","score":56.1,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Relaxed","Lax"],"moves":["Thrash","Double Kick","Horn Attack","Peck"],"note":"Duelo de referência: 68,4/100 (perfil físico). Gen 3: UU; set \"Standard\" com 0/4 golpes por nível (faltam Earthquake, Megahorn, Shadow Ball, Ice Beam).","smogon":{"tier":"UU","covered":0,"slots":4}}},
      "36": {"id":36,"name":"Clefable","types":["normal"],"stats":{"hp":95,"atk":70,"def":73,"spa":85,"spd":90,"spe":60},"pve":{"tier":"C","score":30,"role":"physical","priority":["atk","spe"],"natures":["Brave","Adamant","Lonely"],"moves":["Pound","Strength","Meteor Mash","DoubleSlap"],"note":"Dano estimado por segundo na caça: 71,8."},"pvp":{"tier":"C","score":40.9,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Brave","Relaxed","Adamant"],"moves":["Sweet Kiss","Strength","Meteor Mash","Moonlight"],"note":"Duelo de referência: 41,3/100 (perfil físico). Gen 3: RU; set \"Cosmic Power Staller\" com 2/4 golpes por nível (faltam Rest, Seismic Toss).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "38": {"id":38,"name":"Ninetales","types":["fire"],"stats":{"hp":73,"atk":76,"def":75,"spa":81,"spd":100,"spe":100},"pve":{"tier":"C","score":38.9,"role":"special","priority":["spa","spe"],"natures":["Mild","Rash","Modest"],"moves":["Flamethrower","Ember","Quick Attack","Fire Spin"],"note":"Dano estimado por segundo na caça: 93,2."},"pvp":{"tier":"B","score":43.8,"role":"special","priority":["spa","hp","spd","def"],"natures":["Sassy","Relaxed","Calm"],"moves":["Ember","Flamethrower","Quick Attack","Confuse Ray"],"note":"Duelo de referência: 44,3/100 (perfil especial). Gen 3: RU; set \"Grudge\" com 2/4 golpes por nível (faltam Fire Blast, Hidden Power Grass / Substitute).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "40": {"id":40,"name":"Wigglytuff","types":["normal"],"stats":{"hp":140,"atk":70,"def":45,"spa":75,"spd":50,"spe":45},"pve":{"tier":"C","score":43.9,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Brave"],"moves":["Double-Edge","Body Slam","Hyper Voice","Pound"],"note":"Dano estimado por segundo na caça: 105,3. Usa dano físico e especial."},"pvp":{"tier":"C","score":34.5,"role":"mixed","priority":["atk","spa","spe"],"natures":["Relaxed","Lax","Naughty"],"moves":["Body Slam","Hyper Voice","Rest","Charm"],"note":"Duelo de referência: 40,3/100 (perfil misto). Gen 3: PU; set \"Offensive Sub\" com 1/4 golpes por nível (faltam Shadow Ball, Substitute, Seismic Toss / Focus Punch / Fire Blast).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "45": {"id":45,"name":"Vileplume","types":["grass","poison"],"stats":{"hp":75,"atk":80,"def":85,"spa":100,"spd":90,"spe":50},"pve":{"tier":"A","score":58.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Petal Dance","Acid","Mega Drain","Absorb"],"note":"Dano estimado por segundo na caça: 140."},"pvp":{"tier":"A","score":64.8,"role":"special","priority":["spa","hp","spd"],"natures":["Calm","Sassy","Bold"],"moves":["Petal Dance","Acid","Mega Drain","Absorb"],"note":"Duelo de referência: 69,1/100 (perfil especial). Gen 3: UU; set \"Cleric\" com 3/4 golpes por nível (faltam Sludge Bomb / Hidden Power Grass).","smogon":{"tier":"UU","covered":3,"slots":4}}},
      "47": {"id":47,"name":"Parasect","types":["bug","grass"],"stats":{"hp":60,"atk":95,"def":80,"spa":60,"spd":80,"spe":30},"pve":{"tier":"D","score":22.2,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Slash","Growth","Giga Drain","Scratch"],"note":"Dano estimado por segundo na caça: 53,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":17.3,"role":"mixed","priority":["atk","spa","hp","spd"],"natures":["Gentle","Lax","Sassy"],"moves":["Slash","Stun Spore","Giga Drain","Scratch"],"note":"Duelo de referência: 15/100 (perfil misto). Gen 3: ZU; set \"Special Attacker\" com 3/4 golpes por nível (faltam Hidden Power Ice / Hidden Power Fire).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "49": {"id":49,"name":"Venomoth","types":["bug","poison"],"stats":{"hp":70,"atk":65,"def":60,"spa":90,"spd":75,"spe":90},"pve":{"tier":"C","score":40.3,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Psybeam","Psychic","Silver Wind"],"note":"Dano estimado por segundo na caça: 96,7."},"pvp":{"tier":"C","score":32.5,"role":"special","priority":["spa","spe","hp","def"],"natures":["Timid","Hasty","Naive"],"moves":["Psybeam","Psychic","Stun Spore","Silver Wind"],"note":"Duelo de referência: 31,5/100 (perfil especial). Gen 3: NU; set \"Lead Support\" com 2/4 golpes por nível (faltam Baton Pass, Substitute).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "51": {"id":51,"name":"Dugtrio","types":["ground"],"stats":{"hp":35,"atk":80,"def":50,"spa":50,"spd":70,"spe":120},"pve":{"tier":"C","score":43.8,"role":"physical","priority":["atk","spe"],"natures":["Brave","Lonely","Naughty"],"moves":["Earthquake","Slash","Dig","Tri Attack"],"note":"Dano estimado por segundo na caça: 105,1."},"pvp":{"tier":"C","score":30.1,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Lax","Relaxed"],"moves":["Scratch","Sand-Attack","Earthquake","Dig"],"note":"Duelo de referência: 26/100 (perfil físico). Gen 3: UU (sem Arena Trap no jogo); set \"Choice Band\" com 1/4 golpes por nível (faltam Hidden Power Bug, Aerial Ace, Rock Slide / Beat Up / Sunny Day).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "53": {"id":53,"name":"Persian","types":["normal"],"stats":{"hp":65,"atk":70,"def":60,"spa":65,"spd":65,"spe":115},"pve":{"tier":"C","score":30.5,"role":"physical","priority":["atk","spe"],"natures":["Brave","Adamant","Lonely"],"moves":["Scratch","Slash","Cut","Bite"],"note":"Dano estimado por segundo na caça: 73,2."},"pvp":{"tier":"C","score":28.7,"role":"physical","priority":["atk","spe"],"natures":["Jolly","Adamant","Brave"],"moves":["Screech","Slash","Growl","Bite"],"note":"Duelo de referência: 28,1/100 (perfil físico). Gen 3: RU; set \"Choice Band\" com 1/4 golpes por nível (faltam Return / Double-Edge, Hidden Power Ground / Hidden Power Fighting, Shadow Ball).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "55": {"id":55,"name":"Golduck","types":["water"],"stats":{"hp":80,"atk":82,"def":78,"spa":95,"spd":80,"spe":85},"pve":{"tier":"B","score":54.2,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Quiet"],"moves":["Surf","Waterfall","Strength","Hydro Pump"],"note":"Dano estimado por segundo na caça: 130. Usa dano físico e especial."},"pvp":{"tier":"B","score":46.7,"role":"mixed","priority":["spa","atk"],"natures":["Quiet","Brave","Relaxed"],"moves":["Surf","Waterfall","Strength","Confusion"],"note":"Duelo de referência: 46,1/100 (perfil misto). Gen 3: UU; set \"Calm Mind\" com 2/4 golpes por nível (faltam Calm Mind, Psychic).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "57": {"id":57,"name":"Primeape","types":["fighting"],"stats":{"hp":65,"atk":105,"def":60,"spa":60,"spd":70,"spe":95},"pve":{"tier":"B","score":53.8,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Cross Chop","Low Kick","Karate Chop"],"note":"Dano estimado por segundo na caça: 129."},"pvp":{"tier":"A","score":59,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Adamant","Brave","Impish"],"moves":["Thrash","Screech","Cross Chop","Low Kick"],"note":"Duelo de referência: 70,5/100 (perfil físico). Gen 3: RU; set \"Choice Band\" com 1/4 golpes por nível (faltam Focus Punch / Earthquake, Rock Slide, Hidden Power Ghost / Hidden Power Flying).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "59": {"id":59,"name":"Arcanine","types":["fire"],"stats":{"hp":90,"atk":110,"def":80,"spa":100,"spd":80,"spe":95},"pve":{"tier":"A","score":59.7,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Flame Wheel","Flamethrower","Bite","Agility"],"note":"Dano estimado por segundo na caça: 143,1, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"A","score":55.1,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Sassy","Relaxed","Brave"],"moves":["Flame Wheel","Bite","Flamethrower","ExtremeSpeed"],"note":"Duelo de referência: 57/100 (perfil misto). Gen 3: UU; set \"Barkanine\" com 2/4 golpes por nível (faltam Howl, Hidden Power Fighting).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "62": {"id":62,"name":"Poliwrath","types":["water","fighting"],"stats":{"hp":90,"atk":85,"def":95,"spa":70,"spd":90,"spe":70},"pve":{"tier":"A","score":69.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Submission","Body Slam","Waterfall","Belly Drum"],"note":"Dano estimado por segundo na caça: 166, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":47.6,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Belly Drum","Body Slam","Strength","Hydro Pump"],"note":"Duelo de referência: 54,8/100 (perfil físico). Gen 3: RU; set \"Belly Drum\" com 1/4 golpes por nível (faltam Substitute, Brick Break, Hidden Power Ghost / Hidden Power Rock / Return).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "65": {"id":65,"name":"Alakazam","types":["psychic"],"stats":{"hp":55,"atk":50,"def":45,"spa":135,"spd":85,"spe":120},"pve":{"tier":"S","score":96.6,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psybeam","Psychic","Confusion","Calm Mind"],"note":"Dano estimado por segundo na caça: 231,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":60,"role":"special","priority":["spa","spe","hp","spd"],"natures":["Timid","Naive","Calm"],"moves":["Psybeam","Psychic","Recover","Calm Mind"],"note":"Duelo de referência: 56,5/100 (perfil especial). Gen 3: UUBL; set \"Calm Mind Sweeper\" com 3/4 golpes por nível (faltam Fire Punch).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "68": {"id":68,"name":"Machamp","types":["fighting"],"stats":{"hp":90,"atk":130,"def":80,"spa":65,"spd":85,"spe":55},"pve":{"tier":"B","score":51.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Submission","Low Kick","Vital Throw","Cross Chop"],"note":"Dano estimado por segundo na caça: 122,6."},"pvp":{"tier":"B","score":50.8,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Low Kick","Strength","Vital Throw","Leer"],"note":"Duelo de referência: 55,6/100 (perfil físico). Gen 3: UUBL; set \"Bulk Up\" com 1/4 golpes por nível (faltam Bulk Up, Rock Slide, Hidden Power Ghost / Hidden Power Bug).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "71": {"id":71,"name":"Victreebel","types":["grass","poison"],"stats":{"hp":80,"atk":105,"def":65,"spa":100,"spd":60,"spe":70},"pve":{"tier":"A","score":58.8,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Razor Leaf","Acid","Growth","Slam"],"note":"Dano estimado por segundo na caça: 141, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":34.2,"role":"physical","priority":["atk"],"natures":["Adamant","Careful","Impish"],"moves":["Razor Leaf","Growth","Vine Whip","Slam"],"note":"Duelo de referência: 35,3/100 (perfil físico). Gen 3: RU; set \"Swords Dance\" com 1/4 golpes por nível (faltam Swords Dance, Sludge Bomb, Hidden Power Ground).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "73": {"id":73,"name":"Tentacruel","types":["water","poison"],"stats":{"hp":80,"atk":70,"def":65,"spa":80,"spd":120,"spe":100},"pve":{"tier":"B","score":56.8,"role":"special","priority":["spa","spe"],"natures":["Mild","Rash","Modest"],"moves":["Surf","BubbleBeam","Acid","Waterfall"],"note":"Dano estimado por segundo na caça: 136,2."},"pvp":{"tier":"B","score":50.8,"role":"mixed","priority":["spa","atk","hp","spe"],"natures":["Sassy","Relaxed","Naive"],"moves":["Surf","BubbleBeam","Waterfall","Barrier"],"note":"Duelo de referência: 51,3/100 (perfil misto). Gen 3: UU; set \"Mirror Coat\" com 2/4 golpes por nível (faltam Giga Drain / Toxic, Mirror Coat).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "76": {"id":76,"name":"Golem","types":["rock","ground"],"stats":{"hp":80,"atk":110,"def":130,"spa":55,"spd":65,"spe":45},"pve":{"tier":"B","score":50.4,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Double-Edge","Earthquake","Rock Blast","Rock Throw"],"note":"Dano estimado por segundo na caça: 120,9."},"pvp":{"tier":"B","score":45.5,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Lax","Adamant"],"moves":["Double-Edge","Rock Throw","Earthquake","Defense Curl"],"note":"Duelo de referência: 41,5/100 (perfil físico). Gen 3: UU; set \"Choice Band\" com 3/4 golpes por nível (faltam Rock Slide / Hidden Power Rock).","smogon":{"tier":"UU","covered":3,"slots":4}}},
      "78": {"id":78,"name":"Rapidash","types":["fire"],"stats":{"hp":65,"atk":100,"def":70,"spa":80,"spd":80,"spe":105},"pve":{"tier":"C","score":45.8,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Take Down","Stomp","Strength","Fire Blast"],"note":"Dano estimado por segundo na caça: 109,8."},"pvp":{"tier":"C","score":40.2,"role":"mixed","priority":["atk","spa","spe","hp"],"natures":["Naive","Sassy","Hasty"],"moves":["Strength","Stomp","Fire Blast","Bounce"],"note":"Duelo de referência: 39,5/100 (perfil misto). Gen 3: RU; set \"Baton Pass\" com 2/4 golpes por nível (faltam Baton Pass, Hidden Power Grass / Hidden Power Ice).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "80": {"id":80,"name":"Slowbro","types":["water","psychic"],"stats":{"hp":95,"atk":75,"def":110,"spa":100,"spd":80,"spe":30},"pve":{"tier":"B","score":50.9,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Psychic","Water Gun","Confusion"],"note":"Dano estimado por segundo na caça: 122,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":56.1,"role":"special","priority":["spa","spe","hp","def"],"natures":["Timid","Naive","Hasty"],"moves":["Surf","Psychic","Amnesia","Confusion"],"note":"Duelo de referência: 58,5/100 (perfil especial). Gen 3: UUBL; set \"Defensive\" com 2/4 golpes por nível (faltam Rest, Calm Mind / Thunder Wave).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "82": {"id":82,"name":"Magneton","types":["electric","steel"],"stats":{"hp":50,"atk":60,"def":95,"spa":120,"spd":70,"spe":70},"pve":{"tier":"C","score":39.5,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Hasty"],"moves":["ThunderShock","Spark","Tri Attack","Zap Cannon"],"note":"Dano estimado por segundo na caça: 94,8. Usa dano físico e especial."},"pvp":{"tier":"B","score":49.5,"role":"special","priority":["spa","hp","def","spe"],"natures":["Timid","Naive","Hasty"],"moves":["ThunderShock","Metal Sound","Thunder Wave","Zap Cannon"],"note":"Duelo de referência: 53,3/100 (perfil especial). Gen 3: OU; set \"Trapper\" com 1/4 golpes por nível (faltam Thunderbolt, Hidden Power Fire / Hidden Power Grass, Protect / Substitute).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "83": {"id":83,"name":"Farfetch'd","types":["normal","flying"],"stats":{"hp":52,"atk":65,"def":55,"spa":58,"spd":62,"spe":60},"pve":{"tier":"B","score":49,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Cut","Swords Dance","Agility"],"note":"Dano estimado por segundo na caça: 117,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":27.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Swords Dance","Fly","False Swipe"],"note":"Duelo de referência: 28,1/100 (perfil físico). Gen 3: ZU; set \"Knock Off\" com 4/4 golpes por nível.","smogon":{"tier":"ZU","covered":4,"slots":4}}},
      "85": {"id":85,"name":"Dodrio","types":["normal","flying"],"stats":{"hp":60,"atk":110,"def":70,"spa":60,"spd":60,"spe":100},"pve":{"tier":"A","score":57.7,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Drill Peck","Fury Attack","Fly","Tri Attack"],"note":"Dano estimado por segundo na caça: 138,3."},"pvp":{"tier":"B","score":42.1,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Lax","Sassy","Impish"],"moves":["Drill Peck","Peck","Growl","Tri Attack"],"note":"Duelo de referência: 41,6/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 1/4 golpes por nível (faltam Return, Quick Attack, Hidden Power Ground / Hidden Power Fighting).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "87": {"id":87,"name":"Dewgong","types":["water","ice"],"stats":{"hp":90,"atk":70,"def":80,"spa":70,"spd":95,"spe":70},"pve":{"tier":"B","score":52.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Aurora Beam","Ice Beam","Icy Wind"],"note":"Dano estimado por segundo na caça: 125,6."},"pvp":{"tier":"B","score":53.3,"role":"special","priority":["spa","hp","def","spd"],"natures":["Lax","Bold","Modest"],"moves":["Surf","Aurora Beam","Headbutt","Ice Beam"],"note":"Duelo de referência: 58/100 (perfil especial). Gen 3: NU; set \"Specially Defensive\" com 3/4 golpes por nível (faltam Sleep Talk).","smogon":{"tier":"NU","covered":3,"slots":4}}},
      "89": {"id":89,"name":"Muk","types":["poison"],"stats":{"hp":105,"atk":105,"def":75,"spa":65,"spd":100,"spe":50},"pve":{"tier":"C","score":34.3,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Hasty"],"moves":["Sludge","Pound","Strength","Sludge Bomb"],"note":"Dano estimado por segundo na caça: 82,3. Usa dano físico e especial."},"pvp":{"tier":"B","score":43.1,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Lax","Relaxed","Brave"],"moves":["Acid Armor","Strength","Sludge","Screech"],"note":"Duelo de referência: 46,4/100 (perfil misto). Gen 3: UU; set \"Standard\" com 1/4 golpes por nível (faltam Ice Punch, Explosion, Hidden Power Ghost / Hidden Power Grass).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "91": {"id":91,"name":"Cloyster","types":["water","ice"],"stats":{"hp":50,"atk":95,"def":180,"spa":85,"spd":45,"spe":70},"pve":{"tier":"A","score":60.2,"role":"special","priority":["spa"],"natures":["Mild","Rash","Quiet"],"moves":["Surf","Aurora Beam","Ice Beam","Dive"],"note":"Dano estimado por segundo na caça: 144,2."},"pvp":{"tier":"A","score":61.5,"role":"special","priority":["spa","hp","def"],"natures":["Modest","Quiet","Rash"],"moves":["Surf","Aurora Beam","Protect","Ice Beam"],"note":"Duelo de referência: 59,4/100 (perfil especial). Gen 3: OU; set \"Spiker\" com 3/4 golpes por nível (faltam Explosion).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "94": {"id":94,"name":"Gengar","types":["ghost","poison"],"stats":{"hp":60,"atk":65,"def":60,"spa":130,"spd":75,"spe":110},"pve":{"tier":"C","score":45.3,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Lonely"],"moves":["Shadow Ball","Shadow Punch","Strength","Lick"],"note":"Dano estimado por segundo na caça: 108,7. Usa dano físico e especial."},"pvp":{"tier":"A","score":61,"role":"special","priority":["spa","hp","def"],"natures":["Bold","Relaxed","Lax"],"moves":["Shadow Ball","Night Shade","Confuse Ray","Dream Eater"],"note":"Duelo de referência: 54,3/100 (perfil especial). Gen 3: OU; set \"Utility\" com 3/4 golpes por nível (faltam Ice Punch / Taunt / Explosion / Focus Punch).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "97": {"id":97,"name":"Hypno","types":["psychic"],"stats":{"hp":85,"atk":73,"def":70,"spa":73,"spd":115,"spe":67},"pve":{"tier":"C","score":30.3,"role":"mixed","priority":["atk","spa","spe"],"natures":["Quiet","Lonely","Naughty"],"moves":["Psychic","Pound","Headbutt","Meditate"],"note":"Dano estimado por segundo na caça: 72,7, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":28.9,"role":"special","priority":["spa"],"natures":["Mild","Modest","Brave"],"moves":["Poison Gas","Psychic","Headbutt","Confusion"],"note":"Duelo de referência: 28,7/100 (perfil especial). Gen 3: RU; set \"Support\" com 1/4 golpes por nível (faltam Thunder Wave / Toxic, Wish, Reflect / Protect / Counter).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "99": {"id":99,"name":"Kingler","types":["water"],"stats":{"hp":55,"atk":130,"def":115,"spa":50,"spd":50,"spe":75},"pve":{"tier":"B","score":52.8,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["ViceGrip","Stomp","Crabhammer","Surf"],"note":"Dano estimado por segundo na caça: 126,6. Usa dano físico e especial."},"pvp":{"tier":"C","score":40.9,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Naughty"],"moves":["Crabhammer","Strength","Stomp","Protect"],"note":"Duelo de referência: 48,8/100 (perfil físico). Gen 3: PU; set \"Swords Dance\" com 1/4 golpes por nível (faltam Swords Dance, Double-Edge / Return, Hidden Power Ghost / Substitute).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "101": {"id":101,"name":"Electrode","types":["electric"],"stats":{"hp":60,"atk":50,"def":70,"spa":80,"spd":80,"spe":140},"pve":{"tier":"D","score":24.3,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Spark","Tackle","Swift","Rollout"],"note":"Dano estimado por segundo na caça: 58,3. Usa dano físico e especial."},"pvp":{"tier":"C","score":31.8,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Brave"],"moves":["Spark","Light Screen","Tackle","Screech"],"note":"Duelo de referência: 29,3/100 (perfil físico). Gen 3: UU; set \"Substitute\" com 1/4 golpes por nível (faltam Thunderbolt, Substitute, Hidden Power Ice / Toxic).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "103": {"id":103,"name":"Exeggutor","types":["grass","psychic"],"stats":{"hp":95,"atk":95,"def":85,"spa":125,"spd":65,"spe":55},"pve":{"tier":"B","score":52.8,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Quiet"],"moves":["SolarBeam","Stomp","Confusion","Egg Bomb"],"note":"Dano estimado por segundo na caça: 126,5. Usa dano físico e especial."},"pvp":{"tier":"B","score":46.6,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Bold","Lax"],"moves":["SolarBeam","Confusion","Reflect","Egg Bomb"],"note":"Duelo de referência: 40,8/100 (perfil especial). Gen 3: UUBL; set \"Double Powder\" com 3/4 golpes por nível (faltam Explosion).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "105": {"id":105,"name":"Marowak","types":["ground"],"stats":{"hp":60,"atk":80,"def":110,"spa":50,"spd":80,"spe":45},"pve":{"tier":"C","score":41.6,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Bonemerang","Double-Edge","Bone Rush"],"note":"Dano estimado por segundo na caça: 99,6."},"pvp":{"tier":"B","score":49.9,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Naughty"],"moves":["Thrash","Bonemerang","Double-Edge","Bone Rush"],"note":"Duelo de referência: 50/100 (perfil físico). Gen 3: UUBL; set \"Swords Dance\" com 2/4 golpes por nível (faltam Swords Dance, Rock Slide).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "106": {"id":106,"name":"Hitmonlee","types":["fighting"],"stats":{"hp":50,"atk":120,"def":53,"spa":35,"spd":110,"spe":87},"pve":{"tier":"S","score":81.9,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Meditate","Hi Jump Kick","Brick Break","Rolling Kick"],"note":"Dano estimado por segundo na caça: 196,2, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":51,"role":"physical","priority":["atk","hp","spd"],"natures":["Adamant","Brave","Lonely"],"moves":["Meditate","Hi Jump Kick","Brick Break","Mega Kick"],"note":"Duelo de referência: 53,5/100 (perfil físico). Gen 3: UU; set \"Reversal\" com 2/4 golpes por nível (faltam Bulk Up / Focus Punch, Hidden Power Ghost).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "107": {"id":107,"name":"Hitmonchan","types":["fighting"],"stats":{"hp":50,"atk":105,"def":79,"spa":35,"spd":110,"spe":76},"pve":{"tier":"B","score":52.6,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Mach Punch","Sky Uppercut","Pursuit","Fire Punch"],"note":"Dano estimado por segundo na caça: 126."},"pvp":{"tier":"B","score":49.6,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Mach Punch","Sky Uppercut","Detect","Pursuit"],"note":"Duelo de referência: 56/100 (perfil físico). Gen 3: NU; set \"All-out Attacker\" com 2/4 golpes por nível (faltam Hidden Power Ghost / Hidden Power Flying / Rock Slide, Rock Slide / Earthquake / Bulk Up).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "108": {"id":108,"name":"Lickitung","types":["normal"],"stats":{"hp":90,"atk":55,"def":75,"spa":60,"spd":75,"spe":30},"pve":{"tier":"D","score":25.9,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Stomp","Slam","Surf","Lick"],"note":"Dano estimado por segundo na caça: 62,1. Usa dano físico e especial."},"pvp":{"tier":"D","score":22.7,"role":"physical","priority":["atk","spe"],"natures":["Jolly","Brave","Adamant"],"moves":["Slam","Defense Curl","Strength","Screech"],"note":"Duelo de referência: 24/100 (perfil físico). Gen 3: PU; set \"Bulky Support\" com 1/4 golpes por nível (faltam Wish, Protect, Seismic Toss).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "110": {"id":110,"name":"Weezing","types":["poison"],"stats":{"hp":65,"atk":90,"def":120,"spa":85,"spd":70,"spe":60},"pve":{"tier":"D","score":25.2,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Hasty"],"moves":["Sludge","Tackle","Smog"],"note":"Dano estimado por segundo na caça: 60,5. Usa dano físico e especial."},"pvp":{"tier":"C","score":30.1,"role":"mixed","priority":["spa","atk"],"natures":["Rash","Quiet","Naughty"],"moves":["Sludge","Tackle","Smokescreen","Smog"],"note":"Duelo de referência: 21/100 (perfil misto). Gen 3: UUBL; set \"Offensive\" com 2/4 golpes por nível (faltam Sludge Bomb, Flamethrower / Fire Blast).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "112": {"id":112,"name":"Rhydon","types":["ground","rock"],"stats":{"hp":105,"atk":130,"def":120,"spa":45,"spd":45,"spe":40},"pve":{"tier":"B","score":53.8,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Earthquake","Stomp","Rock Blast","Megahorn"],"note":"Dano estimado por segundo na caça: 128,9."},"pvp":{"tier":"A","score":56.3,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Brave","Naughty"],"moves":["Earthquake","Rock Blast","Megahorn","Take Down"],"note":"Duelo de referência: 54,7/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 3/4 golpes por nível (faltam Focus Punch / Double-Edge).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "114": {"id":114,"name":"Tangela","types":["grass"],"stats":{"hp":65,"atk":55,"def":115,"spa":100,"spd":40,"spe":60},"pve":{"tier":"D","score":22.8,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Quiet"],"moves":["Slam","Growth","Mega Drain","Vine Whip"],"note":"Dano estimado por segundo na caça: 54,7, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"D","score":20.4,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Lax","Lonely","Naughty"],"moves":["Absorb","Tickle","Mega Drain","Slam"],"note":"Duelo de referência: 18,8/100 (perfil misto). Gen 3: PU; set \"Physically Defensive\" com 2/4 golpes por nível (faltam Giga Drain / Hidden Power Grass, Leech Seed / Morning Sun).","smogon":{"tier":"PU","covered":2,"slots":4}}},
      "115": {"id":115,"name":"Kangaskhan","types":["normal"],"stats":{"hp":105,"atk":95,"def":80,"spa":40,"spd":80,"spe":90},"pve":{"tier":"B","score":48.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Mega Punch","Strength","Dizzy Punch","Comet Punch"],"note":"Dano estimado por segundo na caça: 115,9."},"pvp":{"tier":"A","score":55,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Mega Punch","Strength","Dizzy Punch","Bite"],"note":"Duelo de referência: 57,3/100 (perfil físico). Gen 3: UU; set \"Reversal\" com 2/4 golpes por nível (faltam Return, Shadow Ball).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "119": {"id":119,"name":"Seaking","types":["water"],"stats":{"hp":80,"atk":92,"def":65,"spa":65,"spd":80,"spe":68},"pve":{"tier":"C","score":44.3,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Horn Attack","Surf","Waterfall","Agility"],"note":"Dano estimado por segundo na caça: 106,2, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":34.7,"role":"physical","priority":["atk","hp"],"natures":["Lonely","Naughty","Adamant"],"moves":["Supersonic","Waterfall","Tail Whip","Dive"],"note":"Duelo de referência: 36/100 (perfil físico). Gen 3: ZU; set \"Flail\" com 3/4 golpes por nível (faltam Substitute / Endure).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "121": {"id":121,"name":"Starmie","types":["water","psychic"],"stats":{"hp":60,"atk":75,"def":85,"spa":100,"spd":85,"spe":115},"pve":{"tier":"A","score":68.1,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","BubbleBeam","Water Gun","Hydro Pump"],"note":"Dano estimado por segundo na caça: 163,2."},"pvp":{"tier":"A","score":62.2,"role":"special","priority":["spa","hp","spd","def"],"natures":["Modest","Mild","Rash"],"moves":["Surf","BubbleBeam","Recover","Cosmic Power"],"note":"Duelo de referência: 56,6/100 (perfil especial). Gen 3: OU; set \"Defensive\" com 3/4 golpes por nível (faltam Thunder Wave / Psychic / Thunderbolt / Ice Beam).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "122": {"id":122,"name":"Mr. Mime","types":["psychic"],"stats":{"hp":40,"atk":45,"def":65,"spa":100,"spd":120,"spe":90},"pve":{"tier":"B","score":50.9,"role":"special","priority":["spa","spe"],"natures":["Mild","Rash","Modest"],"moves":["Psybeam","Psychic","Confusion","DoubleSlap"],"note":"Dano estimado por segundo na caça: 122."},"pvp":{"tier":"B","score":48,"role":"special","priority":["spa","hp","spd"],"natures":["Mild","Modest","Quiet"],"moves":["Psybeam","Psychic","Confusion","Light Screen"],"note":"Duelo de referência: 43,5/100 (perfil especial). Gen 3: RU; set \"Encore + Baton Pass\" com 4/4 golpes por nível.","smogon":{"tier":"RU","covered":4,"slots":4}}},
      "124": {"id":124,"name":"Jynx","types":["ice","psychic"],"stats":{"hp":65,"atk":50,"def":35,"spa":115,"spd":95,"spe":95},"pve":{"tier":"B","score":56.6,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Psychic","Powder Snow","Confusion","Blizzard"],"note":"Dano estimado por segundo na caça: 135,6."},"pvp":{"tier":"A","score":64.7,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Relaxed","Calm"],"moves":["Psychic","Lovely Kiss","Fake Tears","Blizzard"],"note":"Duelo de referência: 64,8/100 (perfil especial). Gen 3: UUBL; set \"Fake Tears\" com 3/4 golpes por nível (faltam Ice Beam).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "125": {"id":125,"name":"Electabuzz","types":["electric"],"stats":{"hp":65,"atk":83,"def":57,"spa":95,"spd":85,"spe":105},"pve":{"tier":"A","score":58.7,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Quiet"],"moves":["Thunderbolt","Thunder","Quick Attack","ThunderPunch"],"note":"Dano estimado por segundo na caça: 140,8. Usa dano físico e especial."},"pvp":{"tier":"B","score":49.4,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Sassy","Quiet","Gentle"],"moves":["Thunderbolt","ThunderPunch","Light Screen","Thunder"],"note":"Duelo de referência: 50,5/100 (perfil misto). Gen 3: UU; set \"Support\" com 2/4 golpes por nível (faltam Counter, Toxic / Ice Punch).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "126": {"id":126,"name":"Magmar","types":["fire"],"stats":{"hp":65,"atk":95,"def":57,"spa":100,"spd":85,"spe":93},"pve":{"tier":"A","score":62.2,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Quiet"],"moves":["Flamethrower","Fire Punch","Sunny Day","Fire Blast"],"note":"Dano estimado por segundo na caça: 149,1, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":48.4,"role":"special","priority":["spa","hp"],"natures":["Modest","Quiet","Rash"],"moves":["Flamethrower","Fire Punch","Sunny Day","Fire Blast"],"note":"Duelo de referência: 55,6/100 (perfil especial). Gen 3: RU; set \"Mixed Attacker\" com 1/4 golpes por nível (faltam Thunder Punch, Hidden Power Grass, Focus Punch).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "127": {"id":127,"name":"Pinsir","types":["bug"],"stats":{"hp":65,"atk":125,"def":100,"spa":55,"spd":70,"spe":85},"pve":{"tier":"S","score":76.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["ViceGrip","Swords Dance","Brick Break","Strength"],"note":"Dano estimado por segundo na caça: 182,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":52.2,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["ViceGrip","Brick Break","Strength","Swords Dance"],"note":"Duelo de referência: 58,4/100 (perfil físico). Gen 3: UU; set \"Swords Dance\" com 1/4 golpes por nível (faltam Earthquake, Hidden Power Bug, Rock Slide).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "128": {"id":128,"name":"Tauros","types":["normal"],"stats":{"hp":75,"atk":100,"def":95,"spa":40,"spd":70,"spe":110},"pve":{"tier":"A","score":74.8,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Take Down","Horn Attack","Pursuit"],"note":"Dano estimado por segundo na caça: 179,4."},"pvp":{"tier":"S","score":71.3,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Thrash","Tail Whip","Take Down","Horn Attack"],"note":"Duelo de referência: 87,9/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 0/4 golpes por nível (faltam Return, Earthquake, Hidden Power Ghost, Double-Edge).","smogon":{"tier":"UUBL","covered":0,"slots":4}}},
      "130": {"id":130,"name":"Gyarados","types":["water","flying"],"stats":{"hp":95,"atk":125,"def":79,"spa":60,"spd":100,"spe":81},"pve":{"tier":"S","score":84.3,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Waterfall","Dragon Dance","Hydro Pump"],"note":"Dano estimado por segundo na caça: 202, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":68.2,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Thrash","Hydro Pump","Bite","Hyper Beam"],"note":"Duelo de referência: 76,5/100 (perfil físico). Gen 3: OU; set \"Standard\" com 1/4 golpes por nível (faltam Hidden Power Flying / Hidden Power Rock, Earthquake, Double-Edge / Taunt / Thunder Wave).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "131": {"id":131,"name":"Lapras","types":["water","ice"],"stats":{"hp":130,"atk":85,"def":80,"spa":85,"spd":95,"spe":60},"pve":{"tier":"B","score":56.4,"role":"mixed","priority":["spa","atk"],"natures":["Quiet","Mild","Rash"],"moves":["Surf","Ice Beam","Waterfall","Rain Dance"],"note":"Dano estimado por segundo na caça: 135,3, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"A","score":62.8,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Calm","Lax"],"moves":["Surf","Body Slam","Ice Beam","Confuse Ray"],"note":"Duelo de referência: 68/100 (perfil especial). Gen 3: UU; set \"Offensive Utility\" com 2/4 golpes por nível (faltam Thunderbolt, Heal Bell / Roar).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "132": {"id":132,"name":"Ditto","types":["normal"],"stats":{"hp":48,"atk":48,"def":48,"spa":48,"spd":48,"spe":48},"pve":{"tier":"D","score":0,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":[],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero."},"pvp":{"tier":"D","score":7.2,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":[],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero.","smogon":{"tier":"ZU","covered":1,"slots":1}}},
      "134": {"id":134,"name":"Vaporeon","types":["water"],"stats":{"hp":130,"atk":65,"def":60,"spa":110,"spd":95,"spe":65},"pve":{"tier":"A","score":60.9,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Gun","Aurora Beam","Hydro Pump"],"note":"Dano estimado por segundo na caça: 145,9."},"pvp":{"tier":"A","score":60.6,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Sassy","Bold"],"moves":["Surf","Water Gun","Aurora Beam","Acid Armor"],"note":"Duelo de referência: 63,8/100 (perfil especial). Gen 3: UUBL; set \"Substitute + WishPass\" com 2/4 golpes por nível (faltam Substitute, Wish).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "135": {"id":135,"name":"Jolteon","types":["electric"],"stats":{"hp":65,"atk":65,"def":60,"spa":110,"spd":95,"spe":130},"pve":{"tier":"B","score":47.2,"role":"special","priority":["spa"],"natures":["Mild","Rash","Quiet"],"moves":["ThunderShock","Thunder","Agility","Quick Attack"],"note":"Dano estimado por segundo na caça: 113,2, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":60.1,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Quiet","Lax","Rash"],"moves":["ThunderShock","Sand-Attack","Thunder Wave","Quick Attack"],"note":"Duelo de referência: 60,4/100 (perfil misto). Gen 3: OU; set \"Standard\" com 2/4 golpes por nível (faltam Thunderbolt, Hidden Power Ice / Hidden Power Grass).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "136": {"id":136,"name":"Flareon","types":["fire"],"stats":{"hp":65,"atk":130,"def":60,"spa":95,"spd":110,"spe":65},"pve":{"tier":"B","score":49,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Flamethrower","Bite","Take Down","Ember"],"note":"Dano estimado por segundo na caça: 117,5. Usa dano físico e especial."},"pvp":{"tier":"B","score":43.8,"role":"mixed","priority":["spa","atk","spe","hp"],"natures":["Relaxed","Sassy","Quiet"],"moves":["Bite","Sand-Attack","Quick Attack","Flamethrower"],"note":"Duelo de referência: 51,4/100 (perfil misto). Gen 3: NU; set \"Mixed Attacker\" com 1/4 golpes por nível (faltam Double-Edge, Fire Blast / Overheat, Hidden Power Grass / Hidden Power Electric).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "139": {"id":139,"name":"Omastar","types":["rock","water"],"stats":{"hp":70,"atk":60,"def":125,"spa":115,"spd":70,"spe":55},"pve":{"tier":"A","score":63.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Gun","Hydro Pump","AncientPower"],"note":"Dano estimado por segundo na caça: 151,7."},"pvp":{"tier":"B","score":45.6,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Rash","Mild","Lax"],"moves":["AncientPower","Bite","Mud Shot","Protect"],"note":"Duelo de referência: 45,7/100 (perfil misto). Gen 3: UU; set \"Defensive Spikes\" com 2/4 golpes por nível (faltam Spikes, Toxic / Ice Beam).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "141": {"id":141,"name":"Kabutops","types":["rock","water"],"stats":{"hp":60,"atk":115,"def":105,"spa":65,"spd":70,"spe":80},"pve":{"tier":"B","score":54.9,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Slash","Surf","Waterfall","AncientPower"],"note":"Dano estimado por segundo na caça: 131,6. Usa dano físico e especial."},"pvp":{"tier":"C","score":35.3,"role":"mixed","priority":["atk","spa","hp","spd"],"natures":["Gentle","Sassy","Lax"],"moves":["Harden","Waterfall","Surf","Mud Shot"],"note":"Duelo de referência: 36,6/100 (perfil misto). Gen 3: RU; set \"Swords Dance + Flail\" com 1/4 golpes por nível (faltam Flail, Swords Dance, Rock Slide).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "142": {"id":142,"name":"Aerodactyl","types":["rock","flying"],"stats":{"hp":80,"atk":105,"def":65,"spa":60,"spd":75,"spe":130},"pve":{"tier":"B","score":50.9,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Wing Attack","Take Down","AncientPower","Bite"],"note":"Dano estimado por segundo na caça: 122."},"pvp":{"tier":"B","score":51.5,"role":"physical","priority":["atk","hp","spd"],"natures":["Adamant","Naughty","Careful"],"moves":["Wing Attack","Bite","Strength","Supersonic"],"note":"Duelo de referência: 52,3/100 (perfil físico). Gen 3: OU; set \"Choice Band\" com 1/4 golpes por nível (faltam Earthquake, Hidden Power Rock, Double-Edge).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "143": {"id":143,"name":"Snorlax","types":["normal"],"stats":{"hp":160,"atk":110,"def":65,"spa":65,"spd":110,"spe":30},"pve":{"tier":"S","score":79.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Body Slam","Strength","Belly Drum","Hyper Beam"],"note":"Dano estimado por segundo na caça: 190,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":75.9,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Adamant","Brave","Naughty"],"moves":["Body Slam","Belly Drum","Rest","Headbutt"],"note":"Duelo de referência: 74,7/100 (perfil físico). Gen 3: OU; set \"Amnesia CurseLax\" com 3/4 golpes por nível (faltam Curse).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "144": {"id":144,"name":"Articuno","types":["ice","flying"],"stats":{"hp":90,"atk":85,"def":100,"spa":95,"spd":125,"spe":85},"pve":{"tier":"B","score":51.5,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Powder Snow","Ice Beam","Agility"],"note":"Dano estimado por segundo na caça: 123,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":54,"role":"special","priority":["spa","hp","def","spd"],"natures":["Relaxed","Quiet","Naive"],"moves":["Gust","Ice Beam","Reflect","Powder Snow"],"note":"Duelo de referência: 54,3/100 (perfil especial). Gen 3: UUBL; set \"Heal Bell\" com 2/4 golpes por nível (faltam Rest, Heal Bell).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "145": {"id":145,"name":"Zapdos","types":["electric","flying"],"stats":{"hp":90,"atk":90,"def":85,"spa":125,"spd":90,"spe":100},"pve":{"tier":"A","score":61.2,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["ThunderShock","Drill Peck","Thunder","Fly"],"note":"Dano estimado por segundo na caça: 146,7. Usa dano físico e especial."},"pvp":{"tier":"S","score":70,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Naive","Hasty","Brave"],"moves":["ThunderShock","Drill Peck","Thunder","Thunder Wave"],"note":"Duelo de referência: 73/100 (perfil misto). Gen 3: OU; set \"Mixed\" com 2/4 golpes por nível (faltam Thunderbolt, Hidden Power Grass / Hidden Power Fighting).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "146": {"id":146,"name":"Moltres","types":["fire","flying"],"stats":{"hp":90,"atk":100,"def":90,"spa":125,"spd":85,"spe":90},"pve":{"tier":"A","score":72.7,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Quiet","Rash"],"moves":["Flamethrower","Heat Wave","Wing Attack","Sky Attack"],"note":"Dano estimado por segundo na caça: 174,3. Usa dano físico e especial."},"pvp":{"tier":"A","score":63.1,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Quiet","Mild","Rash"],"moves":["Flamethrower","Wing Attack","Heat Wave","Sky Attack"],"note":"Duelo de referência: 70,5/100 (perfil misto). Gen 3: OU; set \"Standard\" com 1/4 golpes por nível (faltam Hidden Power Grass, Will-O-Wisp, Roar / Overheat).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "149": {"id":149,"name":"Dragonite","types":["dragon","flying"],"stats":{"hp":91,"atk":134,"def":95,"spa":100,"spd":100,"spe":80},"pve":{"tier":"S","score":79.4,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Outrage","Wing Attack","Hyper Beam","Slam"],"note":"Dano estimado por segundo na caça: 190,3."},"pvp":{"tier":"S","score":72.8,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Outrage","Leer","Hyper Beam","Wing Attack"],"note":"Duelo de referência: 90/100 (perfil físico). Gen 3: UUBL; set \"Standard Dragon Dance\" com 0/4 golpes por nível (faltam Hidden Power Flying, Earthquake, Dragon Dance, Thunder / Thunderbolt / Ice Beam).","smogon":{"tier":"UUBL","covered":0,"slots":4}}},
      "150": {"id":150,"name":"Mewtwo","types":["psychic"],"stats":{"hp":106,"atk":110,"def":90,"spa":154,"spd":90,"spe":130},"pve":{"tier":"A","score":64.6,"role":"special","priority":["spa"],"natures":["Mild","Rash","Quiet"],"moves":["Psychic","Swift","Strength","Confusion"],"note":"Dano estimado por segundo na caça: 154,8."},"pvp":{"tier":"S","score":79.6,"role":"mixed","priority":["spa","atk","def"],"natures":["Sassy","Relaxed","Gentle"],"moves":["Psychic","Amnesia","Strength","Recover"],"note":"Duelo de referência: 83,7/100 (perfil misto). Gen 3: Uber; set \"Calm Mind MonoAttacker\" com 2/4 golpes por nível (faltam Taunt, Calm Mind).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "151": {"id":151,"name":"Mew","types":["psychic"],"stats":{"hp":100,"atk":100,"def":100,"spa":100,"spd":100,"spe":100},"pve":{"tier":"B","score":57.5,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Quiet"],"moves":["Psychic","Surf","Mega Punch","AncientPower"],"note":"Dano estimado por segundo na caça: 137,9. Usa dano físico e especial."},"pvp":{"tier":"B","score":48.7,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Quiet","Relaxed","Sassy"],"moves":["Pound","Psychic","AncientPower","Mega Punch"],"note":"Duelo de referência: 52,9/100 (perfil misto). Gen 3: Uber; set \"Lum Berry Explosion Lead\" com 0/4 golpes por nível (faltam Thunder Wave, Thunder, Fire Blast / Taunt, Explosion).","smogon":{"tier":"Uber","covered":0,"slots":4}}},
      "154": {"id":154,"name":"Meganium","types":["grass"],"stats":{"hp":80,"atk":82,"def":100,"spa":83,"spd":100,"spe":80},"pve":{"tier":"C","score":45.9,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Brave"],"moves":["Razor Leaf","SolarBeam","Body Slam","Tackle"],"note":"Dano estimado por segundo na caça: 110,1. Usa dano físico e especial."},"pvp":{"tier":"B","score":51.8,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Adamant","Brave","Impish"],"moves":["Razor Leaf","Synthesis","Body Slam","Light Screen"],"note":"Duelo de referência: 53,1/100 (perfil físico). Gen 3: RU; set \"Standard\" com 3/4 golpes por nível (faltam Leech Seed).","smogon":{"tier":"RU","covered":3,"slots":4}}},
      "157": {"id":157,"name":"Typhlosion","types":["fire"],"stats":{"hp":78,"atk":84,"def":78,"spa":109,"spd":85,"spe":100},"pve":{"tier":"B","score":55.5,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Flamethrower","Flame Wheel","Ember","Swift"],"note":"Dano estimado por segundo na caça: 133. Usa dano físico e especial."},"pvp":{"tier":"A","score":56.6,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Relaxed","Sassy","Gentle"],"moves":["Flame Wheel","Quick Attack","Flamethrower","Smokescreen"],"note":"Duelo de referência: 62,9/100 (perfil misto). Gen 3: UUBL; set \"Special Sweeper\" com 1/4 golpes por nível (faltam Substitute, Sunny Day, Hidden Power Grass / Thunder Punch).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "160": {"id":160,"name":"Feraligatr","types":["water"],"stats":{"hp":85,"atk":105,"def":100,"spa":79,"spd":83,"spe":78},"pve":{"tier":"B","score":52.7,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Surf","Slash","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 126,4. Usa dano físico e especial."},"pvp":{"tier":"B","score":53.3,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Lax","Mild","Quiet"],"moves":["Slash","Waterfall","Screech","Hydro Pump"],"note":"Duelo de referência: 60,6/100 (perfil misto). Gen 3: UU; set \"Physical Sweeper\" com 1/4 golpes por nível (faltam Earthquake, Hidden Power Flying / Rock Slide, Swords Dance).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "162": {"id":162,"name":"Furret","types":["normal"],"stats":{"hp":85,"atk":76,"def":64,"spa":45,"spd":55,"spe":90},"pve":{"tier":"C","score":39.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Quick Attack","Slam","Strength","Fury Swipes"],"note":"Dano estimado por segundo na caça: 94,4."},"pvp":{"tier":"C","score":31.3,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Gentle","Hasty","Jolly"],"moves":["Cut","Amnesia","Strength","Surf"],"note":"Duelo de referência: 33,8/100 (perfil físico). Gen 3: PU; set \"Wallbreaker\" com 1/4 golpes por nível (faltam Double-Edge / Return, Shadow Ball, Brick Break).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "164": {"id":164,"name":"Noctowl","types":["normal","flying"],"stats":{"hp":100,"atk":50,"def":50,"spa":76,"spd":96,"spe":70},"pve":{"tier":"D","score":24.6,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Take Down","Tackle","Fly","Confusion"],"note":"Dano estimado por segundo na caça: 59."},"pvp":{"tier":"D","score":25.3,"role":"mixed","priority":["atk","spa"],"natures":["Brave","Naughty","Hasty"],"moves":["Dream Eater","Take Down","Confusion","Hypnosis"],"note":"Duelo de referência: 26,5/100 (perfil misto). Gen 3: ZU; set \"Specially Defensive\" com 2/4 golpes por nível (faltam Psychic, Whirlwind).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "166": {"id":166,"name":"Ledian","types":["bug","flying"],"stats":{"hp":55,"atk":35,"def":50,"spa":55,"spd":110,"spe":85},"pve":{"tier":"D","score":17.3,"role":"mixed","priority":["atk","spa"],"natures":["Brave","Lonely","Naughty"],"moves":["Double-Edge","Agility","Swift","Comet Punch"],"note":"Dano estimado por segundo na caça: 41,5, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"D","score":14.7,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Lax","Relaxed","Gentle"],"moves":["Double-Edge","Supersonic","Swift","Comet Punch"],"note":"Duelo de referência: 12,2/100 (perfil misto). Gen 3: ZU; set \"Dual Screens\" com 3/4 golpes por nível (faltam Substitute).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "168": {"id":168,"name":"Ariados","types":["bug","poison"],"stats":{"hp":70,"atk":90,"def":70,"spa":60,"spd":60,"spe":40},"pve":{"tier":"D","score":18.2,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Psychic","Fury Swipes","Leech Life","Agility"],"note":"Dano estimado por segundo na caça: 43,7, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"D","score":20.2,"role":"special","priority":["spa","atk"],"natures":["Brave","Lonely","Gentle"],"moves":["Night Shade","Leech Life","Psychic","Fury Swipes"],"note":"Duelo de referência: 20,8/100 (perfil especial). Gen 3: ZU; set \"Baton Pass\" com 2/4 golpes por nível (faltam Sludge Bomb, Baton Pass).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "169": {"id":169,"name":"Crobat","types":["poison","flying"],"stats":{"hp":85,"atk":90,"def":80,"spa":70,"spd":80,"spe":130},"pve":{"tier":"B","score":47.5,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Air Cutter","Wing Attack","Poison Fang","Fly"],"note":"Dano estimado por segundo na caça: 113,9. Usa dano físico e especial."},"pvp":{"tier":"B","score":50,"role":"physical","priority":["atk","hp","spe","spd"],"natures":["Jolly","Careful","Impish"],"moves":["Wing Attack","Bite","Poison Fang","Screech"],"note":"Duelo de referência: 58,2/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 0/4 golpes por nível (faltam Sludge Bomb, Aerial Ace, Hidden Power Ground / Hidden Power Fighting, Shadow Ball).","smogon":{"tier":"UUBL","covered":0,"slots":4}}},
      "171": {"id":171,"name":"Lanturn","types":["water","electric"],"stats":{"hp":125,"atk":58,"def":58,"spa":76,"spd":76,"spe":67},"pve":{"tier":"C","score":46.9,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Quiet"],"moves":["Surf","Spark","Water Gun","Hydro Pump"],"note":"Dano estimado por segundo na caça: 112,4. Usa dano físico e especial."},"pvp":{"tier":"A","score":56.4,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Hasty","Naive","Sassy"],"moves":["Surf","Spark","Water Gun","Thunder Wave"],"note":"Duelo de referência: 56,1/100 (perfil misto). Gen 3: UU; set \"Parafusion\" com 3/4 golpes por nível (faltam Thunderbolt).","smogon":{"tier":"UU","covered":3,"slots":4}}},
      "176": {"id":176,"name":"Togetic","types":["normal","flying"],"stats":{"hp":55,"atk":40,"def":85,"spa":80,"spd":105,"spe":40},"pve":{"tier":"D","score":19.3,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Double-Edge","Fly"],"note":"Dano estimado por segundo na caça: 46,2."},"pvp":{"tier":"D","score":20.9,"role":"physical","priority":["atk"],"natures":["Brave","Quiet","Relaxed"],"moves":["Double-Edge","Fly","Wish","Charm"],"note":"Duelo de referência: 22,4/100 (perfil físico). Gen 3: PU; set \"Baton Pass\" com 1/4 golpes por nível (faltam Ancient Power, Baton Pass, Fire Blast / Flamethrower).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "178": {"id":178,"name":"Xatu","types":["psychic","flying"],"stats":{"hp":65,"atk":75,"def":70,"spa":95,"spd":70,"spe":95},"pve":{"tier":"C","score":39.5,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Psychic","Peck","Fly"],"note":"Dano estimado por segundo na caça: 94,8. Usa dano físico e especial."},"pvp":{"tier":"B","score":42.2,"role":"special","priority":["spa","atk"],"natures":["Modest","Mild","Lonely"],"moves":["Confuse Ray","Psychic","Night Shade","Fly"],"note":"Duelo de referência: 43,1/100 (perfil especial). Gen 3: RU; set \"Baton Pass\" com 2/4 golpes por nível (faltam Baton Pass, Calm Mind).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "181": {"id":181,"name":"Ampharos","types":["electric"],"stats":{"hp":90,"atk":75,"def":75,"spa":115,"spd":90,"spe":55},"pve":{"tier":"C","score":39.9,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["ThunderShock","Thunder","ThunderPunch","Tackle"],"note":"Dano estimado por segundo na caça: 95,6."},"pvp":{"tier":"A","score":54.8,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Bold","Modest"],"moves":["ThunderShock","Thunder","Light Screen","Thunder Wave"],"note":"Duelo de referência: 58,2/100 (perfil especial). Gen 3: UU; set \"Focus Punch\" com 2/4 golpes por nível (faltam Focus Punch, Thunderbolt).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "182": {"id":182,"name":"Bellossom","types":["grass"],"stats":{"hp":75,"atk":80,"def":85,"spa":90,"spd":100,"spe":50},"pve":{"tier":"A","score":59.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Petal Dance","SolarBeam","Magical Leaf","Acid"],"note":"Dano estimado por segundo na caça: 143,2."},"pvp":{"tier":"B","score":47.1,"role":"special","priority":["spa"],"natures":["Quiet","Rash","Modest"],"moves":["Petal Dance","Stun Spore","Moonlight","SolarBeam"],"note":"Duelo de referência: 52,6/100 (perfil especial). Gen 3: NU; set \"Specially Defensive\" com 3/4 golpes por nível (faltam Giga Drain / Hidden Power Grass).","smogon":{"tier":"NU","covered":3,"slots":4}}},
      "184": {"id":184,"name":"Azumarill","types":["water"],"stats":{"hp":100,"atk":50,"def":80,"spa":50,"spd":80,"spe":50},"pve":{"tier":"C","score":40.8,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Hasty"],"moves":["Surf","BubbleBeam","Waterfall","Rain Dance"],"note":"Dano estimado por segundo na caça: 97,7, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":35,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Rash","Lax","Gentle"],"moves":["Charm","Surf","BubbleBeam","Waterfall"],"note":"Duelo de referência: 37,2/100 (perfil misto). Gen 3: NU (sem Huge Power no jogo); set \"Choice Band\" com 1/4 golpes por nível (faltam Focus Punch, Return, Hidden Power Ghost).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "185": {"id":185,"name":"Sudowoodo","types":["rock"],"stats":{"hp":70,"atk":100,"def":115,"spa":30,"spd":65,"spe":30},"pve":{"tier":"C","score":35.6,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Double-Edge","Rock Slide","Rock Throw","Low Kick"],"note":"Dano estimado por segundo na caça: 85,3."},"pvp":{"tier":"C","score":29,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Brave","Lonely"],"moves":["Double-Edge","Rock Slide","Low Kick","Faint Attack"],"note":"Duelo de referência: 28,5/100 (perfil físico). Gen 3: NU; set \"Choice Band\" com 2/4 golpes por nível (faltam Earthquake, Focus Punch / Brick Break).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "186": {"id":186,"name":"Politoed","types":["water"],"stats":{"hp":90,"atk":75,"def":75,"spa":90,"spd":100,"spe":70},"pve":{"tier":"A","score":60.7,"role":"mixed","priority":["atk","spa"],"natures":["Brave","Lonely","Naughty"],"moves":["Surf","Body Slam","Waterfall","Belly Drum"],"note":"Dano estimado por segundo na caça: 145,6, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":50.2,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Belly Drum","Body Slam","Waterfall","Hydro Pump"],"note":"Duelo de referência: 54,2/100 (perfil físico). Gen 3: RU; set \"Special Attacker + Hypnosis\" com 2/4 golpes por nível (faltam Ice Beam, Hidden Power Grass / Counter).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "189": {"id":189,"name":"Jumpluff","types":["grass","flying"],"stats":{"hp":75,"atk":55,"def":70,"spa":55,"spd":85,"spe":110},"pve":{"tier":"D","score":12.4,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Tackle","Mega Drain"],"note":"Dano estimado por segundo na caça: 29,8. Usa dano físico e especial."},"pvp":{"tier":"D","score":26.5,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Sassy","Careful","Adamant"],"moves":["Tackle","Synthesis","Stun Spore","Leech Seed"],"note":"Duelo de referência: 21,6/100 (perfil físico). Gen 3: RUBL; set \"SubSeed\" com 2/4 golpes por nível (faltam Substitute, Encore).","smogon":{"tier":"RUBL","covered":2,"slots":4}}},
      "190": {"id":190,"name":"Aipom","types":["normal"],"stats":{"hp":55,"atk":70,"def":55,"spa":40,"spd":55,"spe":85},"pve":{"tier":"C","score":35.5,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Agility","Cut","Strength","Fury Swipes"],"note":"Dano estimado por segundo na caça: 85, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":20.9,"role":"physical","priority":["atk","spe"],"natures":["Impish","Lax","Relaxed"],"moves":["Sand-Attack","Strength","Tickle","Cut"],"note":"Duelo de referência: 19,8/100 (perfil físico). Gen 3: ZU; set \"Annoyer\" com 2/4 golpes por nível (faltam Thunder Wave, Thief).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "192": {"id":192,"name":"Sunflora","types":["grass"],"stats":{"hp":75,"atk":75,"def":55,"spa":105,"spd":85,"spe":30},"pve":{"tier":"S","score":84,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Petal Dance","SolarBeam","Growth","Giga Drain"],"note":"Dano estimado por segundo na caça: 201,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":50,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Relaxed","Calm"],"moves":["Petal Dance","SolarBeam","Giga Drain","Mega Drain"],"note":"Duelo de referência: 62,2/100 (perfil especial). Gen 3: ZU; set \"Sunny Beam\" com 3/4 golpes por nível (faltam Hidden Power Fire).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "193": {"id":193,"name":"Yanma","types":["bug","flying"],"stats":{"hp":65,"atk":65,"def":45,"spa":75,"spd":45,"spe":95},"pve":{"tier":"D","score":27.9,"role":"physical","priority":["atk"],"natures":["Lonely","Naughty","Adamant"],"moves":["Wing Attack","Quick Attack","Tackle","Uproar"],"note":"Dano estimado por segundo na caça: 66,9."},"pvp":{"tier":"D","score":22.2,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Impish"],"moves":["Wing Attack","Quick Attack","Supersonic","Screech"],"note":"Duelo de referência: 23,9/100 (perfil físico). Gen 3: ZU; set \"Reversal Sweeper\" com 1/4 golpes por nível (faltam Substitute / Endure, Reversal, Aerial Ace).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "195": {"id":195,"name":"Quagsire","types":["water","ground"],"stats":{"hp":95,"atk":85,"def":85,"spa":65,"spd":65,"spe":35},"pve":{"tier":"B","score":48.5,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Surf","Earthquake","Waterfall","Rain Dance"],"note":"Dano estimado por segundo na caça: 116,2, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":50.9,"role":"physical","priority":["atk","hp","spd"],"natures":["Gentle","Adamant","Naughty"],"moves":["Waterfall","Surf","Tail Whip","Earthquake"],"note":"Duelo de referência: 49,2/100 (perfil físico). Gen 3: UU; set \"Counter\" com 3/4 golpes por nível (faltam Counter).","smogon":{"tier":"UU","covered":3,"slots":4}}},
      "196": {"id":196,"name":"Espeon","types":["psychic"],"stats":{"hp":65,"atk":65,"def":60,"spa":130,"spd":95,"spe":110},"pve":{"tier":"A","score":70.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Psybeam","Psychic","Confusion","Take Down"],"note":"Dano estimado por segundo na caça: 169,5."},"pvp":{"tier":"A","score":54.4,"role":"special","priority":["spa","hp","spd"],"natures":["Modest","Quiet","Calm"],"moves":["Psybeam","Psychic","Morning Sun","Confusion"],"note":"Duelo de referência: 53,7/100 (perfil especial). Gen 3: UUBL; set \"EspyJump\" com 2/4 golpes por nível (faltam Calm Mind, Substitute).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "197": {"id":197,"name":"Umbreon","types":["dark"],"stats":{"hp":95,"atk":65,"def":110,"spa":60,"spd":130,"spe":65},"pve":{"tier":"D","score":26.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Faint Attack","Take Down","Pursuit"],"note":"Dano estimado por segundo na caça: 63."},"pvp":{"tier":"S","score":68.3,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Adamant","Impish","Careful"],"moves":["Bite","Confuse Ray","Screech","Moonlight"],"note":"Duelo de referência: 74,2/100 (perfil físico). Gen 3: UUBL; set \"Mean Look + Baton Pass\" com 3/4 golpes por nível (faltam Taunt).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "198": {"id":198,"name":"Murkrow","types":["dark","flying"],"stats":{"hp":60,"atk":85,"def":42,"spa":85,"spd":42,"spe":91},"pve":{"tier":"C","score":35.6,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Pursuit","Fly","Peck"],"note":"Dano estimado por segundo na caça: 85,3."},"pvp":{"tier":"D","score":23.5,"role":"mixed","priority":["atk","spa"],"natures":["Brave","Lonely","Naughty"],"moves":["Faint Attack","Night Shade","Fly","Pursuit"],"note":"Duelo de referência: 25,7/100 (perfil misto). Gen 3: NU; set \"Choice Band\" com 0/4 golpes por nível (faltam Drill Peck, Hidden Power Ground / Hidden Power Fighting, Shadow Ball, Double-Edge).","smogon":{"tier":"NU","covered":0,"slots":4}}},
      "199": {"id":199,"name":"Slowking","types":["water","psychic"],"stats":{"hp":95,"atk":75,"def":80,"spa":100,"spd":110,"spe":30},"pve":{"tier":"B","score":50.9,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Psychic","Water Gun","Confusion"],"note":"Dano estimado por segundo na caça: 122,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":54.4,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Calm","Lax"],"moves":["Surf","Psychic","Yawn","Confusion"],"note":"Duelo de referência: 57,6/100 (perfil especial). Gen 3: UU; set \"Calm Mind\" com 2/4 golpes por nível (faltam Calm Mind, Rest).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "200": {"id":200,"name":"Misdreavus","types":["ghost"],"stats":{"hp":60,"atk":60,"def":60,"spa":85,"spd":85,"spe":85},"pve":{"tier":"D","score":19.5,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Quiet","Rash"],"moves":["Psybeam","Astonish"],"note":"Dano estimado por segundo na caça: 46,7. Usa dano físico e especial."},"pvp":{"tier":"D","score":26.6,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Quiet","Relaxed","Brave"],"moves":["Psybeam","Astonish","Confuse Ray","Growl"],"note":"Duelo de referência: 19/100 (perfil misto). Gen 3: UU; set \"Perish Trapper\" com 2/4 golpes por nível (faltam Taunt / Destiny Bond, Protect).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "201": {"id":201,"name":"Unown","types":["psychic"],"stats":{"hp":48,"atk":72,"def":48,"spa":72,"spd":48,"spe":48},"pve":{"tier":"D","score":0,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":["Hidden Power"],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero."},"pvp":{"tier":"D","score":2.9,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":["Hidden Power"],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero.","smogon":{"tier":"ZU","covered":0,"slots":1}}},
      "202": {"id":202,"name":"Wobbuffet","types":["psychic"],"stats":{"hp":190,"atk":33,"def":58,"spa":33,"spd":58,"spe":33},"pve":{"tier":"D","score":0,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":["Safeguard","Charm","Encore"],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero."},"pvp":{"tier":"D","score":21.6,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":["Safeguard","Charm","Encore"],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero.","smogon":{"tier":"UU","covered":4,"slots":4}}},
      "203": {"id":203,"name":"Girafarig","types":["normal","psychic"],"stats":{"hp":70,"atk":80,"def":65,"spa":90,"spd":65,"spe":85},"pve":{"tier":"B","score":53.7,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Psybeam","Stomp","Strength","Crunch"],"note":"Dano estimado por segundo na caça: 128,8. Usa dano físico e especial."},"pvp":{"tier":"C","score":40.9,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Quiet","Brave","Relaxed"],"moves":["Psybeam","Stomp","Crunch","Confusion"],"note":"Duelo de referência: 39,9/100 (perfil misto). Gen 3: UU; set \"WishPasser\" com 2/4 golpes por nível (faltam Wish, Substitute).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "205": {"id":205,"name":"Forretress","types":["bug","steel"],"stats":{"hp":75,"atk":90,"def":140,"spa":60,"spd":60,"spe":40},"pve":{"tier":"D","score":29,"role":"physical","priority":["atk"],"natures":["Brave","Adamant","Lonely"],"moves":["Double-Edge","Take Down","Strength","Tackle"],"note":"Dano estimado por segundo na caça: 69,6."},"pvp":{"tier":"B","score":47,"role":"physical","priority":["atk","hp","def"],"natures":["Brave","Adamant","Naughty"],"moves":["Double-Edge","Take Down","Protect","Tackle"],"note":"Duelo de referência: 32,6/100 (perfil físico). Gen 3: OU; set \"Standard\" com 4/4 golpes por nível.","smogon":{"tier":"OU","covered":4,"slots":4}}},
      "206": {"id":206,"name":"Dunsparce","types":["normal"],"stats":{"hp":100,"atk":70,"def":70,"spa":65,"spd":65,"spe":45},"pve":{"tier":"D","score":24.2,"role":"physical","priority":["atk","spe"],"natures":["Brave","Quiet","Relaxed"],"moves":["Take Down","Strength","Pursuit","Rage"],"note":"Dano estimado por segundo na caça: 57,9."},"pvp":{"tier":"C","score":30.1,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Sassy","Brave"],"moves":["Take Down","Strength","Yawn","Screech"],"note":"Duelo de referência: 35,1/100 (perfil físico). Gen 3: PUBL; set \"Paraflinch\" com 0/4 golpes por nível (faltam Headbutt, Thunder Wave / Body Slam, Shadow Ball, Rock Slide).","smogon":{"tier":"PUBL","covered":0,"slots":4}}},
      "207": {"id":207,"name":"Gligar","types":["ground","flying"],"stats":{"hp":65,"atk":75,"def":105,"spa":35,"spd":65,"spe":85},"pve":{"tier":"D","score":25.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Faint Attack","Strength","Quick Attack"],"note":"Dano estimado por segundo na caça: 60,1."},"pvp":{"tier":"C","score":35.2,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Lonely","Impish"],"moves":["Slash","Screech","Faint Attack","Harden"],"note":"Duelo de referência: 34,8/100 (perfil físico). Gen 3: UU; set \"Swords Dance\" com 1/4 golpes por nível (faltam Swords Dance, Earthquake, Hidden Power Flying).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "208": {"id":208,"name":"Steelix","types":["steel","ground"],"stats":{"hp":75,"atk":85,"def":200,"spa":55,"spd":65,"spe":30},"pve":{"tier":"C","score":31.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Iron Tail","Double-Edge","Crunch","Slam"],"note":"Dano estimado por segundo na caça: 75,3."},"pvp":{"tier":"B","score":51.2,"role":"physical","priority":["atk","spe"],"natures":["Jolly","Hasty","Adamant"],"moves":["Iron Tail","Screech","Harden","Crunch"],"note":"Duelo de referência: 51,5/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 2/4 golpes por nível (faltam Earthquake, Explosion).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "210": {"id":210,"name":"Granbull","types":["normal"],"stats":{"hp":90,"atk":120,"def":75,"spa":60,"spd":60,"spe":45},"pve":{"tier":"C","score":43.1,"role":"physical","priority":["atk","spe"],"natures":["Brave","Adamant","Lonely"],"moves":["Take Down","Strength","Crunch","Bite"],"note":"Dano estimado por segundo na caça: 103,2."},"pvp":{"tier":"C","score":38.1,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Lax","Relaxed"],"moves":["Scary Face","Strength","Charm","Crunch"],"note":"Duelo de referência: 43,1/100 (perfil físico). Gen 3: UU; set \"Offensive Utility\" com 0/4 golpes por nível (faltam Return / Body Slam, Focus Punch / Earthquake, Shadow Ball, Heal Bell / Rest).","smogon":{"tier":"UU","covered":0,"slots":4}}},
      "211": {"id":211,"name":"Qwilfish","types":["water","poison"],"stats":{"hp":65,"atk":95,"def":75,"spa":55,"spd":55,"spe":85},"pve":{"tier":"C","score":45.1,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Surf","Take Down","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 108. Usa dano físico e especial."},"pvp":{"tier":"C","score":36.6,"role":"mixed","priority":["spa","atk"],"natures":["Gentle","Sassy","Brave"],"moves":["Harden","Waterfall","Surf","Hydro Pump"],"note":"Duelo de referência: 32,1/100 (perfil misto). Gen 3: UU; set \"Spiker\" com 2/4 golpes por nível (faltam Sludge Bomb, Destiny Bond / Self-Destruct).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "212": {"id":212,"name":"Scizor","types":["bug","steel"],"stats":{"hp":70,"atk":130,"def":100,"spa":55,"spd":80,"spe":65},"pve":{"tier":"S","score":94.1,"role":"physical","priority":["atk"],"natures":["Brave","Adamant","Lonely"],"moves":["Metal Claw","Agility","Swords Dance","Quick Attack"],"note":"Dano estimado por segundo na caça: 225,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":65,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Adamant"],"moves":["Metal Claw","Strength","Swords Dance","Wing Attack"],"note":"Duelo de referência: 70,9/100 (perfil físico). Gen 3: UUBL; set \"Swords Dance\" com 2/4 golpes por nível (faltam Silver Wind, Hidden Power Rock).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "213": {"id":213,"name":"Shuckle","types":["bug","rock"],"stats":{"hp":20,"atk":10,"def":230,"spa":10,"spd":230,"spe":5},"pve":{"tier":"D","score":3.2,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Strength","Rock Smash","Wrap","Constrict"],"note":"Dano estimado por segundo na caça: 7,7."},"pvp":{"tier":"D","score":11.3,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Sassy","Gentle"],"moves":["Strength","Rock Smash","Rest","Withdraw"],"note":"Duelo de referência: 5,2/100 (perfil físico). Gen 3: PU; set \"Mixed Wall\" com 3/4 golpes por nível (faltam Toxic).","smogon":{"tier":"PU","covered":3,"slots":4}}},
      "214": {"id":214,"name":"Heracross","types":["bug","fighting"],"stats":{"hp":80,"atk":125,"def":75,"spa":40,"spd":95,"spe":85},"pve":{"tier":"B","score":55.9,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Brick Break","Take Down","Strength","Megahorn"],"note":"Dano estimado por segundo na caça: 134,1."},"pvp":{"tier":"A","score":64.3,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Naughty"],"moves":["Brick Break","Leer","Tackle","Megahorn"],"note":"Duelo de referência: 61/100 (perfil físico). Gen 3: OU; set \"Standard\" com 3/4 golpes por nível (faltam Rock Slide).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "215": {"id":215,"name":"Sneasel","types":["dark","ice"],"stats":{"hp":55,"atk":95,"def":55,"spa":35,"spd":75,"spe":115},"pve":{"tier":"B","score":53.2,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Metal Claw","Slash","Agility"],"note":"Dano estimado por segundo na caça: 127,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":26.7,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Naughty"],"moves":["Faint Attack","Screech","Slash","Metal Claw"],"note":"Duelo de referência: 29/100 (perfil físico). Gen 3: RU; set \"Physical Attacker\" com 0/4 golpes por nível (faltam Shadow Ball, Brick Break, Double-Edge, Swords Dance).","smogon":{"tier":"RU","covered":0,"slots":4}}},
      "217": {"id":217,"name":"Ursaring","types":["normal"],"stats":{"hp":90,"atk":130,"def":75,"spa":75,"spd":75,"spe":55},"pve":{"tier":"S","score":93.7,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Slash","Faint Attack","Fury Swipes"],"note":"Dano estimado por segundo na caça: 224,5."},"pvp":{"tier":"S","score":70.7,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Careful","Impish","Relaxed"],"moves":["Thrash","Leer","Slash","Faint Attack"],"note":"Duelo de referência: 88,4/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 0/4 golpes por nível (faltam Return, Earthquake, Hidden Power Ghost, Focus Punch / Sleep Talk).","smogon":{"tier":"UUBL","covered":0,"slots":4}}},
      "219": {"id":219,"name":"Magcargo","types":["fire","rock"],"stats":{"hp":50,"atk":50,"def":120,"spa":80,"spd":80,"spe":30},"pve":{"tier":"C","score":31.9,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Hasty"],"moves":["Flamethrower","Ember","Body Slam","Rock Slide"],"note":"Dano estimado por segundo na caça: 76,5. Usa dano físico e especial."},"pvp":{"tier":"D","score":28.2,"role":"special","priority":["spa"],"natures":["Quiet","Modest","Brave"],"moves":["Flamethrower","Harden","Amnesia","Rock Slide"],"note":"Duelo de referência: 33,1/100 (perfil especial). Gen 3: ZU; set \"Specially Defensive\" com 2/4 golpes por nível (faltam Rest, Sleep Talk).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "221": {"id":221,"name":"Piloswine","types":["ice","ground"],"stats":{"hp":100,"atk":100,"def":80,"spa":60,"spd":60,"spe":50},"pve":{"tier":"D","score":29.7,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Horn Attack","Take Down","Strength","Blizzard"],"note":"Dano estimado por segundo na caça: 71,2."},"pvp":{"tier":"D","score":28.1,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Lax","Relaxed","Brave"],"moves":["Amnesia","Take Down","Strength","Blizzard"],"note":"Duelo de referência: 29/100 (perfil misto). Gen 3: PUBL; set \"Choice Band\" com 1/4 golpes por nível (faltam Earthquake, Rock Slide, Double-Edge).","smogon":{"tier":"PUBL","covered":1,"slots":4}}},
      "222": {"id":222,"name":"Corsola","types":["water","rock"],"stats":{"hp":55,"atk":55,"def":85,"spa":65,"spd":85,"spe":35},"pve":{"tier":"C","score":34.1,"role":"special","priority":["spa","spe"],"natures":["Mild","Rash","Hasty"],"moves":["Surf","BubbleBeam","Rock Blast","AncientPower"],"note":"Dano estimado por segundo na caça: 81,7."},"pvp":{"tier":"D","score":25.6,"role":"special","priority":["spa"],"natures":["Modest","Bold","Calm"],"moves":["Surf","BubbleBeam","Recover","AncientPower"],"note":"Duelo de referência: 26,9/100 (perfil especial). Gen 3: ZU; set \"Calm Mind\" com 3/4 golpes por nível (faltam Calm Mind).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "224": {"id":224,"name":"Octillery","types":["water"],"stats":{"hp":75,"atk":105,"def":75,"spa":105,"spd":75,"spe":45},"pve":{"tier":"A","score":58.2,"role":"special","priority":["spa","spe"],"natures":["Mild","Rash","Hasty"],"moves":["Surf","BubbleBeam","Water Gun","Ice Beam"],"note":"Dano estimado por segundo na caça: 139,6."},"pvp":{"tier":"C","score":37.7,"role":"special","priority":["spa","hp","spd","def"],"natures":["Lax","Relaxed","Gentle"],"moves":["Ice Beam","Octazooka","Psybeam","Aurora Beam"],"note":"Duelo de referência: 39/100 (perfil especial). Gen 3: NU; set \"Baton Pass Receiver\" com 2/4 golpes por nível (faltam Hidden Power Electric, Substitute).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "225": {"id":225,"name":"Delibird","types":["ice","flying"],"stats":{"hp":45,"atk":55,"def":45,"spa":65,"spd":45,"spe":75},"pve":{"tier":"D","score":6.3,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Fly"],"note":"Dano estimado por segundo na caça: 15."},"pvp":{"tier":"D","score":7,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Fly"],"note":"Duelo de referência: 5,4/100 (perfil físico). Gen 3: ZU; set \"Substitute + 3 Attacks\" com 0/4 golpes por nível (faltam Substitute, Aerial Ace, Ice Beam, Hidden Power Ground).","smogon":{"tier":"ZU","covered":0,"slots":4}}},
      "226": {"id":226,"name":"Mantine","types":["water","flying"],"stats":{"hp":65,"atk":40,"def":70,"spa":80,"spd":140,"spe":70},"pve":{"tier":"B","score":50.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","BubbleBeam","Water Pulse","Agility"],"note":"Dano estimado por segundo na caça: 120,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":40,"role":"special","priority":["spa","spe","hp","spd"],"natures":["Hasty","Naive","Timid"],"moves":["Confuse Ray","BubbleBeam","Water Pulse","Wing Attack"],"note":"Duelo de referência: 44,3/100 (perfil especial). Gen 3: RU; set \"Hazer\" com 1/4 golpes por nível (faltam Ice Beam, Haze, Toxic).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "227": {"id":227,"name":"Skarmory","types":["steel","flying"],"stats":{"hp":65,"atk":80,"def":140,"spa":40,"spd":70,"spe":70},"pve":{"tier":"C","score":34.8,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Steel Wing","Peck","Agility","Fly"],"note":"Dano estimado por segundo na caça: 83,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":52.8,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Steel Wing","Peck","Leer","Fly"],"note":"Duelo de referência: 53,6/100 (perfil físico). Gen 3: OU; set \"Defensive Spikes\" com 1/4 golpes por nível (faltam Whirlwind / Roar, Toxic / Taunt, Pursuit / Protect / Drill Peck).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "229": {"id":229,"name":"Houndoom","types":["dark","fire"],"stats":{"hp":75,"atk":90,"def":50,"spa":110,"spd":80,"spe":95},"pve":{"tier":"A","score":65.6,"role":"mixed","priority":["atk","spa","spe"],"natures":["Hasty","Naive","Lonely"],"moves":["Flamethrower","Howl","Faint Attack","Crunch"],"note":"Dano estimado por segundo na caça: 157,2, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":49.3,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Relaxed","Quiet","Brave"],"moves":["Bite","Faint Attack","Crunch","Flamethrower"],"note":"Duelo de referência: 47,6/100 (perfil misto). Gen 3: UUBL; set \"Pursuit\" com 2/4 golpes por nível (faltam Pursuit, Will-O-Wisp / Toxic).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "230": {"id":230,"name":"Kingdra","types":["water","dragon"],"stats":{"hp":75,"atk":95,"def":95,"spa":95,"spd":95,"spe":85},"pve":{"tier":"A","score":58.7,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Surf","Water Gun","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 140,8."},"pvp":{"tier":"A","score":53.5,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Quiet","Rash","Mild"],"moves":["Surf","Waterfall","Smokescreen","Twister"],"note":"Duelo de referência: 54,4/100 (perfil misto). Gen 3: UUBL; set \"Rain Dance Sweeper\" com 2/4 golpes por nível (faltam Rain Dance, Ice Beam).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "232": {"id":232,"name":"Donphan","types":["ground"],"stats":{"hp":90,"atk":120,"def":120,"spa":60,"spd":60,"spe":50},"pve":{"tier":"B","score":52.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Double-Edge","Earthquake","Take Down","Horn Attack"],"note":"Dano estimado por segundo na caça: 125,4."},"pvp":{"tier":"B","score":52.7,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Impish","Lonely"],"moves":["Horn Attack","Double-Edge","Growl","Earthquake"],"note":"Duelo de referência: 54,1/100 (perfil físico). Gen 3: UUBL; set \"Tank\" com 2/4 golpes por nível (faltam Hidden Power Rock, Rest).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "233": {"id":233,"name":"Porygon2","types":["normal"],"stats":{"hp":85,"atk":80,"def":90,"spa":105,"spd":95,"spe":60},"pve":{"tier":"C","score":40.1,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Quiet"],"moves":["Psybeam","Tackle","Tri Attack","Agility"],"note":"Dano estimado por segundo na caça: 96,2, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":51.1,"role":"special","priority":["spa","hp","spd","def"],"natures":["Modest","Calm","Bold"],"moves":["Recover","Psybeam","Tri Attack","Zap Cannon"],"note":"Duelo de referência: 61,7/100 (perfil especial). Gen 3: (OU); set \"Standard\" com 1/4 golpes por nível (faltam Ice Beam, Thunderbolt / Thunder / Toxic, Thunder Wave / Toxic).","smogon":{"tier":"(OU)","covered":1,"slots":4}}},
      "234": {"id":234,"name":"Stantler","types":["normal"],"stats":{"hp":73,"atk":95,"def":62,"spa":85,"spd":65,"spe":85},"pve":{"tier":"C","score":45.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Take Down","Stomp","Tackle","Astonish"],"note":"Dano estimado por segundo na caça: 108."},"pvp":{"tier":"C","score":39.3,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Brave","Lonely"],"moves":["Take Down","Sand-Attack","Stomp","Astonish"],"note":"Duelo de referência: 37,8/100 (perfil físico). Gen 3: RU; set \"Calm Mind\" com 2/4 golpes por nível (faltam Thunderbolt, Psychic / Hidden Power Ice).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "235": {"id":235,"name":"Smeargle","types":["normal"],"stats":{"hp":55,"atk":20,"def":35,"spa":20,"spd":45,"spe":75},"pve":{"tier":"D","score":0,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":[],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero."},"pvp":{"tier":"D","score":7.5,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":[],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero.","smogon":{"tier":"UUBL","covered":0,"slots":4}}},
      "237": {"id":237,"name":"Hitmontop","types":["fighting"],"stats":{"hp":50,"atk":95,"def":95,"spa":35,"spd":110,"spe":70},"pve":{"tier":"C","score":37.8,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Quick Attack","Rolling Kick","Strength","Pursuit"],"note":"Dano estimado por segundo na caça: 90,6."},"pvp":{"tier":"C","score":38.7,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Impish","Lonely"],"moves":["Quick Attack","Detect","Pursuit","Rolling Kick"],"note":"Duelo de referência: 37,1/100 (perfil físico). Gen 3: UU; set \"Counter\" com 2/4 golpes por nível (faltam Brick Break / High Jump Kick, Hidden Power Ghost).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "241": {"id":241,"name":"Miltank","types":["normal"],"stats":{"hp":95,"atk":80,"def":105,"spa":40,"spd":70,"spe":100},"pve":{"tier":"B","score":53.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Stomp","Body Slam","Strength","Tackle"],"note":"Dano estimado por segundo na caça: 127,3."},"pvp":{"tier":"S","score":68.9,"role":"physical","priority":["atk","spe","hp","def"],"natures":["Jolly","Impish","Hasty"],"moves":["Body Slam","Strength","Milk Drink","Surf"],"note":"Duelo de referência: 69,7/100 (perfil físico). Gen 3: UUBL; set \"Curse\" com 3/4 golpes por nível (faltam Curse).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "242": {"id":242,"name":"Blissey","types":["normal"],"stats":{"hp":255,"atk":10,"def":10,"spa":75,"spd":135,"spe":55},"pve":{"tier":"D","score":13.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Double-Edge","Strength","Egg Bomb","DoubleSlap"],"note":"Dano estimado por segundo na caça: 32."},"pvp":{"tier":"C","score":39.9,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Gentle","Sassy"],"moves":["Double-Edge","Softboiled","Light Screen","Rock Smash"],"note":"Duelo de referência: 30,4/100 (perfil físico). Gen 3: OU; set \"Blissey\" com 2/4 golpes por nível (faltam Toxic, Heal Bell).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "243": {"id":243,"name":"Raikou","types":["electric"],"stats":{"hp":90,"atk":85,"def":75,"spa":115,"spd":100,"spe":115},"pve":{"tier":"A","score":67,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Quiet"],"moves":["ThunderShock","Spark","Thunder","Calm Mind"],"note":"Dano estimado por segundo na caça: 160,5, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"S","score":65.2,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Relaxed","Calm"],"moves":["ThunderShock","Thunder","Calm Mind","Reflect"],"note":"Duelo de referência: 66,2/100 (perfil especial). Gen 3: OU; set \"Calm Mind Sweeper\" com 2/4 golpes por nível (faltam Thunderbolt, Hidden Power Grass / Hidden Power Ice).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "244": {"id":244,"name":"Entei","types":["fire"],"stats":{"hp":115,"atk":115,"def":85,"spa":90,"spd":75,"spe":100},"pve":{"tier":"A","score":65.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Flamethrower","Ember","Calm Mind","Fire Blast"],"note":"Dano estimado por segundo na caça: 156,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":69.9,"role":"special","priority":["spa","hp","def","spd"],"natures":["Relaxed","Sassy","Brave"],"moves":["Fire Blast","Strength","Flamethrower","Calm Mind"],"note":"Duelo de referência: 76,3/100 (perfil especial). Gen 3: UUBL; set \"SubCM\" com 2/4 golpes por nível (faltam Substitute, Hidden Power Grass).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "245": {"id":245,"name":"Suicune","types":["water"],"stats":{"hp":100,"atk":75,"def":115,"spa":90,"spd":115,"spe":85},"pve":{"tier":"S","score":75.9,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","BubbleBeam","Aurora Beam","Calm Mind"],"note":"Dano estimado por segundo na caça: 181,9, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":76.9,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Relaxed","Calm"],"moves":["Surf","BubbleBeam","Calm Mind","Hydro Pump"],"note":"Duelo de referência: 77,5/100 (perfil especial). Gen 3: OU; set \"Substitute\" com 3/4 golpes por nível (faltam Substitute).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "248": {"id":248,"name":"Tyranitar","types":["rock","dark"],"stats":{"hp":100,"atk":134,"def":110,"spa":95,"spd":100,"spe":61},"pve":{"tier":"A","score":67,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Thrash","Rock Slide","Earthquake","Crunch"],"note":"Dano estimado por segundo na caça: 160,7."},"pvp":{"tier":"S","score":74.2,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Adamant"],"moves":["Thrash","Scary Face","Screech","Crunch"],"note":"Duelo de referência: 79,4/100 (perfil físico). Gen 3: OU; set \"Fast Dragon Dance\" com 2/4 golpes por nível (faltam Dragon Dance, Hidden Power Bug / Hidden Power Grass / Ice Beam).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "249": {"id":249,"name":"Lugia","types":["psychic","flying"],"stats":{"hp":106,"atk":90,"def":130,"spa":90,"spd":154,"spe":110},"pve":{"tier":"B","score":52.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Surf","AncientPower","Aeroblast"],"note":"Dano estimado por segundo na caça: 125,7."},"pvp":{"tier":"S","score":78.6,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Lax","Gentle","Naive"],"moves":["Gust","Strength","Waterfall","Recover"],"note":"Duelo de referência: 82,3/100 (perfil misto). Gen 3: Uber; set \"Great Wall\" com 2/4 golpes por nível (faltam Reflect, Toxic).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "250": {"id":250,"name":"Ho-Oh","types":["fire","flying"],"stats":{"hp":106,"atk":130,"def":90,"spa":110,"spd":154,"spe":90},"pve":{"tier":"B","score":54.5,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Quiet"],"moves":["Gust","AncientPower","Sacred Fire","Fire Blast"],"note":"Dano estimado por segundo na caça: 130,6. Usa dano físico e especial."},"pvp":{"tier":"S","score":80.6,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Relaxed","Sassy","Lax"],"moves":["Sunny Day","Sacred Fire","Fire Blast","Gust"],"note":"Duelo de referência: 85,1/100 (perfil misto). Gen 3: Uber; set \"Special Attacker\" com 2/4 golpes por nível (faltam Calm Mind, Thunderbolt / Thunder).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "251": {"id":251,"name":"Celebi","types":["psychic","grass"],"stats":{"hp":100,"atk":100,"def":100,"spa":100,"spd":100,"spe":100},"pve":{"tier":"D","score":27,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Cut","Confusion","AncientPower"],"note":"Dano estimado por segundo na caça: 64,8. Usa dano físico e especial."},"pvp":{"tier":"A","score":55.8,"role":"special","priority":["spa","hp","spd","def"],"natures":["Modest","Quiet","Calm"],"moves":["Leech Seed","Confusion","AncientPower","Recover"],"note":"Duelo de referência: 41,7/100 (perfil especial). Gen 3: OU; set \"Utility\" com 4/4 golpes por nível.","smogon":{"tier":"OU","covered":4,"slots":4}}},
      "254": {"id":254,"name":"Sceptile","types":["grass"],"stats":{"hp":70,"atk":85,"def":65,"spa":105,"spd":85,"spe":120},"pve":{"tier":"C","score":38.7,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Leaf Blade","Quick Attack","Slam","Giga Drain"],"note":"Dano estimado por segundo na caça: 92,8."},"pvp":{"tier":"C","score":41,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Relaxed","Lax"],"moves":["Leaf Blade","Screech","Slam","Detect"],"note":"Duelo de referência: 41,6/100 (perfil físico). Gen 3: UUBL; set \"SubSeed\" com 1/4 golpes por nível (faltam Leech Seed, Substitute, Hidden Power Ice / Hidden Power Fire).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "257": {"id":257,"name":"Blaziken","types":["fire","fighting"],"stats":{"hp":80,"atk":120,"def":70,"spa":110,"spd":70,"spe":80},"pve":{"tier":"A","score":73.5,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Brave"],"moves":["Bulk Up","Flamethrower","Sky Uppercut","Blaze Kick"],"note":"Dano estimado por segundo na caça: 176,2, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"A","score":64.1,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Double Kick","Sky Uppercut","Bulk Up","Blaze Kick"],"note":"Duelo de referência: 74,3/100 (perfil físico). Gen 3: UUBL; set \"Mixed Sweeper\" com 1/4 golpes por nível (faltam Swords Dance / Focus Punch, Rock Slide, Fire Blast / Overheat).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "260": {"id":260,"name":"Swampert","types":["water","ground"],"stats":{"hp":100,"atk":110,"def":90,"spa":85,"spd":90,"spe":60},"pve":{"tier":"A","score":62.1,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Surf","Earthquake","Muddy Water","Hydro Pump"],"note":"Dano estimado por segundo na caça: 148,8. Usa dano físico e especial."},"pvp":{"tier":"S","score":70.5,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Lax","Gentle","Lonely"],"moves":["Waterfall","Muddy Water","Protect","Hydro Pump"],"note":"Duelo de referência: 70,4/100 (perfil misto). Gen 3: OU; set \"Standard Defensive\" com 3/4 golpes por nível (faltam Ice Beam).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "262": {"id":262,"name":"Mightyena","types":["dark"],"stats":{"hp":70,"atk":90,"def":70,"spa":60,"spd":60,"spe":70},"pve":{"tier":"B","score":49.6,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Crunch","Take Down","Howl"],"note":"Dano estimado por segundo na caça: 118,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":39.6,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Adamant","Careful","Impish"],"moves":["Bite","Crunch","Howl","Strength"],"note":"Duelo de referência: 45,4/100 (perfil físico). Gen 3: PU; set \"Bulky Heal Bell\" com 2/4 golpes por nível (faltam Heal Bell, Rest / Protect).","smogon":{"tier":"PU","covered":2,"slots":4}}},
      "264": {"id":264,"name":"Linoone","types":["normal"],"stats":{"hp":78,"atk":70,"def":61,"spa":50,"spd":61,"spe":100},"pve":{"tier":"S","score":75.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Belly Drum","Slash","Strength","Headbutt"],"note":"Dano estimado por segundo na caça: 180,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":39,"role":"physical","priority":["atk"],"natures":["Brave","Adamant","Lonely"],"moves":["Slash","Tail Whip","Headbutt","Fury Swipes"],"note":"Duelo de referência: 34,1/100 (perfil físico). Gen 3: UUBL; set \"Substitute + Flail\" com 2/4 golpes por nível (faltam Substitute / Endure, Shadow Ball).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "267": {"id":267,"name":"Beautifly","types":["bug","flying"],"stats":{"hp":60,"atk":70,"def":50,"spa":90,"spd":50,"spe":65},"pve":{"tier":"C","score":30.3,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Gust","Tackle","Silver Wind","Mega Drain"],"note":"Dano estimado por segundo na caça: 72,7."},"pvp":{"tier":"D","score":21.2,"role":"special","priority":["spa","hp"],"natures":["Modest","Quiet","Bold"],"moves":["Gust","Stun Spore","Giga Drain","Silver Wind"],"note":"Duelo de referência: 21,6/100 (perfil especial). Gen 3: ZU; set \"Paralyzer\" com 3/4 golpes por nível (faltam Substitute).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "269": {"id":269,"name":"Dustox","types":["bug","poison"],"stats":{"hp":60,"atk":50,"def":70,"spa":50,"spd":90,"spe":65},"pve":{"tier":"D","score":19.4,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Psybeam","Confusion","Silver Wind"],"note":"Dano estimado por segundo na caça: 46,6."},"pvp":{"tier":"D","score":20.9,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Quiet","Rash","Mild"],"moves":["Poison Sting","Psybeam","Light Screen","Silver Wind"],"note":"Duelo de referência: 19,2/100 (perfil misto). Gen 3: ZU; set \"Specially Defensive\" com 3/4 golpes por nível (faltam Sludge Bomb / Psychic).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "272": {"id":272,"name":"Ludicolo","types":["water","grass"],"stats":{"hp":80,"atk":70,"def":70,"spa":90,"spd":100,"spe":70},"pve":{"tier":"B","score":55,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Quiet","Rash"],"moves":["Surf","Waterfall","Rain Dance","Hydro Pump"],"note":"Dano estimado por segundo na caça: 131,8, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"A","score":55.9,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Rash","Mild","Lax"],"moves":["Surf","Waterfall","Rain Dance","Hydro Pump"],"note":"Duelo de referência: 59/100 (perfil misto). Gen 3: UUBL; set \"Rain Dance Sweeper\" com 2/4 golpes por nível (faltam Ice Beam, Leech Seed / Hidden Power Grass).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "275": {"id":275,"name":"Shiftry","types":["grass","dark"],"stats":{"hp":90,"atk":100,"def":60,"spa":90,"spd":60,"spe":80},"pve":{"tier":"B","score":48.2,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Faint Attack","Growth","Extrasensory","Razor Wind"],"note":"Dano estimado por segundo na caça: 115,5, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":38,"role":"mixed","priority":["atk","spa","hp"],"natures":["Brave","Quiet","Relaxed"],"moves":["Faint Attack","Extrasensory","Growth","Synthesis"],"note":"Duelo de referência: 39,6/100 (perfil misto). Gen 3: RU; set \"Choice Band\" com 2/4 golpes por nível (faltam Brick Break, Shadow Ball).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "277": {"id":277,"name":"Swellow","types":["normal","flying"],"stats":{"hp":60,"atk":85,"def":60,"spa":50,"spd":50,"spe":125},"pve":{"tier":"B","score":48.8,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Quick Attack","Aerial Ace","Wing Attack","Fly"],"note":"Dano estimado por segundo na caça: 117."},"pvp":{"tier":"C","score":39.3,"role":"physical","priority":["atk"],"natures":["Adamant","Naughty","Careful"],"moves":["Growl","Quick Attack","Aerial Ace","Wing Attack"],"note":"Duelo de referência: 33,8/100 (perfil físico). Gen 3: UUBL; set \"Endeavor\" com 2/4 golpes por nível (faltam Substitute, Baton Pass).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "279": {"id":279,"name":"Pelipper","types":["water","flying"],"stats":{"hp":60,"atk":50,"def":100,"spa":85,"spd":70,"spe":65},"pve":{"tier":"C","score":44.3,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Surf","Water Gun","Wing Attack","Agility"],"note":"Dano estimado por segundo na caça: 106,2, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":35,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Lonely","Gentle"],"moves":["Surf","Wing Attack","Protect","Growl"],"note":"Duelo de referência: 38,6/100 (perfil misto). Gen 3: NU; set \"Defensive\" com 1/4 golpes por nível (faltam Ice Beam / Toxic, Rest, Sleep Talk).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "282": {"id":282,"name":"Gardevoir","types":["psychic"],"stats":{"hp":68,"atk":65,"def":65,"spa":125,"spd":115,"spe":80},"pve":{"tier":"B","score":50.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psychic","Confusion","Calm Mind"],"note":"Dano estimado por segundo na caça: 120,9, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":53.7,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Gentle","Bold"],"moves":["Hypnosis","Psychic","Confusion","Calm Mind"],"note":"Duelo de referência: 49/100 (perfil especial). Gen 3: UUBL; set \"Trapper\" com 3/4 golpes por nível (faltam Mean Look).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "284": {"id":284,"name":"Masquerain","types":["bug","flying"],"stats":{"hp":70,"atk":60,"def":62,"spa":80,"spd":82,"spe":60},"pve":{"tier":"C","score":35.8,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Gust","BubbleBeam","Agility","Silver Wind"],"note":"Dano estimado por segundo na caça: 85,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":21.1,"role":"special","priority":["spa","spe"],"natures":["Hasty","Timid","Mild"],"moves":["Gust","Stun Spore","BubbleBeam","Silver Wind"],"note":"Duelo de referência: 23,2/100 (perfil especial). Gen 3: ZU; set \"Defensive\" com 1/4 golpes por nível (faltam Toxic, Hydro Pump, Ice Beam).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "286": {"id":286,"name":"Breloom","types":["grass","fighting"],"stats":{"hp":60,"atk":130,"def":80,"spa":60,"spd":60,"spe":70},"pve":{"tier":"S","score":81.4,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Mach Punch","Sky Uppercut","Cut","Growth"],"note":"Dano estimado por segundo na caça: 195, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":54,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Relaxed","Impish","Sassy"],"moves":["Mach Punch","Sky Uppercut","Stun Spore","Absorb"],"note":"Duelo de referência: 49,7/100 (perfil físico). Gen 3: OU; set \"Spore\" com 3/4 golpes por nível (faltam Focus Punch).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "289": {"id":289,"name":"Slaking","types":["normal"],"stats":{"hp":150,"atk":160,"def":100,"spa":95,"spd":65,"spe":100},"pve":{"tier":"S","score":81.7,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Uproar","Strength","Focus Punch"],"note":"Dano estimado por segundo na caça: 195,8."},"pvp":{"tier":"S","score":76.4,"role":"physical","priority":["atk","hp","spe","def"],"natures":["Naughty","Jolly","Impish"],"moves":["Amnesia","Scratch","Faint Attack","Slack Off"],"note":"Duelo de referência: 88/100 (perfil físico). Gen 3: OU (sem Truant no jogo); set \"Choice Band\" com 1/4 golpes por nível (faltam Double-Edge, Shadow Ball, Hyper Beam / Earthquake).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "291": {"id":291,"name":"Ninjask","types":["bug","flying"],"stats":{"hp":61,"atk":90,"def":45,"spa":50,"spd":50,"spe":160},"pve":{"tier":"A","score":66.9,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Slash","Swords Dance","Dig"],"note":"Dano estimado por segundo na caça: 160,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":27,"role":"physical","priority":["atk"],"natures":["Impish","Adamant","Lonely"],"moves":["Swords Dance","Harden","Slash","Dig"],"note":"Duelo de referência: 24,2/100 (perfil físico). Gen 3: RUBL; set \"Swords Dance\" com 1/4 golpes por nível (faltam Silver Wind, Aerial Ace, Hidden Power Ground).","smogon":{"tier":"RUBL","covered":1,"slots":4}}},
      "292": {"id":292,"name":"Shedinja","types":["bug","ghost"],"stats":{"hp":1,"atk":90,"def":45,"spa":30,"spd":30,"spe":40},"pve":{"tier":"D","score":23.4,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Dig","Shadow Ball","Fury Swipes"],"note":"Dano estimado por segundo na caça: 56."},"pvp":{"tier":"D","score":12.8,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Gentle","Sassy"],"moves":["Metal Claw","Dig","Shadow Ball","Fury Swipes"],"note":"Duelo de referência: 8,9/100 (perfil físico). Gen 3: ZU (sem Wonder Guard no jogo); set \"The Shed\" com 1/4 golpes por nível (faltam Swords Dance / Baton Pass, Hidden Power Fighting, Protect / Toxic / Silver Wind).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "295": {"id":295,"name":"Exploud","types":["normal"],"stats":{"hp":104,"atk":91,"def":63,"spa":91,"spd":63,"spe":68},"pve":{"tier":"A","score":61.4,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Stomp","Strength","Hyper Voice","Howl"],"note":"Dano estimado por segundo na caça: 147,2, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":41.1,"role":"physical","priority":["atk"],"natures":["Brave","Adamant","Careful"],"moves":["Strength","Howl","Screech","Rest"],"note":"Duelo de referência: 49,3/100 (perfil físico). Gen 3: RU; set \"Mixed Attacker\" com 0/4 golpes por nível (faltam Return, Shadow Ball / Earthquake, Substitute / Earthquake, Flamethrower / Fire Blast / Overheat).","smogon":{"tier":"RU","covered":0,"slots":4}}},
      "297": {"id":297,"name":"Hariyama","types":["fighting"],"stats":{"hp":144,"atk":120,"def":60,"spa":40,"spd":60,"spe":50},"pve":{"tier":"A","score":70.4,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Arm Thrust","Strength","Vital Throw","Belly Drum"],"note":"Dano estimado por segundo na caça: 168,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":56.8,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Belly Drum","Vital Throw","Arm Thrust","Tackle"],"note":"Duelo de referência: 64,4/100 (perfil físico). Gen 3: UUBL; set \"Offensive\" com 1/4 golpes por nível (faltam Cross Chop / Focus Punch, Brick Break / Rock Slide, Hidden Power Bug / Hidden Power Ghost / Rock Slide).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "299": {"id":299,"name":"Nosepass","types":["rock"],"stats":{"hp":30,"atk":45,"def":135,"spa":45,"spd":90,"spe":30},"pve":{"tier":"D","score":16.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Strength","Rock Slide","Rock Throw","Zap Cannon"],"note":"Dano estimado por segundo na caça: 38,8."},"pvp":{"tier":"D","score":13.8,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Lax","Relaxed"],"moves":["Strength","Thunder Wave","Rock Slide","Harden"],"note":"Duelo de referência: 14/100 (perfil físico). Gen 3: ZU; set \"Wall\" com 1/4 golpes por nível (faltam Earthquake, Protect, Explosion).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "301": {"id":301,"name":"Delcatty","types":["normal"],"stats":{"hp":70,"atk":65,"def":65,"spa":55,"spd":55,"spe":70},"pve":{"tier":"C","score":35.9,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Double-Edge","Covet","Strength","Faint Attack"],"note":"Dano estimado por segundo na caça: 86."},"pvp":{"tier":"D","score":22.4,"role":"physical","priority":["atk","hp"],"natures":["Adamant","Naughty","Careful"],"moves":["Double-Edge","Covet","Strength","Faint Attack"],"note":"Duelo de referência: 25,1/100 (perfil físico). Gen 3: ZU; set \"Special Wall\" com 1/4 golpes por nível (faltam Body Slam / Hidden Power Grass, Wish, Protect).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "302": {"id":302,"name":"Sableye","types":["dark","ghost"],"stats":{"hp":50,"atk":75,"def":75,"spa":65,"spd":65,"spe":50},"pve":{"tier":"D","score":28.8,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Lonely"],"moves":["Faint Attack","Shadow Ball","Fury Swipes","Astonish"],"note":"Dano estimado por segundo na caça: 69,1. Usa dano físico e especial."},"pvp":{"tier":"C","score":36.2,"role":"special","priority":["spa","hp"],"natures":["Timid","Naive","Modest"],"moves":["Shadow Ball","Confuse Ray","Night Shade","Faint Attack"],"note":"Duelo de referência: 38,8/100 (perfil especial). Gen 3: NU; set \"Wall\" com 2/4 golpes por nível (faltam Toxic, Recover).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "303": {"id":303,"name":"Mawile","types":["steel"],"stats":{"hp":50,"atk":85,"def":85,"spa":55,"spd":55,"spe":50},"pve":{"tier":"D","score":26.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["ViceGrip","Crunch","Bite","Faint Attack"],"note":"Dano estimado por segundo na caça: 63."},"pvp":{"tier":"D","score":26,"role":"physical","priority":["atk","spe","hp","def"],"natures":["Adamant","Brave","Jolly"],"moves":["Bite","Iron Defense","Crunch","Strength"],"note":"Duelo de referência: 29,4/100 (perfil físico). Gen 3: PU; set \"Defensive\" com 1/4 golpes por nível (faltam Seismic Toss / Hidden Power Steel, Toxic, Protect).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "306": {"id":306,"name":"Aggron","types":["steel","rock"],"stats":{"hp":70,"atk":110,"def":180,"spa":60,"spd":60,"spe":50},"pve":{"tier":"B","score":47.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Iron Tail","Double-Edge","Take Down"],"note":"Dano estimado por segundo na caça: 113,5."},"pvp":{"tier":"B","score":48.7,"role":"physical","priority":["atk","hp","spd","spe"],"natures":["Sassy","Careful","Gentle"],"moves":["Iron Defense","Iron Tail","Headbutt","Protect"],"note":"Duelo de referência: 52,4/100 (perfil físico). Gen 3: RU; set \"Choice Band\" com 2/4 golpes por nível (faltam Earthquake, Rock Slide).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "308": {"id":308,"name":"Medicham","types":["fighting","psychic"],"stats":{"hp":60,"atk":60,"def":75,"spa":60,"spd":75,"spe":80},"pve":{"tier":"C","score":37.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Hi Jump Kick","Meditate","Fire Punch","Ice Punch"],"note":"Dano estimado por segundo na caça: 89,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":35.5,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Careful"],"moves":["Hi Jump Kick","Ice Punch","Meditate","Detect"],"note":"Duelo de referência: 38/100 (perfil físico). Gen 3: NU (sem Pure Power no jogo); set \"Choice Band\" com 1/4 golpes por nível (faltam Shadow Ball, Rock Slide, Fake Out / Focus Punch).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "310": {"id":310,"name":"Manectric","types":["electric"],"stats":{"hp":70,"atk":75,"def":60,"spa":105,"spd":60,"spe":105},"pve":{"tier":"B","score":55.9,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Brave"],"moves":["Spark","Thunder","Howl","Strength"],"note":"Dano estimado por segundo na caça: 134,1, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":39.1,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Lonely","Naughty","Brave"],"moves":["Bite","Thunder Wave","Quick Attack","Thunder"],"note":"Duelo de referência: 45/100 (perfil misto). Gen 3: RUBL; set \"Special Sweeper\" com 0/4 golpes por nível (faltam Thunderbolt, Substitute, Crunch, Hidden Power Ice / Hidden Power Grass).","smogon":{"tier":"RUBL","covered":0,"slots":4}}},
      "311": {"id":311,"name":"Plusle","types":["electric"],"stats":{"hp":60,"atk":50,"def":40,"spa":85,"spd":75,"spe":95},"pve":{"tier":"C","score":34,"role":"mixed","priority":["atk","spa"],"natures":["Brave","Quiet","Lonely"],"moves":["Spark","Thunder","Quick Attack"],"note":"Dano estimado por segundo na caça: 81,6. Usa dano físico e especial."},"pvp":{"tier":"C","score":28.4,"role":"mixed","priority":["spa","atk"],"natures":["Quiet","Brave","Sassy"],"moves":["Spark","Thunder","Quick Attack","Fake Tears"],"note":"Duelo de referência: 26,1/100 (perfil misto). Gen 3: NU; set \"Special Attacker\" com 2/4 golpes por nível (faltam Thunderbolt, Hidden Power Ice / Hidden Power Grass).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "312": {"id":312,"name":"Minun","types":["electric"],"stats":{"hp":60,"atk":40,"def":50,"spa":75,"spd":85,"spe":95},"pve":{"tier":"D","score":29.8,"role":"mixed","priority":["atk","spa"],"natures":["Brave","Quiet","Lonely"],"moves":["Thunder","Spark","Quick Attack"],"note":"Dano estimado por segundo na caça: 71,5. Usa dano físico e especial."},"pvp":{"tier":"D","score":25.5,"role":"mixed","priority":["atk","spa","hp","spd"],"natures":["Sassy","Gentle","Brave"],"moves":["Thunder","Spark","Quick Attack","Charm"],"note":"Duelo de referência: 23,8/100 (perfil misto). Gen 3: PU; set \"Support\" com 2/4 golpes por nível (faltam Thunderbolt, Hidden Power Grass / Seismic Toss / Hidden Power Ice).","smogon":{"tier":"PU","covered":2,"slots":4}}},
      "313": {"id":313,"name":"Volbeat","types":["bug"],"stats":{"hp":65,"atk":73,"def":55,"spa":47,"spd":75,"spe":85},"pve":{"tier":"C","score":38.7,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Double-Edge","Quick Attack","Signal Beam","Tail Glow"],"note":"Dano estimado por segundo na caça: 92,7, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":28.4,"role":"mixed","priority":["atk","spa","hp"],"natures":["Brave","Lonely","Naughty"],"moves":["Double-Edge","Moonlight","Confuse Ray","Signal Beam"],"note":"Duelo de referência: 27,9/100 (perfil misto). Gen 3: ZU; set \"Wallbreaker\" com 3/4 golpes por nível (faltam Brick Break).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "314": {"id":314,"name":"Illumise","types":["bug"],"stats":{"hp":65,"atk":47,"def":55,"spa":73,"spd":75,"spe":85},"pve":{"tier":"D","score":10.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Covet","Quick Attack","Tackle"],"note":"Dano estimado por segundo na caça: 24,7."},"pvp":{"tier":"D","score":16.3,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Adamant","Lonely"],"moves":["Charm","Quick Attack","Covet","Moonlight"],"note":"Duelo de referência: 15,1/100 (perfil físico). Gen 3: ZU; set \"Support\" com 1/4 golpes por nível (faltam Thunderbolt, Ice Punch, Thunder Wave / Light Screen).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "315": {"id":315,"name":"Roselia","types":["grass","poison"],"stats":{"hp":50,"atk":60,"def":45,"spa":100,"spd":80,"spe":65},"pve":{"tier":"A","score":73.8,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Quiet"],"moves":["Petal Dance","Growth","Magical Leaf","Giga Drain"],"note":"Dano estimado por segundo na caça: 176,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":49.9,"role":"special","priority":["spa","spd","spe"],"natures":["Calm","Sassy","Timid"],"moves":["Petal Dance","Stun Spore","Synthesis","Magical Leaf"],"note":"Duelo de referência: 58/100 (perfil especial). Gen 3: NU; set \"Defensive Spikes\" com 3/4 golpes por nível (faltam Spikes).","smogon":{"tier":"NU","covered":3,"slots":4}}},
      "317": {"id":317,"name":"Swalot","types":["poison"],"stats":{"hp":100,"atk":73,"def":83,"spa":73,"spd":83,"spe":55},"pve":{"tier":"C","score":37.3,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Hasty"],"moves":["Sludge","Sludge Bomb","Body Slam","Pound"],"note":"Dano estimado por segundo na caça: 89,5. Usa dano físico e especial."},"pvp":{"tier":"B","score":42.9,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Gentle","Mild","Lonely"],"moves":["Sludge","Body Slam","Amnesia","Stockpile"],"note":"Duelo de referência: 44,9/100 (perfil misto). Gen 3: PU; set \"Specially Defensive\" com 3/4 golpes por nível (faltam Explosion).","smogon":{"tier":"PU","covered":3,"slots":4}}},
      "319": {"id":319,"name":"Sharpedo","types":["water","dark"],"stats":{"hp":70,"atk":120,"def":40,"spa":95,"spd":40,"spe":95},"pve":{"tier":"A","score":68.1,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Bite","Crunch","Surf","Skull Bash"],"note":"Dano estimado por segundo na caça: 163,3. Usa dano físico e especial."},"pvp":{"tier":"B","score":49.9,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Adamant"],"moves":["Agility","Crunch","Waterfall","Screech"],"note":"Duelo de referência: 57,8/100 (perfil físico). Gen 3: RU; set \"Sharknado\" com 1/4 golpes por nível (faltam Hydro Pump, Ice Beam, Endure).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "321": {"id":321,"name":"Wailord","types":["water"],"stats":{"hp":170,"atk":90,"def":45,"spa":90,"spd":45,"spe":60},"pve":{"tier":"B","score":57.6,"role":"special","priority":["spa"],"natures":["Mild","Rash","Quiet"],"moves":["Surf","Water Pulse","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 138."},"pvp":{"tier":"A","score":56.6,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Mild","Rash","Naughty"],"moves":["Surf","Waterfall","Water Pulse","Rest"],"note":"Duelo de referência: 65,9/100 (perfil misto). Gen 3: NU; set \"Offensive\" com 2/4 golpes por nível (faltam Self-Destruct, Ice Beam).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "323": {"id":323,"name":"Camerupt","types":["fire","ground"],"stats":{"hp":70,"atk":100,"def":70,"spa":105,"spd":75,"spe":40},"pve":{"tier":"A","score":58.1,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Flamethrower","Double-Edge","Earthquake","Rock Slide"],"note":"Dano estimado por segundo na caça: 139,2. Usa dano físico e especial."},"pvp":{"tier":"B","score":50.5,"role":"mixed","priority":["atk","spa","hp"],"natures":["Quiet","Mild","Rash"],"moves":["Double-Edge","Amnesia","Flamethrower","Earthquake"],"note":"Duelo de referência: 53,2/100 (perfil misto). Gen 3: RU; set \"Physically Defensive\" com 3/4 golpes por nível (faltam Protect / Explosion).","smogon":{"tier":"RU","covered":3,"slots":4}}},
      "324": {"id":324,"name":"Torkoal","types":["fire"],"stats":{"hp":70,"atk":85,"def":140,"spa":85,"spd":70,"spe":20},"pve":{"tier":"C","score":38,"role":"special","priority":["spa","spe"],"natures":["Mild","Rash","Quiet"],"moves":["Flamethrower","Heat Wave","Body Slam","Ember"],"note":"Dano estimado por segundo na caça: 91,2."},"pvp":{"tier":"B","score":49.1,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Lax","Rash","Naughty"],"moves":["Flamethrower","Protect","Body Slam","Amnesia"],"note":"Duelo de referência: 56,4/100 (perfil misto). Gen 3: NU; set \"Tank\" com 2/4 golpes por nível (faltam Toxic, Hidden Power Grass / Rock Slide).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "326": {"id":326,"name":"Grumpig","types":["psychic"],"stats":{"hp":80,"atk":45,"def":65,"spa":90,"spd":110,"spe":80},"pve":{"tier":"C","score":41.2,"role":"special","priority":["spa"],"natures":["Quiet","Mild","Rash"],"moves":["Psybeam","Psychic","Bounce"],"note":"Dano estimado por segundo na caça: 98,7."},"pvp":{"tier":"B","score":42.1,"role":"special","priority":["spa"],"natures":["Modest","Quiet","Rash"],"moves":["Psybeam","Psychic","Bounce","Rest"],"note":"Duelo de referência: 40,4/100 (perfil especial). Gen 3: UU; set \"Special Sweeper\" com 2/4 golpes por nível (faltam Calm Mind, Hidden Power Dark / Fire Punch / Ice Punch).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "327": {"id":327,"name":"Spinda","types":["normal"],"stats":{"hp":60,"atk":60,"def":60,"spa":60,"spd":60,"spe":60},"pve":{"tier":"B","score":49.8,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Double-Edge","Dizzy Punch","Psybeam"],"note":"Dano estimado por segundo na caça: 119,3."},"pvp":{"tier":"C","score":33.1,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Naughty"],"moves":["Thrash","Teeter Dance","Double-Edge","Dizzy Punch"],"note":"Duelo de referência: 41,6/100 (perfil físico). Gen 3: ZU; set \"Calm Mind + Baton Pass\" com 1/4 golpes por nível (faltam Thunder Punch / Substitute / Snatch, Calm Mind, Baton Pass).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "330": {"id":330,"name":"Flygon","types":["ground","dragon"],"stats":{"hp":80,"atk":100,"def":80,"spa":80,"spd":80,"spe":100},"pve":{"tier":"B","score":50.4,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["DragonBreath","Dig","Crunch","Strength"],"note":"Dano estimado por segundo na caça: 120,9. Usa dano físico e especial."},"pvp":{"tier":"B","score":45.8,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Relaxed"],"moves":["Bite","Crunch","Screech","Dig"],"note":"Duelo de referência: 51,1/100 (perfil físico). Gen 3: OU; set \"Offensive\" com 0/4 golpes por nível (faltam Earthquake, Rock Slide, Hidden Power Bug, Substitute / Fire Blast).","smogon":{"tier":"OU","covered":0,"slots":4}}},
      "332": {"id":332,"name":"Cacturne","types":["grass","dark"],"stats":{"hp":70,"atk":115,"def":60,"spa":115,"spd":60,"spe":55},"pve":{"tier":"B","score":49.6,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Needle Arm","Growth","Pin Missile"],"note":"Dano estimado por segundo na caça: 118,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":31,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Needle Arm","Pin Missile","Absorb"],"note":"Duelo de referência: 33/100 (perfil físico). Gen 3: NU; set \"Bulky Spikes\" com 2/4 golpes por nível (faltam Giga Drain, Hidden Power Dark).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "334": {"id":334,"name":"Altaria","types":["dragon","flying"],"stats":{"hp":75,"atk":70,"def":90,"spa":70,"spd":105,"spe":80},"pve":{"tier":"C","score":39.8,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Brave"],"moves":["DragonBreath","Peck","Sky Attack","Dragon Dance"],"note":"Dano estimado por segundo na caça: 95,3, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":41.8,"role":"physical","priority":["atk","hp","spd"],"natures":["Adamant","Brave","Naughty"],"moves":["Dragon Dance","DragonBreath","Sky Attack","Peck"],"note":"Duelo de referência: 44,8/100 (perfil físico). Gen 3: UU; set \"Staller\" com 1/4 golpes por nível (faltam Toxic / Hidden Power Grass, Fire Blast / Flamethrower, Rest).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "335": {"id":335,"name":"Zangoose","types":["normal"],"stats":{"hp":73,"atk":115,"def":60,"spa":60,"spd":60,"spe":90},"pve":{"tier":"S","score":100,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Swords Dance","Strength","Crush Claw"],"note":"Dano estimado por segundo na caça: 239,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":53.8,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Careful","Impish","Relaxed"],"moves":["Slash","Leer","Crush Claw","Swords Dance"],"note":"Duelo de referência: 53,7/100 (perfil físico). Gen 3: UUBL; set \"Swords Dance\" com 2/4 golpes por nível (faltam Return, Shadow Ball).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "336": {"id":336,"name":"Seviper","types":["poison"],"stats":{"hp":73,"atk":100,"def":60,"spa":100,"spd":60,"spe":65},"pve":{"tier":"C","score":31.6,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Poison Tail","Crunch","Poison Fang","Bite"],"note":"Dano estimado por segundo na caça: 75,8."},"pvp":{"tier":"C","score":39,"role":"physical","priority":["atk","hp","spe","def"],"natures":["Adamant","Jolly","Careful"],"moves":["Poison Tail","Screech","Crunch","Glare"],"note":"Duelo de referência: 42,6/100 (perfil físico). Gen 3: PU; set \"Mixed Breaker\" com 2/4 golpes por nível (faltam Sludge Bomb, Earthquake).","smogon":{"tier":"PU","covered":2,"slots":4}}},
      "337": {"id":337,"name":"Lunatone","types":["rock","psychic"],"stats":{"hp":70,"atk":55,"def":65,"spa":95,"spd":85,"spe":70},"pve":{"tier":"D","score":29.4,"role":"mixed","priority":["spa","atk","spe"],"natures":["Quiet","Brave","Relaxed"],"moves":["Psychic","Confusion","Tackle","Rock Throw"],"note":"Dano estimado por segundo na caça: 70,5. Usa dano físico e especial."},"pvp":{"tier":"C","score":32.8,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Psychic","Confusion","Cosmic Power","Rock Throw"],"note":"Duelo de referência: 27,5/100 (perfil especial). Gen 3: UU; set \"Calm Mind + Baton Pass\" com 2/4 golpes por nível (faltam Baton Pass, Calm Mind).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "338": {"id":338,"name":"Solrock","types":["rock","psychic"],"stats":{"hp":70,"atk":95,"def":85,"spa":55,"spd":65,"spe":70},"pve":{"tier":"C","score":31.9,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Tackle","Rock Slide","Rock Throw","SolarBeam"],"note":"Dano estimado por segundo na caça: 76,4. Usa dano físico e especial."},"pvp":{"tier":"C","score":31.8,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Gentle","Sassy"],"moves":["Tackle","Rock Throw","Rock Slide","Confusion"],"note":"Duelo de referência: 26,1/100 (perfil físico). Gen 3: UU; set \"Reflect\" com 2/4 golpes por nível (faltam Reflect, Earthquake).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "340": {"id":340,"name":"Whiscash","types":["water","ground"],"stats":{"hp":110,"atk":78,"def":73,"spa":76,"spd":71,"spe":60},"pve":{"tier":"B","score":50.2,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Surf","Earthquake","Water Gun","Waterfall"],"note":"Dano estimado por segundo na caça: 120,4. Usa dano físico e especial."},"pvp":{"tier":"S","score":69,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Gentle"],"moves":["Tickle","Waterfall","Earthquake","Rest"],"note":"Duelo de referência: 82,1/100 (perfil físico). Gen 3: NU; set \"Defensive\" com 2/4 golpes por nível (faltam Ice Beam, Protect / Sleep Talk).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "342": {"id":342,"name":"Crawdaunt","types":["water","dark"],"stats":{"hp":63,"atk":120,"def":85,"spa":90,"spd":55,"spe":55},"pve":{"tier":"S","score":78.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["ViceGrip","Swords Dance","Waterfall","Crabhammer"],"note":"Dano estimado por segundo na caça: 187,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":54.7,"role":"physical","priority":["atk","spe"],"natures":["Jolly","Hasty","Naive"],"moves":["Waterfall","Crabhammer","Swords Dance","Protect"],"note":"Duelo de referência: 64,1/100 (perfil físico). Gen 3: NU; set \"Special Attacker\" com 2/4 golpes por nível (faltam Crunch, Ice Beam).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "344": {"id":344,"name":"Claydol","types":["ground","psychic"],"stats":{"hp":60,"atk":70,"def":105,"spa":70,"spd":120,"spe":75},"pve":{"tier":"C","score":30,"role":"special","priority":["spa","spe"],"natures":["Mild","Rash","Modest"],"moves":["Psybeam","AncientPower","Rapid Spin","Confusion"],"note":"Dano estimado por segundo na caça: 72."},"pvp":{"tier":"C","score":39.4,"role":"special","priority":["spa","hp","def","spd"],"natures":["Quiet","Relaxed","Sassy"],"moves":["Psybeam","AncientPower","Confusion","Cosmic Power"],"note":"Duelo de referência: 32,5/100 (perfil especial). Gen 3: OU; set \"Utility\" com 2/4 golpes por nível (faltam Earthquake, Psychic).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "346": {"id":346,"name":"Cradily","types":["rock","grass"],"stats":{"hp":86,"atk":81,"def":97,"spa":81,"spd":107,"spe":43},"pve":{"tier":"D","score":23.3,"role":"mixed","priority":["spa","atk","spe"],"natures":["Brave","Quiet","Hasty"],"moves":["Acid","Strength","AncientPower","Astonish"],"note":"Dano estimado por segundo na caça: 55,8. Usa dano físico e especial."},"pvp":{"tier":"C","score":33.5,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Brave","Naughty","Lax"],"moves":["Strength","Rock Smash","AncientPower","Amnesia"],"note":"Duelo de referência: 32,9/100 (perfil misto). Gen 3: UU; set \"Staller\" com 1/4 golpes por nível (faltam Barrier, Toxic, Rest).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "348": {"id":348,"name":"Armaldo","types":["rock","bug"],"stats":{"hp":75,"atk":125,"def":100,"spa":70,"spd":80,"spe":45},"pve":{"tier":"C","score":38,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Slash","Strength","Rock Blast","AncientPower"],"note":"Dano estimado por segundo na caça: 91."},"pvp":{"tier":"C","score":41.8,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Naughty","Adamant"],"moves":["Protect","Strength","Rock Blast","AncientPower"],"note":"Duelo de referência: 43,1/100 (perfil físico). Gen 3: UUBL; set \"Rapid Spin\" com 1/4 golpes por nível (faltam Hidden Power Bug / Earthquake, Rapid Spin, Swords Dance / Rest).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "350": {"id":350,"name":"Milotic","types":["water"],"stats":{"hp":95,"atk":60,"def":79,"spa":100,"spd":125,"spe":81},"pve":{"tier":"A","score":68,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Surf","Water Pulse","Water Gun","Rain Dance"],"note":"Dano estimado por segundo na caça: 162,9, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":74.9,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Relaxed","Calm"],"moves":["Surf","Water Pulse","Rain Dance","Recover"],"note":"Duelo de referência: 75,7/100 (perfil especial). Gen 3: OU; set \"Standard\" com 3/4 golpes por nível (faltam Toxic).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "351": {"id":351,"name":"Castform","types":["normal"],"stats":{"hp":70,"atk":70,"def":70,"spa":70,"spd":70,"spe":70},"pve":{"tier":"D","score":21.8,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Powder Snow","Rain Dance","Water Gun","Weather Ball"],"note":"Dano estimado por segundo na caça: 52,2, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":19.9,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Tackle","Weather Ball","Ember","Water Gun"],"note":"Duelo de referência: 17,3/100 (perfil físico). Gen 3: ZU; set \"Sunny Day\" com 2/4 golpes por nível (faltam Thunderbolt / Ice Beam, Solar Beam).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "352": {"id":352,"name":"Kecleon","types":["normal"],"stats":{"hp":60,"atk":90,"def":70,"spa":60,"spd":120,"spe":40},"pve":{"tier":"C","score":32.9,"role":"physical","priority":["atk","spe"],"natures":["Brave","Lonely","Naughty"],"moves":["Slash","AncientPower","Scratch","Strength"],"note":"Dano estimado por segundo na caça: 78,9."},"pvp":{"tier":"D","score":27.6,"role":"physical","priority":["atk","spe"],"natures":["Brave","Sassy","Quiet"],"moves":["Slash","Strength","Faint Attack","Screech"],"note":"Duelo de referência: 32/100 (perfil físico). Gen 3: NU; set \"Choice Band\" com 0/4 golpes por nível (faltam Return, Shadow Ball, Focus Punch / Brick Break, Trick).","smogon":{"tier":"NU","covered":0,"slots":4}}},
      "354": {"id":354,"name":"Banette","types":["ghost"],"stats":{"hp":64,"atk":115,"def":65,"spa":83,"spd":63,"spe":65},"pve":{"tier":"C","score":30.5,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Shadow Ball","Faint Attack","Curse","Knock Off"],"note":"Dano estimado por segundo na caça: 73,1, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":39.7,"role":"special","priority":["spa","hp","def"],"natures":["Lax","Bold","Rash"],"moves":["Shadow Ball","Faint Attack","Night Shade","Will-O-Wisp"],"note":"Duelo de referência: 37,3/100 (perfil especial). Gen 3: RU; set \"Support\" com 3/4 golpes por nível (faltam Hidden Power Fighting).","smogon":{"tier":"RU","covered":3,"slots":4}}},
      "356": {"id":356,"name":"Dusclops","types":["ghost"],"stats":{"hp":40,"atk":70,"def":130,"spa":60,"spd":130,"spe":25},"pve":{"tier":"D","score":21.7,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Shadow Punch","Curse","Pursuit","Astonish"],"note":"Dano estimado por segundo na caça: 52, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":34.4,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Lax","Gentle","Lonely"],"moves":["Shadow Punch","Night Shade","Confuse Ray","Pursuit"],"note":"Duelo de referência: 29,1/100 (perfil misto). Gen 3: UUBL; set \"Staller\" com 2/4 golpes por nível (faltam Focus Punch / Seismic Toss, Pain Split / Rest).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "357": {"id":357,"name":"Tropius","types":["grass","flying"],"stats":{"hp":99,"atk":68,"def":83,"spa":72,"spd":87,"spe":51},"pve":{"tier":"B","score":51.8,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Razor Leaf","SolarBeam","Gust","Growth"],"note":"Dano estimado por segundo na caça: 124,1, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":31.4,"role":"special","priority":["spa","hp","def","spe"],"natures":["Bold","Relaxed","Mild"],"moves":["Magical Leaf","Body Slam","SolarBeam","Synthesis"],"note":"Duelo de referência: 35,6/100 (perfil especial). Gen 3: ZU; set \"Bulky Disruptor\" com 2/4 golpes por nível (faltam Hidden Power Grass, Leech Seed).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "358": {"id":358,"name":"Chimecho","types":["psychic"],"stats":{"hp":65,"atk":50,"def":70,"spa":95,"spd":80,"spe":65},"pve":{"tier":"C","score":40.3,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Quiet"],"moves":["Psychic","Double-Edge","Confusion","Uproar"],"note":"Dano estimado por segundo na caça: 96,5. Usa dano físico e especial."},"pvp":{"tier":"C","score":31.7,"role":"special","priority":["spa","atk","hp","def"],"natures":["Brave","Lonely","Rash"],"moves":["Psychic","Double-Edge","Confusion","Uproar"],"note":"Duelo de referência: 28,1/100 (perfil especial). Gen 3: NU; set \"Defensive Support\" com 3/4 golpes por nível (faltam Reflect / Light Screen).","smogon":{"tier":"NU","covered":3,"slots":4}}},
      "359": {"id":359,"name":"Absol","types":["dark"],"stats":{"hp":65,"atk":130,"def":60,"spa":75,"spd":60,"spe":75},"pve":{"tier":"S","score":87.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Brave","Lonely"],"moves":["Bite","Quick Attack","Swords Dance","Slash"],"note":"Dano estimado por segundo na caça: 209,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":50,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Bite","Swords Dance","Slash","Leer"],"note":"Duelo de referência: 55/100 (perfil físico). Gen 3: RU; set \"Swords Dance + Baton Pass\" com 2/4 golpes por nível (faltam Shadow Ball / Substitute, Baton Pass).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "362": {"id":362,"name":"Glalie","types":["ice"],"stats":{"hp":80,"atk":80,"def":80,"spa":80,"spd":80,"spe":80},"pve":{"tier":"C","score":41.6,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Quiet"],"moves":["Powder Snow","Ice Beam","Crunch","Blizzard"],"note":"Dano estimado por segundo na caça: 99,7. Usa dano físico e especial."},"pvp":{"tier":"C","score":36.2,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Rash","Mild","Quiet"],"moves":["Double Team","Ice Beam","Bite","Blizzard"],"note":"Duelo de referência: 41,7/100 (perfil misto). Gen 3: NUBL; set \"Spikes\" com 0/4 golpes por nível (faltam Spikes, Explosion, Earthquake, Hidden Power Grass).","smogon":{"tier":"NUBL","covered":0,"slots":4}}},
      "365": {"id":365,"name":"Walrein","types":["ice","water"],"stats":{"hp":110,"atk":80,"def":90,"spa":95,"spd":90,"spe":65},"pve":{"tier":"A","score":58.2,"role":"special","priority":["spa","spe"],"natures":["Mild","Rash","Modest"],"moves":["Surf","Aurora Beam","Water Gun","Blizzard"],"note":"Dano estimado por segundo na caça: 139,6."},"pvp":{"tier":"S","score":69.3,"role":"special","priority":["spa","hp","def","spd"],"natures":["Relaxed","Sassy","Quiet"],"moves":["Surf","Rest","Body Slam","Blizzard"],"note":"Duelo de referência: 73,6/100 (perfil especial). Gen 3: UU; set \"Standard\" com 3/4 golpes por nível (faltam Ice Beam).","smogon":{"tier":"UU","covered":3,"slots":4}}},
      "367": {"id":367,"name":"Huntail","types":["water"],"stats":{"hp":55,"atk":104,"def":105,"spa":94,"spd":75,"spe":52},"pve":{"tier":"A","score":60.4,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Lonely"],"moves":["Surf","Water Pulse","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 144,7. Usa dano físico e especial."},"pvp":{"tier":"B","score":45.1,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Brave","Naughty","Lax"],"moves":["Surf","Waterfall","Iron Defense","Water Pulse"],"note":"Duelo de referência: 50,3/100 (perfil misto). Gen 3: NU; set \"Baton Pass\" com 2/4 golpes por nível (faltam Substitute, Barrier).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "368": {"id":368,"name":"Gorebyss","types":["water"],"stats":{"hp":55,"atk":84,"def":105,"spa":114,"spd":75,"spe":52},"pve":{"tier":"A","score":67.5,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Pulse","Water Gun","Hydro Pump"],"note":"Dano estimado por segundo na caça: 161,9."},"pvp":{"tier":"A","score":60.5,"role":"special","priority":["spa","hp","def","spd"],"natures":["Modest","Quiet","Mild"],"moves":["Surf","Water Pulse","Amnesia","Psychic"],"note":"Duelo de referência: 59,3/100 (perfil especial). Gen 3: UU; set \"Baton Pass\" com 4/4 golpes por nível.","smogon":{"tier":"UU","covered":4,"slots":4}}},
      "369": {"id":369,"name":"Relicanth","types":["water","rock"],"stats":{"hp":100,"atk":90,"def":130,"spa":45,"spd":65,"spe":55},"pve":{"tier":"C","score":43.1,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Double-Edge","Surf","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 103,4. Usa dano físico e especial."},"pvp":{"tier":"B","score":43.3,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Brave","Impish"],"moves":["Double-Edge","Waterfall","Yawn","Rock Tomb"],"note":"Duelo de referência: 50,5/100 (perfil físico). Gen 3: NU; set \"Physical Wall\" com 1/4 golpes por nível (faltam Rock Slide / Hidden Power Rock, Earthquake, Protect / Sleep Talk).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "370": {"id":370,"name":"Luvdisc","types":["water"],"stats":{"hp":43,"atk":30,"def":55,"spa":40,"spd":65,"spe":97},"pve":{"tier":"D","score":28.2,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Surf","Water Gun","Take Down","Waterfall"],"note":"Dano estimado por segundo na caça: 67,7. Usa dano físico e especial."},"pvp":{"tier":"D","score":18.2,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Quiet","Rash"],"moves":["Surf","Take Down","Water Gun","Sweet Kiss"],"note":"Duelo de referência: 20,4/100 (perfil misto). Gen 3: ZU; set \"Rain Dance \"Sweeper\"\" com 1/4 golpes por nível (faltam Rain Dance, Ice Beam / Blizzard, Hidden Power Grass).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "373": {"id":373,"name":"Salamence","types":["dragon","flying"],"stats":{"hp":95,"atk":135,"def":80,"spa":110,"spd":80,"spe":100},"pve":{"tier":"A","score":74,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Dragon Claw","Double-Edge","DragonBreath","Fly"],"note":"Dano estimado por segundo na caça: 177,3. Usa dano físico e especial."},"pvp":{"tier":"S","score":65.7,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Jolly","Hasty","Naive"],"moves":["Dragon Claw","Double-Edge","Protect","Crunch"],"note":"Duelo de referência: 72,3/100 (perfil físico). Gen 3: OU; set \"Wish Support\" com 1/4 golpes por nível (faltam Flamethrower, Toxic, Wish).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "376": {"id":376,"name":"Metagross","types":["steel","psychic"],"stats":{"hp":80,"atk":135,"def":130,"spa":95,"spd":90,"spe":70},"pve":{"tier":"A","score":70.5,"role":"mixed","priority":["atk","spa","spe"],"natures":["Brave","Lonely","Naughty"],"moves":["Metal Claw","Meteor Mash","Psychic","Agility"],"note":"Dano estimado por segundo na caça: 169, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"S","score":68.2,"role":"mixed","priority":["atk","spa","hp","spd"],"natures":["Sassy","Gentle","Relaxed"],"moves":["Psychic","Meteor Mash","Scary Face","Iron Defense"],"note":"Duelo de referência: 70,4/100 (perfil misto). Gen 3: OU; set \"Tank\" com 2/4 golpes por nível (faltam Earthquake, Explosion).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "377": {"id":377,"name":"Regirock","types":["rock"],"stats":{"hp":80,"atk":100,"def":200,"spa":50,"spd":100,"spe":50},"pve":{"tier":"D","score":29.7,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Strength","Rock Throw","Curse","AncientPower"],"note":"Dano estimado por segundo na caça: 71,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":52.4,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Lonely","Impish"],"moves":["Strength","Rock Throw","Curse","Superpower"],"note":"Duelo de referência: 52,5/100 (perfil físico). Gen 3: UUBL; set \"Curse\" com 2/4 golpes por nível (faltam Rock Slide / Hidden Power Rock, Earthquake).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "378": {"id":378,"name":"Regice","types":["ice"],"stats":{"hp":80,"atk":50,"def":100,"spa":100,"spd":200,"spe":50},"pve":{"tier":"C","score":33.5,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Icy Wind","Hyper Beam","Strength","AncientPower"],"note":"Dano estimado por segundo na caça: 80,2."},"pvp":{"tier":"B","score":45.6,"role":"special","priority":["spa","spe","hp","spd"],"natures":["Naive","Modest","Rash"],"moves":["Icy Wind","Amnesia","Superpower","Zap Cannon"],"note":"Duelo de referência: 53,2/100 (perfil especial). Gen 3: (OU); set \"Offensive\" com 1/4 golpes por nível (faltam Ice Beam, Thunderbolt / Thunder, Thunder Wave / Hidden Power Fire).","smogon":{"tier":"(OU)","covered":1,"slots":4}}},
      "379": {"id":379,"name":"Registeel","types":["steel"],"stats":{"hp":80,"atk":75,"def":150,"spa":75,"spd":150,"spe":50},"pve":{"tier":"C","score":30.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Strength","Curse","Superpower"],"note":"Dano estimado por segundo na caça: 72,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":63,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Careful","Lax"],"moves":["Metal Claw","Amnesia","Curse","Hyper Beam"],"note":"Duelo de referência: 65/100 (perfil físico). Gen 3: OU; set \"Defensive Setup\" com 2/4 golpes por nível (faltam Seismic Toss, Protect / Rest).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "380": {"id":380,"name":"Latias","types":["dragon","psychic"],"stats":{"hp":80,"atk":80,"def":90,"spa":110,"spd":130,"spe":110},"pve":{"tier":"A","score":59.9,"role":"special","priority":["spa","spe"],"natures":["Hasty","Naive","Timid"],"moves":["DragonBreath","Psychic","Surf","Mist Ball"],"note":"Dano estimado por segundo na caça: 143,6."},"pvp":{"tier":"S","score":73.4,"role":"special","priority":["spa","spe","def","hp"],"natures":["Modest","Quiet","Timid"],"moves":["DragonBreath","Wish","Surf","Mist Ball"],"note":"Duelo de referência: 74,9/100 (perfil especial). Gen 3: Uber; set \"BoltBeam\" com 2/4 golpes por nível (faltam Thunder, Ice Beam).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "381": {"id":381,"name":"Latios","types":["dragon","psychic"],"stats":{"hp":80,"atk":90,"def":80,"spa":130,"spd":110,"spe":110},"pve":{"tier":"A","score":70.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["DragonBreath","Psychic","Surf","Dragon Dance"],"note":"Dano estimado por segundo na caça: 168,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":74.6,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Relaxed","Calm"],"moves":["DragonBreath","Recover","Surf","Luster Purge"],"note":"Duelo de referência: 76,6/100 (perfil especial). Gen 3: Uber; set \"Offensive Utility\" com 2/4 golpes por nível (faltam Thunder / Thunderbolt, Ice Beam / Dragon Claw).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "382": {"id":382,"name":"Kyogre","types":["water"],"stats":{"hp":100,"atk":100,"def":90,"spa":150,"spd":140,"spe":90},"pve":{"tier":"S","score":115.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Pulse","Ice Beam","Calm Mind"],"note":"Dano estimado por segundo na caça: 277,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":85.8,"role":"special","priority":["spa","hp","def"],"natures":["Bold","Relaxed","Calm"],"moves":["Surf","Calm Mind","Ice Beam","Hydro Pump"],"note":"Duelo de referência: 86,1/100 (perfil especial). Gen 3: Uber; set \"Substitute + Calm Mind\" com 3/4 golpes por nível (faltam Substitute).","smogon":{"tier":"Uber","covered":3,"slots":4}}},
      "383": {"id":383,"name":"Groudon","types":["ground"],"stats":{"hp":100,"atk":150,"def":140,"spa":100,"spd":90,"spe":90},"pve":{"tier":"S","score":85.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Earthquake","Slash","Bulk Up","Strength"],"note":"Dano estimado por segundo na caça: 204,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":80.7,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Sassy","Impish"],"moves":["Slash","Bulk Up","Earthquake","SolarBeam"],"note":"Duelo de referência: 85,3/100 (perfil físico). Gen 3: Uber; set \"RestTalk\" com 2/4 golpes por nível (faltam Sleep Talk, Hidden Power Ghost / Toxic / Roar).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "384": {"id":384,"name":"Rayquaza","types":["dragon","flying"],"stats":{"hp":105,"atk":150,"def":90,"spa":150,"spd":90,"spe":95},"pve":{"tier":"S","score":135.6,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Outrage","Dragon Claw","Dragon Dance","Hyper Beam"],"note":"Dano estimado por segundo na caça: 325, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":91,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Careful"],"moves":["Outrage","Hyper Beam","Fly","Dragon Claw"],"note":"Duelo de referência: 100/100 (perfil físico). Gen 3: Uber; set \"Dragon Dance\" com 2/4 golpes por nível (faltam Hidden Power Ghost / Hidden Power Bug, Earthquake).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "385": {"id":385,"name":"Jirachi","types":["steel","psychic"],"stats":{"hp":100,"atk":100,"def":100,"spa":100,"spd":100,"spe":100},"pve":{"tier":"B","score":52,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Lonely"],"moves":["Psychic","Double-Edge","Swift","Confusion"],"note":"Dano estimado por segundo na caça: 124,6. Usa dano físico e especial."},"pvp":{"tier":"S","score":73.2,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Naive","Hasty","Gentle"],"moves":["Double-Edge","Psychic","Rest","Confusion"],"note":"Duelo de referência: 77,2/100 (perfil misto). Gen 3: OU; set \"Wish + Calm Mind\" com 2/4 golpes por nível (faltam Calm Mind, Thunder / Thunderbolt / Fire Punch).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "386": {"id":386,"name":"Deoxys","types":["psychic"],"stats":{"hp":50,"atk":150,"def":50,"spa":150,"spd":50,"spe":150},"pve":{"tier":"A","score":68.1,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Lonely"],"moves":["Psychic","ExtremeSpeed","Strength","Swift"],"note":"Dano estimado por segundo na caça: 163,2. Usa dano físico e especial."},"pvp":{"tier":"B","score":51.9,"role":"special","priority":["spa","hp","def","spd"],"natures":["Relaxed","Sassy","Bold"],"moves":["ExtremeSpeed","Psychic","Night Shade","Psycho Boost"],"note":"Duelo de referência: 50,8/100 (perfil especial). Gen 3: Uber; set \"Choice Band\" com 1/4 golpes por nível (faltam Superpower, Shadow Ball, Fire Punch / Thunder / Ice Beam).","smogon":{"tier":"Uber","covered":1,"slots":4}}},
      "3-mega": {"id":"3-mega","name":"Mega Venusaur","types":["grass","poison"],"stats":{"hp":80,"atk":100,"def":123,"spa":122,"spd":120,"spe":80},"pve":{"tier":"S","score":92,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Quiet","Rash"],"moves":["SolarBeam","Razor Leaf","Sludge Bomb","Growth"],"note":"Dano estimado por segundo na caça: 220,6, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"S","score":79.5,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Bold","Modest"],"moves":["SolarBeam","Growth","Sludge Bomb","Razor Leaf"],"note":"Duelo de referência: 81,5/100 (perfil especial). Gen 3: UUBL; set \"Disabler\" com 4/4 golpes por nível.","smogon":{"tier":"UUBL","covered":4,"slots":4}},"baseId":3,"isMega":true},
      "6-mega-x": {"id":"6-mega-x","name":"Mega Charizard X","types":["fire","dragon"],"stats":{"hp":78,"atk":130,"def":111,"spa":130,"spd":85,"spe":100},"pve":{"tier":"A","score":63.7,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Flamethrower","Ember","Slash","Wing Attack"],"note":"Dano estimado por segundo na caça: 152,8. Usa dano físico e especial."},"pvp":{"tier":"A","score":56.1,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Sassy","Bold"],"moves":["Ember","Scratch","Flamethrower","Smokescreen"],"note":"Duelo de referência: 66,1/100 (perfil especial). Gen 3: OU; set \"Mixed Attacker\" com 0/4 golpes por nível (faltam Fire Blast, Hidden Power Grass, Substitute / Dragon Claw, Focus Punch / Beat Up).","smogon":{"tier":"OU","covered":0,"slots":4}},"baseId":6,"isMega":true},
      "6-mega-y": {"id":"6-mega-y","name":"Mega Charizard Y","types":["fire","flying"],"stats":{"hp":78,"atk":104,"def":78,"spa":159,"spd":115,"spe":100},"pve":{"tier":"A","score":73.8,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Hasty"],"moves":["Flamethrower","Ember","Slash","Fly"],"note":"Dano estimado por segundo na caça: 176,8. Usa dano físico e especial."},"pvp":{"tier":"A","score":56.9,"role":"special","priority":["spa","hp","def","spd"],"natures":["Modest","Relaxed","Sassy"],"moves":["Ember","Flamethrower","Growl","Scary Face"],"note":"Duelo de referência: 67,3/100 (perfil especial). Gen 3: OU; set \"Mixed Attacker\" com 0/4 golpes por nível (faltam Fire Blast, Hidden Power Grass, Substitute / Dragon Claw, Focus Punch / Beat Up).","smogon":{"tier":"OU","covered":0,"slots":4}},"baseId":6,"isMega":true},
      "9-mega": {"id":"9-mega","name":"Mega Blastoise","types":["water"],"stats":{"hp":79,"atk":103,"def":120,"spa":135,"spd":115,"spe":78},"pve":{"tier":"S","score":78.7,"role":"special","priority":["spa"],"natures":["Mild","Quiet","Rash"],"moves":["Surf","Water Gun","Rain Dance","Hydro Pump"],"note":"Dano estimado por segundo na caça: 188,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":75.3,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Sassy","Bold"],"moves":["Surf","Protect","Rain Dance","Hydro Pump"],"note":"Duelo de referência: 87/100 (perfil especial). Gen 3: UU; set \"Standard\" com 2/4 golpes por nível (faltam Ice Beam, Rest).","smogon":{"tier":"UU","covered":2,"slots":4}},"baseId":9,"isMega":true},
      "15-mega": {"id":"15-mega","name":"Mega Beedrill","types":["bug","poison"],"stats":{"hp":65,"atk":150,"def":40,"spa":15,"spd":80,"spe":145},"pve":{"tier":"B","score":57.6,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Twineedle","Cut","Pin Missile","Agility"],"note":"Dano estimado por segundo na caça: 138,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":33.8,"role":"physical","priority":["atk"],"natures":["Adamant","Naughty","Careful"],"moves":["Twineedle","Pursuit","Fury Attack","Pin Missile"],"note":"Duelo de referência: 40,4/100 (perfil físico). Gen 3: ZU; set \"Choice Band\" com 1/4 golpes por nível (faltam Sludge Bomb, Hidden Power Bug / Hidden Power Rock, Brick Break).","smogon":{"tier":"ZU","covered":1,"slots":4}},"baseId":15,"isMega":true},
      "18-mega": {"id":"18-mega","name":"Mega Pidgeot","types":["normal","flying"],"stats":{"hp":83,"atk":80,"def":80,"spa":135,"spd":80,"spe":121},"pve":{"tier":"A","score":59.2,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Lonely"],"moves":["Gust","Quick Attack","Tackle","Agility"],"note":"Dano estimado por segundo na caça: 141,8, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":46.9,"role":"mixed","priority":["spa","atk","spe"],"natures":["Hasty","Brave","Lonely"],"moves":["Gust","Quick Attack","Tackle","FeatherDance"],"note":"Duelo de referência: 55,2/100 (perfil misto). Gen 3: NU; set \"All-out Attacker\" com 1/4 golpes por nível (faltam Double-Edge, Aerial Ace / Hidden Power Flying, Hidden Power Ground / Return / Toxic / Facade).","smogon":{"tier":"NU","covered":1,"slots":4}},"baseId":18,"isMega":true},
      "65-mega": {"id":"65-mega","name":"Mega Alakazam","types":["psychic"],"stats":{"hp":55,"atk":50,"def":65,"spa":175,"spd":105,"spe":150},"pve":{"tier":"S","score":121.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psybeam","Psychic","Confusion","Calm Mind"],"note":"Dano estimado por segundo na caça: 291,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":71.4,"role":"special","priority":["spa","hp","def"],"natures":["Modest","Rash","Mild"],"moves":["Psybeam","Psychic","Confusion","Calm Mind"],"note":"Duelo de referência: 72,9/100 (perfil especial). Gen 3: UUBL; set \"Calm Mind Sweeper\" com 3/4 golpes por nível (faltam Fire Punch).","smogon":{"tier":"UUBL","covered":3,"slots":4}},"baseId":65,"isMega":true},
      "80-mega": {"id":"80-mega","name":"Mega Slowbro","types":["water","psychic"],"stats":{"hp":95,"atk":75,"def":180,"spa":130,"spd":80,"spe":30},"pve":{"tier":"A","score":63.7,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Psychic","Water Gun","Confusion"],"note":"Dano estimado por segundo na caça: 152,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":67.1,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Sassy","Modest"],"moves":["Surf","Psychic","Amnesia","Growl"],"note":"Duelo de referência: 74,3/100 (perfil especial). Gen 3: UUBL; set \"Defensive\" com 2/4 golpes por nível (faltam Rest, Calm Mind / Thunder Wave).","smogon":{"tier":"UUBL","covered":2,"slots":4}},"baseId":80,"isMega":true},
      "94-mega": {"id":"94-mega","name":"Mega Gengar","types":["ghost","poison"],"stats":{"hp":60,"atk":65,"def":80,"spa":170,"spd":95,"spe":130},"pve":{"tier":"B","score":53.9,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Lonely"],"moves":["Shadow Ball","Shadow Punch","Strength","Lick"],"note":"Dano estimado por segundo na caça: 129,3. Usa dano físico e especial."},"pvp":{"tier":"S","score":73.6,"role":"special","priority":["spa","hp","def","spd"],"natures":["Modest","Calm","Bold"],"moves":["Shadow Ball","Night Shade","Shadow Punch","Confuse Ray"],"note":"Duelo de referência: 72,3/100 (perfil especial). Gen 3: OU; set \"Utility\" com 3/4 golpes por nível (faltam Ice Punch / Taunt / Explosion / Focus Punch).","smogon":{"tier":"OU","covered":3,"slots":4}},"baseId":94,"isMega":true},
      "115-mega": {"id":"115-mega","name":"Mega Kangaskhan","types":["normal"],"stats":{"hp":105,"atk":125,"def":100,"spa":60,"spd":100,"spe":100},"pve":{"tier":"A","score":64.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Mega Punch","Strength","Dizzy Punch","Comet Punch"],"note":"Dano estimado por segundo na caça: 154,1."},"pvp":{"tier":"S","score":67.2,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Careful","Impish","Relaxed"],"moves":["Mega Punch","Strength","Dizzy Punch","Bite"],"note":"Duelo de referência: 74,7/100 (perfil físico). Gen 3: UU; set \"Reversal\" com 2/4 golpes por nível (faltam Return, Shadow Ball).","smogon":{"tier":"UU","covered":2,"slots":4}},"baseId":115,"isMega":true},
      "127-mega": {"id":"127-mega","name":"Mega Pinsir","types":["bug","flying"],"stats":{"hp":65,"atk":155,"def":120,"spa":65,"spd":90,"spe":105},"pve":{"tier":"S","score":102.2,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["ViceGrip","Swords Dance","Brick Break","Strength"],"note":"Dano estimado por segundo na caça: 244,9, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":53.7,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Adamant","Brave","Lonely"],"moves":["Swords Dance","Brick Break","Seismic Toss","ViceGrip"],"note":"Duelo de referência: 60,5/100 (perfil físico). Gen 3: UU; set \"Swords Dance\" com 1/4 golpes por nível (faltam Earthquake, Hidden Power Bug, Rock Slide).","smogon":{"tier":"UU","covered":1,"slots":4}},"baseId":127,"isMega":true},
      "130-mega": {"id":"130-mega","name":"Mega Gyarados","types":["water","dark"],"stats":{"hp":95,"atk":155,"def":109,"spa":70,"spd":130,"spe":81},"pve":{"tier":"S","score":102,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Waterfall","Rain Dance","Dragon Dance"],"note":"Dano estimado por segundo na caça: 244,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":79.2,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Thrash","Leer","Bite","Hydro Pump"],"note":"Duelo de referência: 92,2/100 (perfil físico). Gen 3: OU; set \"Standard\" com 1/4 golpes por nível (faltam Hidden Power Flying / Hidden Power Rock, Earthquake, Double-Edge / Taunt / Thunder Wave).","smogon":{"tier":"OU","covered":1,"slots":4}},"baseId":130,"isMega":true},
      "142-mega": {"id":"142-mega","name":"Mega Aerodactyl","types":["rock","flying"],"stats":{"hp":80,"atk":135,"def":85,"spa":70,"spd":95,"spe":150},"pve":{"tier":"A","score":64.3,"role":"physical","priority":["atk","spe"],"natures":["Lonely","Naughty","Adamant"],"moves":["Wing Attack","Bite","Take Down","AncientPower"],"note":"Dano estimado por segundo na caça: 154,2."},"pvp":{"tier":"A","score":63.4,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Careful","Adamant"],"moves":["Wing Attack","Bite","AncientPower","Hyper Beam"],"note":"Duelo de referência: 69,3/100 (perfil físico). Gen 3: OU; set \"Choice Band\" com 1/4 golpes por nível (faltam Earthquake, Hidden Power Rock, Double-Edge).","smogon":{"tier":"OU","covered":1,"slots":4}},"baseId":142,"isMega":true},
      "181-mega": {"id":"181-mega","name":"Mega Ampharos","types":["electric","dragon"],"stats":{"hp":90,"atk":95,"def":105,"spa":165,"spd":110,"spe":45},"pve":{"tier":"B","score":49.3,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Quiet"],"moves":["ThunderShock","Thunder","ThunderPunch","Tackle"],"note":"Dano estimado por segundo na caça: 118,2. Usa dano físico e especial."},"pvp":{"tier":"A","score":60.4,"role":"special","priority":["spa","spe","hp"],"natures":["Modest","Rash","Mild"],"moves":["ThunderShock","Thunder","Growl","Light Screen"],"note":"Duelo de referência: 66,2/100 (perfil especial). Gen 3: UU; set \"Focus Punch\" com 2/4 golpes por nível (faltam Focus Punch, Thunderbolt).","smogon":{"tier":"UU","covered":2,"slots":4}},"baseId":181,"isMega":true},
      "208-mega": {"id":"208-mega","name":"Mega Steelix","types":["steel","ground"],"stats":{"hp":75,"atk":125,"def":230,"spa":55,"spd":95,"spe":30},"pve":{"tier":"C","score":43.5,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Iron Tail","Double-Edge","Crunch","Slam"],"note":"Dano estimado por segundo na caça: 104,2."},"pvp":{"tier":"A","score":61.3,"role":"physical","priority":["atk","spe","hp"],"natures":["Adamant","Brave","Lonely"],"moves":["Iron Tail","Screech","Harden","Slam"],"note":"Duelo de referência: 66/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 2/4 golpes por nível (faltam Earthquake, Explosion).","smogon":{"tier":"UUBL","covered":2,"slots":4}},"baseId":208,"isMega":true},
      "212-mega": {"id":"212-mega","name":"Mega Scizor","types":["bug","steel"],"stats":{"hp":70,"atk":150,"def":140,"spa":65,"spd":100,"spe":75},"pve":{"tier":"S","score":115.8,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Quick Attack","Swords Dance","Wing Attack"],"note":"Dano estimado por segundo na caça: 277,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":69.1,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Swords Dance","Slash","Wing Attack","Metal Claw"],"note":"Duelo de referência: 76,8/100 (perfil físico). Gen 3: UUBL; set \"Swords Dance\" com 2/4 golpes por nível (faltam Silver Wind, Hidden Power Rock).","smogon":{"tier":"UUBL","covered":2,"slots":4}},"baseId":212,"isMega":true},
      "214-mega": {"id":"214-mega","name":"Mega Heracross","types":["bug","fighting"],"stats":{"hp":80,"atk":185,"def":115,"spa":40,"spd":105,"spe":75},"pve":{"tier":"A","score":73.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Brick Break","Take Down","Megahorn","Horn Attack"],"note":"Dano estimado por segundo na caça: 175,8."},"pvp":{"tier":"S","score":77,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Leer","Horn Attack","Megahorn","Brick Break"],"note":"Duelo de referência: 79,1/100 (perfil físico). Gen 3: OU; set \"Standard\" com 3/4 golpes por nível (faltam Rock Slide).","smogon":{"tier":"OU","covered":3,"slots":4}},"baseId":214,"isMega":true},
      "229-mega": {"id":"229-mega","name":"Mega Houndoom","types":["dark","fire"],"stats":{"hp":75,"atk":90,"def":90,"spa":140,"spd":90,"spe":115},"pve":{"tier":"S","score":75.8,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Flamethrower","Howl","Faint Attack","Crunch"],"note":"Dano estimado por segundo na caça: 181,6, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"A","score":63.4,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Sassy","Relaxed","Brave"],"moves":["Bite","Ember","Flamethrower","Crunch"],"note":"Duelo de referência: 67,8/100 (perfil misto). Gen 3: UUBL; set \"Pursuit\" com 2/4 golpes por nível (faltam Pursuit, Will-O-Wisp / Toxic).","smogon":{"tier":"UUBL","covered":2,"slots":4}},"baseId":229,"isMega":true},
      "248-mega": {"id":"248-mega","name":"Mega Tyranitar","types":["rock","dark"],"stats":{"hp":100,"atk":164,"def":150,"spa":95,"spd":120,"spe":71},"pve":{"tier":"S","score":82.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Thrash","Earthquake","Rock Slide","Crunch"],"note":"Dano estimado por segundo na caça: 196,8."},"pvp":{"tier":"S","score":77.6,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Adamant"],"moves":["Bite","Crunch","Rock Slide","Thrash"],"note":"Duelo de referência: 84,2/100 (perfil físico). Gen 3: OU; set \"Fast Dragon Dance\" com 2/4 golpes por nível (faltam Dragon Dance, Hidden Power Bug / Hidden Power Grass / Ice Beam).","smogon":{"tier":"OU","covered":2,"slots":4}},"baseId":248,"isMega":true},
      "254-mega": {"id":"254-mega","name":"Mega Sceptile","types":["grass","dragon"],"stats":{"hp":70,"atk":110,"def":75,"spa":145,"spd":85,"spe":145},"pve":{"tier":"B","score":49,"role":"physical","priority":["atk","spe"],"natures":["Brave","Lonely","Naughty"],"moves":["Leaf Blade","Quick Attack","Slam","Giga Drain"],"note":"Dano estimado por segundo na caça: 117,5."},"pvp":{"tier":"A","score":54.2,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Careful","Adamant"],"moves":["Leaf Blade","Screech","Detect","Slam"],"note":"Duelo de referência: 60,4/100 (perfil físico). Gen 3: UUBL; set \"SubSeed\" com 1/4 golpes por nível (faltam Leech Seed, Substitute, Hidden Power Ice / Hidden Power Fire).","smogon":{"tier":"UUBL","covered":1,"slots":4}},"baseId":254,"isMega":true},
      "257-mega": {"id":"257-mega","name":"Mega Blaziken","types":["fire","fighting"],"stats":{"hp":80,"atk":160,"def":80,"spa":130,"spd":80,"spe":100},"pve":{"tier":"S","score":100.8,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Double Kick","Flamethrower","Bulk Up","Blaze Kick"],"note":"Dano estimado por segundo na caça: 241,7, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"S","score":67.7,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Double Kick","Sky Uppercut","Bulk Up","Flamethrower"],"note":"Duelo de referência: 79,4/100 (perfil físico). Gen 3: UUBL; set \"Mixed Sweeper\" com 1/4 golpes por nível (faltam Swords Dance / Focus Punch, Rock Slide, Fire Blast / Overheat).","smogon":{"tier":"UUBL","covered":1,"slots":4}},"baseId":257,"isMega":true},
      "260-mega": {"id":"260-mega","name":"Mega Swampert","types":["water","ground"],"stats":{"hp":100,"atk":150,"def":110,"spa":95,"spd":110,"spe":70},"pve":{"tier":"S","score":77.3,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Brave"],"moves":["Earthquake","Surf","Muddy Water","Take Down"],"note":"Dano estimado por segundo na caça: 185,3. Usa dano físico e especial."},"pvp":{"tier":"S","score":85.6,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Protect","Waterfall","Mud Shot","Earthquake"],"note":"Duelo de referência: 92/100 (perfil físico). Gen 3: OU; set \"Standard Defensive\" com 3/4 golpes por nível (faltam Ice Beam).","smogon":{"tier":"OU","covered":3,"slots":4}},"baseId":260,"isMega":true},
      "282-mega": {"id":"282-mega","name":"Mega Gardevoir","types":["psychic"],"stats":{"hp":68,"atk":85,"def":65,"spa":165,"spd":135,"spe":100},"pve":{"tier":"A","score":64.5,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psychic","Confusion","Calm Mind"],"note":"Dano estimado por segundo na caça: 154,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":72.7,"role":"special","priority":["spa","hp","spe","spd"],"natures":["Timid","Calm","Sassy"],"moves":["Dream Eater","Psychic","Hypnosis","Calm Mind"],"note":"Duelo de referência: 76,2/100 (perfil especial). Gen 3: UUBL; set \"Trapper\" com 3/4 golpes por nível (faltam Mean Look).","smogon":{"tier":"UUBL","covered":3,"slots":4}},"baseId":282,"isMega":true},
      "302-mega": {"id":"302-mega","name":"Mega Sableye","types":["dark","ghost"],"stats":{"hp":50,"atk":85,"def":125,"spa":85,"spd":115,"spe":20},"pve":{"tier":"D","score":25.5,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Faint Attack","Shadow Ball","Fury Swipes","Astonish"],"note":"Dano estimado por segundo na caça: 61,2. Usa dano físico e especial."},"pvp":{"tier":"C","score":39.4,"role":"special","priority":["spa","hp","spd"],"natures":["Sassy","Calm","Timid"],"moves":["Shadow Ball","Night Shade","Detect","Faint Attack"],"note":"Duelo de referência: 43,4/100 (perfil especial). Gen 3: NU; set \"Wall\" com 2/4 golpes por nível (faltam Toxic, Recover).","smogon":{"tier":"NU","covered":2,"slots":4}},"baseId":302,"isMega":true},
      "303-mega": {"id":"303-mega","name":"Mega Mawile","types":["steel"],"stats":{"hp":50,"atk":105,"def":125,"spa":55,"spd":95,"spe":50},"pve":{"tier":"C","score":31.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["ViceGrip","Crunch","Bite","Faint Attack"],"note":"Dano estimado por segundo na caça: 75."},"pvp":{"tier":"C","score":37.8,"role":"physical","priority":["atk","hp","spe","spd"],"natures":["Jolly","Naive","Careful"],"moves":["Bite","Iron Defense","Crunch","Strength"],"note":"Duelo de referência: 46,2/100 (perfil físico). Gen 3: PU; set \"Defensive\" com 1/4 golpes por nível (faltam Seismic Toss / Hidden Power Steel, Toxic, Protect).","smogon":{"tier":"PU","covered":1,"slots":4}},"baseId":303,"isMega":true},
      "306-mega": {"id":"306-mega","name":"Mega Aggron","types":["steel"],"stats":{"hp":70,"atk":140,"def":230,"spa":60,"spd":80,"spe":50},"pve":{"tier":"A","score":58.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Iron Tail","Double-Edge","Take Down"],"note":"Dano estimado por segundo na caça: 139,9."},"pvp":{"tier":"A","score":64.4,"role":"physical","priority":["atk","hp","spd","spe"],"natures":["Brave","Adamant","Lonely"],"moves":["Iron Defense","Iron Tail","Headbutt","Protect"],"note":"Duelo de referência: 74,8/100 (perfil físico). Gen 3: RU; set \"Choice Band\" com 2/4 golpes por nível (faltam Earthquake, Rock Slide).","smogon":{"tier":"RU","covered":2,"slots":4}},"baseId":306,"isMega":true},
      "308-mega": {"id":"308-mega","name":"Mega Medicham","types":["fighting","psychic"],"stats":{"hp":60,"atk":100,"def":85,"spa":80,"spd":85,"spe":100},"pve":{"tier":"B","score":56.5,"role":"physical","priority":["atk","spe"],"natures":["Brave","Adamant","Lonely"],"moves":["Hi Jump Kick","Meditate","Fire Punch","Ice Punch"],"note":"Dano estimado por segundo na caça: 135,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":61.6,"role":"physical","priority":["atk","def","spd"],"natures":["Careful","Impish","Relaxed"],"moves":["Hi Jump Kick","Meditate","Ice Punch","Recover"],"note":"Duelo de referência: 75,3/100 (perfil físico). Gen 3: NU (sem Pure Power no jogo); set \"Choice Band\" com 1/4 golpes por nível (faltam Shadow Ball, Rock Slide, Fake Out / Focus Punch).","smogon":{"tier":"NU","covered":1,"slots":4}},"baseId":308,"isMega":true},
      "310-mega": {"id":"310-mega","name":"Mega Manectric","types":["electric"],"stats":{"hp":70,"atk":75,"def":80,"spa":135,"spd":80,"spe":135},"pve":{"tier":"A","score":60.5,"role":"mixed","priority":["atk","spa","spe"],"natures":["Brave","Lonely","Naughty"],"moves":["Thunder","Spark","Howl","Bite"],"note":"Dano estimado por segundo na caça: 145, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":51.9,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Naughty","Lonely","Lax"],"moves":["Bite","Thunder","Thunder Wave","Quick Attack"],"note":"Duelo de referência: 63,3/100 (perfil misto). Gen 3: RUBL; set \"Special Sweeper\" com 0/4 golpes por nível (faltam Thunderbolt, Substitute, Crunch, Hidden Power Ice / Hidden Power Grass).","smogon":{"tier":"RUBL","covered":0,"slots":4}},"baseId":310,"isMega":true},
      "319-mega": {"id":"319-mega","name":"Mega Sharpedo","types":["water","dark"],"stats":{"hp":70,"atk":140,"def":70,"spa":110,"spd":65,"spe":105},"pve":{"tier":"S","score":80,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Bite","Crunch","Surf","Skull Bash"],"note":"Dano estimado por segundo na caça: 191,8. Usa dano físico e especial."},"pvp":{"tier":"A","score":59.2,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Screech","Crunch","Skull Bash","Agility"],"note":"Duelo de referência: 71,1/100 (perfil físico). Gen 3: RU; set \"Sharknado\" com 1/4 golpes por nível (faltam Hydro Pump, Ice Beam, Endure).","smogon":{"tier":"RU","covered":1,"slots":4}},"baseId":319,"isMega":true},
      "323-mega": {"id":"323-mega","name":"Mega Camerupt","types":["fire","ground"],"stats":{"hp":70,"atk":120,"def":100,"spa":145,"spd":105,"spe":20},"pve":{"tier":"A","score":61.1,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Flamethrower","Double-Edge","Earthquake","Rock Slide"],"note":"Dano estimado por segundo na caça: 146,5. Usa dano físico e especial."},"pvp":{"tier":"A","score":62.8,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Lax","Gentle","Naive"],"moves":["Flamethrower","Ember","Amnesia","Earthquake"],"note":"Duelo de referência: 70,8/100 (perfil misto). Gen 3: RU; set \"Physically Defensive\" com 3/4 golpes por nível (faltam Protect / Explosion).","smogon":{"tier":"RU","covered":3,"slots":4}},"baseId":323,"isMega":true},
      "334-mega": {"id":"334-mega","name":"Mega Altaria","types":["dragon","flying"],"stats":{"hp":75,"atk":110,"def":110,"spa":110,"spd":105,"spe":80},"pve":{"tier":"B","score":57.5,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Brave"],"moves":["DragonBreath","Peck","Sky Attack","Dragon Dance"],"note":"Dano estimado por segundo na caça: 137,8, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"A","score":58.8,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Dragon Dance","DragonBreath","Sky Attack","Fly"],"note":"Duelo de referência: 69,1/100 (perfil físico). Gen 3: UU; set \"Staller\" com 1/4 golpes por nível (faltam Toxic / Hidden Power Grass, Fire Blast / Flamethrower, Rest).","smogon":{"tier":"UU","covered":1,"slots":4}},"baseId":334,"isMega":true},
      "354-mega": {"id":"354-mega","name":"Mega Banette","types":["ghost"],"stats":{"hp":64,"atk":165,"def":75,"spa":93,"spd":83,"spe":75},"pve":{"tier":"C","score":39.5,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Faint Attack","Shadow Ball","Curse","Knock Off"],"note":"Dano estimado por segundo na caça: 94,6, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":48.3,"role":"special","priority":["spa","hp","def"],"natures":["Lonely","Bold","Modest"],"moves":["Faint Attack","Shadow Ball","Night Shade","Will-O-Wisp"],"note":"Duelo de referência: 49,6/100 (perfil especial). Gen 3: RU; set \"Support\" com 3/4 golpes por nível (faltam Hidden Power Fighting).","smogon":{"tier":"RU","covered":3,"slots":4}},"baseId":354,"isMega":true},
      "359-mega": {"id":"359-mega","name":"Mega Absol","types":["dark"],"stats":{"hp":65,"atk":150,"def":60,"spa":115,"spd":60,"spe":115},"pve":{"tier":"S","score":116.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Slash","Quick Attack","Swords Dance"],"note":"Dano estimado por segundo na caça: 278,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":50,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Bite","Swords Dance","Quick Attack","Double Team"],"note":"Duelo de referência: 55/100 (perfil físico). Gen 3: RU; set \"Swords Dance + Baton Pass\" com 2/4 golpes por nível (faltam Shadow Ball / Substitute, Baton Pass).","smogon":{"tier":"RU","covered":2,"slots":4}},"baseId":359,"isMega":true},
      "362-mega": {"id":"362-mega","name":"Mega Glalie","types":["ice"],"stats":{"hp":80,"atk":120,"def":80,"spa":120,"spd":80,"spe":100},"pve":{"tier":"A","score":61.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Powder Snow","Ice Beam","Icy Wind","Blizzard"],"note":"Dano estimado por segundo na caça: 147,9."},"pvp":{"tier":"B","score":45.8,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Mild","Rash","Lonely"],"moves":["Crunch","Ice Beam","Double Team","Blizzard"],"note":"Duelo de referência: 55,4/100 (perfil misto). Gen 3: NUBL; set \"Spikes\" com 0/4 golpes por nível (faltam Spikes, Explosion, Earthquake, Hidden Power Grass).","smogon":{"tier":"NUBL","covered":0,"slots":4}},"baseId":362,"isMega":true},
      "373-mega": {"id":"373-mega","name":"Mega Salamence","types":["dragon","flying"],"stats":{"hp":95,"atk":145,"def":130,"spa":120,"spd":90,"spe":120},"pve":{"tier":"S","score":78.9,"role":"mixed","priority":["atk","spa","spe"],"natures":["Brave","Lonely","Naughty"],"moves":["Dragon Claw","Double-Edge","DragonBreath","Crunch"],"note":"Dano estimado por segundo na caça: 189,1. Usa dano físico e especial."},"pvp":{"tier":"S","score":72.3,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Dragon Claw","Protect","Crunch","Double-Edge"],"note":"Duelo de referência: 81,8/100 (perfil físico). Gen 3: OU; set \"Wish Support\" com 1/4 golpes por nível (faltam Flamethrower, Toxic, Wish).","smogon":{"tier":"OU","covered":1,"slots":4}},"baseId":373,"isMega":true},
      "376-mega": {"id":"376-mega","name":"Mega Metagross","types":["steel","psychic"],"stats":{"hp":80,"atk":145,"def":150,"spa":105,"spd":110,"spe":110},"pve":{"tier":"S","score":96.2,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Meteor Mash","Agility","Psychic"],"note":"Dano estimado por segundo na caça: 230,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":79.4,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Sassy","Relaxed","Gentle"],"moves":["Iron Defense","Meteor Mash","Psychic","Hyper Beam"],"note":"Duelo de referência: 86,4/100 (perfil misto). Gen 3: OU; set \"Tank\" com 2/4 golpes por nível (faltam Earthquake, Explosion).","smogon":{"tier":"OU","covered":2,"slots":4}},"baseId":376,"isMega":true}
    }
  } /* GUIDE_DATA_END */;

  if (moduleEnabled('tiers')) (() => {
    // ==== src/tiers/common.js ====
    // Tiers e recomendações: constantes, dados do guia e selos de tier compartilhados pelo mercado, mapa e ficha.
    const STORAGE_KEY = 'pokeafk-market-filtros:v1';
    const NATURES = [
      'Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful', 'Docile',
      'Gentle', 'Hardy', 'Hasty', 'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild',
      'Modest', 'Naive', 'Naughty', 'Quiet', 'Quirky', 'Rash', 'Relaxed',
      'Sassy', 'Serious', 'Timid',
    ];
    const STATS = [
      ['hp', 'HP', 'HP'], ['atk', 'Atq', 'ATQ'], ['def', 'Def', 'DEF'],
      ['spa', 'Atq. Esp.', 'AT.E'], ['spd', 'Def. Esp.', 'DF.E'], ['spe', 'Vel', 'VEL'],
    ];
    const STAT_KEYS = new Map(STATS.map(([stat, , label]) => [label, stat]));
    const STAT_LABELS = new Map(STATS.map(([stat, label]) => [stat, label]));
    // Nature chart: rows are the raised stat, columns the lowered one; the diagonal is neutral.
    const NATURE_STATS = ['atk', 'def', 'spa', 'spd', 'spe'];
    const NATURE_CHART = [
      ['Hardy', 'Lonely', 'Adamant', 'Naughty', 'Brave'],
      ['Bold', 'Docile', 'Impish', 'Lax', 'Relaxed'],
      ['Modest', 'Mild', 'Bashful', 'Rash', 'Quiet'],
      ['Calm', 'Gentle', 'Careful', 'Quirky', 'Sassy'],
      ['Timid', 'Hasty', 'Jolly', 'Naive', 'Serious'],
    ];
    const NATURE_EFFECTS = new Map(NATURE_CHART.flatMap((row, up) =>
      row.map((nature, down) => [nature, { up: NATURE_STATS[up], down: NATURE_STATS[down] }])));
    function natureEffect(nature) {
      const effect = NATURE_EFFECTS.get(nature);
      if (!effect) return '';
      if (effect.up === effect.down) return 'neutra';
      return `+${STAT_LABELS.get(effect.up)} −${STAT_LABELS.get(effect.down)}`;
    }
    function natureWithEffect(nature) {
      const effect = natureEffect(nature);
      return effect ? `${nature} (${effect})` : nature;
    }
    const ROLES = {
      physical: 'Físico', special: 'Especial', mixed: 'Misto', support: 'Suporte',
    };
    const RANK_PAGE_SIZE = 10;
    const PRIORITY_IV = 28;
    const TIERS = ['S', 'A', 'B', 'C', 'D'];
    // Legendary and mythical Pokémon from generations 1–3.
    const LEGENDARY_DEX = new Set([
      144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251,
      377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
    ]);
    const CATEGORIES = { normal: 'Espécies normais', special: 'Lendários e Megas', all: 'Todas' };
    function profileCategory(profile) {
      return profile.isMega || LEGENDARY_DEX.has(Number(profile.id)) ? 'special' : 'normal';
    }
    // Two tier lists: hunting damage (PvE) and a longer competitive duel.
    const MODES = {
      pve: { label: 'PvE (caça)', short: 'PvE', title: 'PvE' },
      pvp: { label: 'Competitivo', short: 'Comp', title: 'Competitivo' },
    };
    const MODE_KEY = 'pokeafk-market-filtros:mode';
    function readMode() {
      try {
        const saved = localStorage.getItem(MODE_KEY);
        return saved in MODES ? saved : 'pve';
      } catch {
        return 'pve';
      }
    }
    function saveMode(mode) {
      try {
        localStorage.setItem(MODE_KEY, mode);
      } catch {
        // The choice only lasts for this page when storage is blocked.
      }
    }
    function rated(profile, mode) {
      return Boolean(profile?.[mode]?.tier) && Number.isFinite(profile[mode].score);
    }
    const rankedProfiles = Object.values(MARKET_GUIDE?.profiles ?? {})
      .filter(profile => rated(profile, 'pve') && rated(profile, 'pvp'))
      .map(profile => ({ ...profile, category: profileCategory(profile) }));
    const scoreFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
    const TIER_BADGE = 'pafk-tier-badge';

    // Best final evolution (megas excluded) that represents a dex number in the market lists.
    function speciesRating(dex, mode) {
      const mapped = MARKET_GUIDE?.species?.[Number(dex)];
      return (mapped?.finals ?? []).map(id => MARKET_GUIDE.profiles[id])
        .filter(profile => rated(profile, mode))
        .sort((left, right) => right[mode].score - left[mode].score)[0] ?? null;
    }

    function tierSegment(mode, tier, showMode = true) {
      const segment = document.createElement('span');
      segment.className = 'pafk-tier-seg';
      segment.dataset.tier = tier;
      segment.innerHTML = `${showMode ? `<small>${MODES[mode].short}</small>` : ''}<b>${tier}</b>`;
      return segment;
    }

    function createTierBadge(dex) {
      const ratings = Object.keys(MODES).map(mode => [mode, speciesRating(dex, mode)]).filter(([, profile]) => profile);
      if (!ratings.length) return null;
      const badge = document.createElement('span');
      badge.className = TIER_BADGE;
      badge.dataset.dex = String(dex);
      badge.title = ratings.map(([mode, profile]) => {
        const reference = String(profile.id) === String(dex) ? '' : ` (${profile.name})`;
        return `${MODES[mode].title}: tier ${profile[mode].tier}, nota ${scoreFormat.format(profile[mode].score)}${reference}`;
      }).join(' · ');
      badge.setAttribute('aria-label', badge.title);
      badge.append(...ratings.map(([mode, profile]) => tierSegment(mode, profile[mode].tier)));
      return badge;
    }

    function placeTierBadge(host, dex) {
      if (!host || !dex) return;
      const current = host.querySelector(`:scope > .${TIER_BADGE}`);
      if (current?.dataset.dex === String(dex)) return;
      current?.remove();
      const badge = createTierBadge(dex);
      if (!badge) return;
      badge.dataset.pafk = '';
      host.append(badge);
    }

    function dexFromAsset(url) {
      return String(url ?? '').match(/\/assets\/mon\/(?:icon|front)\/(\d+)\.png/)?.[1];
    }

    // MAPA window: hunt list rows and the card of the selected hunt (the map itself is a canvas).

    // ==== src/tiers/badges.js ====
    // Selos de tier no MAPA e na ficha do Pokémon e a seção "Moveset recomendado" da ficha.
    function decorateMap() {
      // Names are single lines with an ellipsis, so the badge gets a line of its own below the place.
      for (const row of document.querySelectorAll('.modal .mx-row[data-hunt]')) {
        placeTierBadge(row.querySelector('.mx-row-main'), dexFromAsset(row.querySelector('.icon')?.style.backgroundImage));
      }
      for (const card of document.querySelectorAll('.modal .mx-card')) {
        placeTierBadge(card.querySelector('.mx-card-txt'), dexFromAsset(card.querySelector('.mx-card-art img')?.getAttribute('src')));
      }
    }

    function moveKey(name) {
      return String(name).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
    }

    const sheetReference = new Map();

    function sheetCandidates(dex) {
      const mapped = MARKET_GUIDE?.species?.[Number(dex)];
      return [...(mapped?.finals ?? []), ...(mapped?.variants ?? [])]
        .map(id => MARKET_GUIDE.profiles[id])
        .filter(profile => rated(profile, 'pve') && rated(profile, 'pvp'));
    }

    function sheetColumn(profile, mode, known) {
      const build = profile[mode];
      const column = document.createElement('div');
      column.className = 'pafk-sheet-col';
      const head = document.createElement('div');
      head.className = 'pafk-sheet-title';
      const title = document.createElement('strong');
      title.textContent = MODES[mode].label;
      const badge = document.createElement('span');
      badge.className = TIER_BADGE;
      badge.append(tierSegment(mode, build.tier, false));
      const score = document.createElement('span');
      score.textContent = `nota ${scoreFormat.format(build.score)}`;
      head.append(title, badge, score);

      const list = document.createElement('ul');
      list.className = 'pafk-sheet-moves';
      let learned = 0;
      for (const name of build.moves) {
        const item = document.createElement('li');
        const has = known.has(moveKey(name));
        if (has) learned++;
        item.className = has ? 'is-known' : '';
        item.textContent = name;
        if (has) item.title = 'Este Pokémon já conhece';
        list.append(item);
      }
      const summary = document.createElement('p');
      summary.className = 'pafk-sheet-sum';
      summary.textContent = `${learned} de ${build.moves.length} golpes já aprendidos`;
      const nature = document.createElement('p');
      const [best, ...others] = build.natures ?? [];
      nature.innerHTML = '<span>Natureza</span> <b></b>';
      nature.querySelector('b').textContent = best
        ? natureWithEffect(best) + (others.length ? ` · ou ${others.map(natureWithEffect).join(', ')}` : '')
        : '—';
      const ivs = document.createElement('p');
      ivs.innerHTML = '<span>IVs prioritários</span> <b></b>';
      ivs.querySelector('b').textContent = priorityText(build) || '—';
      const note = document.createElement('p');
      note.className = 'pafk-sheet-note';
      note.textContent = build.note ?? '';
      column.append(head, list, summary, nature, ivs, note);
      return column;
    }

    function createSheetPanel(dex, known) {
      const candidates = sheetCandidates(dex);
      if (!candidates.length) return null;
      const section = document.createElement('section');
      section.className = 'lab-panel pafk-sheet';
      section.dataset.pafk = '';
      section.dataset.pafkSheet = '';
      section.innerHTML = `
        <header class="lab-head pafk-sheet-head">
          <div><h3>Moveset recomendado</h3><p>Golpes por nível da linha evolutiva e HMs da Loja de Celadon (Cut, Rock Smash, Strength, Surf, Waterfall, Fly e Dive). TMs ficam de fora porque só saem da TM Box. ✓ marca os que este Pokémon já conhece.</p></div>
          <label class="pafk-sheet-ref" hidden>Forma de referência <select></select></label>
        </header>
        <p class="pafk-sheet-refnote" hidden></p>
        <div class="pafk-sheet-grid"></div>`;
      const label = section.querySelector('.pafk-sheet-ref');
      const select = label.querySelector('select');
      const grid = section.querySelector('.pafk-sheet-grid');
      const referenceNote = section.querySelector('.pafk-sheet-refnote');
      select.append(...candidates.map(profile => new Option(profile.name, profile.id)));
      label.hidden = candidates.length < 2;
      const own = candidates.find(profile => String(profile.id) === String(dex));
      // Megas need a stone, so the default is the strongest regular final form; Megas stay in the selector.
      const regular = candidates.filter(profile => !profile.isMega);
      const strongest = [...(regular.length ? regular : candidates)]
        .sort((a, b) => b.pve.score + b.pvp.score - a.pve.score - a.pvp.score)[0];
      const saved = candidates.find(profile => String(profile.id) === sheetReference.get(String(dex)));
      select.value = String((saved ?? own ?? strongest).id);

      function render() {
        const profile = candidates.find(candidate => String(candidate.id) === select.value) ?? candidates[0];
        grid.replaceChildren(...Object.keys(MODES).map(mode => sheetColumn(profile, mode, known)));
        referenceNote.hidden = String(profile.id) === String(dex);
        referenceNote.textContent = `Recomendação para ${profile.name}, a forma final usada como referência.`;
      }
      select.addEventListener('change', () => {
        sheetReference.set(String(dex), select.value);
        render();
      });
      render();
      return section;
    }

    // FICHA DO POKÉMON: tier next to level and type, recommended moves right after "Golpes conhecidos".
    function decorateSheet() {
      for (const lab of document.querySelectorAll('.lab[data-lab-dex]')) {
        const dex = lab.dataset.labDex;
        placeTierBadge(lab.querySelector('.lab-hero .lab-tags'), dex);
        const movesPanel = lab.querySelector('section[data-lab-section="golpes"]');
        if (!movesPanel) continue;
        const known = new Set([...movesPanel.querySelectorAll('.mv-name')].map(element => moveKey(element.textContent)));
        const key = `${dex}#${[...known].join('|')}`;
        const current = movesPanel.nextElementSibling?.matches('[data-pafk-sheet]') ? movesPanel.nextElementSibling : null;
        if (current?.dataset.key === key) continue;
        current?.remove();
        lab.querySelectorAll('[data-pafk-sheet]').forEach(stale => stale.remove());
        const section = createSheetPanel(dex, known);
        if (!section) continue;
        section.dataset.key = key;
        movesPanel.after(section);
      }
    }

    function decorateTierBadges() {
      for (const button of document.querySelectorAll('.mk .mk-sp-go[data-species]')) {
        const row = button.parentElement;
        placeTierBadge(row?.querySelector('.mk-spr-x > b, .mk-sp-x > h4'), button.dataset.species);
      }
      const spec = document.querySelector('.mk .mk-spec');
      const dex = spec?.querySelector('.mk-dexno')?.textContent.trim().match(/^#(\d+)$/)?.[1];
      if (dex) placeTierBadge(spec.querySelector('.mk-spec-name'), dex);
    }

    // ==== src/market/filters.js ====
    // Filtros de natureza e IV do Mercado da Comunidade e o painel de recomendação.
    const OFFER_LIST = '.mk-offers, .mk-lrs';
    const OFFER_ROW = 'article.mk-offer, article.mk-lr';
    const FILTERED_ATTR = 'data-pafk-filtered';
    const memoryFilters = new Map();

    function validIV(value) {
      return Number.isInteger(value) && value >= 0 && value <= 31;
    }

    function emptyFilters() {
      return { natures: new Set(), minimums: new Map() };
    }

    function storageKey(scope) {
      return scope === 'all' ? STORAGE_KEY : `${STORAGE_KEY}:${scope}`;
    }

    function readFilters(scope) {
      if (memoryFilters.has(scope)) return memoryFilters.get(scope);
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey(scope)) || '{}');
        const savedNatures = Array.isArray(saved?.natures) ? saved.natures : [];
        return {
          natures: new Set(NATURES.filter(nature => savedNatures.includes(nature))),
          minimums: new Map(STATS.flatMap(([stat]) => validIV(saved?.minimums?.[stat])
            ? [[stat, saved.minimums[stat]]]
            : [])),
        };
      } catch {
        return emptyFilters();
      }
    }

    function saveFilters(scope, filters) {
      const { natures, minimums } = filters;
      try {
        if (!natures.size && !minimums.size) {
          localStorage.removeItem(storageKey(scope));
        } else {
          localStorage.setItem(storageKey(scope), JSON.stringify({
            natures: [...natures],
            minimums: Object.fromEntries(minimums),
          }));
        }
        memoryFilters.delete(scope);
      } catch {
        memoryFilters.set(scope, filters);
      }
    }

    function matchOffer(offer, { natures, minimums }) {
      let unknown = false;
      if (natures.size) {
        if (offer.nature && !natures.has(offer.nature)) return false;
        unknown = !offer.nature;
      }
      for (const [stat, minimum] of minimums) {
        const value = offer.ivs[stat];
        if (!validIV(value)) unknown = true;
        else if (value < minimum) return false;
      }
      return unknown ? null : true;
    }

    function readOffer(row) {
      const rawNature = row.querySelector('.mk-lr-nature, :scope > .mk-offer-who > small')?.textContent.trim();
      const ivs = {};
      for (const stat of row.querySelectorAll('.mk-ivs > span')) {
        const label = stat.querySelector('small')?.textContent.trim().toUpperCase();
        const value = stat.querySelector('b')?.textContent.trim();
        const key = STAT_KEYS.get(label);
        if (key && /^\d{1,2}$/.test(value)) ivs[key] = Number(value);
      }
      return { nature: NATURES.includes(rawNature) ? rawNature : null, ivs };
    }

    function setNatureCheckboxes(form, natures) {
      for (const checkbox of form.querySelectorAll('[name="nature"]')) {
        checkbox.checked = natures.has(checkbox.value);
      }
      updateNatureCount(form);
    }

    function updateNatureCount(form) {
      const selected = form.querySelectorAll('[name="nature"]:checked').length;
      const summary = form.querySelector('[data-count]');
      summary.textContent = selected
        ? `· ${selected} ${selected === 1 ? 'selecionada' : 'selecionadas'}` : '';
      for (const head of form.querySelectorAll('[data-nat-row], [data-nat-col]')) {
        const boxes = natureGroup(form, head);
        head.setAttribute('aria-pressed', String(boxes.every(box => box.checked)));
      }
    }

    // Checkboxes of one chart row (raised stat) or column (lowered stat).
    function natureGroup(form, head) {
      const selector = head.dataset.natRow
        ? `.pafk-nat[data-up="${head.dataset.natRow}"] input`
        : `.pafk-nat[data-down="${head.dataset.natCol}"] input`;
      return [...form.querySelectorAll(selector)];
    }

    // Empty or 0 means "any IV"; anything else is clamped to 0–31.
    function cleanIV(raw) {
      if (String(raw).trim() === '') return '';
      const value = Math.round(Number(raw));
      if (!Number.isFinite(value)) return '';
      const clamped = Math.min(31, Math.max(0, value));
      return clamped ? String(clamped) : '';
    }

    function syncIVRow(form, stat) {
      const input = form.elements.namedItem(stat);
      const range = form.querySelector(`[data-iv-range="${stat}"]`);
      const value = Number(cleanIV(input.value) || 0);
      range.value = String(value);
      input.closest('.pafk-iv').classList.toggle('is-set', value > 0);
    }

    function syncForm(form) {
      updateNatureCount(form);
      for (const [stat] of STATS) syncIVRow(form, stat);
    }

    function readForm(form) {
      const data = new FormData(form);
      return {
        natures: new Set(data.getAll('nature')),
        minimums: new Map(STATS.flatMap(([stat]) => {
          const value = cleanIV(data.get(stat) ?? '');
          return value ? [[stat, Number(value)]] : [];
        })),
      };
    }

    // Stars the recommended natures and priority IVs in the form (build = null clears them).
    function markRecommended(form, build) {
      const natures = new Set(build?.natures ?? []);
      const priority = new Set(build?.priority ?? []);
      for (const cell of form.querySelectorAll('.pafk-nat')) {
        const nature = cell.querySelector('input').value;
        cell.toggleAttribute('data-rec', natures.has(nature));
        cell.title = natures.has(nature) ? `${natureWithEffect(nature)} · recomendada` : natureWithEffect(nature);
      }
      for (const row of form.querySelectorAll('.pafk-iv')) {
        const rec = priority.has(row.dataset.iv);
        row.toggleAttribute('data-rec', rec);
        row.title = rec ? 'Prioritário na recomendação' : '';
      }
    }

    function priorityText(profile) {
      return profile.priority.map(stat => STAT_LABELS.get(stat) ?? stat).join(' → ');
    }

    function updateRecommendation(dex) {
      const section = panel.querySelector('[data-recommendation]');
      section.hidden = !MARKET_GUIDE || !dex;
      markRecommended(form, null);
      if (section.hidden) return;

      const mapped = MARKET_GUIDE.species[Number(dex)];
      const finals = (mapped?.finals ?? []).map(id => MARKET_GUIDE.profiles[id]).filter(Boolean);
      const variants = (mapped?.variants ?? []).map(id => MARKET_GUIDE.profiles[id]).filter(Boolean);
      const candidates = finals.length ? [...new Set([...finals, ...variants])] : [];
      const branch = section.querySelector('[data-branch]');
      const select = branch.querySelector('select');
      const details = section.querySelector('[data-build]');
      const empty = section.querySelector('[data-no-build]');
      const fill = section.querySelector('[data-fill-natures]');
      let profile = candidates[0];
      details.hidden = !profile;
      empty.hidden = Boolean(profile);
      branch.hidden = candidates.length < 2;
      select.replaceChildren(...candidates.map(candidate => new Option(candidate.name, candidate.id)));
      details.querySelector('details').open = false;
      if (!profile) {
        section.querySelector('[data-build-reference]').textContent = '';
        return;
      }

      const modeSelect = section.querySelector('[data-mode]');
      modeSelect.value = readMode();

      function renderProfile() {
        const build = profile[modeSelect.value] ?? profile.pve;
        const [recommended, ...alternatives] = build.natures ?? [];
        const labels = [ROLES[build.role] ?? build.role];
        if (String(profile.id) !== String(dex)) labels.push(`Referência ${profile.name}`);
        if (build.tier) labels.push(`Tier ${build.tier} · nota ${scoreFormat.format(build.score)}`);
        section.querySelector('[data-build-reference]').textContent = labels.join(' · ');
        section.querySelector('[data-best-nature]').textContent = recommended ? natureWithEffect(recommended) : '—';
        section.querySelector('[data-alt-natures]').textContent = alternatives.length
          ? ` · Alternativas ${alternatives.map(natureWithEffect).join(', ')}` : '';
        section.querySelector('[data-build-priority]').textContent = priorityText(build) || '—';
        section.querySelector('[data-best-moves]').textContent = build.moves?.join(', ') || '—';
        section.querySelector('[data-base-stats]').textContent = STATS.map(([stat, label]) =>
          `${label} ${profile.stats[stat] ?? '—'}`).join(' · ');
        section.querySelector('[data-build-note]').textContent = build.note ?? '';
        fill.disabled = !recommended;
        markRecommended(form, build);
      }

      select.onchange = () => {
        profile = candidates.find(candidate => String(candidate.id) === select.value) ?? candidates[0];
        renderProfile();
      };
      modeSelect.onchange = () => {
        saveMode(modeSelect.value);
        renderProfile();
      };
      fill.onclick = () => {
        const build = profile[modeSelect.value] ?? profile.pve;
        setNatureCheckboxes(form, new Set(build.natures));
        const priority = new Set(build.priority);
        for (const [stat] of STATS) {
          form.elements.namedItem(stat).value = priority.has(stat) ? PRIORITY_IV : '';
        }
        syncForm(form);
        form.requestSubmit();
      };
      renderProfile();
    }

    // ==== src/tiers/dialog.js ====
    // Diálogo da tier list (PvE e Competitivo) aberto pelo botão "Tier list" do mercado.
    function createTierDialog(trigger) {
      const dialog = document.createElement('dialog');
      dialog.id = 'pafk-tier-dialog';
      dialog.setAttribute('aria-labelledby', 'pafk-tier-title');
      dialog.innerHTML = `
        <header class="pafk-tier-header">
          <h3 id="pafk-tier-title">Tier list de Pokémon</h3>
          <button type="button" data-close-tier>Fechar</button>
        </header>
        <div class="pafk-tier-content">
          <div class="pafk-mode-switch" role="group" aria-label="Tier list">
            ${Object.entries(MODES).map(([mode, { label }]) => `<button type="button" data-rank-mode="${mode}" aria-pressed="false">${label}</button>`).join('')}
          </div>
          <p>Cada forma final usa até 4 golpes entre os aprendidos por nível na linha evolutiva e as HMs vendidas na Loja de Celadon. TMs ficam de fora porque só saem, ao acaso, da TM Box. Lendários, míticos e Megas ficam numa categoria separada. <a href="https://pokeafk.io/pokepedia/" target="_blank" rel="noopener noreferrer">Dados da Poképédia</a></p>
          <details data-rank-help="pve">
            <summary>Como a nota PvE é calculada</summary>
            <p>Simula 60 s de caça como o AUTO: usa o golpe pronto mais forte, respeitando recarga e o intervalo entre golpes, que diminui com a Velocidade. Golpes em área contam dois alvos do bando, com 75% do dano em cada um. Reforços como Swords Dance e Growth são usados uma vez e repetidos quando o efeito acaba, sem acumular. Sunny Day e Rain Dance contam enquanto duram. A nota 100 é a espécie normal com mais dano por segundo.</p>
          </details>
          <details data-rank-help="pvp" hidden>
            <summary>Como a nota competitiva é calculada</summary>
            <p>Simula duelos de até 180 s contra um atacante físico e um especial de referência, com as regras do jogo e o AUTO da Ranqueada: reforços e reduções de atributo usados uma vez e repetidos quando acabam, sono, paralisia, queimadura, veneno, confusão, recargas de batalha e até 4 curas. Cobertura de tipos e resistências também contam. 70% da nota vem do duelo e 30% da referência competitiva da Gen 3 (tiers e sets da Smogon e do Pokémon Showdown). Essa referência é reduzida quando o set da Smogon depende de golpes que a espécie não aprende por nível.</p>
          </details>
          <div class="pafk-tier-controls">
            <label>Espécie<input type="search" placeholder="Buscar evolução final" data-rank-search autofocus></label>
            <label>Categoria<select data-rank-category>
              ${Object.entries(CATEGORIES).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
            </select></label>
            <label>Tier<select data-rank-tier><option value="">Todos</option>
              ${TIERS.map(tier => `<option>${tier}</option>`).join('')}
            </select></label>
            <label>Perfil<select data-rank-role><option value="">Todos</option>
              ${Object.entries(ROLES).map(([role, label]) => `<option value="${role}">${label}</option>`).join('')}
            </select></label>
            <label>Ordenar por<select data-rank-sort>
              <option value="score">Maior nota</option><option value="name">Nome</option>
            </select></label>
          </div>
          <div class="pafk-tier-table" role="region" aria-label="Tabela da tier list" tabindex="0">
            <table>
              <thead><tr>
                <th scope="col">Espécie</th><th scope="col">Tier</th><th scope="col">Nota</th><th scope="col">Perfil</th>
                <th scope="col">IVs prioritários</th><th scope="col">Golpes recomendados</th><th scope="col" data-gen3-col>Gen 3</th>
              </tr></thead>
              <tbody></tbody>
            </table>
          </div>
          <p data-rank-empty hidden>Nenhum Pokémon encontrado.</p>
          <footer class="pafk-tier-pagination">
            <p role="status" data-rank-status></p>
            <div>
              <button type="button" data-rank-prev>Anterior</button>
              <button type="button" data-rank-next>Próxima</button>
            </div>
          </footer>
        </div>`;

      const modeButtons = [...dialog.querySelectorAll('[data-rank-mode]')];
      let mode = readMode();
      const search = dialog.querySelector('[data-rank-search]');
      const category = dialog.querySelector('[data-rank-category]');
      const tier = dialog.querySelector('[data-rank-tier]');
      const role = dialog.querySelector('[data-rank-role]');
      const sort = dialog.querySelector('[data-rank-sort]');
      const table = dialog.querySelector('.pafk-tier-table');
      const body = table.querySelector('tbody');
      const empty = dialog.querySelector('[data-rank-empty]');
      const status = dialog.querySelector('[data-rank-status]');
      const previous = dialog.querySelector('[data-rank-prev]');
      const next = dialog.querySelector('[data-rank-next]');
      let page = 0;

      function searchKey(text) {
        return text.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
      }

      function renderPage() {
        const query = searchKey(search.value);
        for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.rankMode === mode));
        for (const help of dialog.querySelectorAll('[data-rank-help]')) help.hidden = help.dataset.rankHelp !== mode;
        dialog.querySelector('[data-gen3-col]').hidden = mode !== 'pvp';
        const filtered = rankedProfiles.filter(profile => (category.value === 'all' || profile.category === category.value)
          && (!tier.value || profile[mode].tier === tier.value)
          && (!role.value || profile[mode].role === role.value)
          && (!query || searchKey(profile.name).includes(query)));
        filtered.sort(sort.value === 'name'
          ? (left, right) => left.name.localeCompare(right.name, 'pt-BR')
          : (left, right) => right[mode].score - left[mode].score || left.name.localeCompare(right.name, 'pt-BR'));

        const pageCount = Math.ceil(filtered.length / RANK_PAGE_SIZE);
        const offset = page * RANK_PAGE_SIZE;
        body.replaceChildren(...filtered.slice(offset, offset + RANK_PAGE_SIZE).map(profile => {
          const row = document.createElement('tr');
          const name = document.createElement('th');
          name.scope = 'row';
          name.textContent = profile.name;
          if (profile.category === 'special') {
            const tag = document.createElement('small');
            tag.className = 'pafk-category-tag';
            tag.textContent = profile.isMega ? 'Mega' : 'Lendário';
            name.append(' ', tag);
          }
          row.append(name);
          const build = profile[mode];
          const tierCell = row.insertCell();
          const tierBadge = document.createElement('span');
          tierBadge.className = TIER_BADGE;
          tierBadge.append(tierSegment(mode, build.tier, false));
          tierCell.append(tierBadge);
          const values = [scoreFormat.format(build.score), ROLES[build.role] ?? build.role,
            priorityText(build) || '—', build.moves.join(', ') || '—'];
          for (const value of values) row.insertCell().textContent = value;
          row.cells[2].title = build.note ?? '';
          if (mode === 'pvp') {
            const smogon = build.smogon;
            const cell = row.insertCell();
            cell.textContent = smogon
              ? `${smogon.tier ?? '—'}${smogon.slots ? ` · ${smogon.covered}/${smogon.slots}` : ''}` : '—';
            cell.title = build.note ?? '';
          }
          return row;
        }));
        table.hidden = !filtered.length;
        empty.hidden = Boolean(filtered.length);
        status.textContent = filtered.length ? `Página ${page + 1} de ${pageCount} · ${filtered.length} Pokémon` : '';
        previous.disabled = page === 0;
        next.disabled = page + 1 >= pageCount;
      }

      function resetPage() {
        page = 0;
        renderPage();
      }

      for (const button of modeButtons) {
        button.addEventListener('click', () => {
          mode = button.dataset.rankMode;
          saveMode(mode);
          resetPage();
        });
      }
      search.addEventListener('input', resetPage);
      for (const control of [category, tier, role, sort]) control.addEventListener('change', resetPage);
      previous.addEventListener('click', () => {
        page--;
        renderPage();
      });
      next.addEventListener('click', () => {
        page++;
        renderPage();
      });
      dialog.querySelector('[data-close-tier]').addEventListener('click', () => dialog.close());
      dialog.addEventListener('keydown', event => {
        event.stopPropagation();
        if (event.key === 'Escape') {
          event.preventDefault();
          dialog.close();
        }
      });
      dialog.addEventListener('close', () => {
        if (trigger.isConnected) trigger.focus();
      });
      document.body.append(dialog);
      renderPage();
      return dialog;
    }

    // ==== src/market/panel.js ====
    // Painel de filtros do mercado: HTML, eventos e carga dos filtros salvos.
    function createPanel(update) {
      const panel = document.createElement('section');
      panel.id = 'pafk-market-filters';
      panel.setAttribute('aria-labelledby', 'pafk-filter-title');
      panel.innerHTML = `
        <div class="pafk-filter-header">
          <h3 id="pafk-filter-title"></h3>
          <button type="button" data-open-tier aria-haspopup="dialog" hidden>Tier list</button>
        </div>
        <div class="pafk-tier-sort" data-tier-sort-box hidden>
          <label>Ordenar pela tier list <select data-tier-sort>
            <option value="">Desligado (ordem do jogo)</option>
            ${Object.entries(MODES).map(([mode, { label }]) => `<option value="${mode}">${label}</option>`).join('')}
          </select></label>
          <span role="status" data-tier-sort-status></span>
        </div>
        <p data-grouped-hint hidden>Abra uma espécie para configurar seus filtros de natureza e IV.</p>
        <form novalidate>
          <div class="pafk-form-grid">
            <fieldset class="pafk-iv-box">
              <legend>IV mínimo <span>(0–31)</span></legend>
              <div class="pafk-ivs">${STATS.map(([stat, label]) => `
                <div class="pafk-iv" data-iv="${stat}">
                  <label for="pafk-iv-${stat}">${label}</label>
                  <input id="pafk-iv-${stat}" type="number" name="${stat}" min="0" max="31" step="1"
                    inputmode="numeric" placeholder="—" autocomplete="off" aria-label="IV mínimo de ${label}">
                  <input type="range" data-iv-range="${stat}" min="0" max="31" step="1" value="0"
                    aria-label="IV mínimo de ${label} (controle deslizante)">
                </div>`).join('')}
              </div>
            </fieldset>
            <fieldset class="pafk-nat-box">
              <legend>Naturezas <span data-count></span></legend>
              <div class="pafk-nat-chart">
                <span class="pafk-nat-corner" aria-hidden="true">sobe ↓<br>cai →</span>
                ${NATURE_STATS.map(stat => `<button type="button" class="pafk-nat-head" data-nat-col="${stat}"
                  aria-pressed="false" aria-label="Marcar naturezas que reduzem ${STAT_LABELS.get(stat)}">−${STAT_LABELS.get(stat)}</button>`).join('')}
                ${NATURE_CHART.map((row, up) => `
                  <button type="button" class="pafk-nat-head" data-nat-row="${NATURE_STATS[up]}" aria-pressed="false"
                    aria-label="Marcar naturezas que aumentam ${STAT_LABELS.get(NATURE_STATS[up])}">+${STAT_LABELS.get(NATURE_STATS[up])}</button>
                  ${row.map((nature, down) => `
                    <label class="pafk-nat${up === down ? ' is-neutral' : ''}" data-up="${NATURE_STATS[up]}" data-down="${NATURE_STATS[down]}">
                      <input type="checkbox" name="nature" value="${nature}" aria-label="${nature}: ${natureEffect(nature)}">
                      <span>${nature}</span><small aria-hidden="true">${natureEffect(nature)}</small>
                    </label>`).join('')}`).join('')}
              </div>
            </fieldset>
          </div>
          <div class="pafk-actions">
            <p class="pafk-form-hint">Os filtros valem na hora. Vazio ou 0 aceita qualquer IV.<span class="pafk-head-hint"> Clique em +Atq, −Vel… para marcar a linha ou coluna inteira.</span></p>
            <button type="button" data-clear>Limpar filtros</button>
          </div>
        </form>
        <p role="status" data-status hidden></p>
        <section class="pafk-recommendation" data-recommendation aria-labelledby="pafk-rec-title" hidden>
          <div class="pafk-recommendation-title">
            <h4 id="pafk-rec-title">Recomendação</h4>
            <span data-build-reference></span>
            <label class="pafk-mode-pick">Lista <select data-mode>
              ${Object.entries(MODES).map(([mode, { label }]) => `<option value="${mode}">${label}</option>`).join('')}
            </select></label>
          </div>
          <label data-branch hidden>Forma de referência <select></select></label>
          <div data-build hidden>
            <p>Natureza principal <strong data-best-nature></strong><span data-alt-natures></span></p>
            <p>IVs prioritários <strong data-build-priority></strong></p>
            <p>Golpes recomendados <strong data-best-moves></strong></p>
            <details>
              <summary>Stats base e detalhes da nota</summary>
              <p><strong>Stats base</strong> <span data-base-stats></span></p>
              <p data-build-note></p>
            </details>
            <button type="button" data-fill-natures>Preencher natureza e IVs</button>
            <p class="pafk-fill-hint">Marca as naturezas recomendadas e IV mínimo ${PRIORITY_IV} nos atributos prioritários.</p>
          </div>
          <p data-no-build hidden>Sem dados de stats e golpes naturais para esta espécie.</p>
        </section>`;

      const form = panel.querySelector('form');
      // Filters apply as soon as a field changes; typed IVs wait for a short pause.
      let typingTimer = 0;
      const apply = () => {
        clearTimeout(typingTimer);
        update(readForm(form));
      };
      form.addEventListener('submit', event => {
        event.preventDefault();
        for (const [stat] of STATS) {
          const input = form.elements.namedItem(stat);
          input.value = cleanIV(input.value);
        }
        syncForm(form);
        apply();
      });
      form.addEventListener('input', event => {
        const target = event.target;
        if (target.dataset.ivRange) {
          const input = form.elements.namedItem(target.dataset.ivRange);
          input.value = target.value === '0' ? '' : target.value;
          syncIVRow(form, target.dataset.ivRange);
          apply();
        } else if (target.type === 'number') {
          syncIVRow(form, target.name);
          clearTimeout(typingTimer);
          typingTimer = setTimeout(apply, 250);
        }
      });
      form.addEventListener('change', event => {
        const target = event.target;
        if (target.name === 'nature') {
          updateNatureCount(form);
          apply();
        } else if (target.type === 'number') {
          target.value = cleanIV(target.value);
          syncIVRow(form, target.name);
          apply();
        }
      });
      form.addEventListener('click', event => {
        const head = event.target.closest('.pafk-nat-head');
        if (!head) return;
        const boxes = natureGroup(form, head);
        const check = !boxes.every(box => box.checked);
        for (const box of boxes) box.checked = check;
        updateNatureCount(form);
        apply();
      });
      panel.querySelector('[data-clear]').addEventListener('click', () => {
        clearTimeout(typingTimer);
        form.reset();
        syncForm(form);
        update(emptyFilters());
      });
      const tierTrigger = panel.querySelector('[data-open-tier]');
      tierTrigger.hidden = !rankedProfiles.length;
      tierTrigger.addEventListener('click', () => {
        tierDialog ??= createTierDialog(tierTrigger);
        tierDialog.showModal();
      });
      return panel;
    }

    function loadForm(form, { natures, minimums }) {
      setNatureCheckboxes(form, natures);
      for (const [stat] of STATS) {
        form.elements.namedItem(stat).value = cleanIV(minimums.get(stat) ?? '');
      }
      syncForm(form);
    }

    // ==== src/tiers/styles.js ====
    // CSS dos selos de tier, do painel do mercado, da tier list e da ficha.
    function installStyles() {
      const style = document.createElement('style');
      style.textContent = `
        [data-pafk-filtered] { display: none !important; }
        #pafk-market-filters {
          box-sizing: border-box;
          margin: 0 0 8px;
          border: 1px solid #bed0ec;
          border-radius: 10px;
          background: #fff;
          color: #152964;
          font: inherit;
          font-size: 13px;
          min-width: 0;
        }
        #pafk-market-filters summary {
          padding: 10px 0;
          cursor: pointer;
          font-weight: 700;
        }
        #pafk-market-filters h3 {
          margin: 0;
          padding-block: 10px 8px;
          font: inherit;
          font-weight: 800;
        }
        #pafk-market-filters .pafk-filter-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0 12px;
          padding: 4px 12px;
        }
        :is(#pafk-market-filters, #pafk-tier-dialog) [hidden] { display: none !important; }
        #pafk-market-filters [data-count] {
          margin-inline-start: 5px;
          color: #2459aa;
          font-variant-numeric: tabular-nums;
        }
        #pafk-market-filters form { display: grid; gap: 6px; padding: 0 12px 10px; }
        #pafk-market-filters fieldset { border: 0; margin: 0; padding: 0; min-width: 0; }
        #pafk-market-filters legend { font-weight: 700; margin-block-end: 4px; }
        #pafk-market-filters legend span { font-weight: 400; }
        #pafk-market-filters .pafk-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
        }
        #pafk-market-filters { container: pafk-filters / inline-size; }
        #pafk-market-filters .pafk-form-grid { display: grid; gap: 14px 20px; align-items: start; }
        @container pafk-filters (min-width: 760px) {
          #pafk-market-filters .pafk-form-grid { grid-template-columns: minmax(250px, 1fr) minmax(0, 2.3fr); }
        }
        /* IV rows: label | typed value | slider. */
        #pafk-market-filters .pafk-ivs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 2px 20px;
        }
        #pafk-market-filters .pafk-iv {
          display: grid;
          grid-template-columns: 76px 52px minmax(0, 1fr);
          align-items: center;
          gap: 8px;
          min-height: 44px;
        }
        #pafk-market-filters .pafk-iv label { color: #465982; white-space: nowrap; }
        #pafk-market-filters .pafk-iv[data-rec] label::after { content: " ★"; color: #c46a00; }
        #pafk-market-filters .pafk-iv.is-set label { color: #152964; font-weight: 700; }
        #pafk-market-filters .pafk-iv input[type="number"] {
          min-height: 34px;
          padding: 2px 4px;
          text-align: center;
          font-weight: 700;
          appearance: textfield;
          -moz-appearance: textfield;
        }
        #pafk-market-filters .pafk-iv input[type="number"]::-webkit-inner-spin-button,
        #pafk-market-filters .pafk-iv input[type="number"]::-webkit-outer-spin-button { appearance: none; margin: 0; }
        #pafk-market-filters .pafk-iv.is-set input[type="number"] { border-color: #1958b8; background: #eef4ff; }
        #pafk-market-filters .pafk-iv input[type="range"] {
          width: 100%;
          min-width: 0;
          height: 28px;
          margin: 0;
          accent-color: #1958b8;
          cursor: pointer;
        }
        /* Nature chart: rows raise a stat, columns lower one, the diagonal is neutral. */
        #pafk-market-filters .pafk-nat-chart {
          display: grid;
          grid-template-columns: auto repeat(5, minmax(0, 1fr));
          gap: 4px;
        }
        #pafk-market-filters .pafk-nat-corner {
          align-self: center;
          color: #5b6b8c;
          font-size: 11px;
          line-height: 1.25;
        }
        #pafk-market-filters .pafk-nat-chart button.pafk-nat-head {
          min-height: 28px;
          padding: 2px 8px;
          border-color: #d8e4f5;
          border-radius: 6px;
          background: #f3f7fe;
          color: #2a3f73;
          font-size: 12px;
          white-space: nowrap;
        }
        #pafk-market-filters .pafk-nat-chart button.pafk-nat-head:hover { border-color: #8fb0e0; }
        #pafk-market-filters .pafk-nat-chart button.pafk-nat-head[aria-pressed="true"] { border-color: #1958b8; background: #dbe7fb; color: #12408a; }
        #pafk-market-filters .pafk-nat {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          min-height: 40px;
          padding: 3px 8px;
          border: 1px solid #d3e0f3;
          border-radius: 6px;
          background: #fff;
          line-height: 1.2;
          cursor: pointer;
          user-select: none;
        }
        #pafk-market-filters .pafk-nat:hover { border-color: #8fb0e0; background: #f6f9ff; }
        #pafk-market-filters .pafk-nat input {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: 0;
          opacity: 0;
          pointer-events: none;
        }
        #pafk-market-filters .pafk-nat span { font-weight: 700; overflow: hidden; text-overflow: ellipsis; }
        #pafk-market-filters .pafk-nat small { color: #5b6b8c; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        #pafk-market-filters .pafk-nat.is-neutral { border-style: dashed; background: #f8f9fc; }
        #pafk-market-filters .pafk-nat.is-neutral span { color: #5b6b8c; font-weight: 600; }
        #pafk-market-filters .pafk-nat:has(:checked) { border-color: #1958b8; background: #1958b8; }
        #pafk-market-filters .pafk-nat:has(:checked) :is(span, small) { color: #fff; }
        #pafk-market-filters .pafk-nat:has(:checked) small { opacity: .85; }
        #pafk-market-filters .pafk-nat:has(:focus-visible) { outline: 2px solid #1958b8; outline-offset: 2px; }
        #pafk-market-filters .pafk-nat[data-rec]::after {
          content: "★";
          position: absolute;
          top: 2px;
          right: 5px;
          color: #c46a00;
          font-size: 11px;
        }
        #pafk-market-filters .pafk-nat[data-rec]:has(:checked)::after { color: #ffd36b; }
        @container pafk-filters (max-width: 519px) {
          #pafk-market-filters .pafk-nat-chart { grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); }
          #pafk-market-filters :is(.pafk-nat-head, .pafk-nat-corner, .pafk-head-hint) { display: none; }
          #pafk-market-filters .pafk-iv { grid-template-columns: 70px 48px minmax(0, 1fr); }
        }
        #pafk-market-filters input[type="number"],
        :is(#pafk-market-filters, #pafk-tier-dialog) :is(button, select, input[type="search"]) {
          box-sizing: border-box;
          min-height: 40px;
          border: 1px solid #bed0ec;
          border-radius: 6px;
          padding: 4px 8px;
          font: inherit;
          color: inherit;
          background: #fff;
        }
        #pafk-market-filters input[type="number"] { width: 100%; font-variant-numeric: tabular-nums; }
        :is(#pafk-market-filters, #pafk-tier-dialog) button { cursor: pointer; font-weight: 700; padding-inline: 12px; }
        :is(#pafk-market-filters, #pafk-tier-dialog) button:disabled { cursor: default; opacity: .55; }
        :is(#pafk-market-filters, #pafk-tier-dialog) :focus-visible { outline: 2px solid #1958b8; outline-offset: 2px; }
        #pafk-market-filters .pafk-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 6px 16px;
          padding-top: 6px;
        }
        #pafk-market-filters .pafk-actions .pafk-form-hint { padding: 0; color: #5b6b8c; font-size: 12px; flex: 1 1 260px; }
        #pafk-market-filters p { margin: 0; padding: 0 12px 10px; }
        #pafk-market-filters .pafk-recommendation {
          border-top: 1px solid #d8e4f5;
          padding: 10px 12px 12px;
          background: #f6f9ff;
          border-radius: 0 0 9px 9px;
        }
        #pafk-market-filters .pafk-recommendation-title {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 10px;
          margin-bottom: 6px;
        }
        #pafk-market-filters .pafk-recommendation h4 { margin: 0; font-size: inherit; font-weight: 800; }
        #pafk-market-filters [data-build-reference] { color: #465982; }
        #pafk-market-filters .pafk-recommendation p { padding: 0 0 4px; text-wrap: pretty; }
        #pafk-market-filters .pafk-recommendation [data-branch] { display: inline-flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 7px; }
        #pafk-market-filters .pafk-recommendation summary { padding: 6px 0 8px; }
        #pafk-market-filters .pafk-recommendation details { margin-bottom: 5px; }
        #pafk-tier-dialog {
          box-sizing: border-box;
          width: min(62rem, calc(100vw - 24px));
          max-width: none;
          max-height: min(86vh, 46rem);
          padding: 0;
          border: 1px solid #bed0ec;
          border-radius: 12px;
          background: #fff;
          color: #152964;
          box-shadow: 0 5px 24px #10275240;
          font: inherit;
          font-size: 13px;
          overflow: auto;
        }
        #pafk-tier-dialog::backdrop { background: #17294761; }
        #pafk-tier-dialog .pafk-tier-header {
          position: sticky;
          top: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 12px;
          border-bottom: 1px solid #bed0ec;
          background: #f6f9ff;
        }
        #pafk-tier-dialog .pafk-tier-header h3 { margin: 0; text-wrap: balance; }
        #pafk-tier-dialog .pafk-tier-content { padding: 12px; }
        #pafk-tier-dialog p { margin: 0; text-wrap: pretty; }
        #pafk-tier-dialog a { color: #1859b4; }
        #pafk-tier-dialog .pafk-tier-controls {
          display: grid;
          grid-template-columns: minmax(150px, 2fr) minmax(130px, 1.4fr) repeat(3, minmax(88px, 1fr));
          gap: 8px;
          margin: 12px 0;
        }
        #pafk-tier-dialog .pafk-tier-controls label { display: grid; gap: 4px; min-width: 0; font-weight: 700; }
        #pafk-tier-dialog .pafk-tier-controls :is(input, select) { width: 100%; min-width: 0; }
        #pafk-tier-dialog .pafk-tier-table { overflow-x: auto; border: 1px solid #d8e4f5; border-radius: 6px; }
        #pafk-tier-dialog table { width: 100%; min-width: 600px; border-collapse: collapse; font-variant-numeric: tabular-nums; }
        #pafk-tier-dialog :is(th, td) { padding: 8px; text-align: start; }
        #pafk-tier-dialog thead { background: #eef4ff; }
        #pafk-tier-dialog tbody tr + tr { border-top: 1px solid #e2eaf7; }
        #pafk-tier-dialog .pafk-category-tag {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 999px;
          background: #ece6fb;
          color: #4d2d93;
          font-size: 11px;
          font-weight: 700;
          vertical-align: 1px;
        }
        .${TIER_BADGE} {
          display: inline-flex;
          align-items: stretch;
          gap: 3px;
          margin-inline-start: 8px;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.4;
          vertical-align: 2px;
          white-space: nowrap;
        }
        .pafk-tier-seg {
          display: inline-flex;
          align-items: baseline;
          gap: 3px;
          padding: 0 6px;
          border: 1px solid var(--pafk-tier-edge);
          border-radius: 6px;
          background: var(--pafk-tier-bg);
          color: var(--pafk-tier-fg);
          --pafk-tier-bg: #e4ebf5; --pafk-tier-fg: #34425c; --pafk-tier-edge: #c7d3e5;
        }
        .pafk-tier-seg small { font-size: 10px; font-weight: 700; opacity: .85; }
        .pafk-tier-seg b { font-weight: 900; }
        .pafk-tier-seg[data-tier="S"] { --pafk-tier-bg: #ffd6d6; --pafk-tier-fg: #8f1010; --pafk-tier-edge: #f2a3a3; }
        .pafk-tier-seg[data-tier="A"] { --pafk-tier-bg: #ffe3c7; --pafk-tier-fg: #8a4300; --pafk-tier-edge: #f5bd85; }
        .pafk-tier-seg[data-tier="B"] { --pafk-tier-bg: #fff2bd; --pafk-tier-fg: #6b5300; --pafk-tier-edge: #e8d27a; }
        .pafk-tier-seg[data-tier="C"] { --pafk-tier-bg: #dcf5cf; --pafk-tier-fg: #2b6312; --pafk-tier-edge: #a9da90; }
        .pafk-tier-seg[data-tier="D"] { --pafk-tier-bg: #d9e9ff; --pafk-tier-fg: #1c4c8c; --pafk-tier-edge: #a6c6ef; }
        #pafk-tier-dialog .${TIER_BADGE} { margin: 0; }
        #pafk-tier-dialog .pafk-tier-seg { min-width: 1.6em; justify-content: center; }
        .mk-spec-name .${TIER_BADGE} { margin: 0; font-size: 15px; }
        .mk-spec-name .pafk-tier-seg { padding: 2px 8px; }
        #pafk-tier-dialog .pafk-mode-switch { display: inline-flex; margin-bottom: 10px; }
        #pafk-tier-dialog .pafk-mode-switch button { border-radius: 0; }
        #pafk-tier-dialog .pafk-mode-switch button:first-child { border-radius: 6px 0 0 6px; }
        #pafk-tier-dialog .pafk-mode-switch button:last-child { border-radius: 0 6px 6px 0; border-inline-start: 0; }
        #pafk-tier-dialog .pafk-mode-switch [aria-pressed="true"] { background: #1958b8; border-color: #1958b8; color: #fff; }
        #pafk-tier-dialog details { margin: 8px 0; }
        #pafk-tier-dialog details summary { cursor: pointer; font-weight: 700; }
        #pafk-tier-dialog details p { margin-top: 6px; }
        #pafk-market-filters .pafk-mode-pick { display: inline-flex; align-items: center; gap: 6px; margin-inline-start: auto; font-weight: 700; }
        #pafk-market-filters .pafk-mode-pick select { min-height: 32px; }
        #pafk-market-filters .pafk-tier-sort { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; padding: 0 12px 10px; }
        #pafk-market-filters .pafk-tier-sort label { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; }
        #pafk-market-filters .pafk-tier-sort [role="status"] { color: #465982; font-variant-numeric: tabular-nums; }
        .mk-main[data-pafk-sorted] :is(.mk-sptable, .mk-grid, .mk-pager):not([data-pafk], [data-pafk] *) { display: none !important; }
        #pafk-tier-sorted .pafk-sort-group {
          grid-column: 1 / -1; display: flex; align-items: center; gap: 8px;
          margin: 10px 0 4px; padding: 6px 10px; border-radius: 8px;
          background: #eef4ff; color: #152964; font-weight: 800;
        }
        #pafk-tier-sorted .pafk-sort-group .${TIER_BADGE} { margin: 0; font-size: 14px; }
        #pafk-tier-sorted .pafk-sort-group small { margin-inline-start: auto; color: #465982; font-weight: 600; }
        :is(.mx-row-main, .mx-card-txt) > .${TIER_BADGE} { align-self: flex-start; margin: 2px 0 0; font-size: 10px; line-height: 1.3; }
        :is(.mx-row-main, .mx-card-txt) > .${TIER_BADGE} .pafk-tier-seg { padding: 0 4px; }
        :is(.mx-row-main, .mx-card-txt) > .${TIER_BADGE} .pafk-tier-seg small { font-size: 9px; }
        .lab-tags .${TIER_BADGE} { margin-inline-start: 2px; align-self: center; }
        .lab-panel.pafk-sheet { grid-column: 1 / -1; --section-color: #1958b8; --section-bg: #eef4ff; }
        .pafk-sheet .pafk-sheet-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 8px 16px; }
        .pafk-sheet .pafk-sheet-ref { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: #152964; }
        .pafk-sheet .pafk-sheet-ref select { min-height: 32px; border: 1px solid #bed0ec; border-radius: 6px; padding: 2px 8px; font: inherit; background: #fff; color: inherit; }
        .pafk-sheet .pafk-sheet-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; margin-top: 10px; }
        .pafk-sheet .pafk-sheet-refnote { margin: 8px 0 0; color: #465982; }
        .pafk-sheet .pafk-sheet-col { padding: 10px 12px; border: 1px solid #d8e4f5; border-radius: 10px; background: #f6f9ff; color: #152964; min-width: 0; }
        .pafk-sheet .pafk-sheet-title { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 8px; }
        .pafk-sheet .pafk-sheet-title .${TIER_BADGE} { margin: 0; }
        .pafk-sheet .pafk-sheet-title > span:last-child { color: #465982; font-variant-numeric: tabular-nums; }
        .pafk-sheet .pafk-sheet-moves { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0 0 8px; padding: 0; list-style: none; }
        .pafk-sheet .pafk-sheet-moves li { padding: 6px 8px; border: 1px solid #c9d8ef; border-radius: 6px; background: #fff; font-weight: 700; overflow-wrap: anywhere; }
        .pafk-sheet .pafk-sheet-moves li.is-known { border-color: #8fcf9f; background: #ecf9ef; color: #1d6b34; }
        .pafk-sheet .pafk-sheet-moves li.is-known::before { content: '✓ '; }
        .pafk-sheet .pafk-sheet-col p { margin: 0 0 4px; text-wrap: pretty; }
        .pafk-sheet .pafk-sheet-col p > span { color: #465982; }
        .pafk-sheet .pafk-sheet-sum { color: #465982; font-variant-numeric: tabular-nums; }
        .pafk-sheet .pafk-sheet-note { margin-top: 6px !important; font-size: 12px; color: #465982; }
        #pafk-market-filters .pafk-fill-hint { padding: 6px 0 0; color: #465982; }
        #pafk-tier-dialog .pafk-tier-pagination {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 10px;
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 600px) {
          #pafk-tier-dialog .pafk-tier-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          #pafk-tier-dialog .pafk-tier-controls label:first-child { grid-column: span 2; }
        }
      `;
      document.head.append(style);
    }

    // ==== src/market/state.js ====
    // Estado do painel do mercado e resultado dos filtros.
    function showResults(list, nativeNature) {
      const active = filters.natures.size + filters.minimums.size;
      const rows = list ? [...list.querySelectorAll(OFFER_ROW)] : [];
      let matched = 0;
      let unknown = 0;
      for (const row of rows) {
        const result = active ? matchOffer(readOffer(row), filters) : true;
        row.toggleAttribute(FILTERED_ATTR, result === false);
        if (result === true) matched++;
        if (result === null) unknown++;
      }
      let message = '';
      if (active && rows.length) {
        message = matched
          ? `${matched} de ${rows.length} anúncios carregados passam pelos filtros.`
          : 'Nenhum anúncio carregado atende aos filtros.';
        if (unknown) message += ` Anúncios sem dados suficientes: ${unknown}.`;
      }
      if (filters.natures.size && NATURES.includes(nativeNature)) {
        message += ` O filtro do jogo está em ${nativeNature}. Selecione “Todas as naturezas” nele para combinar várias.`;
      }
      const status = panel.querySelector('[data-status]');
      status.hidden = !message;
      if (status.textContent !== message) status.textContent = message;
    }

    let scope = null;
    let recommendationDex = null;
    let tierDialog = null;
    let filters = emptyFilters();
    let pending = false;
    let stylesInstalled = false;
    const panel = createPanel(next => {
      if (!scope || !panel.isConnected) return;
      filters = next;
      saveFilters(scope, filters);
      syncMarket();
    });
    const form = panel.querySelector('form');
    const title = panel.querySelector('h3');
    const groupedHint = panel.querySelector('[data-grouped-hint]');

    function ensureStyles() {
      if (stylesInstalled) return;
      installStyles();
      stylesInstalled = true;
    }

    // ==== src/market/tier-sort.js ====
    // ---- Sorting the grouped species list by tier ----------------------------------------------
    // The game sorts and paginates on its server (12 species per page) and has no tier order, so
    // the script walks the pages with the current filters, copies the rows and shows them in one list.
    // Copies stay inside the market, where the game's own click handler opens the species.
    const TIER_SORT_KEY = 'pokeafk-market-filtros:tier-sort';
    const SPECIES_ROWS = '.mk-sptable .mk-itr.mk-spr, .mk-grid > article.mk-sp';
    let tierSortMode = '';
    try {
      const saved = localStorage.getItem(TIER_SORT_KEY);
      tierSortMode = saved in MODES ? saved : '';
    } catch {
      // Without storage the choice lasts only for this page.
    }
    let tierSortCache = null;
    let tierSortBusy = false;
    let tierSortToken = 0;
    const tierSortBox = panel.querySelector('[data-tier-sort-box]');
    const tierSortSelect = panel.querySelector('[data-tier-sort]');
    const tierSortStatus = panel.querySelector('[data-tier-sort-status]');
    tierSortSelect.value = tierSortMode;
    tierSortSelect.addEventListener('change', () => {
      tierSortMode = tierSortSelect.value;
      try {
        if (tierSortMode) localStorage.setItem(TIER_SORT_KEY, tierSortMode);
        else localStorage.removeItem(TIER_SORT_KEY);
      } catch {
        // Ignored: see above.
      }
      syncMarket();
    });

    const marketMain = () => document.querySelector('.mk > .mk-main');
    const gameRows = main => [...main.querySelectorAll(SPECIES_ROWS)].filter(row => !row.closest('[data-pafk]'));
    const currentPage = main => {
      const current = main.querySelector('.mk-pager .mk-pg[aria-current="page"]');
      return current ? Number(current.textContent) - 1 : 0;
    };
    const firstPageSignature = main => [
      main.querySelector('.mk-count')?.textContent.trim() ?? '',
      main.querySelector('.mk-sptable') ? 'list' : 'cards',
      gameRows(main).map(row => row.querySelector('.mk-sp-go')?.dataset.species).join(','),
    ].join('|');

    function waitFor(test, timeout = 8000) {
      return new Promise(resolve => {
        const started = performance.now();
        const check = () => {
          if (test()) return resolve(true);
          if (performance.now() - started > timeout) return resolve(false);
          setTimeout(check, 120);
        };
        check();
      });
    }

    async function openPage(index) {
      const main = marketMain();
      const button = main?.querySelector(`.mk-pager .mk-pg[data-pg="${index}"]`);
      if (!button || button.disabled) return false;
      button.click();
      return waitFor(() => {
        const now = marketMain();
        return now && currentPage(now) === index && gameRows(now).length > 0;
      });
    }

    async function collectTierSort() {
      const token = ++tierSortToken;
      tierSortBusy = true;
      tierSortStatus.textContent = 'Lendo as páginas do mercado…';
      try {
        let main = marketMain();
        if (currentPage(main) !== 0 && !(await openPage(0))) throw new Error('first page');
        main = marketMain();
        const signature = firstPageSignature(main);
        const list = Boolean(main.querySelector('.mk-sptable'));
        const head = main.querySelector('.mk-sptable .mk-ithead')?.outerHTML ?? '';
        const rows = new Map();
        for (let page = 0; page < 300; page++) {
          if (token !== tierSortToken) return;
          main = marketMain();
          for (const row of gameRows(main)) {
            const dex = row.querySelector('.mk-sp-go')?.dataset.species;
            if (dex && !rows.has(dex)) rows.set(dex, row.cloneNode(true));
          }
          tierSortStatus.textContent = `Lendo as páginas do mercado: ${page + 1}…`;
          const next = main.querySelector('.mk-pager .mk-pg[aria-label="Próxima página"]');
          if (!next || next.disabled) break;
          if (!(await openPage(page + 1))) break;
        }
        if (currentPage(marketMain()) !== 0) await openPage(0);
        if (token !== tierSortToken) return;
        tierSortCache = { signature, list, head, rows: [...rows.entries()] };
        tierSortStatus.textContent = `${rows.size} espécies ordenadas`;
      } catch {
        tierSortCache = null;
        tierSortStatus.textContent = 'Não consegui ler as páginas. Tente de novo.';
      } finally {
        if (token === tierSortToken) tierSortBusy = false;
      }
      syncMarket();
    }

    function renderTierSort(main) {
      const { list, head, rows } = tierSortCache;
      const mode = tierSortMode;
      const groups = new Map([...TIERS, '—'].map(tier => [tier, []]));
      for (const [dex, row] of rows) {
        const profile = speciesRating(dex, mode);
        groups.get(profile ? profile[mode].tier : '—').push({ row, score: profile ? profile[mode].score : -1 });
      }
      const container = document.createElement('div');
      container.id = 'pafk-tier-sorted';
      container.dataset.pafk = '';
      container.dataset.mode = mode;
      const body = document.createElement('div');
      if (list) {
        container.className = 'mk-itable mk-sptable';
        container.setAttribute('role', 'table');
        container.setAttribute('aria-label', 'Pokémon à venda, pela tier list');
        container.insertAdjacentHTML('beforeend', head);
        body.className = 'mk-itbody';
        body.setAttribute('role', 'rowgroup');
      } else {
        body.className = 'mk-grid';
      }
      for (const [tier, members] of groups) {
        if (!members.length) continue;
        members.sort((a, b) => b.score - a.score);
        const heading = document.createElement('div');
        heading.className = 'pafk-sort-group';
        if (list) heading.setAttribute('role', 'row');
        const label = tier === '—' ? 'Sem tier' : `Tier ${tier}`;
        heading.innerHTML = `<span class="${TIER_BADGE}"></span><b></b><small></small>`;
        if (tier !== '—') heading.firstChild.append(tierSegment(mode, tier, false));
        else heading.firstChild.remove();
        heading.querySelector('b').textContent = `${label} · ${MODES[mode].label}`;
        heading.querySelector('small').textContent = `${members.length} ${members.length === 1 ? 'espécie' : 'espécies'}`;
        body.append(heading, ...members.map(member => member.row.cloneNode(true)));
      }
      container.append(body);
      return container;
    }

    function syncTierSort(main, grouped) {
      tierSortBox.hidden = !grouped;
      const active = Boolean(grouped && tierSortMode);
      const current = main.querySelector('#pafk-tier-sorted');
      if (!active) {
        tierSortToken++;
        tierSortBusy = false;
        tierSortStatus.textContent = '';
        current?.remove();
        delete main.dataset.pafkSorted;
        return;
      }
      if (tierSortBusy) return;
      const onFirstPage = currentPage(main) === 0;
      const gameList = gameRows(main).length ? gameRows(main)[0].closest('.mk-sptable, .mk-grid') : null;
      if (!gameList) return;
      if (!tierSortCache || (onFirstPage && tierSortCache.signature !== firstPageSignature(main))) {
        current?.remove();
        delete main.dataset.pafkSorted;
        collectTierSort();
        return;
      }
      main.dataset.pafkSorted = '';
      if (current?.dataset.mode === tierSortMode && current.previousElementSibling === gameList) return;
      current?.remove();
      gameList.after(renderTierSort(main));
      decorateTierBadges();
    }

    // ==== src/tiers/observer.js ====
    // Sincronização com a tela do jogo: um único MutationObserver para mercado, MAPA e ficha.
    function syncAll() {
      if (document.querySelector('.mk, .modal .mx-row, .modal .mx-card, .lab[data-lab-dex]')) ensureStyles();
      decorateMap();
      decorateSheet();
      syncMarket();
    }

    function syncMarket() {
      if (document.querySelector('.mk')) {
        ensureStyles();
        decorateTierBadges();
      }
      const main = document.querySelector('.mk > .mk-main');
      const speciesTools = main?.querySelector(':scope > .mk-offer-tools');
      const species = main?.querySelector(':scope > .mk-spec');
      const market = main?.parentElement;
      const isPokemonBrowse = market?.matches('[data-page="mons"]')
        && market.querySelector('[data-tkind="mons"][aria-pressed="true"]');
      const browseTools = isPokemonBrowse && main.querySelector(':scope > .mk-tools-bar');
      const dex = species?.querySelector('.mk-dexno')?.textContent.trim().match(/^#(\d+)$/)?.[1];
      const isSpecies = Boolean(speciesTools && dex);
      if (!isSpecies && !browseTools) {
        scope = null;
        tierDialog?.close();
        panel.remove();
        return;
      }

      const grouped = browseTools && market.querySelector('[data-grouped][aria-pressed="true"]');
      const nextScope = isSpecies ? `species:${Number(dex)}` : (grouped ? null : 'all');

      if (isSpecies) {
        if (species.previousElementSibling !== panel) species.before(panel);
      } else if (browseTools.nextElementSibling !== panel) {
        browseTools.after(panel);
      }
      if (scope !== nextScope) {
        scope = nextScope;
        filters = nextScope ? readFilters(nextScope) : emptyFilters();
        loadForm(form, filters);
      }
      const nextDex = isSpecies ? Number(dex) : null;
      if (recommendationDex !== nextDex) {
        recommendationDex = nextDex;
        updateRecommendation(nextDex);
      }

      const speciesName = species?.querySelector('h2')?.textContent.trim();
      const heading = speciesName ? `Filtros de ${speciesName}` : 'Filtros de Pokémon';
      if (title.textContent !== heading) title.textContent = heading;
      form.hidden = !scope;
      groupedHint.hidden = Boolean(scope);
      const nativeNature = speciesTools?.querySelector('[aria-label="Natureza"]')?.textContent.trim();
      showResults(main.querySelector(OFFER_LIST), nativeNature);
      syncTierSort(main, Boolean(browseTools && grouped));
    }

    // Market, MAPA and FICHA DO POKÉMON all live in game windows (.mk inside .modal).
    const WATCHED = '.mk, .modal';
    const observer = new MutationObserver(records => {
      const relevant = records.some(({ target, addedNodes, removedNodes }) => {
        const element = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
        if (panel.contains(element) || tierDialog?.contains(element)) return false;
        if (element?.closest(`[data-pafk], .${TIER_BADGE}`)) return false;
        const changed = [...addedNodes, ...removedNodes];
        if (changed.length && changed.every(node => node.nodeType === Node.ELEMENT_NODE
          && (node.hasAttribute('data-pafk') || node.classList.contains(TIER_BADGE)))) return false;
        if (element?.closest(WATCHED)) return true;
        return changed.some(node => node.nodeType === Node.ELEMENT_NODE
          && (node.matches(WATCHED) || node.querySelector(WATCHED)));
      });
      if (pending || !relevant) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        syncAll();
      });
    });
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['aria-pressed', 'data-page'],
    });
    syncAll();
  })();

  if (moduleEnabled('daily')) (() => {
    // ==== src/daily.js ====
    // ---- Fazer daily ---------------------------------------------------------------------------
    // Fights the trainers of the day whose level sits between the main Pokémon's level and 10 below.
    // The route comes from the MAPA's NPC list (sorted by XP, which also marks the locked ones),
    // grouped by place. Each fight: open MAPA → NPCs → pick the trainer → "Teleportar até lá" →
    // talk key → LUTAR → wait for the result → CONTINUAR. Any input from the player, a timeout or
    // something unexpected stops the loop.
    (() => {
      // Levels below the main Pokémon; the player can change it in the card.
      const DEFAULT_RANGE = 10;
      const MAX_RANGE = 99;
      const RANGE_STORAGE = 'pokeafk-market-filtros:daily-range';
      const FIGHT_TIMEOUT = 10 * 60 * 1000;
      const KEYS_STORAGE = 'pokeafk.ui.keys';
      const HEAL_BELOW = 0.5;
      // Trainers in a row where the game did not react before the daily gives up.
      const MAX_UNREACHABLE_STREAK = 4;

      class Stop extends Error {}
      let run = null;

      const box = document.createElement('section');
      box.id = 'pafk-daily';
      box.dataset.pafk = '';
      box.setAttribute('aria-label', 'Daily de treinadores');
      box.innerHTML = `
        <button type="button" class="pafk-daily-toggle" aria-expanded="false" data-daily-toggle>
          <span aria-hidden="true">⚔</span> Daily
        </button>
        <div class="pafk-daily-body" hidden data-daily-body>
          <header>
            <strong title="Arraste para mover; clique duas vezes para voltar ao lugar">Treinadores do dia</strong>
            <button type="button" class="pafk-daily-x" aria-label="Fechar" data-daily-toggle>✕</button>
          </header>
          <label class="pafk-daily-levels">
            Lutar até
            <input type="number" min="0" max="${MAX_RANGE}" step="1" value="${DEFAULT_RANGE}" inputmode="numeric" data-daily-levels>
            níveis abaixo do principal
            <small>Sugerido: ${DEFAULT_RANGE}.</small>
          </label>
          <p class="pafk-daily-range" data-daily-range>Faixa: nível do Pokémon principal até ${DEFAULT_RANGE} abaixo.</p>
          <label class="pafk-daily-avoid">
            <input type="checkbox" data-daily-avoid checked>
            Evitar times com vantagem de tipo
            <small>O time de cada treinador é aprendido na primeira luta.</small>
          </label>
          <div class="pafk-daily-progress" hidden data-daily-progress>
            <div class="pafk-daily-count"><strong data-daily-left></strong><span data-daily-total></span></div>
            <div class="pafk-daily-bar" role="progressbar" aria-valuemin="0" data-daily-bar><i></i></div>
          </div>
          <p class="pafk-daily-status" role="status" aria-live="polite" data-daily-status></p>
          <ol class="pafk-daily-route" hidden data-daily-route></ol>
          <div class="pafk-daily-actions">
            <button type="button" class="pafk-daily-go" data-daily-go>Fazer daily</button>
            <button type="button" class="pafk-daily-stop" hidden data-daily-stop>Parar</button>
          </div>
        </div>`;
      const body = box.querySelector('[data-daily-body]');
      const goButton = box.querySelector('[data-daily-go]');
      const stopButton = box.querySelector('[data-daily-stop]');
      const statusEl = box.querySelector('[data-daily-status]');
      const rangeEl = box.querySelector('[data-daily-range]');
      const progressEl = box.querySelector('[data-daily-progress]');
      const routeEl = box.querySelector('[data-daily-route]');
      const avoidBox = box.querySelector('[data-daily-avoid]');
      const levelsInput = box.querySelector('[data-daily-levels]');

      const style = document.createElement('style');
      style.dataset.pafk = '';
      style.textContent = `
        #pafk-daily {
          position: fixed; right: 8px; top: 96px; z-index: 40;
          display: flex; flex-direction: column; align-items: flex-end;
          font: 13px/1.35 system-ui, sans-serif; color: #152964;
        }
        #pafk-daily [hidden] { display: none !important; }
        #pafk-daily button { font: inherit; cursor: pointer; }
        #pafk-daily .pafk-daily-toggle {
          border: 1px solid #bed0ec; border-radius: 999px; background: #fff; color: #152964;
          padding: 6px 12px; font-weight: 800; box-shadow: 0 2px 8px rgb(0 0 0 / .18);
        }
        #pafk-daily[data-running] .pafk-daily-toggle { background: #2459aa; border-color: #2459aa; color: #fff; }
        #pafk-daily .pafk-daily-body {
          box-sizing: border-box; width: min(290px, calc(100vw - 24px)); margin-top: 6px;
          border: 1px solid #bed0ec; border-radius: 10px; background: #fff; padding: 10px 12px 12px;
          box-shadow: 0 6px 20px rgb(0 0 0 / .22); display: grid; gap: 8px;
        }
        #pafk-daily header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        #pafk-daily :is(.pafk-daily-toggle, .pafk-daily-body > header) { cursor: grab; touch-action: none; user-select: none; }
        #pafk-daily[data-dragging] :is(.pafk-daily-toggle, .pafk-daily-body > header) { cursor: grabbing; }
        #pafk-daily .pafk-daily-x { cursor: pointer; }
        #pafk-daily .pafk-daily-x { border: 0; background: none; color: #4a5f8f; padding: 2px 4px; }
        #pafk-daily p { margin: 0; }
        #pafk-daily .pafk-daily-range { color: #4a5f8f; font-size: 12px; }
        #pafk-daily .pafk-daily-levels { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; }
        #pafk-daily .pafk-daily-levels input {
          width: 4.5em; box-sizing: border-box; padding: 3px 6px; font: inherit; font-weight: 700;
          color: #152964; border: 1px solid #bed0ec; border-radius: 6px; background: #fff;
          font-variant-numeric: tabular-nums;
        }
        #pafk-daily .pafk-daily-levels input:focus-visible { outline: 2px solid #2459aa; outline-offset: 1px; }
        #pafk-daily .pafk-daily-levels input:disabled { background: #eef2f9; color: #4a5f8f; }
        #pafk-daily .pafk-daily-levels small { flex-basis: 100%; color: #4a5f8f; font-size: 11px; }
        #pafk-daily .pafk-daily-avoid { display: grid; grid-template-columns: auto 1fr; gap: 0 6px; align-items: center; cursor: pointer; }
        #pafk-daily .pafk-daily-avoid input { margin: 0; }
        #pafk-daily .pafk-daily-avoid small { grid-column: 2; color: #4a5f8f; font-size: 11px; }
        #pafk-daily .pafk-daily-route li:is([data-state="avoided"], [data-state="unreachable"], [data-state="closed"]) { opacity: .6; }
        #pafk-daily .pafk-daily-route li[data-state="avoided"] b { color: #b35c00; }
        #pafk-daily .pafk-daily-count { display: flex; justify-content: space-between; gap: 8px; font-variant-numeric: tabular-nums; }
        #pafk-daily .pafk-daily-count span { color: #4a5f8f; }
        #pafk-daily .pafk-daily-bar { height: 8px; border-radius: 4px; background: #e3ebf7; overflow: hidden; margin-top: 4px; }
        #pafk-daily .pafk-daily-bar i { display: block; height: 100%; width: 0; background: #2f9e44; transition: width .3s; }
        #pafk-daily .pafk-daily-status { min-height: 1.35em; }
        #pafk-daily .pafk-daily-route {
          margin: 0; padding: 0; list-style: none; max-height: 180px; overflow: auto;
          border-top: 1px solid #e3ebf7; font-size: 12px;
        }
        #pafk-daily .pafk-daily-route li {
          display: grid; grid-template-columns: 1fr auto; gap: 0 8px; padding: 4px 0;
          border-bottom: 1px solid #eef2f9;
        }
        #pafk-daily .pafk-daily-route li small { grid-column: 1; color: #4a5f8f; }
        #pafk-daily .pafk-daily-route li b { grid-row: 1 / span 2; grid-column: 2; align-self: center; font-weight: 700; }
        #pafk-daily .pafk-daily-route li[data-state="current"] { background: #eef4ff; }
        #pafk-daily .pafk-daily-route li[data-state="won"] b { color: #2f9e44; }
        #pafk-daily .pafk-daily-route li[data-state="lost"] b,
        #pafk-daily .pafk-daily-route li[data-state="skipped"] b { color: #c92a2a; }
        #pafk-daily .pafk-daily-actions { display: flex; gap: 8px; }
        #pafk-daily .pafk-daily-actions button {
          flex: 1; border-radius: 8px; padding: 7px 10px; font-weight: 800; border: 1px solid #2459aa;
        }
        #pafk-daily .pafk-daily-go { background: #2459aa; color: #fff; }
        #pafk-daily .pafk-daily-go:disabled { opacity: .55; cursor: default; }
        #pafk-daily .pafk-daily-stop { background: #fff; color: #c92a2a; border-color: #c92a2a !important; }
      `;
      document.head.append(style);
      document.body.append(box);

      // Until the player drags it, it sits under the game's quick actions column (CAÇAR, Poke
      // Center, Poke Market). A dragged position is kept, anchored by the top right corner.
      const POSITION_STORAGE = 'pokeafk-market-filtros:daily-pos';
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(POSITION_STORAGE) ?? 'null');
      } catch {
        saved = null;
      }
      function clampPosition({ right, top }) {
        const width = box.querySelector('.pafk-daily-toggle').offsetWidth || 80;
        return {
          right: Math.min(Math.max(0, right), Math.max(0, innerWidth - width)),
          top: Math.min(Math.max(0, top), Math.max(0, innerHeight - 40)),
        };
      }
      function placeBox() {
        let position;
        if (saved) {
          position = clampPosition(saved);
        } else {
          const rect = document.querySelector('.hud.world-hud .hud-quick')?.getBoundingClientRect();
          const visible = rect && rect.width > 0;
          position = {
            top: visible ? Math.round(rect.bottom + 6) : 96,
            right: visible ? Math.max(8, Math.round(innerWidth - rect.right)) : 8,
          };
        }
        box.style.top = `${position.top}px`;
        box.style.right = `${position.right}px`;
      }
      placeBox();
      setInterval(placeBox, 1000);
      addEventListener('resize', placeBox);

      // Drag by the "Daily" button or the panel header. A short move still counts as a click.
      let dragged = false;
      for (const handle of box.querySelectorAll('.pafk-daily-toggle, .pafk-daily-body > header')) {
        handle.addEventListener('pointerdown', event => {
          if (event.button !== 0 || event.target.closest('.pafk-daily-x')) return;
          const start = { x: event.clientX, y: event.clientY };
          const origin = { right: parseFloat(box.style.right) || 0, top: parseFloat(box.style.top) || 0 };
          let moving = false;
          dragged = false;
          handle.setPointerCapture(event.pointerId);
          const move = moveEvent => {
            const dx = moveEvent.clientX - start.x;
            const dy = moveEvent.clientY - start.y;
            if (!moving && Math.hypot(dx, dy) < 5) return;
            moving = true;
            box.dataset.dragging = '';
            saved = clampPosition({ right: origin.right - dx, top: origin.top + dy });
            placeBox();
          };
          const end = () => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', end);
            handle.removeEventListener('pointercancel', end);
            delete box.dataset.dragging;
            if (!moving) return;
            dragged = true;
            try {
              localStorage.setItem(POSITION_STORAGE, JSON.stringify(saved));
            } catch {
              // The position lasts only for this page.
            }
          };
          handle.addEventListener('pointermove', move);
          handle.addEventListener('pointerup', end);
          handle.addEventListener('pointercancel', end);
        });
      }
      // Double-clicking the header puts the card back under the game's buttons.
      box.querySelector('.pafk-daily-body > header').addEventListener('dblclick', () => {
        saved = null;
        try {
          localStorage.removeItem(POSITION_STORAGE);
        } catch {
          // Nothing to forget.
        }
        placeBox();
      });

      for (const toggle of box.querySelectorAll('[data-daily-toggle]')) {
        toggle.addEventListener('click', () => {
          if (dragged) {
            dragged = false;
            return;
          }
          body.hidden = !body.hidden;
          box.querySelector('.pafk-daily-toggle').setAttribute('aria-expanded', String(!body.hidden));
          if (!body.hidden && !run) showRange();
        });
      }

      // ---- Reading the game ----
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const text = element => element?.textContent.replace(/\s+/g, ' ').trim() ?? '';
      const fold = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
      // The list shows "PESCADOR DALE"; the challenge shows the class and the name apart.
      const sameTrainer = (full, foe) => fold(full) === fold(foe) || fold(full).endsWith(` ${fold(foe)}`);

      function mainPokemon() {
        const button = $('button.hud-active-button');
        const label = button?.getAttribute('aria-label') ?? '';
        const match = label.match(/Resumo de (.+), nível (\d+)/i);
        const dex = Number(button?.querySelector('img.front')?.getAttribute('src')?.match(/\/(\d+)[^/]*\.png/)?.[1] ?? 0);
        return match ? { name: match[1], level: Number(match[2]), dex } : null;
      }

      // ---- Trainer teams and type edge ----
      // The client only learns a trainer's team in battle, so each fight saves the opposing
      // Pokémon (the arena's red card shows the one in play). Trainers repeat daily.
      const TEAMS_STORAGE = 'pokeafk-market-filtros:npc-teams';
      const AVOID_STORAGE = 'pokeafk-market-filtros:daily-avoid';
      const SPECIES_TYPES = MARKET_GUIDE.types ?? {};
      const TYPE_CHART = {
        normal: { half: ['rock', 'steel'], zero: ['ghost'] },
        fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
        water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
        electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
        grass: { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
        ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
        fighting: { double: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug'], zero: ['ghost'] },
        poison: { double: ['grass'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
        ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
        flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
        psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
        bug: { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel'] },
        rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
        ghost: { double: ['psychic', 'ghost'], half: ['dark', 'steel'], zero: ['normal'] },
        dragon: { double: ['dragon'], half: ['steel'] },
        dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'steel'] },
        steel: { double: ['ice', 'rock'], half: ['fire', 'water', 'electric', 'steel'] },
      };
      const typesOf = dex => (SPECIES_TYPES[dex] ?? '').split('/').filter(Boolean);
      const TYPE_NAMES = {
        normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico', grass: 'Planta', ice: 'Gelo',
        fighting: 'Lutador', poison: 'Veneno', ground: 'Terra', flying: 'Voador', psychic: 'Psíquico',
        bug: 'Inseto', rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio', steel: 'Aço',
      };
      function multiplier(attack, defenders) {
        const row = TYPE_CHART[attack] ?? {};
        return defenders.reduce((total, type) => total * (row.double?.includes(type) ? 2
          : row.half?.includes(type) ? 0.5 : row.zero?.includes(type) ? 0 : 1), 1);
      }

      function readTeams() {
        try {
          return JSON.parse(localStorage.getItem(TEAMS_STORAGE) ?? '{}') ?? {};
        } catch {
          return {};
        }
      }
      function saveTeam(npc, dexes) {
        if (!dexes.length) return;
        const teams = readTeams();
        teams[npc.id] = { name: npc.name, dex: [...dexes], at: new Date().toISOString().slice(0, 10) };
        try {
          localStorage.setItem(TEAMS_STORAGE, JSON.stringify(teams));
        } catch {
          // Without storage the team is learned again next time.
        }
      }
      // The type of the known team that hits the main Pokémon super effectively, if any.
      function typeEdge(npc, mainDex) {
        const defenders = typesOf(mainDex);
        const team = readTeams()[npc.id]?.dex ?? [];
        if (!defenders.length) return null;
        for (const dex of team) {
          const strong = typesOf(dex).find(type => multiplier(type, defenders) >= 2);
          if (strong) return strong;
        }
        return null;
      }
      // Dex of the opposing Pokémon in play, from the arena's red card icon.
      try {
        avoidBox.checked = localStorage.getItem(AVOID_STORAGE) !== 'off';
      } catch {
        // Defaults to on.
      }
      avoidBox.addEventListener('change', () => {
        try {
          localStorage.setItem(AVOID_STORAGE, avoidBox.checked ? 'on' : 'off');
        } catch {
          // The choice lasts only for this page.
        }
      });

      // How many levels below the main Pokémon to fight (whole number, 0–MAX_RANGE).
      function cleanRange(value) {
        const number = Math.round(Number(value));
        return Number.isFinite(number) && String(value).trim() !== ''
          ? Math.min(MAX_RANGE, Math.max(0, number))
          : DEFAULT_RANGE;
      }
      const levelRange = () => cleanRange(levelsInput.value);
      try {
        const saved = localStorage.getItem(RANGE_STORAGE);
        if (saved !== null) levelsInput.value = String(cleanRange(saved));
      } catch {
        // Defaults to the suggested range.
      }
      levelsInput.addEventListener('input', () => showRange());
      // Typing a number must not reach the game's hotkeys.
      for (const type of ['keydown', 'keyup', 'keypress']) {
        levelsInput.addEventListener(type, event => event.stopPropagation());
      }
      levelsInput.addEventListener('change', () => {
        levelsInput.value = String(levelRange());
        showRange();
        try {
          localStorage.setItem(RANGE_STORAGE, levelsInput.value);
        } catch {
          // The choice lasts only for this page.
        }
      });

      function foeInPlay() {
        const card = $$('.ah-card').find(element => element.querySelector('.ah-name.red'));
        const icon = card?.querySelector('.ah-mon-ic')?.getAttribute('style') ?? '';
        return Number(icon.match(/\/(\d+)[^/)"']*\.png/)?.[1] ?? 0);
      }
      const mapWindow = () => $('.modal.mapa-open');
      const inArena = () => Boolean($('.in-arena'));
      const resultWindow = () => $('.ah-result[data-result]');
      const challenge = () => $('.b5-challenge');

      function isHunting() {
        const button = $('.hud-act.hunt[data-act="hunt"]');
        if (!button) return false;
        return button.classList.contains('on') || button.getAttribute('aria-pressed') === 'true'
          || /parar/i.test(text(button.querySelector('.hud-act-l')));
      }

      function talkKey() {
        try {
          const keys = JSON.parse(localStorage.getItem(KEYS_STORAGE) ?? 'null');
          if (keys && typeof keys.talk === 'string' && keys.talk) return keys.talk;
        } catch {
          // The game's default binding is used below.
        }
        return 'Z';
      }

      // ---- Run control ----
      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
      function alive() {
        if (!run || run.stopped) throw new Stop(run?.reason ?? 'Parado.');
      }
      async function pause(min = 300, max = 800) {
        await sleep(min + Math.random() * (max - min));
        alive();
      }
      async function until(test, timeout, what) {
        const started = performance.now();
        for (;;) {
          alive();
          let value;
          try {
            value = test();
          } catch {
            value = null;
          }
          if (value) return value;
          if (performance.now() - started > timeout) throw new Error(`O jogo não respondeu: ${what}.`);
          await sleep(150);
        }
      }
      function stop(reason) {
        if (!run || run.stopped) return;
        run.stopped = true;
        run.reason = reason;
      }
      function setStatus(message) {
        statusEl.textContent = message;
      }

      // The player taking over stops the loop. Clicks and keys sent by the script are not trusted.
      const onPlayerInput = event => {
        // The account monitor (pokeafk-monitor.user.js) is not the game either.
        if (!run || !event.isTrusted || box.contains(event.target)
          || (event.target instanceof Element && event.target.closest('#pafk-monitor'))) return;
        stop('Parado porque você usou o jogo.');
      };
      addEventListener('pointerdown', onPlayerInput, true);
      addEventListener('keydown', onPlayerInput, true);

      // ---- MAPA ----
      async function openNpcList() {
        if (!mapWindow()) {
          const button = $('.hud.world-hud > nav.hud-topbar > [data-act="map"]') ?? $('[aria-label="MAPA"]');
          if (!button) throw new Error('Botão MAPA não encontrado.');
          button.click();
          await until(() => mapWindow()?.querySelector('[data-list="npcs"]'), 10000, 'abrir o MAPA');
          await pause(150, 350);
        }
        const map = mapWindow();
        const tab = map.querySelector('[data-list="npcs"]');
        if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
        await until(() => {
          const list = mapWindow()?.querySelector('.mx-list');
          return list && (list.querySelector('.mx-row.npc') || list.querySelector('.mx-empty'));
        }, 10000, 'carregar a lista de NPCs');
        return mapWindow();
      }

      async function closeMap() {
        const map = mapWindow();
        if (!map) return;
        const close = map.querySelector('[aria-label="Fechar"], .close, [data-close]');
        if (close) close.click();
        else dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await until(() => !mapWindow(), 5000, 'fechar o MAPA');
      }

      async function chooseRegion(id) {
        const map = mapWindow();
        const tab = map.querySelector(`.mx-tab[data-region="${CSS.escape(id)}"]`);
        if (!tab || tab.classList.contains('on')) return;
        tab.click();
        await until(() => mapWindow()?.querySelector(`.mx-tab.on[data-region="${CSS.escape(id)}"]`), 5000, 'trocar de região');
        await until(() => mapWindow()?.querySelector('.mx-list .mx-row.npc, .mx-list .mx-empty'), 8000, 'carregar os NPCs da região');
        await sleep(150);
      }

      async function sortNpcs(order) {
        const button = mapWindow()?.querySelector(`[data-npcsort="${order}"]`);
        if (!button || button.classList.contains('on')) return;
        button.click();
        await until(() => mapWindow()?.querySelector(`[data-npcsort="${order}"].on`), 4000, 'ordenar os NPCs');
        await sleep(120);
      }

      // Rows of the region's NPC list in "more XP first" order, with the chapter each one sits in.
      function readNpcRows(region) {
        const list = mapWindow()?.querySelector('.mx-list');
        const rows = [];
        let chapter = '';
        for (const element of list?.children ?? []) {
          if (element.matches('.mx-chapter')) chapter = text(element).toUpperCase();
          if (!element.matches('.mx-row.npc[data-npc]')) continue;
          rows.push({
            id: element.dataset.npc,
            region,
            name: text(element.querySelector('.mx-row-main strong')),
            place: text(element.querySelector('.mx-row-place')),
            level: Number(text(element.querySelector('.mx-row-lv')).match(/\d+/)?.[0] ?? 0),
            // Overworld sprite sheet (/assets/npcs/{gfx}.png), used to find a wandering trainer.
            gfx: element.querySelector('.mx-npc-face i')?.style.backgroundImage
              .match(/\/assets\/npcs\/([^/"')]+)\.png/)?.[1] ?? '',
            beaten: element.classList.contains('beaten') || chapter.startsWith('VENCIDOS'),
            locked: chapter.startsWith('BLOQUEADOS'),
          });
        }
        return rows;
      }

      async function buildRoute(level) {
        const map = await openNpcList();
        const regions = $$('.mx-tab[data-region]', map)
          .filter(tab => !tab.classList.contains('locked') && !tab.classList.contains('soon'));
        const startRegion = map.querySelector('.mx-tab.on[data-region]')?.dataset.region;
        const startSort = map.querySelector('[data-npcsort].on')?.dataset.npcsort;
        const all = [];
        for (const tab of regions) {
          const id = tab.dataset.region;
          setStatus(`Lendo os NPCs de ${text(tab.querySelector('.mx-tab-name')) || id}...`);
          await chooseRegion(id);
          await sortNpcs('xp');
          all.push(...readNpcRows(id));
        }
        if (startSort) await sortNpcs(startSort);
        if (startRegion) await chooseRegion(startRegion);

        const inRange = all.filter(npc => npc.level <= level && npc.level >= level - levelRange());
        const todo = inRange.filter(npc => !npc.beaten && !npc.locked);
        // Lowest level first; within a level, trainers of the same place stay together (the list
        // is by XP, so the first trainer of each place sets that place's turn).
        const placeOrder = new Map();
        for (const npc of todo) {
          const key = `${npc.region}|${npc.place}`;
          if (!placeOrder.has(key)) placeOrder.set(key, placeOrder.size);
        }
        const route = todo
          .map((npc, index) => ({ npc, index, place: placeOrder.get(`${npc.region}|${npc.place}`) }))
          .sort((a, b) => a.npc.level - b.npc.level || a.place - b.place || a.index - b.index)
          .map(({ npc }) => npc);
        return {
          route,
          beatenInRange: inRange.filter(npc => npc.beaten).length,
          lockedInRange: inRange.filter(npc => npc.locked).length,
        };
      }

      // ---- One fight ----
      async function teleportTo(npc) {
        await openNpcList();
        await chooseRegion(npc.region);
        const row = await until(
          () => mapWindow()?.querySelector(`.mx-list .mx-row.npc[data-npc="${CSS.escape(npc.id)}"]`),
          5000, 'achar o treinador na lista');
        if (row.classList.contains('beaten')) return 'won';
        row.click();
        const card = await until(() => {
          const found = mapWindow()?.querySelector('.mx-card-in.npc');
          return found && text(found).includes(npc.name) ? found : null;
        }, 5000, 'abrir o cartão do treinador');
        const cardText = text(card);
        if (/Vencido hoje/i.test(cardText)) return 'won';
        if (/Bloquead/i.test(cardText)) return 'locked';
        // The card warns when the place is closed to the player (e.g. a Gym that needs badges).
        if (/abre quando|ins[ií]gnia/i.test(text(card.closest('.mx-card') ?? card))) return 'closed';
        const tp = await until(() => {
          const button = mapWindow()?.querySelector('.mx-card:has(> .mx-card-in.npc) [data-act="tp"]');
          return button && !button.disabled ? button : null;
        }, 15000, 'liberar o teleporte');
        await pause(150, 400);
        tp.click();
        await until(() => !mapWindow(), 10000, 'teleportar');
        return 'there';
      }

      // After a step that went nowhere: decline an open challenge and close the MAPA.
      async function recoverScreen() {
        challenge()?.querySelector('[data-nofight]')?.click();
        await closeMap().catch(() => {});
        await pause(200, 400);
      }

      // ---- Finding a trainer on screen ----
      // Trainers that wander may have left the spot the teleport faces. The world canvas draws
      // sprites 1:1 from /assets/npcs/{gfx}.png (frame size in npcs.json), so the trainer's frames
      // are searched in the canvas pixels, nearest to the centre (the player) first. A click on
      // the trainer makes the game walk up to it and talk.
      let npcMetaCache;
      async function npcMeta() {
        npcMetaCache ??= fetch('/assets/npcs/npcs.json').then(response => response.json()).catch(() => ({}));
        return npcMetaCache;
      }
      const templateCache = new Map();
      async function npcTemplates(gfx) {
        if (templateCache.has(gfx)) return templateCache.get(gfx);
        const meta = (await npcMeta())[gfx];
        let templates = [];
        // HD sprites are drawn on another layer and are not searched.
        if (meta && !meta.hd && meta.w && meta.h) {
          const image = new Image();
          image.src = `/assets/npcs/${gfx}.png`;
          await image.decode().catch(() => {});
          if (image.naturalWidth) {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(image, 0, 0);
            const frames = Math.min(meta.frames || 1, Math.floor(image.naturalWidth / meta.w));
            for (let frame = 0; frame < frames; frame += 1) {
              const data = ctx.getImageData(frame * meta.w, 0, meta.w, Math.min(meta.h, image.naturalHeight)).data;
              for (const flip of [false, true]) {
                const pixels = [];
                for (let y = 0; y < meta.h; y += 1) {
                  for (let x = 0; x < meta.w; x += 1) {
                    const at = (y * meta.w + x) * 4;
                    if (data[at + 3] < 200) continue;
                    pixels.push([flip ? meta.w - 1 - x : x, y, data[at], data[at + 1], data[at + 2]]);
                  }
                }
                // Too few opaque pixels would match anything.
                if (pixels.length < 24) continue;
                const step = Math.max(1, Math.floor(pixels.length / 10));
                templates.push({ w: meta.w, h: meta.h, pixels, keys: pixels.filter((_, i) => i % step === 0).slice(0, 10) });
              }
            }
          }
        }
        templateCache.set(gfx, templates);
        return templates;
      }

      function worldCanvas() {
        return $$('canvas')
          .filter(canvas => canvas.width && canvas.getBoundingClientRect().width / canvas.width > 1.2
            && !canvas.closest('[hidden]') && !canvas.classList.contains('title-scene'))
          .sort((a, b) => b.width * b.height - a.width * a.height)[0];
      }

      // Where the trainer's sprite is drawn, as the client point of its feet tile, or null.
      async function locateTrainer(npc) {
        const templates = await npcTemplates(npc.gfx);
        const canvas = worldCanvas();
        if (!templates.length || !canvas) return null;
        const { width, height } = canvas;
        let data;
        try {
          data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
        } catch {
          return null;
        }
        // Day/night tints and effects change the colours, so each channel is fitted as
        // screen = gain × sprite + offset before comparing; a flat area (gain near 0) never fits.
        const fits = (pixels, left, top, tolerance, share) => {
          for (let channel = 0; channel < 3; channel += 1) {
            let sx = 0, sy = 0, sxx = 0, sxy = 0;
            const n = pixels.length;
            for (const pixel of pixels) {
              const a = pixel[2 + channel];
              const b = data[((top + pixel[1]) * width + left + pixel[0]) * 4 + channel];
              sx += a; sy += b; sxx += a * a; sxy += a * b;
            }
            const spread = n * sxx - sx * sx;
            const gain = spread > 0 ? (n * sxy - sx * sy) / spread : 1;
            if (spread > n * n * 100 && (gain < 0.5 || gain > 1.4)) return false;
            const offset = (sy - gain * sx) / n;
            let good = 0;
            for (const pixel of pixels) {
              const b = data[((top + pixel[1]) * width + left + pixel[0]) * 4 + channel];
              if (Math.abs(gain * pixel[2 + channel] + offset - b) <= tolerance) good += 1;
            }
            if (good < share * n) return false;
          }
          return true;
        };
        const matches = [];
        for (const template of templates) {
          for (let top = 0; top + template.h <= height; top += 1) {
            for (let left = 0; left + template.w <= width; left += 1) {
              if (!fits(template.keys, left, top, 24, 1)) continue;
              if (fits(template.pixels, left, top, 20, 0.85)) {
                // The sprite stands on its tile: centred horizontally, feet at the bottom.
                matches.push({ x: left + template.w / 2, y: top + template.h - 8 });
              }
            }
          }
        }
        if (!matches.length) return null;
        const centre = [width / 2, height / 2];
        const best = matches.sort((a, b) => Math.hypot(a.x - centre[0], a.y - centre[1]) - Math.hypot(b.x - centre[0], b.y - centre[1]))[0];
        const rect = canvas.getBoundingClientRect();
        return { canvas, x: rect.left + best.x * rect.width / width, y: rect.top + best.y * rect.height / height };
      }

      async function walkToTrainer(npc) {
        for (let attempt = 0; attempt < 3 && !challenge(); attempt += 1) {
          const spot = await locateTrainer(npc);
          if (!spot) {
            await sleep(600);
            continue;
          }
          setStatus(`Procurando ${npc.name} por perto...`);
          const init = { bubbles: true, cancelable: true, clientX: spot.x, clientY: spot.y, button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', isPrimary: true };
          spot.canvas.dispatchEvent(new PointerEvent('pointerdown', init));
          spot.canvas.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0 }));
          try {
            await until(challenge, 6000, 'andar até o treinador');
          } catch (error) {
            if (error instanceof Stop) throw error;
          }
        }
        return challenge();
      }

      async function talkAndFight(npc) {
        const key = talkKey();
        for (let attempt = 0; attempt < 2 && !challenge(); attempt += 1) {
          await pause(350, 700);
          dispatchEvent(new KeyboardEvent('keydown', { key: key.length === 1 ? key.toLowerCase() : key, bubbles: true }));
          await sleep(80);
          dispatchEvent(new KeyboardEvent('keyup', { key: key.length === 1 ? key.toLowerCase() : key, bubbles: true }));
          try {
            await until(challenge, 3500, 'abrir o desafio');
          } catch (error) {
            if (error instanceof Stop) throw error;
          }
        }
        // Nothing happened after talking: the trainer may have wandered off, so look for it.
        const dialog = challenge() ?? (npc.gfx ? await walkToTrainer(npc) : null);
        if (!dialog) return 'unreachable';
        const foe = text(dialog.querySelector('.b5-ch-name'));
        if (foe && !sameTrainer(npc.name, foe)) {
          dialog.querySelector('[data-nofight]')?.click();
          await pause();
          return 'skipped';
        }
        await pause(200, 500);
        dialog.querySelector('[data-fight]')?.click();
        await until(() => inArena() || resultWindow(), 15000, 'começar a batalha');
        setStatus(`Lutando contra ${npc.name}...`);
        const seen = new Set();
        const result = await until(() => {
          const dex = foeInPlay();
          if (dex) seen.add(dex);
          return resultWindow();
        }, FIGHT_TIMEOUT, 'terminar a batalha');
        saveTeam(npc, [...seen]);
        const outcome = result.dataset.result;
        const sentToCenter = /Centro Pokémon/i.test(text(result));
        await pause();
        result.querySelector('[data-ah="ok"]')?.click();
        await until(() => !resultWindow(), 8000, 'fechar o resultado');
        return outcome === 'win' ? 'won' : (sentToCenter ? 'lost-healed' : 'lost');
      }

      // HP of the main Pokémon from the HUD ("33/ 50").
      function hpRatio() {
        const match = text($('.hud-hp-numbers')).match(/(\d+)\s*\/\s*(\d+)/);
        return match && Number(match[2]) ? Number(match[1]) / Number(match[2]) : null;
      }

      async function heal() {
        const button = $('.hud-act.center[data-act="center"]');
        if (!button) return;
        setStatus('Indo ao Centro Pokémon para curar a equipe...');
        await pause(150, 400);
        button.click();
        // The trainer walks there; healing ends when the HUD shows full HP again.
        await until(() => (hpRatio() ?? 1) >= 0.99, 120000, 'curar no Centro Pokémon');
        await pause(600, 1200);
      }

      // ---- Panel ----
      const LABELS = {
        won: 'Vencido', lost: 'Derrota', skipped: 'Pulado', locked: 'Bloqueado',
        unreachable: 'Inacessível', closed: 'Inacessível', avoided: 'Evitado', current: 'Agora', todo: '',
      };
      function renderProgress() {
        const { route, done, total } = run;
        const left = total - done;
        progressEl.hidden = false;
        box.querySelector('[data-daily-left]').textContent = left ? (left === 1 ? 'Falta 1' : `Faltam ${left}`) : 'Tudo feito!';
        box.querySelector('[data-daily-total]').textContent = `${done} de ${total}`;
        const bar = box.querySelector('[data-daily-bar]');
        bar.setAttribute('aria-valuemax', String(total));
        bar.setAttribute('aria-valuenow', String(done));
        bar.querySelector('i').style.width = `${total ? Math.round(done / total * 100) : 100}%`;
        routeEl.hidden = !route.length;
        routeEl.replaceChildren(...route.map(npc => {
          const item = document.createElement('li');
          item.dataset.state = npc.state;
          item.innerHTML = '<span></span><small></small><b></b>';
          item.children[0].textContent = `${npc.name} · Nv. ${npc.level}`;
          item.children[1].textContent = npc.edge ? `${npc.place} · time com ${TYPE_NAMES[npc.edge] ?? npc.edge}` : npc.place;
          item.children[2].textContent = LABELS[npc.state] ?? '';
          return item;
        }));
        routeEl.querySelector('[data-state="current"]')?.scrollIntoView({ block: 'nearest' });
      }

      function showRange() {
        const main = mainPokemon();
        const below = levelRange();
        const lowest = Math.max(1, main ? main.level - below : 1);
        rangeEl.textContent = main
          ? (lowest === main.level
            ? `${main.name}, Nv. ${main.level}: só treinadores do Nv. ${main.level}.`
            : `${main.name}, Nv. ${main.level}: treinadores do Nv. ${lowest} ao ${main.level}.`)
          : 'Entre no jogo para ver o Pokémon principal.';
      }

      function setRunning(on) {
        goButton.hidden = on;
        stopButton.hidden = !on;
        levelsInput.disabled = on;
        box.toggleAttribute('data-running', on);
      }

      stopButton.addEventListener('click', () => stop('Parado.'));

      goButton.addEventListener('click', async () => {
        if (run) return;
        const main = mainPokemon();
        showRange();
        if (!main) {
          setStatus('Não achei o Pokémon principal no HUD.');
          return;
        }
        run = { stopped: false, reason: '', route: [], done: 0, total: 0 };
        setRunning(true);
        routeEl.hidden = true;
        progressEl.hidden = true;
        try {
          if (inArena() || resultWindow() || challenge()) throw new Error('Termine a batalha ou o diálogo aberto antes.');
          if (isHunting()) {
            setStatus('Parando a caça...');
            $('.hud-act.hunt[data-act="hunt"]').click();
            await until(() => !isHunting(), 8000, 'parar a caça');
            await pause();
          }
          setStatus('Calculando a rota...');
          const { route, beatenInRange, lockedInRange } = await buildRoute(main.level);
          run.route = route.map(npc => {
            const edge = avoidBox.checked ? typeEdge(npc, main.dex) : null;
            return { ...npc, edge, state: edge ? 'avoided' : 'todo' };
          });
          const avoided = run.route.filter(npc => npc.state === 'avoided').length;
          run.total = route.length - avoided + beatenInRange;
          run.done = beatenInRange;
          renderProgress();
          if (!run.route.some(npc => npc.state === 'todo')) {
            if (avoided) {
              await closeMap();
              setStatus(`Nada a fazer: ${avoided} treinador(es) evitado(s) por vantagem de tipo.`);
              return;
            }
            await closeMap();
            setStatus(lockedInRange
              ? `Nada a fazer: ${lockedInRange} treinador(es) da faixa ainda bloqueado(s).`
              : 'Nada a fazer: todos os treinadores da faixa já foram vencidos hoje.');
            return;
          }
          let unreachableStreak = 0;
          for (const npc of run.route) {
            if (npc.state !== 'todo') continue;
            npc.state = 'current';
            renderProgress();
            if ((hpRatio() ?? 1) < HEAL_BELOW) await heal();
            setStatus(`Indo até ${npc.name} (${npc.place})...`);
            let outcome;
            try {
              const arrival = await teleportTo(npc);
              outcome = arrival === 'there' ? await talkAndFight(npc) : arrival;
            } catch (error) {
              // The game did not react (teleport or talk went nowhere): skip this trainer, unless
              // a battle is on screen, where moving on would be unsafe.
              if (error instanceof Stop || inArena() || resultWindow()) throw error;
              await recoverScreen();
              outcome = 'unreachable';
            }
            unreachableStreak = outcome === 'unreachable' ? unreachableStreak + 1 : 0;
            if (unreachableStreak >= MAX_UNREACHABLE_STREAK) {
              npc.state = outcome;
              renderProgress();
              throw new Error(`${MAX_UNREACHABLE_STREAK} treinadores seguidos sem resposta do jogo`);
            }
            if (outcome === 'lost') await heal();
            if (outcome === 'lost-healed') outcome = 'lost';
            npc.state = outcome;
            if (outcome === 'won') run.done += 1;
            renderProgress();
            await pause();
          }
          await closeMap().catch(() => {});
          const lost = run.route.filter(npc => npc.state === 'lost').length;
          const skipped = run.route.filter(npc => npc.state === 'skipped' || npc.state === 'locked').length;
          const unreachable = run.route.filter(npc => npc.state === 'unreachable' || npc.state === 'closed').length;
          setStatus(['Daily concluído.', lost && `${lost} derrota(s).`, skipped && `${skipped} pulado(s).`,
            unreachable && `${unreachable} inacessível(is).`,
            avoided && `${avoided} evitado(s) por vantagem de tipo.`]
            .filter(Boolean).join(' '));
        } catch (error) {
          const current = run.route.find(npc => npc.state === 'current');
          if (current) current.state = 'todo';
          if (run.route.length) renderProgress();
          setStatus(error instanceof Stop ? error.message : `Parado: ${error.message}`);
        } finally {
          run = null;
          setRunning(false);
        }
      });
    })();
  })();

  if (moduleEnabled('monitor')) (() => {
    // ==== src/data/dex.js ====
    // Gerado por build-data.mjs: espécies por número da Pokédex, "Nome:tipo". Não edite à mão.
    const DEX = /* DEX_DATA_START */ ["","Bulbasaur:grass","Ivysaur:grass","Venusaur:grass","Charmander:fire","Charmeleon:fire","Charizard:fire","Squirtle:water","Wartortle:water","Blastoise:water","Caterpie:bug","Metapod:bug","Butterfree:bug","Weedle:bug","Kakuna:bug","Beedrill:bug","Pidgey:normal","Pidgeotto:normal","Pidgeot:normal","Rattata:normal","Raticate:normal","Spearow:normal","Fearow:normal","Ekans:poison","Arbok:poison","Pikachu:electric","Raichu:electric","Sandshrew:ground","Sandslash:ground","Nidoran♀:poison","Nidorina:poison","Nidoqueen:poison","Nidoran♂:poison","Nidorino:poison","Nidoking:poison","Clefairy:normal","Clefable:normal","Vulpix:fire","Ninetales:fire","Jigglypuff:normal","Wigglytuff:normal","Zubat:poison","Golbat:poison","Oddish:grass","Gloom:grass","Vileplume:grass","Paras:bug","Parasect:bug","Venonat:bug","Venomoth:bug","Diglett:ground","Dugtrio:ground","Meowth:normal","Persian:normal","Psyduck:water","Golduck:water","Mankey:fighting","Primeape:fighting","Growlithe:fire","Arcanine:fire","Poliwag:water","Poliwhirl:water","Poliwrath:water","Abra:psychic","Kadabra:psychic","Alakazam:psychic","Machop:fighting","Machoke:fighting","Machamp:fighting","Bellsprout:grass","Weepinbell:grass","Victreebel:grass","Tentacool:water","Tentacruel:water","Geodude:rock","Graveler:rock","Golem:rock","Ponyta:fire","Rapidash:fire","Slowpoke:water","Slowbro:water","Magnemite:electric","Magneton:electric","Farfetch'd:normal","Doduo:normal","Dodrio:normal","Seel:water","Dewgong:water","Grimer:poison","Muk:poison","Shellder:water","Cloyster:water","Gastly:ghost","Haunter:ghost","Gengar:ghost","Onix:rock","Drowzee:psychic","Hypno:psychic","Krabby:water","Kingler:water","Voltorb:electric","Electrode:electric","Exeggcute:grass","Exeggutor:grass","Cubone:ground","Marowak:ground","Hitmonlee:fighting","Hitmonchan:fighting","Lickitung:normal","Koffing:poison","Weezing:poison","Rhyhorn:ground","Rhydon:ground","Chansey:normal","Tangela:grass","Kangaskhan:normal","Horsea:water","Seadra:water","Goldeen:water","Seaking:water","Staryu:water","Starmie:water","Mr. Mime:psychic","Scyther:bug","Jynx:ice","Electabuzz:electric","Magmar:fire","Pinsir:bug","Tauros:normal","Magikarp:water","Gyarados:water","Lapras:water","Ditto:normal","Eevee:normal","Vaporeon:water","Jolteon:electric","Flareon:fire","Porygon:normal","Omanyte:rock","Omastar:rock","Kabuto:rock","Kabutops:rock","Aerodactyl:rock","Snorlax:normal","Articuno:ice","Zapdos:electric","Moltres:fire","Dratini:dragon","Dragonair:dragon","Dragonite:dragon","Mewtwo:psychic","Mew:psychic","Chikorita:grass","Bayleef:grass","Meganium:grass","Cyndaquil:fire","Quilava:fire","Typhlosion:fire","Totodile:water","Croconaw:water","Feraligatr:water","Sentret:normal","Furret:normal","Hoothoot:normal","Noctowl:normal","Ledyba:bug","Ledian:bug","Spinarak:bug","Ariados:bug","Crobat:poison","Chinchou:water","Lanturn:water","Pichu:electric","Cleffa:normal","Igglybuff:normal","Togepi:normal","Togetic:normal","Natu:psychic","Xatu:psychic","Mareep:electric","Flaaffy:electric","Ampharos:electric","Bellossom:grass","Marill:water","Azumarill:water","Sudowoodo:rock","Politoed:water","Hoppip:grass","Skiploom:grass","Jumpluff:grass","Aipom:normal","Sunkern:grass","Sunflora:grass","Yanma:bug","Wooper:water","Quagsire:water","Espeon:psychic","Umbreon:dark","Murkrow:dark","Slowking:water","Misdreavus:ghost","Unown:psychic","Wobbuffet:psychic","Girafarig:normal","Pineco:bug","Forretress:bug","Dunsparce:normal","Gligar:ground","Steelix:steel","Snubbull:normal","Granbull:normal","Qwilfish:water","Scizor:bug","Shuckle:bug","Heracross:bug","Sneasel:dark","Teddiursa:normal","Ursaring:normal","Slugma:fire","Magcargo:fire","Swinub:ice","Piloswine:ice","Corsola:water","Remoraid:water","Octillery:water","Delibird:ice","Mantine:water","Skarmory:steel","Houndour:dark","Houndoom:dark","Kingdra:water","Phanpy:ground","Donphan:ground","Porygon2:normal","Stantler:normal","Smeargle:normal","Tyrogue:fighting","Hitmontop:fighting","Smoochum:ice","Elekid:electric","Magby:fire","Miltank:normal","Blissey:normal","Raikou:electric","Entei:fire","Suicune:water","Larvitar:rock","Pupitar:rock","Tyranitar:rock","Lugia:psychic","Ho-Oh:fire","Celebi:psychic","Treecko:grass","Grovyle:grass","Sceptile:grass","Torchic:fire","Combusken:fire","Blaziken:fire","Mudkip:water","Marshtomp:water","Swampert:water","Poochyena:dark","Mightyena:dark","Zigzagoon:normal","Linoone:normal","Wurmple:bug","Silcoon:bug","Beautifly:bug","Cascoon:bug","Dustox:bug","Lotad:water","Lombre:water","Ludicolo:water","Seedot:grass","Nuzleaf:grass","Shiftry:grass","Taillow:normal","Swellow:normal","Wingull:water","Pelipper:water","Ralts:psychic","Kirlia:psychic","Gardevoir:psychic","Surskit:bug","Masquerain:bug","Shroomish:grass","Breloom:grass","Slakoth:normal","Vigoroth:normal","Slaking:normal","Nincada:bug","Ninjask:bug","Shedinja:bug","Whismur:normal","Loudred:normal","Exploud:normal","Makuhita:fighting","Hariyama:fighting","Azurill:normal","Nosepass:rock","Skitty:normal","Delcatty:normal","Sableye:dark","Mawile:steel","Aron:steel","Lairon:steel","Aggron:steel","Meditite:fighting","Medicham:fighting","Electrike:electric","Manectric:electric","Plusle:electric","Minun:electric","Volbeat:bug","Illumise:bug","Roselia:grass","Gulpin:poison","Swalot:poison","Carvanha:water","Sharpedo:water","Wailmer:water","Wailord:water","Numel:fire","Camerupt:fire","Torkoal:fire","Spoink:psychic","Grumpig:psychic","Spinda:normal","Trapinch:ground","Vibrava:ground","Flygon:ground","Cacnea:grass","Cacturne:grass","Swablu:normal","Altaria:dragon","Zangoose:normal","Seviper:poison","Lunatone:rock","Solrock:rock","Barboach:water","Whiscash:water","Corphish:water","Crawdaunt:water","Baltoy:ground","Claydol:ground","Lileep:rock","Cradily:rock","Anorith:rock","Armaldo:rock","Feebas:water","Milotic:water","Castform:normal","Kecleon:normal","Shuppet:ghost","Banette:ghost","Duskull:ghost","Dusclops:ghost","Tropius:grass","Chimecho:psychic","Absol:dark","Wynaut:psychic","Snorunt:ice","Glalie:ice","Spheal:ice","Sealeo:ice","Walrein:ice","Clamperl:water","Huntail:water","Gorebyss:water","Relicanth:water","Luvdisc:water","Bagon:dragon","Shelgon:dragon","Salamence:dragon","Beldum:steel","Metang:steel","Metagross:steel","Regirock:rock","Regice:ice","Registeel:steel","Latias:dragon","Latios:dragon","Kyogre:water","Groudon:ground","Rayquaza:dragon","Jirachi:steel","Deoxys:psychic"] /* DEX_DATA_END */;

    // ==== src/monitor.js ====
    // ---- Monitor de contas ----
    // Each game tab reads its own HUD (DOM only) and saves a small record in the userscript manager's
    // storage, which every tab shares, even across Firefox containers (localStorage and
    // BroadcastChannel are split per container). Every tab then shows all records in the panel.

    // ---- Settings ----
    const PREFIX = 'acct:';
    const NICKS_KEY = 'nicks';
    const HEARTBEAT = 20 * 1000;     // rewrite even without changes, so others know the tab is alive
    // No record for this long: "sem sinal". Chrome may run timers of a long-hidden tab only once a
    // minute; HUD changes still write right away.
    const STALE_AFTER = 150 * 1000;
    const LOW_BALLS = 50;
    const LOW_POTIONS = 20;
    const POSITION_STORAGE = 'pokeafk-monitor:pos';
    const OPEN_STORAGE = 'pokeafk-monitor:open';
    const COMPACT_KEY = 'ui:compact';   // shared by every tab, like the records

    // Game images (same origin as the game).
    const IMG = {
      ball: '/assets/ui/hud-icons/24-poke-ball.png',
      afk: '/assets/items/afk-ball.png',
      potion: '/assets/ui/hud-icons/29-super-pocao.png',
      xp: '/assets/ui/v5/icones/experiencia.png',
      frame: '/assets/ui/hud-frame-a1.svg',
      front: dex => `/assets/mon/front/${dex}.png`,
      icon: dex => `/assets/mon/icon/${dex}.png`, // two 32×32 frames, one above the other
      typeBg: type => `/assets/ui/v5/fundos/${type}.webp`,
    };

    // Species by dex number, "Name:firstType": the DEX table in src/data/dex.js (build-data.mjs).
    // The HUD shows the wild Pokémon only by name, so its sprite comes from here.
    const nameKey = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toUpperCase().replace(/[^A-Z0-9♀♂]/g, '');
    let dexByName = null;
    function speciesByName(name) {
      if (!dexByName) {
        dexByName = new Map();
        DEX.forEach((entry, dex) => {
          if (!entry) return;
          const [species, type] = entry.split(':');
          dexByName.set(nameKey(species), { dex, type });
        });
      }
      return dexByName.get(nameKey(name)) ?? null;
    }

    // Storage: the manager's shared storage; without grants, localStorage (this container only).
    const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
    const store = hasGM
      ? {
        get: (key, fallback) => GM_getValue(key, fallback),
        set: (key, value) => GM_setValue(key, value),
        del: key => GM_deleteValue(key),
        keys: () => GM_listValues(),
      }
      : {
        get: (key, fallback) => {
          try {
            const raw = localStorage.getItem(`pokeafk-monitor:${key}`);
            return raw === null ? fallback : JSON.parse(raw);
          } catch {
            return fallback;
          }
        },
        set: (key, value) => {
          try {
            localStorage.setItem(`pokeafk-monitor:${key}`, JSON.stringify(value));
          } catch {
            // Lost for this page only.
          }
        },
        del: key => {
          try {
            localStorage.removeItem(`pokeafk-monitor:${key}`);
          } catch {
            // Nothing to forget.
          }
        },
        keys: () => Object.keys(localStorage)
          .filter(key => key.startsWith('pokeafk-monitor:'))
          .map(key => key.slice('pokeafk-monitor:'.length)),
      };

    // ---- States ----
    // Color always comes with a text label (title emoji + word in the panel).
    const STATES = {
      daily: { label: 'Daily', dot: '🔵', color: '#2459aa' },
      battle: { label: 'Em batalha', dot: '🟣', color: '#7048e8' },
      hunting: { label: 'Caçando', dot: '🟢', color: '#2f9e44' },
      fishing: { label: 'Pescando', dot: '🟢', color: '#1098ad' },
      idle: { label: 'Parado', dot: '🟡', color: '#e8890c' },
      out: { label: 'Fora do jogo', dot: '⚪', color: '#868e96' },
      stale: { label: 'Sem sinal', dot: '⚪', color: '#868e96' },
      closed: { label: 'Aba fechada', dot: '⚪', color: '#adb5bd' },
    };

    // ---- Reading the HUD ----
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const text = element => element?.textContent.replace(/\s+/g, ' ').trim() ?? '';
    const count = value => Number(String(value ?? '').replace(/\D/g, '')) || 0;

    function isOn(button) {
      if (!button || button.hidden) return false;
      return button.classList.contains('on') || button.getAttribute('aria-pressed') === 'true'
        || /^parar/i.test(button.getAttribute('aria-label') ?? '') || /^parar/i.test(text($('.hud-act-l', button)));
    }

    // Potions last seen in the Bag, for accounts whose HUD has no automation panel.
    const AFK_BALL = 'afk-ball';
    let bagPotions = null;
    let lastFoe = null;

    function readHud() {
      const hud = $('.hud.world-hud');
      const name = text($('.hud-trainer-name [translate="no"]')) || text($('.hud-trainer-name'));
      if (!hud || !name) return null;

      const balls = $$('.capture-ball[data-capture-ball]').map(button => ({
        id: button.dataset.captureBall,
        label: button.getAttribute('title') || button.dataset.captureBall,
        n: count(text($('span', button))),
        auto: $(`.ax-pick[data-ball="${button.dataset.captureBall}"]`)?.classList.contains('on') ?? null,
      }));

      let heal = $$('.ax-pick[data-heal]').map(button => ({
        id: button.dataset.heal,
        label: text($('.ax-pick-n', button)) || button.dataset.heal,
        n: count(text($('b', button))),
      }));
      const bagCards = $$('.bag-card[data-card$="potion"]');
      if (bagCards.length) {
        bagPotions = bagCards.map(card => ({
          id: card.dataset.card, label: text($('.bag-nm', card)), n: count(text($('.bag-n', card))),
        }));
      }
      let potionsFrom = 'hud';
      if (!heal.length && bagPotions) {
        heal = bagPotions;
        potionsFrom = 'bag';
      }
      const potions = heal.filter(item => item.id !== 'berry');

      const hp = text($('.hud-hp-numbers')).match(/(\d+)\s*\/\s*(\d+)/);
      const activeButton = $('button.hud-active-button');
      const active = activeButton?.getAttribute('aria-label')?.match(/Resumo de (.+), nível (\d+)/i);
      const portrait = $('.hud-mon-portrait', activeButton ?? document);
      const daily = $('#pafk-daily');
      const dailyDone = text($('[data-daily-total]', daily ?? document)).match(/(\d+)\s*de\s*(\d+)/);

      let state = 'idle';
      if (daily?.hasAttribute('data-running')) state = 'daily';
      else if ($('.in-arena') || $('.ah-result[data-result]')) state = 'battle';
      else if (isOn($('.hud-act.hunt[data-act="hunt"]')) || hud.classList.contains('hunting')) state = 'hunting';
      else if (isOn($('.hud-act.fish[data-act="fish"]')) || hud.classList.contains('fishing')) state = 'fishing';

      // The wild Pokémon on screen. Between fights the box goes away, so the last one is kept
      // while the account keeps hunting.
      const foeBox = $('.gba-healthbox.opponent');
      const foeName = foeBox ? ($('.name', foeBox)?.getAttribute('title') || text($('.name', foeBox))) : '';
      if (foeName) {
        const species = speciesByName(foeName);
        lastFoe = {
          name: foeName.charAt(0) + foeName.slice(1).toLowerCase(),
          level: Number(text($('.lv', foeBox)).match(/\d+/)?.[0] ?? 0) || null,
          dex: species?.dex ?? null,
          type: species?.type ?? null,
        };
      }
      if (state !== 'hunting' && state !== 'fishing') lastFoe = null;

      return {
        v: 1,
        name,
        state,
        daily: state === 'daily' && dailyDone ? { done: Number(dailyDone[1]), total: Number(dailyDone[2]) } : null,
        balls,
        // Poké, Great, Super and Ultra Ball count as balls; the AFK Ball (kept for shinies) apart.
        ballsTotal: balls.filter(ball => ball.id !== AFK_BALL).reduce((sum, ball) => sum + ball.n, 0),
        afkBalls: balls.find(ball => ball.id === AFK_BALL)?.n ?? null,
        potions: heal.length ? potions : null,
        potionsTotal: heal.length ? potions.reduce((sum, item) => sum + item.n, 0) : null,
        potionsFrom,
        money: count(text($('.hud-wallet .hud-amt'))) || null,
        main: active ? {
          name: active[1].charAt(0) + active[1].slice(1).toLowerCase(),
          level: Number(active[2]),
          hp: hp ? Number(hp[1]) : null,
          hpMax: hp ? Number(hp[2]) : null,
          // Sprite, type background and type color exactly as the HUD shows them.
          front: $('img.front', portrait ?? document)?.getAttribute('src') ?? null,
          bg: $('img.hud-mon-bg', portrait ?? document)?.getAttribute('src') ?? null,
          color: portrait?.style.getPropertyValue('--tc').trim() || null,
        } : null,
        foe: lastFoe,
        xp: {
          trainer: readXp($('.hud-trainer-xp')),
          mon: readXp($('.hud-xp-line')),
        },
      };
    }

    // Exact XP from the HUD bars' tooltips, e.g. "511.795 / 549.646 XP de treinador neste nível.
    // XP total: 6.681.268." The total keeps growing across level-ups, so rates use it.
    function readXp(bar) {
      const title = bar?.getAttribute('title') ?? '';
      const level = title.match(/([\d.]+)\s*\/\s*([\d.]+)/);
      const total = title.match(/XP total:\s*([\d.]+)/i);
      if (!total) return null;
      return {
        total: count(total[1]),
        cur: level ? count(level[1]) : null,
        max: level ? count(level[2]) : null,
        rate: null,
      };
    }

    // ---- XP per hour ----
    // Like the game's hunt analyzer ("ritmo atual"): XP gained over the last 10 minutes. Samples
    // stay in sessionStorage, so a reload of the tab does not start over.
    const XP_WINDOW = 10 * 60 * 1000;
    // Less history than this: still measuring. XP also arrives in bursts (mission rewards, +20 mil
    // at once), which would swing a one-minute rate.
    const XP_MIN_SPAN = 3 * 60 * 1000;
    const XP_SAMPLE_EVERY = 10 * 1000;
    const XP_STORAGE = 'pokeafk-monitor:xp';
    let xpSeries = {};
    try {
      xpSeries = JSON.parse(sessionStorage.getItem(XP_STORAGE) ?? '{}') ?? {};
    } catch {
      xpSeries = {};
    }

    // Adds a sample and returns XP per hour, or null while there is not enough history.
    function xpRate(name, key, total) {
      const now = Date.now();
      let series = xpSeries[name];
      const last = series?.samples.at(-1);
      // Another account, another main Pokémon or a total that went down: start over.
      if (!series || series.key !== key || (last && total < last[1])) {
        series = xpSeries[name] = { key, samples: [] };
      }
      const samples = series.samples;
      if (!samples.length || now - samples.at(-1)[0] >= XP_SAMPLE_EVERY) samples.push([now, total]);
      // Keep one sample at or just before the window start.
      while (samples.length > 2 && now - samples[1][0] >= XP_WINDOW) samples.shift();
      const first = samples[0];
      const span = now - first[0];
      if (span < XP_MIN_SPAN) return null;
      return Math.max(0, Math.round((total - first[1]) / span * 3600 * 1000));
    }

    function trackXp(record) {
      const { trainer, mon } = record.xp;
      if (trainer) trainer.rate = xpRate('trainer', record.name, trainer.total);
      if (mon) mon.rate = xpRate('mon', `${record.name}|${record.main?.name}|${record.main?.front}`, mon.total);
      try {
        sessionStorage.setItem(XP_STORAGE, JSON.stringify(xpSeries));
      } catch {
        // The rate starts over after a reload.
      }
    }

    // ---- Formatting ----
    const nf = new Intl.NumberFormat('pt-BR');
    const fmt = n => (n === null || n === undefined ? '—' : nf.format(n));
    // Short numbers for the tab title.
    const short = n => {
      if (n === null || n === undefined) return '?';
      if (n < 10000) return String(n);
      return `${Math.round(n / 1000)}k`;
    };
    function ago(ms) {
      const s = Math.max(0, Math.round(ms / 1000));
      if (s < 5) return 'agora';
      if (s < 60) return `há ${s} s`;
      const m = Math.round(s / 60);
      if (m < 60) return `há ${m} min`;
      const h = Math.floor(m / 60);
      if (h < 24) return `há ${h} h${m % 60 ? ` ${m % 60} min` : ''}`;
      return `há ${Math.floor(h / 24)} d`;
    }
    const nicks = () => store.get(NICKS_KEY, {}) ?? {};
    const displayName = name => nicks()[name] || name;
    const lowBalls = record => record.ballsTotal !== null && record.ballsTotal < LOW_BALLS;
    const lowPotions = record => record.potionsTotal !== null && record.potionsTotal < LOW_POTIONS;

    // What the viewer should see for a record, counting age and closed tabs.
    function viewState(record, now = Date.now()) {
      if (record.closed) return 'closed';
      if (now - record.at > STALE_AFTER) return 'stale';
      return record.state;
    }

    // ---- This tab: record, title and icon ----
    let me = null;           // last record read here
    let myName = null;       // account in this tab
    let stateSince = Date.now();
    let lastWrite = 0;
    let lastSaved = '';
    let wantedTitle = '';

    function compare(record) {
      // Fields that matter for "changed". HP counts in steps of 10%, so a fight does not write on
      // every hit; the heartbeat carries the exact value.
      const hpStep = record.main?.hpMax ? Math.round(record.main.hp / record.main.hpMax * 10) : null;
      return JSON.stringify([record.state, record.daily, record.ballsTotal, record.potionsTotal,
        record.afkBalls, record.money, record.main?.level, record.main?.name, record.main?.front, hpStep, record.foe?.name,
        Math.round((record.xp?.trainer?.rate ?? -1) / 5000), Math.round((record.xp?.mon?.rate ?? -1) / 5000)]);
    }

    function save(record, force = false) {
      const key = compare(record);
      const now = Date.now();
      if (!force && key === lastSaved && now - lastWrite < HEARTBEAT) return;
      lastSaved = key;
      lastWrite = now;
      store.set(PREFIX + record.name, { ...record, since: stateSince, at: now, closed: false });
    }

    function titleFor(record) {
      const state = STATES[record.state];
      const warn = lowBalls(record) || lowPotions(record) ? '⚠' : '';
      const doing = record.state === 'daily' && record.daily
        ? ` · faltam ${record.daily.total - record.daily.done}`
        : record.state === 'idle' || record.state === 'battle' ? ` · ${state.label.toLowerCase()}` : '';
      return `${state.dot}${warn} ${displayName(record.name)}${doing} · ◓${short(record.ballsTotal)} ✚${short(record.potionsTotal)}`;
    }

    function iconFor(stateKey, name) {
      const color = STATES[stateKey]?.color ?? '#868e96';
      const letter = (name || '?').trim().charAt(0).toUpperCase().replace(/[<>&"']/g, '?');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`
        + `<circle cx="32" cy="32" r="30" fill="${color}" stroke="#fff" stroke-width="4"/>`
        + `<text x="32" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" `
        + `font-size="34" fill="#fff">${letter}</text></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }

    let iconLink = null;
    let wantedIcon = '';
    function applyTab() {
      if (wantedTitle && document.title !== wantedTitle) document.title = wantedTitle;
      if (!wantedIcon) return;
      // The game's own icon links are put aside while ours is set, and come back on reload.
      for (const link of $$('link[rel~="icon"]')) {
        if (link !== iconLink) link.remove();
      }
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        iconLink.type = 'image/svg+xml';
        iconLink.dataset.pafk = '';
      }
      if (iconLink.getAttribute('href') !== wantedIcon) iconLink.setAttribute('href', wantedIcon);
      if (!iconLink.isConnected) document.head.append(iconLink);
    }

    function tick() {
      const record = readHud();
      if (record) {
        if (!me) {
          // After a reload, keep counting from the saved record if the account is doing the same.
          const old = store.get(PREFIX + record.name, null);
          // A reload marks the tab closed for a moment; a tab closed for longer starts over.
          const recent = old && Date.now() - old.at < (old.closed ? 30 * 1000 : STALE_AFTER);
          stateSince = recent && old.state === record.state && old.since ? old.since : Date.now();
        } else if (me.state !== record.state) {
          stateSince = Date.now();
        }
        trackXp(record);
        me = record;
        if (myName && myName !== record.name) {
          // Another account logged in on this tab.
          const old = store.get(PREFIX + myName, null);
          if (old) store.set(PREFIX + myName, { ...old, closed: true, at: Date.now() });
        }
        myName = record.name;
        try {
          sessionStorage.setItem('pokeafk-monitor:name', myName);
        } catch {
          // Only used to label the tab while logged out.
        }
        save(record);
        wantedTitle = titleFor(record);
        wantedIcon = iconFor(record.state, displayName(record.name));
      } else {
        // Login screen, loading or another page of the site.
        let known = myName;
        try {
          known ||= sessionStorage.getItem('pokeafk-monitor:name');
        } catch {
          // Unknown account.
        }
        // Keep the account's record alive as "fora do jogo" (also right after a reload).
        if (me) {
          me = null;
          stateSince = Date.now();
          lastWrite = 0;
        }
        const now = Date.now();
        if (known && now - lastWrite >= HEARTBEAT) {
          const old = store.get(PREFIX + known, null);
          if (old) {
            if (old.state !== 'out') stateSince = now;
            lastWrite = now;
            lastSaved = '';
            store.set(PREFIX + known, { ...old, state: 'out', daily: null, since: old.state === 'out' ? old.since : stateSince, at: now, closed: false });
          }
        }
        wantedTitle = known ? `${STATES.out.dot} ${displayName(known)} · fora do jogo` : '';
        wantedIcon = known ? iconFor('out', displayName(known)) : '';
      }
      applyTab();
      renderChip();
    }

    // The game may set its own title or icon; put ours back right away.
    new MutationObserver(applyTab).observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href'] });

    // HUD changes trigger a read soon after; the interval covers anything missed and the heartbeat.
    // Background tabs keep receiving DOM updates (checked in the game), and their timers still run
    // at least about once a second.
    let pending = 0;
    function soon() {
      if (pending) return;
      pending = setTimeout(() => {
        pending = 0;
        tick();
      }, 400);
    }
    new MutationObserver(mutations => {
      if (mutations.every(m => (m.target instanceof Element ? m.target : m.target.parentElement)?.closest('#pafk-monitor'))) return;
      soon();
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'data-running', 'aria-label'] });
    setInterval(tick, 5000);

    addEventListener('pagehide', () => {
      let name = myName;
      try {
        name ||= sessionStorage.getItem('pokeafk-monitor:name');
      } catch {
        // Unknown account.
      }
      if (!name) return;
      const old = store.get(PREFIX + name, null);
      if (old) store.set(PREFIX + name, { ...old, closed: true, at: Date.now() });
    });
    addEventListener('pageshow', event => {
      if (!event.persisted) return;
      lastSaved = '';
      tick();
    });

    // ---- Panel ----
    // Visual language of the game's HUD: the same pixel frame (hud-frame-a1.svg), "HUD Pixel" font,
    // navy text, hard 2–3 px shadow and pixelated sprites on the type background. Each state keeps
    // one color and always comes with its name (color is never the only cue).
    const box = document.createElement('section');
    box.id = 'pafk-monitor';
    box.dataset.pafk = '';
    box.dataset.mode = 'full';
    box.setAttribute('aria-label', 'Monitor de contas');
    box.innerHTML = `
      <button type="button" class="pafk-mon-chip" aria-expanded="false" data-mon-toggle title="Contas abertas (arraste para mover)">
        <span>CONTAS</span><span class="pafk-mon-dots" data-mon-dots></span>
      </button>
      <div class="pafk-mon-body" hidden data-mon-body>
        <header>
          <strong title="Arraste para mover; clique duas vezes para voltar ao lugar">CONTAS <small data-mon-count></small></strong>
          <div class="pafk-mon-seg" role="group" aria-label="Modo de exibição">
            <button type="button" data-mon-mode="full" aria-pressed="true">Completo</button>
            <button type="button" data-mon-mode="compact" aria-pressed="false">Compacto</button>
          </div>
          <button type="button" class="pafk-mon-x" aria-label="Fechar" data-mon-toggle>✕</button>
        </header>
        <ul class="pafk-mon-list" data-mon-list></ul>
        <p class="pafk-mon-empty" hidden data-mon-empty>Nenhuma conta ainda. Abra o jogo em outras abas com este script ligado.</p>
        <p class="pafk-mon-foot">⚠ com menos de ${LOW_BALLS} bolas ou ${LOW_POTIONS} poções. Passe o mouse nos números para ver cada tipo.</p>
      </div>`;
    const body = $('[data-mon-body]', box);
    const list = $('[data-mon-list]', box);
    const empty = $('[data-mon-empty]', box);
    const dots = $('[data-mon-dots]', box);
    const countEl = $('[data-mon-count]', box);

    const NAVY = '#14206b';
    const MUTED = '#55638f';
    const style = document.createElement('style');
    style.dataset.pafk = '';
    style.textContent = `
      #pafk-monitor {
        position: fixed; right: 170px; top: 72px; z-index: 41;
        display: flex; flex-direction: column; align-items: flex-end;
        font: 12px/1.35 system-ui, sans-serif; color: ${NAVY};
      }
      #pafk-monitor [hidden] { display: none !important; }
      #pafk-monitor button { font: inherit; color: inherit; cursor: pointer; }
      #pafk-monitor img, #pafk-monitor .pafk-mon-foe-ic { image-rendering: pixelated; }
      #pafk-monitor .pafk-mon-pixel, #pafk-monitor .pafk-mon-chip, #pafk-monitor header strong,
      #pafk-monitor .pafk-mon-name b, #pafk-monitor .pafk-mon-pill, #pafk-monitor .pafk-mon-n,
      #pafk-monitor .pafk-mon-foe-n, #pafk-monitor .pafk-mon-monname { font-family: "HUD Pixel", system-ui, sans-serif; }
      #pafk-monitor .pafk-mon-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

      /* Chip, framed like the game's AUTO button */
      #pafk-monitor .pafk-mon-chip {
        display: flex; align-items: center; gap: 8px; height: 34px; box-sizing: border-box; padding: 0 10px 0 11px;
        border: 4px solid transparent; border-image: url("${IMG.frame}") 10 fill / 4px; background: none;
        box-shadow: 2px 3px 0 rgb(7 26 63 / .33); font-size: 15px; letter-spacing: .02em;
      }
      #pafk-monitor .pafk-mon-dots { display: flex; gap: 4px; }
      #pafk-monitor .pafk-mon-dots i {
        width: 9px; height: 9px; border-radius: 2px; display: block; box-shadow: inset 0 0 0 1px rgb(0 0 0 / .22);
      }
      #pafk-monitor .pafk-mon-dots i[data-warn] { outline: 2px solid #d9480f; outline-offset: 1px; }
      #pafk-monitor :is(.pafk-mon-chip, .pafk-mon-body > header) { cursor: grab; touch-action: none; user-select: none; }
      #pafk-monitor[data-dragging] :is(.pafk-mon-chip, .pafk-mon-body > header) { cursor: grabbing; }

      /* Panel */
      #pafk-monitor .pafk-mon-body {
        box-sizing: border-box; width: min(380px, calc(100vw - 24px)); margin-top: 6px;
        border: 6px solid transparent; border-image: url("${IMG.frame}") 10 fill / 6px;
        box-shadow: 2px 3px 0 rgb(7 26 63 / .33); padding: 6px 6px 8px; display: grid; gap: 8px;
        max-height: calc(100vh - 130px); overflow: auto; overscroll-behavior: contain;
      }
      #pafk-monitor[data-mode="compact"] .pafk-mon-body { width: min(350px, calc(100vw - 24px)); }
      #pafk-monitor header { display: flex; align-items: center; gap: 8px; padding: 0 2px; }
      #pafk-monitor header strong { font-size: 16px; font-weight: 400; margin-right: auto; letter-spacing: .02em; }
      #pafk-monitor header strong small { font-size: 13px; color: ${MUTED}; }
      #pafk-monitor .pafk-mon-seg { display: flex; border: 1px solid #b7c6db; border-radius: 6px; overflow: hidden; }
      #pafk-monitor .pafk-mon-seg button { border: 0; background: #fff; padding: 2px 8px; font-size: 11px; font-weight: 600; }
      #pafk-monitor .pafk-mon-seg button + button { border-left: 1px solid #b7c6db; }
      #pafk-monitor .pafk-mon-seg button[aria-pressed="true"] { background: ${NAVY}; color: #fff; }
      #pafk-monitor .pafk-mon-x { border: 0; background: none; color: ${MUTED}; padding: 2px 4px; border-radius: 4px; }
      #pafk-monitor .pafk-mon-x:hover { background: #e9eef8; color: ${NAVY}; }
      #pafk-monitor p { margin: 0; }
      #pafk-monitor .pafk-mon-foot, #pafk-monitor .pafk-mon-empty { color: ${MUTED}; font-size: 11px; padding: 0 2px; }
      #pafk-monitor .pafk-mon-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
      #pafk-monitor[data-mode="compact"] .pafk-mon-list { gap: 0; border: 1px solid #d5deee; border-radius: 8px; background: #fff; overflow: hidden; }

      /* Shared pieces */
      #pafk-monitor .pafk-mon-pic {
        position: relative; display: block; overflow: hidden; border-radius: 6px;
        background: var(--tc, #dfe6f2) center / cover no-repeat; box-shadow: inset 0 0 0 1px rgb(20 32 107 / .18);
      }
      #pafk-monitor .pafk-mon-pic img { position: absolute; inset: 0; width: 100%; height: 100%; }
      #pafk-monitor .pafk-mon-name { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
      #pafk-monitor .pafk-mon-name b { font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #pafk-monitor .pafk-mon-name small { color: ${MUTED}; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #pafk-monitor .pafk-mon-age { color: ${MUTED}; font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }
      #pafk-monitor .pafk-mon-pill {
        display: inline-flex; align-items: center; gap: 5px; padding: 1px 7px 1px 6px; border-radius: 99px;
        color: var(--c); background: color-mix(in srgb, var(--c) 13%, #fff); font-size: 13px; white-space: nowrap;
      }
      #pafk-monitor .pafk-mon-pill i { width: 7px; height: 7px; border-radius: 2px; background: var(--c); }
      #pafk-monitor .pafk-mon-muted { color: ${MUTED}; }
      #pafk-monitor .pafk-mon-n { display: inline-flex; align-items: center; gap: 3px; font-size: 14px; white-space: nowrap; font-variant-numeric: tabular-nums; }
      #pafk-monitor .pafk-mon-n img { width: 18px; height: 18px; }
      #pafk-monitor .pafk-mon-n[data-low] { color: #c92a2a; }
      #pafk-monitor .pafk-mon-money { font-size: 12px; color: ${MUTED}; }
      #pafk-monitor .pafk-mon-foe { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
      #pafk-monitor .pafk-mon-foe-n { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #pafk-monitor .pafk-mon-foe small { color: ${MUTED}; font-size: 11px; white-space: nowrap; }
      #pafk-monitor .pafk-mon-foe-ic {
        --s: 32px; flex: none; width: var(--s); height: var(--s); margin: -4px -2px;
        background: 0 0 / var(--s) calc(var(--s) * 2) no-repeat; animation: pafk-mon-bob .6s infinite;
      }
      @keyframes pafk-mon-bob { 0%, 49.9% { background-position: 0 0; } 50%, 100% { background-position: 0 calc(var(--s) * -1); } }
      @media (prefers-reduced-motion: reduce) { #pafk-monitor .pafk-mon-foe-ic { animation: none; } }
      #pafk-monitor .pafk-mon-hp {
        position: relative; flex: 1; min-width: 40px; height: 6px; border-radius: 99px;
        background: #e6edf6; box-shadow: inset 0 0 0 1px #b7c6db; overflow: hidden;
      }
      #pafk-monitor .pafk-mon-hp i { position: absolute; inset: 0 auto 0 0; border-radius: 99px; background: #2fb344; }
      #pafk-monitor .pafk-mon-hp i[data-mid] { background: #f2b705; }
      #pafk-monitor .pafk-mon-hp i[data-low] { background: #e03131; }
      #pafk-monitor .pafk-mon-bar { flex: 1; min-width: 40px; height: 6px; border-radius: 99px; background: #e6edf6; overflow: hidden; }
      #pafk-monitor .pafk-mon-bar i { display: block; height: 100%; background: var(--c); }
      #pafk-monitor :is(.pafk-mon-card, .pafk-mon-row):is([data-state="stale"], [data-state="closed"]) :is(.pafk-mon-pic, .pafk-mon-foe-ic) { filter: grayscale(1); opacity: .6; }
      #pafk-monitor .pafk-mon-meta { display: flex; align-items: center; gap: 1px; }
      #pafk-monitor .pafk-mon-meta .pafk-mon-age { margin-right: 4px; }
      #pafk-monitor .pafk-mon-meta button { border: 0; background: none; color: ${MUTED}; padding: 0 4px; font-size: 12px; border-radius: 4px; line-height: 20px; }
      #pafk-monitor .pafk-mon-meta button:hover { background: #e9eef8; color: ${NAVY}; }
      #pafk-monitor .pafk-mon-name input {
        width: 100%; box-sizing: border-box; font: 13px system-ui, sans-serif; font-weight: 700; color: ${NAVY};
        border: 1px solid #b7c6db; border-radius: 6px; padding: 1px 6px;
      }
      #pafk-monitor :focus-visible { outline: 2px solid #2459aa; outline-offset: 1px; }

      /* Full mode: one card per account */
      #pafk-monitor .pafk-mon-card {
        display: grid; grid-template-columns: 60px minmax(0, 1fr) auto; gap: 3px 10px; align-items: center;
        padding: 8px 8px 7px 10px; background: #fff; border: 1px solid #d5deee; border-radius: 8px;
        box-shadow: inset 3px 0 0 var(--c);
      }
      #pafk-monitor .pafk-mon-card[data-me] { border-color: #8fa6d6; }
      #pafk-monitor .pafk-mon-card .pafk-mon-pic { width: 60px; height: 60px; }
      #pafk-monitor .pafk-mon-card .pafk-mon-name b { font-size: 16px; }
      #pafk-monitor .pafk-mon-status { grid-column: 2 / 4; display: flex; align-items: center; gap: 6px; min-width: 0; }
      #pafk-monitor .pafk-mon-status small { color: ${MUTED}; font-size: 11px; white-space: nowrap; }
      #pafk-monitor .pafk-mon-mon { grid-column: 2 / 4; display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 11px; color: ${MUTED}; }
      #pafk-monitor .pafk-mon-xp { grid-column: 2 / 4; display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 11px; color: ${MUTED}; }
      #pafk-monitor .pafk-mon-xp:empty { display: none; }
      #pafk-monitor .pafk-mon-xp img { width: 16px; height: 16px; }
      #pafk-monitor .pafk-mon-xplbl { font-weight: 700; color: ${NAVY}; }
      #pafk-monitor .pafk-mon-xpcell { display: inline-flex; align-items: baseline; gap: 4px; min-width: 0; white-space: nowrap; }
      #pafk-monitor .pafk-mon-xpcell + .pafk-mon-xpcell::before { content: "·"; margin-right: 2px; }
      #pafk-monitor .pafk-mon-xpcell b { font-weight: 400; font-size: 13px; color: ${NAVY}; }
      #pafk-monitor .pafk-mon-monname { font-size: 13px; color: ${NAVY}; white-space: nowrap; }
      #pafk-monitor .pafk-mon-cardfoot {
        grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 6px 10px; flex-wrap: wrap;
        margin-top: 4px; padding-top: 6px; border-top: 1px dashed #d5deee; min-height: 24px;
      }
      #pafk-monitor .pafk-mon-doing { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1 1 140px; }
      #pafk-monitor .pafk-mon-counts { display: flex; align-items: center; gap: 10px; margin-left: auto; }

      /* Compact mode: one line per account */
      #pafk-monitor .pafk-mon-row {
        display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 0 10px; align-items: center;
        padding: 4px 8px; box-shadow: inset 3px 0 0 var(--c);
      }
      #pafk-monitor .pafk-mon-row + .pafk-mon-row { border-top: 1px solid #e3e9f4; }
      #pafk-monitor .pafk-mon-row[data-me] { background: #f5f8fe; }
      #pafk-monitor .pafk-mon-row .pafk-mon-pic { width: 34px; height: 34px; border-radius: 5px; }
      #pafk-monitor .pafk-mon-row .pafk-mon-name b { font-size: 14px; }
      #pafk-monitor .pafk-mon-row .pafk-mon-name .pafk-mon-age { margin-left: auto; padding-left: 6px; }
      #pafk-monitor .pafk-mon-row .pafk-mon-foe small { display: none; }
      #pafk-monitor .pafk-mon-line { display: flex; align-items: center; gap: 5px; min-width: 0; font-size: 11px; color: ${MUTED}; white-space: nowrap; }
      #pafk-monitor .pafk-mon-line .pafk-mon-dot { width: 7px; height: 7px; border-radius: 2px; background: var(--c); flex: none; }
      #pafk-monitor .pafk-mon-line b { font-weight: 600; color: var(--c); }
      #pafk-monitor .pafk-mon-row .pafk-mon-foe-ic { --s: 22px; margin: -3px -1px; }
      #pafk-monitor .pafk-mon-row .pafk-mon-foe-n { font-size: 12px; color: ${NAVY}; }
      #pafk-monitor .pafk-mon-row .pafk-mon-counts { display: grid; grid-template-columns: auto auto; justify-items: end; gap: 0 8px; }
      #pafk-monitor .pafk-mon-row .pafk-mon-xpn { font-size: 12px; }
      #pafk-monitor .pafk-mon-afk[data-zero] { color: ${MUTED}; }
      #pafk-monitor .pafk-mon-afk[data-zero] img { opacity: .55; }
      #pafk-monitor .pafk-mon-row .pafk-mon-n { font-size: 13px; }
      #pafk-monitor .pafk-mon-row .pafk-mon-n img { width: 15px; height: 15px; }
    `;
    document.head.append(style);
    document.body.append(box);

    // Typing a nickname must not reach the game's hotkeys.
    for (const type of ['keydown', 'keyup', 'keypress']) {
      box.addEventListener(type, event => {
        if (event.target instanceof HTMLInputElement) event.stopPropagation();
      });
    }

    function records() {
      return store.keys()
        .filter(key => key.startsWith(PREFIX))
        .map(key => store.get(key, null))
        .filter(record => record && record.name);
    }

    function renderChip() {
      const now = Date.now();
      const all = records().sort(byName);
      dots.replaceChildren(...all.map(record => {
        const state = viewState(record, now);
        const dot = document.createElement('i');
        dot.style.background = STATES[state]?.color ?? '#868e96';
        const warn = state !== 'closed' && state !== 'stale' && (lowBalls(record) || lowPotions(record));
        if (warn) dot.dataset.warn = '';
        dot.title = `${displayName(record.name)}: ${STATES[state]?.label ?? state}${warn ? ' (pouco estoque)' : ''}`;
        return dot;
      }));
      if (!body.hidden) renderList(all, now);
    }

    function byName(a, b) {
      return displayName(a.name).localeCompare(displayName(b.name), 'pt-BR', { sensitivity: 'base' });
    }

    // ---- Pieces of a row (HTML strings; values escaped) ----
    const esc = value => String(value).replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
    const clock = ms => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    function picHtml(main) {
      const bg = main?.bg ? `background-image:url('${esc(main.bg)}');` : '';
      const tint = main?.color ? `--tc:${esc(main.color)};` : '';
      const img = main?.front ? `<img src="${esc(main.front)}" alt="" draggable="false">` : '';
      return `<span class="pafk-mon-pic" style="${tint}${bg}" title="${esc(main ? `${main.name} Nv. ${main.level}` : '')}">${img}</span>`;
    }

    function foeHtml(foe) {
      if (!foe) return '';
      const icon = foe.dex
        ? `<i class="pafk-mon-foe-ic" style="background-image:url('${IMG.icon(foe.dex)}')" aria-hidden="true"></i>` : '';
      return `<span class="pafk-mon-foe" title="Pokémon selvagem na tela">${icon}`
        + `<span class="pafk-mon-foe-n">${esc(foe.name)}</span>${foe.level ? `<small>Nv. ${foe.level}</small>` : ''}</span>`;
    }

    // What the account is doing, besides the state name.
    function doingHtml(record, state, compact) {
      if (state === 'closed') return `<span class="pafk-mon-muted">Fechada às ${clock(record.at)}</span>`;
      if (state === 'stale') return `<span class="pafk-mon-muted">Última leitura às ${clock(record.at)}</span>`;
      if (state === 'daily' && record.daily) {
        const { done, total } = record.daily;
        const left = total - done;
        const bar = compact ? '' : `<span class="pafk-mon-bar"><i style="width:${total ? Math.round(done / total * 100) : 100}%"></i></span>`;
        return `${bar}<span>${done} de ${total} · ${left ? `faltam ${left}` : 'tudo feito'}</span>`;
      }
      if ((state === 'hunting' || state === 'fishing') && record.foe) return foeHtml(record.foe);
      if (state === 'hunting' || state === 'fishing') return '<span class="pafk-mon-muted">Procurando selvagens…</span>';
      if (state === 'battle') return '<span>Luta em andamento</span>';
      if (state === 'out') return '<span class="pafk-mon-muted">Na tela de entrada</span>';
      return compact ? '' : '<span class="pafk-mon-muted">Sem caçar nem lutar</span>';
    }

    function countsHtml(record, withMoney) {
      const ballList = (record.balls ?? []).filter(ball => ball.id !== AFK_BALL && (ball.n > 0 || ball.auto))
        .map(ball => `${ball.label}: ${fmt(ball.n)}${ball.auto ? ' (captura automática)' : ''}`).join('\n');
      const potionList = (record.potions ?? []).map(potion => `${potion.label}: ${fmt(potion.n)}`).join('\n');
      const cell = (img, n, unit, title, low) => `<span class="pafk-mon-n" title="${esc(title)}"${low ? ' data-low' : ''}>`
        + `<img src="${img}" alt="" draggable="false">${low ? '⚠' : ''}${n}<span class="pafk-mon-sr"> ${unit}</span></span>`;
      const balls = cell(IMG.ball, fmt(record.ballsTotal), 'bolas', ballList || 'Sem bolas', lowBalls(record));
      const potions = record.potionsTotal === null
        ? cell(IMG.potion, '?', 'poções', 'O HUD desta conta não mostra as poções; abra a Bolsa uma vez.', false)
        : cell(IMG.potion, fmt(record.potionsTotal), 'poções', potionList, lowPotions(record));
      const money = withMoney && record.money ? `<span class="pafk-mon-money pafk-mon-pixel" title="Dinheiro">₽${fmt(record.money)}</span>` : '';
      const afk = record.afkBalls === null || record.afkBalls === undefined ? ''
        : cell(IMG.afk, fmt(record.afkBalls), 'AFK Balls', 'AFK Ball (separada das outras bolas; costuma ser usada nos shinies)', false)
          .replace('class="pafk-mon-n"', `class="pafk-mon-n pafk-mon-afk"${record.afkBalls ? '' : ' data-zero'}`);
      return `${balls}${potions}${afk}${money}`;
    }

    const nfc = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
    function eta(xp) {
      if (!xp?.rate || xp.max === null || xp.cur === null) return '';
      const minutes = Math.ceil((xp.max - xp.cur) / xp.rate * 60);
      if (minutes > 99 * 60) return '';
      const time = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
      return `próximo nível em ~${time}`;
    }
    // One XP rate: "348 mil/h", "medindo…" or "—" (old record).
    function rateText(xp, live) {
      if (!xp) return '—';
      if (!live) return '—';
      return xp.rate === null ? 'medindo…' : `${nfc.format(xp.rate)}/h`;
    }
    function rateTitle(label, xp, live) {
      if (!xp) return `${label}: sem dados`;
      const parts = [`${label}: ${live && xp.rate !== null ? `${fmt(xp.rate)} XP/h nos últimos 10 min` : 'XP/h ainda sem medida'}`];
      if (xp.max !== null) parts.push(`${fmt(xp.cur)} / ${fmt(xp.max)} XP neste nível`);
      const next = live ? eta(xp) : '';
      if (next) parts.push(next);
      return parts.join('\n');
    }

    function xpHtml(record, state, compact) {
      const live = state !== 'stale' && state !== 'closed' && state !== 'out';
      const trainer = record.xp?.trainer;
      const mon = record.xp?.mon;
      if (!trainer && !mon) return '';
      const icon = `<img src="${IMG.xp}" alt="" draggable="false">`;
      if (compact) {
        const title = [rateTitle('Treinador', trainer, live), rateTitle(record.main?.name ?? 'Pokémon', mon, live)].join('\n\n');
        return `<span class="pafk-mon-n pafk-mon-xpn" title="${esc(title)}">${icon}${esc(rateText(trainer, live))}<span class="pafk-mon-sr"> XP do treinador</span></span>`;
      }
      const cell = (label, xp) => `<span class="pafk-mon-xpcell" title="${esc(rateTitle(label, xp, live))}">`
        + `<span>${esc(label)}</span><b class="pafk-mon-pixel">${esc(rateText(xp, live))}</b></span>`;
      return `${icon}<span class="pafk-mon-xplbl">XP/h</span>${cell('Treinador', trainer)}${cell(record.main?.name ?? 'Pokémon', mon)}`;
    }

    function hpHtml(main) {
      if (!main) return '';
      const name = `<span class="pafk-mon-monname">${esc(main.name)}</span><span>Nv. ${main.level}</span>`;
      if (main.hp === null || !main.hpMax) return name;
      const ratio = Math.max(0, Math.min(1, main.hp / main.hpMax));
      const level = ratio <= 0.2 ? ' data-low' : ratio <= 0.5 ? ' data-mid' : '';
      return `${name}<span class="pafk-mon-hp" title="HP ${main.hp}/${main.hpMax}"><i${level} style="width:${Math.round(ratio * 100)}%"></i></span>`
        + `<span>${main.hp}/${main.hpMax}</span>`;
    }

    function setHtml(element, html) {
      if (element && element.dataset.html !== html) {
        element.dataset.html = html;
        element.innerHTML = html;
      }
    }

    // ---- Rows ----
    // Rows are kept per account and updated in place, so the buttons keep working while the
    // numbers change every second.
    const rows = new Map();
    let shownMode = null;
    let editing = null;
    const mode = () => (store.get(COMPACT_KEY, false) ? 'compact' : 'full');

    function makeRow(name, compact) {
      const item = document.createElement('li');
      if (compact) {
        item.className = 'pafk-mon-row';
        item.innerHTML = `
          <span data-f="pic"></span>
          <div style="min-width: 0">
            <div class="pafk-mon-name"><b data-f="name"></b><small data-f="sub"></small><span class="pafk-mon-age" data-f="age"></span></div>
            <div class="pafk-mon-line" data-f="line"></div>
          </div>
          <div class="pafk-mon-counts" data-f="counts"></div>`;
        return item;
      }
      item.className = 'pafk-mon-card';
      item.innerHTML = `
        <span data-f="pic" style="grid-row: 1 / 5; align-self: start"></span>
        <div class="pafk-mon-name"><b data-f="name"></b><small data-f="sub"></small></div>
        <div class="pafk-mon-meta">
          <span class="pafk-mon-age" data-f="age"></span>
          <button type="button" data-mon-rename title="Dar um apelido" aria-label="Dar um apelido a ${esc(name)}">✎</button>
          <button type="button" data-mon-forget title="Tirar da lista (volta quando a aba da conta atualizar)" aria-label="Tirar ${esc(name)} da lista">✕</button>
        </div>
        <div class="pafk-mon-status" data-f="status"></div>
        <div class="pafk-mon-mon" data-f="mon"></div>
        <div class="pafk-mon-xp" data-f="xp"></div>
        <div class="pafk-mon-cardfoot">
          <div class="pafk-mon-doing" data-f="doing"></div>
          <div class="pafk-mon-counts" data-f="counts"></div>
        </div>`;
      $('[data-mon-rename]', item).addEventListener('click', () => startRename(item, name));
      $('[data-mon-forget]', item).addEventListener('click', () => {
        store.del(PREFIX + name);
        if (name === myName) lastSaved = '';
        rows.delete(name);
        item.remove();
        renderChip();
      });
      return item;
    }

    function renderList(all, now) {
      const current = mode();
      if (current !== shownMode) {
        shownMode = current;
        box.dataset.mode = current;
        rows.clear();
        list.replaceChildren();
        for (const button of $$('[data-mon-mode]', box)) {
          button.setAttribute('aria-pressed', String(button.dataset.monMode === current));
        }
      }
      const compact = current === 'compact';
      empty.hidden = all.length > 0;
      countEl.textContent = all.length ? `(${all.length})` : '';
      const allNicks = nicks();
      const seen = new Set();
      all.forEach((record, index) => {
        seen.add(record.name);
        let item = rows.get(record.name);
        if (!item) {
          item = makeRow(record.name, compact);
          rows.set(record.name, item);
        }
        if (list.children[index] !== item) list.insertBefore(item, list.children[index] ?? null);
        const state = viewState(record, now);
        const info = STATES[state] ?? STATES.stale;
        item.dataset.state = state;
        item.style.setProperty('--c', info.color);
        item.toggleAttribute('data-me', record.name === myName);

        const nick = allNicks[record.name];
        if (editing !== record.name) {
          $('[data-f="name"]', item).textContent = nick || record.name;
          $('[data-f="sub"]', item).textContent = [nick ? record.name : '', record.name === myName ? 'esta aba' : '']
            .filter(Boolean).join(' · ');
        }
        setHtml($('[data-f="pic"]', item), picHtml(record.main));
        const age = $('[data-f="age"]', item);
        age.textContent = ago(now - record.at);
        age.title = `Última leitura: ${new Date(record.at).toLocaleString('pt-BR')}`;
        const since = state !== 'closed' && state !== 'stale' && record.since ? ago(now - record.since) : '';
        setHtml($('[data-f="counts"]', item), countsHtml(record, !compact) + (compact ? xpHtml(record, state, true) : ''));

        if (compact) {
          const doing = doingHtml(record, state, true);
          setHtml($('[data-f="line"]', item), `<i class="pafk-mon-dot"></i><b>${esc(info.label)}</b>`
            + (doing ? ` · ${doing}` : since ? ` · ${esc(since)}` : ''));
          return;
        }
        setHtml($('[data-f="status"]', item), `<span class="pafk-mon-pill"><i></i>${esc(info.label)}</span>`
          + (since ? `<small>${esc(since)}</small>` : ''));
        setHtml($('[data-f="mon"]', item), hpHtml(record.main));
        setHtml($('[data-f="xp"]', item), xpHtml(record, state, false));
        setHtml($('[data-f="doing"]', item), doingHtml(record, state, false));
      });
      for (const [name, item] of rows) {
        if (!seen.has(name)) {
          rows.delete(name);
          item.remove();
        }
      }
    }

    for (const button of $$('[data-mon-mode]', box)) {
      button.addEventListener('click', () => {
        store.set(COMPACT_KEY, button.dataset.monMode === 'compact');
        renderChip();
      });
    }

    function startRename(item, name) {
      editing = name;
      const target = $('.pafk-mon-name', item);
      const input = document.createElement('input');
      input.value = nicks()[name] ?? '';
      input.placeholder = name;
      input.maxLength = 24;
      input.setAttribute('aria-label', `Apelido de ${name} (vazio volta ao nome da conta)`);
      for (const child of target.children) child.hidden = true;
      target.append(input);
      input.focus();
      input.select();
      let done = false;
      const finish = keep => {
        if (done) return;
        done = true;
        input.remove();
        for (const child of target.children) child.hidden = false;
        if (keep) {
          const all = nicks();
          const value = input.value.trim();
          if (value) all[name] = value;
          else delete all[name];
          store.set(NICKS_KEY, all);
        }
        editing = null;
        tick();
      };
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') finish(true);
        if (event.key === 'Escape') finish(false);
      });
      input.addEventListener('blur', () => finish(true));
    }

    // Changes from other tabs: listen to each account key as it appears.
    const listening = new Set();
    function listen() {
      if (typeof GM_addValueChangeListener !== 'function') return;
      for (const key of [NICKS_KEY, ...store.keys().filter(key => key.startsWith(PREFIX))]) {
        if (listening.has(key)) continue;
        listening.add(key);
        GM_addValueChangeListener(key, (_key, _old, _value, remote) => {
          if (!remote) return;
          if (key === NICKS_KEY && me) {
            wantedTitle = titleFor(me);
            wantedIcon = iconFor(me.state, displayName(me.name));
            applyTab();
          }
          renderChip();
        });
      }
    }
    listen();
    setInterval(listen, 5000);
    // While the panel is open, refresh the ages every second.
    setInterval(() => {
      if (!body.hidden) renderChip();
    }, 1000);

    // ---- Opening, position and dragging (same behavior as the Daily card) ----
    function setOpen(open) {
      body.hidden = !open;
      $('.pafk-mon-chip', box).setAttribute('aria-expanded', String(open));
      try {
        localStorage.setItem(OPEN_STORAGE, open ? '1' : '0');
      } catch {
        // Remembered for this page only.
      }
      if (open) renderChip();
    }

    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(POSITION_STORAGE) ?? 'null');
    } catch {
      saved = null;
    }
    function clampPosition({ right, top }) {
      const width = $('.pafk-mon-chip', box).offsetWidth || 90;
      return {
        right: Math.min(Math.max(0, right), Math.max(0, innerWidth - width)),
        top: Math.min(Math.max(0, top), Math.max(0, innerHeight - 40)),
      };
    }
    // Until dragged, it sits left of the game's AUTO button, over the map (the column under AUTO
    // holds the quick actions, the XP boost and the Daily card).
    function placeBox() {
      let position = saved ? clampPosition(saved) : null;
      if (!position) {
        const auto = $('.hud.world-hud .hud-auto-toggle')?.getBoundingClientRect();
        position = auto && auto.width > 0
          ? { top: Math.round(auto.top), right: Math.round(innerWidth - auto.left + 8) }
          : { top: 72, right: 170 };
      }
      box.style.top = `${position.top}px`;
      box.style.right = `${position.right}px`;
    }
    placeBox();
    setInterval(placeBox, 1000);
    addEventListener('resize', placeBox);

    let dragged = false;
    for (const handle of $$('.pafk-mon-chip, .pafk-mon-body > header', box)) {
      handle.addEventListener('pointerdown', event => {
        // Buttons inside the header (mode, close) are not drag handles; pointer capture would eat their click.
        if (event.button !== 0 || (event.target.closest('button') && event.target.closest('button') !== handle)) return;
        const start = { x: event.clientX, y: event.clientY };
        const origin = { right: parseFloat(box.style.right) || 0, top: parseFloat(box.style.top) || 0 };
        let moving = false;
        dragged = false;
        handle.setPointerCapture(event.pointerId);
        const move = moveEvent => {
          const dx = moveEvent.clientX - start.x;
          const dy = moveEvent.clientY - start.y;
          if (!moving && Math.hypot(dx, dy) < 5) return;
          moving = true;
          box.dataset.dragging = '';
          saved = clampPosition({ right: origin.right - dx, top: origin.top + dy });
          placeBox();
        };
        const end = () => {
          handle.removeEventListener('pointermove', move);
          handle.removeEventListener('pointerup', end);
          handle.removeEventListener('pointercancel', end);
          delete box.dataset.dragging;
          if (!moving) return;
          dragged = true;
          try {
            localStorage.setItem(POSITION_STORAGE, JSON.stringify(saved));
          } catch {
            // The position lasts only for this page.
          }
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', end);
        handle.addEventListener('pointercancel', end);
      });
    }
    $('.pafk-mon-body > header', box).addEventListener('dblclick', () => {
      saved = null;
      try {
        localStorage.removeItem(POSITION_STORAGE);
      } catch {
        // Nothing to forget.
      }
      placeBox();
    });
    for (const toggle of $$('[data-mon-toggle]', box)) {
      toggle.addEventListener('click', () => {
        if (dragged) {
          dragged = false;
          return;
        }
        setOpen(body.hidden);
      });
    }
    try {
      if (localStorage.getItem(OPEN_STORAGE) === '1') setOpen(true);
    } catch {
      // Starts closed.
    }

    // Menu of the userscript manager: nickname for this tab's account.
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('Dar um apelido a esta conta', () => {
        if (!myName) {
          alert('Entre no jogo primeiro para o script saber qual é a conta.');
          return;
        }
        const value = prompt(`Apelido para ${myName} (vazio volta ao nome da conta):`, nicks()[myName] ?? '');
        if (value === null) return;
        const all = nicks();
        if (value.trim()) all[myName] = value.trim().slice(0, 24);
        else delete all[myName];
        store.set(NICKS_KEY, all);
        tick();
      });
      GM_registerMenuCommand('Mostrar ou esconder o painel de contas', () => setOpen(body.hidden));
    }

    tick();
  })();
})();
