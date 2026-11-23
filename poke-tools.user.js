// ==UserScript==
// @name         PokeAFK Tools
// @namespace    pokeafk-tools
// @version      1.10.1
// @description  Ferramentas para o pokeAFK: filtros e base de preços no mercado, tiers no mapa e na ficha, recomendações de builds, daily de treinadores, monitor de contas e desvio de golpes em área.
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
    monitor: 'Monitor de contas e troca entre contas',
    dodge: 'Desvio de golpes em área (experimental)',
  };
  // Experimental parts start turned off until the player turns them on in the menu.
  const MODULES_OFF_BY_DEFAULT = new Set(['dodge']);
  const MODULES_KEY = 'modules';
  const hasModuleStore = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

  function readModules() {
    let saved = {};
    try {
      saved = (hasModuleStore ? GM_getValue(MODULES_KEY, {}) : {}) || {};
    } catch {}
    return Object.fromEntries(Object.keys(MODULES).map(id => [id,
      typeof saved[id] === 'boolean' ? saved[id] : !MODULES_OFF_BY_DEFAULT.has(id)]));
  }

  const enabledModules = readModules();
  const moduleEnabled = id => enabledModules[id] === true;

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
    "tierThresholds": {"pve":{"S":80.3,"A":63.5,"B":47.5,"C":26.7,"D":0},"pvp":{"S":70.5,"A":58.9,"B":49.6,"C":30.7,"D":0}},
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
      "3": {"id":3,"name":"Venusaur","types":["grass","poison"],"stats":{"hp":80,"atk":82,"def":83,"spa":100,"spd":100,"spe":80},"pve":{"tier":"B","score":59,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["SolarBeam","Sludge Bomb","Growth"],"note":"Dano estimado por segundo na caça: 141,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":43.5,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Modest","Quiet"],"moves":["PoisonPowder","SolarBeam","Leech Seed","Synthesis"],"note":"Duelo de referência: 35,7/100 (perfil especial). Gen 3: UUBL; set \"Disabler\" com 4/4 golpes por nível.","smogon":{"tier":"UUBL","covered":4,"slots":4}}},
      "6": {"id":6,"name":"Charizard","types":["fire","flying"],"stats":{"hp":78,"atk":84,"def":78,"spa":109,"spd":85,"spe":100},"pve":{"tier":"B","score":61.9,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Flamethrower","Ember","Fire Spin"],"note":"Dano estimado por segundo na caça: 148,3."},"pvp":{"tier":"B","score":55.8,"role":"special","priority":["spa","hp","def"],"natures":["Bold","Calm","Relaxed"],"moves":["Ember","Flamethrower","Dragon Rage","Scary Face"],"note":"Duelo de referência: 61,5/100 (perfil especial). Gen 3: OU; set \"Mixed Attacker\" com 0/4 golpes por nível (faltam Fire Blast, Hidden Power Grass, Substitute / Dragon Claw, Focus Punch / Beat Up).","smogon":{"tier":"OU","covered":0,"slots":4}}},
      "9": {"id":9,"name":"Blastoise","types":["water"],"stats":{"hp":79,"atk":83,"def":100,"spa":85,"spd":105,"spe":78},"pve":{"tier":"A","score":70.7,"role":"special","priority":["spa"],"natures":["Mild","Quiet","Rash"],"moves":["Surf","Rain Dance","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 169,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":61.9,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Brave","Quiet","Naughty"],"moves":["Tail Whip","Surf","Waterfall","Protect"],"note":"Duelo de referência: 65,4/100 (perfil misto). Gen 3: UU; set \"Standard\" com 2/4 golpes por nível (faltam Ice Beam, Rest).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "12": {"id":12,"name":"Butterfree","types":["bug","flying"],"stats":{"hp":60,"atk":45,"def":50,"spa":80,"spd":80,"spe":70},"pve":{"tier":"C","score":33.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Psybeam","Confusion","Silver Wind"],"note":"Dano estimado por segundo na caça: 80,7."},"pvp":{"tier":"D","score":22.9,"role":"special","priority":["spa","hp","spd"],"natures":["Timid","Quiet","Naive"],"moves":["Gust","Psybeam","Harden","Silver Wind"],"note":"Duelo de referência: 23,7/100 (perfil especial). Gen 3: ZU; set \"Double Powder\" com 2/4 golpes por nível (faltam Psychic, Hidden Power Fire).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "15": {"id":15,"name":"Beedrill","types":["bug","poison"],"stats":{"hp":65,"atk":80,"def":40,"spa":45,"spd":80,"spe":75},"pve":{"tier":"C","score":31.7,"role":"physical","priority":["atk","spe"],"natures":["Hasty","Jolly","Naive"],"moves":["Pin Missile","Twineedle","Cut","Agility"],"note":"Dano estimado por segundo na caça: 75,9, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":31.7,"role":"physical","priority":["atk","hp"],"natures":["Adamant","Brave","Naughty"],"moves":["Twineedle","Pursuit","Harden","Agility"],"note":"Duelo de referência: 35,1/100 (perfil físico). Gen 3: ZU; set \"Choice Band\" com 1/4 golpes por nível (faltam Sludge Bomb, Hidden Power Bug / Hidden Power Rock, Brick Break).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "18": {"id":18,"name":"Pidgeot","types":["normal","flying"],"stats":{"hp":83,"atk":80,"def":75,"spa":70,"spd":70,"spe":91},"pve":{"tier":"C","score":43.4,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Gust","Quick Attack","Tackle","Agility"],"note":"Dano estimado por segundo na caça: 104, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":50.8,"role":"mixed","priority":["atk","spa","hp","spd"],"natures":["Gentle","Sassy","Brave"],"moves":["Quick Attack","Tackle","Agility","Gust"],"note":"Duelo de referência: 56,7/100 (perfil misto). Gen 3: NU; set \"All-out Attacker\" com 1/4 golpes por nível (faltam Double-Edge, Aerial Ace / Hidden Power Flying, Hidden Power Ground / Return / Toxic / Facade).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "20": {"id":20,"name":"Raticate","types":["normal"],"stats":{"hp":55,"atk":81,"def":60,"spa":50,"spd":70,"spe":97},"pve":{"tier":"C","score":43.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Quick Attack","Tackle","Hyper Fang","Strength"],"note":"Dano estimado por segundo na caça: 103,2."},"pvp":{"tier":"C","score":36.5,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Adamant","Relaxed"],"moves":["Quick Attack","Hyper Fang","Tail Whip","Pursuit"],"note":"Duelo de referência: 38,4/100 (perfil físico). Gen 3: NU; set \"Choice Band\" com 1/4 golpes por nível (faltam Double-Edge / Return, Shadow Ball, Hidden Power Ground).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "22": {"id":22,"name":"Fearow","types":["normal","flying"],"stats":{"hp":65,"atk":90,"def":65,"spa":61,"spd":61,"spe":100},"pve":{"tier":"B","score":51.5,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Drill Peck","Fury Attack","Aerial Ace","Agility"],"note":"Dano estimado por segundo na caça: 123,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":56.1,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Adamant","Brave","Careful"],"moves":["Drill Peck","Agility","Leer","Fury Attack"],"note":"Duelo de referência: 61,2/100 (perfil físico). Gen 3: RUBL; set \"Choice Band\" com 1/4 golpes por nível (faltam Quick Attack, Return, Hidden Power Ground).","smogon":{"tier":"RUBL","covered":1,"slots":4}}},
      "24": {"id":24,"name":"Arbok","types":["poison"],"stats":{"hp":60,"atk":85,"def":69,"spa":65,"spd":79,"spe":80},"pve":{"tier":"D","score":21.5,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Strength","Poison Sting","Wrap"],"note":"Dano estimado por segundo na caça: 51,5."},"pvp":{"tier":"C","score":45.5,"role":"physical","priority":["atk","hp"],"natures":["Adamant","Impish","Naughty"],"moves":["Bite","Strength","Glare","Screech"],"note":"Duelo de referência: 48,5/100 (perfil físico). Gen 3: PU; set \"Offensive\" com 2/4 golpes por nível (faltam Sludge Bomb, Earthquake).","smogon":{"tier":"PU","covered":2,"slots":4}}},
      "26": {"id":26,"name":"Raichu","types":["electric"],"stats":{"hp":60,"atk":90,"def":55,"spa":90,"spd":80,"spe":100},"pve":{"tier":"B","score":56.1,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Thunderbolt","ThunderShock","Quick Attack","Thunder"],"note":"Dano estimado por segundo na caça: 134,5."},"pvp":{"tier":"B","score":55.2,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Relaxed","Sassy","Quiet"],"moves":["ThunderShock","Quick Attack","Charm","Light Screen"],"note":"Duelo de referência: 58,5/100 (perfil misto). Gen 3: RU; set \"Wish\" com 2/4 golpes por nível (faltam Hidden Power Grass / Hidden Power Ice, Wish).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "28": {"id":28,"name":"Sandslash","types":["ground"],"stats":{"hp":75,"atk":100,"def":110,"spa":45,"spd":55,"spe":65},"pve":{"tier":"C","score":27.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Cut","Strength","Fury Swipes"],"note":"Dano estimado por segundo na caça: 65,2."},"pvp":{"tier":"C","score":30.7,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Adamant","Naughty","Careful"],"moves":["Slash","Strength","Defense Curl","Rock Smash"],"note":"Duelo de referência: 32/100 (perfil físico). Gen 3: UU; set \"Swords Dance\" com 0/4 golpes por nível (faltam Earthquake, Rock Slide / Rapid Spin, Hidden Power Bug / Rapid Spin, Swords Dance).","smogon":{"tier":"UU","covered":0,"slots":4}}},
      "31": {"id":31,"name":"Nidoqueen","types":["poison","ground"],"stats":{"hp":90,"atk":82,"def":87,"spa":75,"spd":85,"spe":76},"pve":{"tier":"C","score":37.5,"role":"mixed","priority":["atk","spa","spe"],"natures":["Hasty","Naive","Lonely"],"moves":["Surf","Double Kick","Bite","Body Slam"],"note":"Dano estimado por segundo na caça: 89,8. Usa dano físico e especial."},"pvp":{"tier":"B","score":52.7,"role":"physical","priority":["atk","hp","spe","def"],"natures":["Jolly","Hasty","Impish"],"moves":["Tail Whip","Body Slam","Crunch","Surf"],"note":"Duelo de referência: 59,1/100 (perfil físico). Gen 3: UU; set \"Standard\" com 0/4 golpes por nível (faltam Earthquake, Shadow Ball, Sludge Bomb, Ice Beam).","smogon":{"tier":"UU","covered":0,"slots":4}}},
      "34": {"id":34,"name":"Nidoking","types":["poison","ground"],"stats":{"hp":81,"atk":92,"def":77,"spa":85,"spd":75,"spe":85},"pve":{"tier":"B","score":53,"role":"mixed","priority":["atk","spa","spe"],"natures":["Brave","Lonely","Naughty"],"moves":["Thrash","Surf","Double Kick","Horn Attack"],"note":"Dano estimado por segundo na caça: 127. Usa dano físico e especial."},"pvp":{"tier":"A","score":60.2,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Relaxed","Lax"],"moves":["Thrash","Double Kick","Horn Attack","Peck"],"note":"Duelo de referência: 68,4/100 (perfil físico). Gen 3: UU; set \"Standard\" com 0/4 golpes por nível (faltam Earthquake, Megahorn, Shadow Ball, Ice Beam).","smogon":{"tier":"UU","covered":0,"slots":4}}},
      "36": {"id":36,"name":"Clefable","types":["normal"],"stats":{"hp":95,"atk":70,"def":73,"spa":85,"spd":90,"spe":60},"pve":{"tier":"C","score":30,"role":"physical","priority":["atk","spe"],"natures":["Brave","Adamant","Lonely"],"moves":["Pound","Strength","Meteor Mash","DoubleSlap"],"note":"Dano estimado por segundo na caça: 71,8."},"pvp":{"tier":"B","score":56.7,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Adamant"],"moves":["Charm","Strength","Meteor Mash","Moonlight"],"note":"Duelo de referência: 60,9/100 (perfil físico). Gen 3: RU; set \"Cosmic Power Staller\" com 2/4 golpes por nível (faltam Rest, Seismic Toss).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "38": {"id":38,"name":"Ninetales","types":["fire"],"stats":{"hp":73,"atk":76,"def":75,"spa":81,"spd":100,"spe":100},"pve":{"tier":"B","score":49.1,"role":"special","priority":["spa","spe"],"natures":["Mild","Rash","Modest"],"moves":["Flamethrower","Ember","Quick Attack","Fire Spin"],"note":"Dano estimado por segundo na caça: 117,8."},"pvp":{"tier":"B","score":58.7,"role":"special","priority":["spa","hp","spd","def"],"natures":["Modest","Rash","Calm"],"moves":["Ember","Flamethrower","Quick Attack","Confuse Ray"],"note":"Duelo de referência: 62,7/100 (perfil especial). Gen 3: RU; set \"Grudge\" com 2/4 golpes por nível (faltam Fire Blast, Hidden Power Grass / Substitute).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "40": {"id":40,"name":"Wigglytuff","types":["normal"],"stats":{"hp":140,"atk":70,"def":45,"spa":75,"spd":50,"spe":45},"pve":{"tier":"B","score":49.9,"role":"mixed","priority":["atk","spa"],"natures":["Brave","Lonely","Naughty"],"moves":["Double-Edge","Hyper Voice","Body Slam","Pound"],"note":"Dano estimado por segundo na caça: 119,7. Usa dano físico e especial."},"pvp":{"tier":"C","score":45.1,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Adamant","Relaxed"],"moves":["Body Slam","Strength","Rest","Charm"],"note":"Duelo de referência: 51,1/100 (perfil físico). Gen 3: PU; set \"Offensive Sub\" com 1/4 golpes por nível (faltam Shadow Ball, Substitute, Seismic Toss / Focus Punch / Fire Blast).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "45": {"id":45,"name":"Vileplume","types":["grass","poison"],"stats":{"hp":75,"atk":80,"def":85,"spa":100,"spd":90,"spe":50},"pve":{"tier":"B","score":58.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Petal Dance","Acid","Mega Drain","Absorb"],"note":"Dano estimado por segundo na caça: 140."},"pvp":{"tier":"S","score":72.1,"role":"special","priority":["spa","hp","def","spd"],"natures":["Sassy","Quiet","Brave"],"moves":["Petal Dance","Stun Spore","Moonlight","Sleep Powder"],"note":"Duelo de referência: 76,4/100 (perfil especial). Gen 3: UU; set \"Cleric\" com 3/4 golpes por nível (faltam Sludge Bomb / Hidden Power Grass).","smogon":{"tier":"UU","covered":3,"slots":4}}},
      "47": {"id":47,"name":"Parasect","types":["bug","grass"],"stats":{"hp":60,"atk":95,"def":80,"spa":60,"spd":80,"spe":30},"pve":{"tier":"D","score":22,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Cut","Growth","Scratch"],"note":"Dano estimado por segundo na caça: 52,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":15.7,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Cut","Spore","Stun Spore"],"note":"Duelo de referência: 14/100 (perfil físico). Gen 3: ZU; set \"Special Attacker\" com 3/4 golpes por nível (faltam Hidden Power Ice / Hidden Power Fire).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "49": {"id":49,"name":"Venomoth","types":["bug","poison"],"stats":{"hp":70,"atk":65,"def":60,"spa":90,"spd":75,"spe":90},"pve":{"tier":"C","score":41.7,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Psybeam","Psychic","Silver Wind"],"note":"Dano estimado por segundo na caça: 99,9."},"pvp":{"tier":"C","score":34.1,"role":"special","priority":["spa","hp","def"],"natures":["Relaxed","Quiet","Modest"],"moves":["Psybeam","Psychic","Confusion","Silver Wind"],"note":"Duelo de referência: 33,9/100 (perfil especial). Gen 3: NU; set \"Lead Support\" com 2/4 golpes por nível (faltam Baton Pass, Substitute).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "51": {"id":51,"name":"Dugtrio","types":["ground"],"stats":{"hp":35,"atk":80,"def":50,"spa":50,"spd":70,"spe":120},"pve":{"tier":"B","score":48.9,"role":"physical","priority":["atk"],"natures":["Brave","Adamant","Lonely"],"moves":["Earthquake","Slash","Dig","Scratch"],"note":"Dano estimado por segundo na caça: 117,3."},"pvp":{"tier":"C","score":33.6,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Lax","Adamant"],"moves":["Sand-Attack","Slash","Earthquake","Dig"],"note":"Duelo de referência: 32,1/100 (perfil físico). Gen 3: UU (sem Arena Trap no jogo); set \"Choice Band\" com 1/4 golpes por nível (faltam Hidden Power Bug, Aerial Ace, Rock Slide / Beat Up / Sunny Day).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "53": {"id":53,"name":"Persian","types":["normal"],"stats":{"hp":65,"atk":70,"def":60,"spa":65,"spd":65,"spe":115},"pve":{"tier":"C","score":30.5,"role":"physical","priority":["atk","spe"],"natures":["Brave","Adamant","Lonely"],"moves":["Scratch","Slash","Cut","Bite"],"note":"Dano estimado por segundo na caça: 73,2."},"pvp":{"tier":"C","score":39.4,"role":"physical","priority":["atk","spe","hp"],"natures":["Jolly","Adamant","Impish"],"moves":["Slash","Screech","Bite","Growl"],"note":"Duelo de referência: 41,7/100 (perfil físico). Gen 3: RU; set \"Choice Band\" com 1/4 golpes por nível (faltam Return / Double-Edge, Hidden Power Ground / Hidden Power Fighting, Shadow Ball).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "55": {"id":55,"name":"Golduck","types":["water"],"stats":{"hp":80,"atk":82,"def":78,"spa":95,"spd":80,"spe":85},"pve":{"tier":"B","score":53.9,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Surf","Hydro Pump","Confusion"],"note":"Dano estimado por segundo na caça: 129,3."},"pvp":{"tier":"C","score":42.6,"role":"special","priority":["spa"],"natures":["Modest","Quiet","Mild"],"moves":["Surf","Confusion","Hydro Pump"],"note":"Duelo de referência: 41,3/100 (perfil especial). Gen 3: UU; set \"Calm Mind\" com 2/4 golpes por nível (faltam Calm Mind, Psychic).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "57": {"id":57,"name":"Primeape","types":["fighting"],"stats":{"hp":65,"atk":105,"def":60,"spa":60,"spd":70,"spe":95},"pve":{"tier":"B","score":54.5,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Cross Chop","Low Kick","Karate Chop"],"note":"Dano estimado por segundo na caça: 130,6."},"pvp":{"tier":"A","score":67.2,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Adamant","Impish"],"moves":["Thrash","Screech","Cross Chop","Low Kick"],"note":"Duelo de referência: 76/100 (perfil físico). Gen 3: RU; set \"Choice Band\" com 1/4 golpes por nível (faltam Focus Punch / Earthquake, Rock Slide, Hidden Power Ghost / Hidden Power Flying).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "59": {"id":59,"name":"Arcanine","types":["fire"],"stats":{"hp":90,"atk":110,"def":80,"spa":100,"spd":80,"spe":95},"pve":{"tier":"A","score":74.1,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Lonely"],"moves":["Flamethrower","Flame Wheel","Agility","Strength"],"note":"Dano estimado por segundo na caça: 177,7, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"A","score":67.4,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Adamant","Impish","Careful"],"moves":["Flame Wheel","Bite","Agility","Leer"],"note":"Duelo de referência: 71,6/100 (perfil físico). Gen 3: UU; set \"Barkanine\" com 2/4 golpes por nível (faltam Howl, Hidden Power Fighting).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "62": {"id":62,"name":"Poliwrath","types":["water","fighting"],"stats":{"hp":90,"atk":85,"def":95,"spa":70,"spd":90,"spe":70},"pve":{"tier":"A","score":69.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Submission","Body Slam","Waterfall","Belly Drum"],"note":"Dano estimado por segundo na caça: 166, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":54.5,"role":"physical","priority":["atk","spe","hp"],"natures":["Adamant","Naughty","Lonely"],"moves":["Submission","Body Slam","Waterfall","DoubleSlap"],"note":"Duelo de referência: 60,5/100 (perfil físico). Gen 3: RU; set \"Belly Drum\" com 1/4 golpes por nível (faltam Substitute, Brick Break, Hidden Power Ghost / Hidden Power Rock / Return).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "65": {"id":65,"name":"Alakazam","types":["psychic"],"stats":{"hp":55,"atk":50,"def":45,"spa":135,"spd":85,"spe":120},"pve":{"tier":"S","score":96.6,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psybeam","Psychic","Confusion","Calm Mind"],"note":"Dano estimado por segundo na caça: 231,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":57.8,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Bold","Modest"],"moves":["Psybeam","Psychic","Confusion","Calm Mind"],"note":"Duelo de referência: 55,2/100 (perfil especial). Gen 3: UUBL; set \"Calm Mind Sweeper\" com 3/4 golpes por nível (faltam Fire Punch).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "68": {"id":68,"name":"Machamp","types":["fighting"],"stats":{"hp":90,"atk":130,"def":80,"spa":65,"spd":85,"spe":55},"pve":{"tier":"B","score":51.9,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Submission","Low Kick","Vital Throw","Cross Chop"],"note":"Dano estimado por segundo na caça: 124,5."},"pvp":{"tier":"A","score":59,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Relaxed","Sassy","Brave"],"moves":["Low Kick","Strength","Vital Throw","Leer"],"note":"Duelo de referência: 63,9/100 (perfil físico). Gen 3: UUBL; set \"Bulk Up\" com 1/4 golpes por nível (faltam Bulk Up, Rock Slide, Hidden Power Ghost / Hidden Power Bug).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "71": {"id":71,"name":"Victreebel","types":["grass","poison"],"stats":{"hp":80,"atk":105,"def":65,"spa":100,"spd":60,"spe":70},"pve":{"tier":"B","score":57.5,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Razor Leaf","Acid","Growth","Slam"],"note":"Dano estimado por segundo na caça: 137,8, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":39,"role":"mixed","priority":["atk","spa","spe","hp"],"natures":["Brave","Sassy","Relaxed"],"moves":["Razor Leaf","Stun Spore","Acid","Growth"],"note":"Duelo de referência: 40,9/100 (perfil misto). Gen 3: RU; set \"Swords Dance\" com 1/4 golpes por nível (faltam Swords Dance, Sludge Bomb, Hidden Power Ground).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "73": {"id":73,"name":"Tentacruel","types":["water","poison"],"stats":{"hp":80,"atk":70,"def":65,"spa":80,"spd":120,"spe":100},"pve":{"tier":"A","score":68.2,"role":"special","priority":["spa"],"natures":["Mild","Rash","Quiet"],"moves":["Surf","BubbleBeam","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 163,5."},"pvp":{"tier":"B","score":58.8,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Brave","Quiet","Sassy"],"moves":["Surf","Barrier","Waterfall","BubbleBeam"],"note":"Duelo de referência: 61/100 (perfil misto). Gen 3: UU; set \"Mirror Coat\" com 2/4 golpes por nível (faltam Giga Drain / Toxic, Mirror Coat).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "76": {"id":76,"name":"Golem","types":["rock","ground"],"stats":{"hp":80,"atk":110,"def":130,"spa":55,"spd":65,"spe":45},"pve":{"tier":"B","score":60.6,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Earthquake","Double-Edge","Rock Blast","Rock Throw"],"note":"Dano estimado por segundo na caça: 145,3."},"pvp":{"tier":"C","score":45.3,"role":"physical","priority":["atk","hp","spe","def"],"natures":["Jolly","Naive","Relaxed"],"moves":["Defense Curl","Rock Throw","Rock Blast","Earthquake"],"note":"Duelo de referência: 42,9/100 (perfil físico). Gen 3: UU; set \"Choice Band\" com 3/4 golpes por nível (faltam Rock Slide / Hidden Power Rock).","smogon":{"tier":"UU","covered":3,"slots":4}}},
      "78": {"id":78,"name":"Rapidash","types":["fire"],"stats":{"hp":65,"atk":100,"def":70,"spa":80,"spd":80,"spe":105},"pve":{"tier":"B","score":48.2,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Stomp","Take Down","Strength","Bounce"],"note":"Dano estimado por segundo na caça: 115,6."},"pvp":{"tier":"C","score":40.7,"role":"physical","priority":["atk","hp","spd"],"natures":["Adamant","Lonely","Careful"],"moves":["Tail Whip","Tackle","Strength","Agility"],"note":"Duelo de referência: 40,4/100 (perfil físico). Gen 3: RU; set \"Baton Pass\" com 2/4 golpes por nível (faltam Baton Pass, Hidden Power Grass / Hidden Power Ice).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "80": {"id":80,"name":"Slowbro","types":["water","psychic"],"stats":{"hp":95,"atk":75,"def":110,"spa":100,"spd":80,"spe":30},"pve":{"tier":"B","score":61.1,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Psychic","Water Gun","Confusion"],"note":"Dano estimado por segundo na caça: 146,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":64.7,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Calm","Modest"],"moves":["Surf","Psychic","Amnesia","Confusion"],"note":"Duelo de referência: 68,3/100 (perfil especial). Gen 3: UUBL; set \"Defensive\" com 2/4 golpes por nível (faltam Rest, Calm Mind / Thunder Wave).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "82": {"id":82,"name":"Magneton","types":["electric","steel"],"stats":{"hp":50,"atk":60,"def":95,"spa":120,"spd":70,"spe":70},"pve":{"tier":"C","score":34.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["ThunderShock","Swift","Tri Attack","Zap Cannon"],"note":"Dano estimado por segundo na caça: 82,5."},"pvp":{"tier":"B","score":51.9,"role":"special","priority":["spa","spe"],"natures":["Timid","Naive","Hasty"],"moves":["ThunderShock","Metal Sound","Swift","Thunder Wave"],"note":"Duelo de referência: 54,7/100 (perfil especial). Gen 3: OU; set \"Trapper\" com 1/4 golpes por nível (faltam Thunderbolt, Hidden Power Fire / Hidden Power Grass, Protect / Substitute).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "83": {"id":83,"name":"Farfetch'd","types":["normal","flying"],"stats":{"hp":52,"atk":65,"def":55,"spa":58,"spd":62,"spe":60},"pve":{"tier":"B","score":49,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Cut","Swords Dance","Agility"],"note":"Dano estimado por segundo na caça: 117,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":30.1,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Gentle","Sassy"],"moves":["Slash","Peck","Swords Dance","Agility"],"note":"Duelo de referência: 31,3/100 (perfil físico). Gen 3: ZU; set \"Knock Off\" com 4/4 golpes por nível.","smogon":{"tier":"ZU","covered":4,"slots":4}}},
      "85": {"id":85,"name":"Dodrio","types":["normal","flying"],"stats":{"hp":60,"atk":110,"def":70,"spa":60,"spd":60,"spe":100},"pve":{"tier":"B","score":52.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Drill Peck","Peck","Fury Attack","Agility"],"note":"Dano estimado por segundo na caça: 125,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":58.6,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Impish","Adamant"],"moves":["Drill Peck","Peck","Fury Attack","Agility"],"note":"Duelo de referência: 62,4/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 1/4 golpes por nível (faltam Return, Quick Attack, Hidden Power Ground / Hidden Power Fighting).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "87": {"id":87,"name":"Dewgong","types":["water","ice"],"stats":{"hp":90,"atk":70,"def":80,"spa":70,"spd":95,"spe":70},"pve":{"tier":"A","score":63.5,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Aurora Beam","Ice Beam","Icy Wind"],"note":"Dano estimado por segundo na caça: 152,3."},"pvp":{"tier":"B","score":54.8,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Lax","Gentle","Hasty"],"moves":["Surf","Waterfall","Headbutt","Ice Beam"],"note":"Duelo de referência: 57,9/100 (perfil misto). Gen 3: NU; set \"Specially Defensive\" com 3/4 golpes por nível (faltam Sleep Talk).","smogon":{"tier":"NU","covered":3,"slots":4}}},
      "89": {"id":89,"name":"Muk","types":["poison"],"stats":{"hp":105,"atk":105,"def":75,"spa":65,"spd":100,"spe":50},"pve":{"tier":"D","score":20.7,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Pound","Strength"],"note":"Dano estimado por segundo na caça: 49,6."},"pvp":{"tier":"C","score":44.7,"role":"physical","priority":["atk","hp","spd"],"natures":["Adamant","Naughty","Lonely"],"moves":["Pound","Strength","Acid Armor","Screech"],"note":"Duelo de referência: 47/100 (perfil físico). Gen 3: UU; set \"Standard\" com 1/4 golpes por nível (faltam Ice Punch, Explosion, Hidden Power Ghost / Hidden Power Grass).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "91": {"id":91,"name":"Cloyster","types":["water","ice"],"stats":{"hp":50,"atk":95,"def":180,"spa":85,"spd":45,"spe":70},"pve":{"tier":"A","score":72.2,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Surf","Aurora Beam","Ice Beam","Dive"],"note":"Dano estimado por segundo na caça: 173."},"pvp":{"tier":"B","score":58.3,"role":"special","priority":["spa","hp","spd","def"],"natures":["Rash","Modest","Calm"],"moves":["Surf","Protect","Aurora Beam","Ice Beam"],"note":"Duelo de referência: 56,3/100 (perfil especial). Gen 3: OU; set \"Spiker\" com 3/4 golpes por nível (faltam Explosion).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "94": {"id":94,"name":"Gengar","types":["ghost","poison"],"stats":{"hp":60,"atk":65,"def":60,"spa":130,"spd":75,"spe":110},"pve":{"tier":"C","score":28.9,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Shadow Ball"],"note":"Dano estimado por segundo na caça: 69,3."},"pvp":{"tier":"A","score":67.2,"role":"special","priority":["spa","hp","def"],"natures":["Modest","Mild","Rash"],"moves":["Shadow Ball","Dream Eater","Night Shade","Hypnosis"],"note":"Duelo de referência: 64,9/100 (perfil especial). Gen 3: OU; set \"Utility\" com 3/4 golpes por nível (faltam Ice Punch / Taunt / Explosion / Focus Punch).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "97": {"id":97,"name":"Hypno","types":["psychic"],"stats":{"hp":85,"atk":73,"def":70,"spa":73,"spd":115,"spe":67},"pve":{"tier":"C","score":30.3,"role":"mixed","priority":["atk","spa","spe"],"natures":["Quiet","Lonely","Naughty"],"moves":["Psychic","Pound","Headbutt","Meditate"],"note":"Dano estimado por segundo na caça: 72,7, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"C","score":31.4,"role":"mixed","priority":["atk","spa","spe"],"natures":["Quiet","Hasty","Sassy"],"moves":["Pound","Headbutt","Meditate","Confusion"],"note":"Duelo de referência: 31,9/100 (perfil misto). Gen 3: RU; set \"Support\" com 1/4 golpes por nível (faltam Thunder Wave / Toxic, Wish, Reflect / Protect / Counter).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "99": {"id":99,"name":"Kingler","types":["water"],"stats":{"hp":55,"atk":130,"def":115,"spa":50,"spd":50,"spe":75},"pve":{"tier":"B","score":56.1,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Stomp","ViceGrip","Crabhammer","Dive"],"note":"Dano estimado por segundo na caça: 134,4."},"pvp":{"tier":"C","score":47.1,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Brave","Naughty"],"moves":["Crabhammer","Strength","Stomp","Protect"],"note":"Duelo de referência: 53,2/100 (perfil físico). Gen 3: PU; set \"Swords Dance\" com 1/4 golpes por nível (faltam Swords Dance, Double-Edge / Return, Hidden Power Ghost / Substitute).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "101": {"id":101,"name":"Electrode","types":["electric"],"stats":{"hp":60,"atk":50,"def":70,"spa":80,"spd":80,"spe":140},"pve":{"tier":"D","score":8.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Swift"],"note":"Dano estimado por segundo na caça: 20,2."},"pvp":{"tier":"D","score":19.1,"role":"special","priority":["spa","spe","hp","spd"],"natures":["Mild","Modest","Quiet"],"moves":["Swift","SonicBoom","Light Screen"],"note":"Duelo de referência: 14,5/100 (perfil especial). Gen 3: UU; set \"Substitute\" com 1/4 golpes por nível (faltam Thunderbolt, Substitute, Hidden Power Ice / Toxic).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "103": {"id":103,"name":"Exeggutor","types":["grass","psychic"],"stats":{"hp":95,"atk":95,"def":85,"spa":125,"spd":65,"spe":55},"pve":{"tier":"B","score":47.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["SolarBeam","Confusion","Uproar"],"note":"Dano estimado por segundo na caça: 114,3."},"pvp":{"tier":"C","score":39.6,"role":"special","priority":["spa","hp","def"],"natures":["Bold","Modest","Relaxed"],"moves":["Confusion","Leech Seed","Reflect","Stun Spore"],"note":"Duelo de referência: 34,5/100 (perfil especial). Gen 3: UUBL; set \"Double Powder\" com 3/4 golpes por nível (faltam Explosion).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "105": {"id":105,"name":"Marowak","types":["ground"],"stats":{"hp":60,"atk":80,"def":110,"spa":50,"spd":80,"spe":45},"pve":{"tier":"C","score":41.6,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Bonemerang","Double-Edge","Bone Rush"],"note":"Dano estimado por segundo na caça: 99,6."},"pvp":{"tier":"B","score":49.9,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Naughty"],"moves":["Thrash","Bonemerang","Double-Edge","Bone Rush"],"note":"Duelo de referência: 50/100 (perfil físico). Gen 3: UUBL; set \"Swords Dance\" com 2/4 golpes por nível (faltam Swords Dance, Rock Slide).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "106": {"id":106,"name":"Hitmonlee","types":["fighting"],"stats":{"hp":50,"atk":120,"def":53,"spa":35,"spd":110,"spe":87},"pve":{"tier":"A","score":79.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Meditate","Jump Kick","Hi Jump Kick","Brick Break"],"note":"Dano estimado por segundo na caça: 190,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":56.3,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Adamant"],"moves":["Double Kick","Hi Jump Kick","Brick Break","Meditate"],"note":"Duelo de referência: 59,1/100 (perfil físico). Gen 3: UU; set \"Reversal\" com 2/4 golpes por nível (faltam Bulk Up / Focus Punch, Hidden Power Ghost).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "107": {"id":107,"name":"Hitmonchan","types":["fighting"],"stats":{"hp":50,"atk":105,"def":79,"spa":35,"spd":110,"spe":76},"pve":{"tier":"B","score":52.6,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Mach Punch","Sky Uppercut","Pursuit","Fire Punch"],"note":"Dano estimado por segundo na caça: 126."},"pvp":{"tier":"A","score":61.8,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Mach Punch","Sky Uppercut","Strength","Detect"],"note":"Duelo de referência: 68,5/100 (perfil físico). Gen 3: NU; set \"All-out Attacker\" com 2/4 golpes por nível (faltam Hidden Power Ghost / Hidden Power Flying / Rock Slide, Rock Slide / Earthquake / Bulk Up).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "108": {"id":108,"name":"Lickitung","types":["normal"],"stats":{"hp":90,"atk":55,"def":75,"spa":60,"spd":75,"spe":30},"pve":{"tier":"C","score":35.5,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Stomp","Surf","Slam","Lick"],"note":"Dano estimado por segundo na caça: 85,2. Usa dano físico e especial."},"pvp":{"tier":"C","score":30.9,"role":"physical","priority":["atk","hp"],"natures":["Jolly","Hasty","Adamant"],"moves":["Stomp","Screech","Strength","Defense Curl"],"note":"Duelo de referência: 33,7/100 (perfil físico). Gen 3: PU; set \"Bulky Support\" com 1/4 golpes por nível (faltam Wish, Protect, Seismic Toss).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "110": {"id":110,"name":"Weezing","types":["poison"],"stats":{"hp":65,"atk":90,"def":120,"spa":85,"spd":70,"spe":60},"pve":{"tier":"D","score":23.3,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Hasty"],"moves":["Sludge","Tackle","Smog"],"note":"Dano estimado por segundo na caça: 55,9. Usa dano físico e especial."},"pvp":{"tier":"D","score":26.2,"role":"mixed","priority":["spa","atk"],"natures":["Rash","Naughty","Lax"],"moves":["Tackle","Sludge","Smokescreen","Smog"],"note":"Duelo de referência: 19,9/100 (perfil misto). Gen 3: UUBL; set \"Offensive\" com 2/4 golpes por nível (faltam Sludge Bomb, Flamethrower / Fire Blast).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "112": {"id":112,"name":"Rhydon","types":["ground","rock"],"stats":{"hp":105,"atk":130,"def":120,"spa":45,"spd":45,"spe":40},"pve":{"tier":"A","score":69,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Earthquake","Stomp","Horn Attack","Megahorn"],"note":"Dano estimado por segundo na caça: 165,3."},"pvp":{"tier":"B","score":55.1,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Relaxed","Adamant"],"moves":["Rock Blast","Earthquake","Megahorn","Take Down"],"note":"Duelo de referência: 53,8/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 3/4 golpes por nível (faltam Focus Punch / Double-Edge).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "114": {"id":114,"name":"Tangela","types":["grass"],"stats":{"hp":65,"atk":55,"def":115,"spa":100,"spd":40,"spe":60},"pve":{"tier":"D","score":17.6,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Absorb","Mega Drain","Growth"],"note":"Dano estimado por segundo na caça: 42,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":24.2,"role":"special","priority":["spa","def","hp"],"natures":["Relaxed","Modest","Bold"],"moves":["Absorb","Mega Drain","Growth","Tickle"],"note":"Duelo de referência: 24,3/100 (perfil especial). Gen 3: PU; set \"Physically Defensive\" com 2/4 golpes por nível (faltam Giga Drain / Hidden Power Grass, Leech Seed / Morning Sun).","smogon":{"tier":"PU","covered":2,"slots":4}}},
      "115": {"id":115,"name":"Kangaskhan","types":["normal"],"stats":{"hp":105,"atk":95,"def":80,"spa":40,"spd":80,"spe":90},"pve":{"tier":"C","score":47.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Mega Punch","Strength","Dizzy Punch","Comet Punch"],"note":"Dano estimado por segundo na caça: 113,1."},"pvp":{"tier":"A","score":61.1,"role":"physical","priority":["atk","hp","def"],"natures":["Brave","Adamant","Naughty"],"moves":["Mega Punch","Strength","Leer","Dizzy Punch"],"note":"Duelo de referência: 63,9/100 (perfil físico). Gen 3: UU; set \"Reversal\" com 2/4 golpes por nível (faltam Return, Shadow Ball).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "119": {"id":119,"name":"Seaking","types":["water"],"stats":{"hp":80,"atk":92,"def":65,"spa":65,"spd":80,"spe":68},"pve":{"tier":"C","score":33,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Horn Attack","Waterfall","Agility","Dive"],"note":"Dano estimado por segundo na caça: 79, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":46.4,"role":"physical","priority":["atk","spe"],"natures":["Jolly","Hasty","Adamant"],"moves":["Horn Attack","Waterfall","Peck","Agility"],"note":"Duelo de referência: 50,1/100 (perfil físico). Gen 3: ZU; set \"Flail\" com 3/4 golpes por nível (faltam Substitute / Endure).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "121": {"id":121,"name":"Starmie","types":["water","psychic"],"stats":{"hp":60,"atk":75,"def":85,"spa":100,"spd":85,"spe":115},"pve":{"tier":"A","score":79.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","BubbleBeam","Water Gun","Hydro Pump"],"note":"Dano estimado por segundo na caça: 191."},"pvp":{"tier":"A","score":64.1,"role":"special","priority":["spa","hp","spd","def"],"natures":["Sassy","Modest","Relaxed"],"moves":["Surf","BubbleBeam","Swift","Recover"],"note":"Duelo de referência: 61,3/100 (perfil especial). Gen 3: OU; set \"Defensive\" com 3/4 golpes por nível (faltam Thunder Wave / Psychic / Thunderbolt / Ice Beam).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "122": {"id":122,"name":"Mr. Mime","types":["psychic"],"stats":{"hp":40,"atk":45,"def":65,"spa":100,"spd":120,"spe":90},"pve":{"tier":"B","score":50,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psybeam","Psychic","Confusion"],"note":"Dano estimado por segundo na caça: 119,9."},"pvp":{"tier":"B","score":49.6,"role":"special","priority":["spa","hp"],"natures":["Quiet","Modest","Sassy"],"moves":["Psybeam","Psychic","Confusion","Light Screen"],"note":"Duelo de referência: 47,4/100 (perfil especial). Gen 3: RU; set \"Encore + Baton Pass\" com 4/4 golpes por nível.","smogon":{"tier":"RU","covered":4,"slots":4}}},
      "124": {"id":124,"name":"Jynx","types":["ice","psychic"],"stats":{"hp":65,"atk":50,"def":35,"spa":115,"spd":95,"spe":95},"pve":{"tier":"B","score":62.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Powder Snow","Psychic","Blizzard","Confusion"],"note":"Dano estimado por segundo na caça: 149,5."},"pvp":{"tier":"C","score":48.2,"role":"special","priority":["spa","hp","spd"],"natures":["Modest","Quiet","Mild"],"moves":["Powder Snow","Psychic","Confusion","Fake Tears"],"note":"Duelo de referência: 44,1/100 (perfil especial). Gen 3: UUBL; set \"Fake Tears\" com 3/4 golpes por nível (faltam Ice Beam).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "125": {"id":125,"name":"Electabuzz","types":["electric"],"stats":{"hp":65,"atk":83,"def":57,"spa":95,"spd":85,"spe":105},"pve":{"tier":"B","score":59.2,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Quiet"],"moves":["Thunderbolt","Thunder","Quick Attack","ThunderPunch"],"note":"Dano estimado por segundo na caça: 141,9. Usa dano físico e especial."},"pvp":{"tier":"B","score":53.1,"role":"mixed","priority":["atk","spa","spe","hp"],"natures":["Brave","Sassy","Quiet"],"moves":["Thunderbolt","Strength","ThunderPunch","Light Screen"],"note":"Duelo de referência: 54,6/100 (perfil misto). Gen 3: UU; set \"Support\" com 2/4 golpes por nível (faltam Counter, Toxic / Ice Punch).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "126": {"id":126,"name":"Magmar","types":["fire"],"stats":{"hp":65,"atk":95,"def":57,"spa":100,"spd":85,"spe":93},"pve":{"tier":"S","score":85.4,"role":"special","priority":["spa"],"natures":["Mild","Quiet","Rash"],"moves":["Flamethrower","Fire Blast","Fire Punch","Sunny Day"],"note":"Dano estimado por segundo na caça: 204,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":52.4,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Relaxed","Sassy","Lax"],"moves":["Ember","Flamethrower","Fire Punch","Confuse Ray"],"note":"Duelo de referência: 57,6/100 (perfil misto). Gen 3: RU; set \"Mixed Attacker\" com 1/4 golpes por nível (faltam Thunder Punch, Hidden Power Grass, Focus Punch).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "127": {"id":127,"name":"Pinsir","types":["bug"],"stats":{"hp":65,"atk":125,"def":100,"spa":55,"spd":70,"spe":85},"pve":{"tier":"A","score":72.9,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["ViceGrip","Swords Dance","Brick Break","Strength"],"note":"Dano estimado por segundo na caça: 174,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":60,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["ViceGrip","Brick Break","Strength","Swords Dance"],"note":"Duelo de referência: 65,6/100 (perfil físico). Gen 3: UU; set \"Swords Dance\" com 1/4 golpes por nível (faltam Earthquake, Hidden Power Bug, Rock Slide).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "128": {"id":128,"name":"Tauros","types":["normal"],"stats":{"hp":75,"atk":100,"def":95,"spa":40,"spd":70,"spe":110},"pve":{"tier":"A","score":74.8,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Take Down","Horn Attack","Pursuit"],"note":"Dano estimado por segundo na caça: 179,4."},"pvp":{"tier":"A","score":63.9,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Thrash","Take Down","Horn Attack","Pursuit"],"note":"Duelo de referência: 71,7/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 0/4 golpes por nível (faltam Return, Earthquake, Hidden Power Ghost, Double-Edge).","smogon":{"tier":"UUBL","covered":0,"slots":4}}},
      "130": {"id":130,"name":"Gyarados","types":["water","flying"],"stats":{"hp":95,"atk":125,"def":79,"spa":60,"spd":100,"spe":81},"pve":{"tier":"S","score":86.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Thrash","Dragon Dance","Waterfall","Rain Dance"],"note":"Dano estimado por segundo na caça: 206,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":79,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Dragon Dance","Leer","Thrash","Bite"],"note":"Duelo de referência: 86,6/100 (perfil físico). Gen 3: OU; set \"Standard\" com 1/4 golpes por nível (faltam Hidden Power Flying / Hidden Power Rock, Earthquake, Double-Edge / Taunt / Thunder Wave).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "131": {"id":131,"name":"Lapras","types":["water","ice"],"stats":{"hp":130,"atk":85,"def":80,"spa":85,"spd":95,"spe":60},"pve":{"tier":"A","score":71.5,"role":"special","priority":["spa"],"natures":["Quiet","Mild","Rash"],"moves":["Surf","Ice Beam","Waterfall","Rain Dance"],"note":"Dano estimado por segundo na caça: 171,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":68.3,"role":"special","priority":["spa","hp","def","spd"],"natures":["Relaxed","Sassy","Modest"],"moves":["Surf","Body Slam","Ice Beam","Growl"],"note":"Duelo de referência: 72,7/100 (perfil especial). Gen 3: UU; set \"Offensive Utility\" com 2/4 golpes por nível (faltam Thunderbolt, Heal Bell / Roar).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "132": {"id":132,"name":"Ditto","types":["normal"],"stats":{"hp":48,"atk":48,"def":48,"spa":48,"spd":48,"spe":48},"pve":{"tier":"D","score":0,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":[],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero."},"pvp":{"tier":"D","score":4.8,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":[],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero.","smogon":{"tier":"ZU","covered":1,"slots":1}}},
      "134": {"id":134,"name":"Vaporeon","types":["water"],"stats":{"hp":130,"atk":65,"def":60,"spa":110,"spd":95,"spe":65},"pve":{"tier":"A","score":74.6,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Gun","Aurora Beam","Hydro Pump"],"note":"Dano estimado por segundo na caça: 178,8."},"pvp":{"tier":"A","score":65.4,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Bold","Modest"],"moves":["Surf","Water Gun","Aurora Beam","Acid Armor"],"note":"Duelo de referência: 68,5/100 (perfil especial). Gen 3: UUBL; set \"Substitute + WishPass\" com 2/4 golpes por nível (faltam Substitute, Wish).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "135": {"id":135,"name":"Jolteon","types":["electric"],"stats":{"hp":65,"atk":65,"def":60,"spa":110,"spd":95,"spe":130},"pve":{"tier":"C","score":37.2,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["ThunderShock","Thunder"],"note":"Dano estimado por segundo na caça: 89,2."},"pvp":{"tier":"A","score":59.4,"role":"special","priority":["spa","hp","spd","def"],"natures":["Modest","Rash","Calm"],"moves":["ThunderShock","Thunder","Thunder Wave","Agility"],"note":"Duelo de referência: 59,4/100 (perfil especial). Gen 3: OU; set \"Standard\" com 2/4 golpes por nível (faltam Thunderbolt, Hidden Power Ice / Hidden Power Grass).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "136": {"id":136,"name":"Flareon","types":["fire"],"stats":{"hp":65,"atk":130,"def":60,"spa":95,"spd":110,"spe":65},"pve":{"tier":"C","score":35.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Take Down","Quick Attack","Tackle"],"note":"Dano estimado por segundo na caça: 84,3."},"pvp":{"tier":"B","score":50.5,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Careful","Lax"],"moves":["Bite","Tail Whip","Quick Attack","Growl"],"note":"Duelo de referência: 56,7/100 (perfil físico). Gen 3: NU; set \"Mixed Attacker\" com 1/4 golpes por nível (faltam Double-Edge, Fire Blast / Overheat, Hidden Power Grass / Hidden Power Electric).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "139": {"id":139,"name":"Omastar","types":["rock","water"],"stats":{"hp":70,"atk":60,"def":125,"spa":115,"spd":70,"spe":55},"pve":{"tier":"A","score":77.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Gun","Hydro Pump","AncientPower"],"note":"Dano estimado por segundo na caça: 186,2."},"pvp":{"tier":"B","score":56.5,"role":"special","priority":["spa","hp","spd"],"natures":["Modest","Mild","Rash"],"moves":["Surf","Protect","Mud Shot","AncientPower"],"note":"Duelo de referência: 59,3/100 (perfil especial). Gen 3: UU; set \"Defensive Spikes\" com 2/4 golpes por nível (faltam Spikes, Toxic / Ice Beam).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "141": {"id":141,"name":"Kabutops","types":["rock","water"],"stats":{"hp":60,"atk":115,"def":105,"spa":65,"spd":70,"spe":80},"pve":{"tier":"C","score":41.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Scratch","Waterfall","Dive"],"note":"Dano estimado por segundo na caça: 99."},"pvp":{"tier":"C","score":45,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Impish","Adamant"],"moves":["Slash","Harden","Rock Smash","Waterfall"],"note":"Duelo de referência: 48,2/100 (perfil físico). Gen 3: RU; set \"Swords Dance + Flail\" com 1/4 golpes por nível (faltam Flail, Swords Dance, Rock Slide).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "142": {"id":142,"name":"Aerodactyl","types":["rock","flying"],"stats":{"hp":80,"atk":105,"def":65,"spa":60,"spd":75,"spe":130},"pve":{"tier":"B","score":47.5,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Wing Attack","Bite","Take Down","Agility"],"note":"Dano estimado por segundo na caça: 113,9, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":58.6,"role":"physical","priority":["atk","hp","spd"],"natures":["Adamant","Brave","Naughty"],"moves":["Bite","Wing Attack","Agility","Strength"],"note":"Duelo de referência: 60,9/100 (perfil físico). Gen 3: OU; set \"Choice Band\" com 1/4 golpes por nível (faltam Earthquake, Hidden Power Rock, Double-Edge).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "143": {"id":143,"name":"Snorlax","types":["normal"],"stats":{"hp":160,"atk":110,"def":65,"spa":65,"spd":110,"spe":30},"pve":{"tier":"A","score":79.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Body Slam","Strength","Belly Drum","Headbutt"],"note":"Dano estimado por segundo na caça: 190,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":79.6,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Body Slam","Belly Drum","Rest","Covet"],"note":"Duelo de referência: 79,8/100 (perfil físico). Gen 3: OU; set \"Amnesia CurseLax\" com 3/4 golpes por nível (faltam Curse).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "144": {"id":144,"name":"Articuno","types":["ice","flying"],"stats":{"hp":90,"atk":85,"def":100,"spa":95,"spd":125,"spe":85},"pve":{"tier":"B","score":58.9,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Powder Snow","Ice Beam","Blizzard"],"note":"Dano estimado por segundo na caça: 141,2."},"pvp":{"tier":"A","score":66.2,"role":"special","priority":["spa","hp","spd"],"natures":["Modest","Mild","Calm"],"moves":["Gust","Powder Snow","Agility","Reflect"],"note":"Duelo de referência: 69,5/100 (perfil especial). Gen 3: UUBL; set \"Heal Bell\" com 2/4 golpes por nível (faltam Rest, Heal Bell).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "145": {"id":145,"name":"Zapdos","types":["electric","flying"],"stats":{"hp":90,"atk":90,"def":85,"spa":125,"spd":90,"spe":100},"pve":{"tier":"C","score":41.5,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["ThunderShock","Thunder"],"note":"Dano estimado por segundo na caça: 99,5."},"pvp":{"tier":"A","score":68.9,"role":"special","priority":["spa","hp","def","spd"],"natures":["Modest","Quiet","Bold"],"moves":["ThunderShock","Detect","Thunder Wave","Light Screen"],"note":"Duelo de referência: 70,4/100 (perfil especial). Gen 3: OU; set \"Mixed\" com 2/4 golpes por nível (faltam Thunderbolt, Hidden Power Grass / Hidden Power Fighting).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "146": {"id":146,"name":"Moltres","types":["fire","flying"],"stats":{"hp":90,"atk":100,"def":90,"spa":125,"spd":85,"spe":90},"pve":{"tier":"S","score":90.2,"role":"special","priority":["spa","spe"],"natures":["Quiet","Mild","Modest"],"moves":["Flamethrower","Heat Wave","Ember","Agility"],"note":"Dano estimado por segundo na caça: 216,2, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":65.4,"role":"special","priority":["spa","hp","spd","def"],"natures":["Quiet","Sassy","Relaxed"],"moves":["Ember","Flamethrower","Heat Wave","Agility"],"note":"Duelo de referência: 70,3/100 (perfil especial). Gen 3: OU; set \"Standard\" com 1/4 golpes por nível (faltam Hidden Power Grass, Will-O-Wisp, Roar / Overheat).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "149": {"id":149,"name":"Dragonite","types":["dragon","flying"],"stats":{"hp":91,"atk":134,"def":95,"spa":100,"spd":100,"spe":80},"pve":{"tier":"S","score":82.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Outrage","Wing Attack","Fly","Slam"],"note":"Dano estimado por segundo na caça: 197."},"pvp":{"tier":"S","score":86.5,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Careful"],"moves":["Outrage","Wing Attack","Slam","Wrap"],"note":"Duelo de referência: 100/100 (perfil físico). Gen 3: UUBL; set \"Standard Dragon Dance\" com 0/4 golpes por nível (faltam Hidden Power Flying, Earthquake, Dragon Dance, Thunder / Thunderbolt / Ice Beam).","smogon":{"tier":"UUBL","covered":0,"slots":4}}},
      "150": {"id":150,"name":"Mewtwo","types":["psychic"],"stats":{"hp":106,"atk":110,"def":90,"spa":154,"spd":90,"spe":130},"pve":{"tier":"B","score":54.8,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psychic","Swift","Confusion"],"note":"Dano estimado por segundo na caça: 131,3."},"pvp":{"tier":"S","score":76.6,"role":"special","priority":["spa","hp","spd","def"],"natures":["Sassy","Relaxed","Bold"],"moves":["Psychic","Swift","Confusion","Recover"],"note":"Duelo de referência: 78,2/100 (perfil especial). Gen 3: Uber; set \"Calm Mind MonoAttacker\" com 2/4 golpes por nível (faltam Taunt, Calm Mind).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "151": {"id":151,"name":"Mew","types":["psychic"],"stats":{"hp":100,"atk":100,"def":100,"spa":100,"spd":100,"spe":100},"pve":{"tier":"A","score":65.9,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Surf","Psychic","Mega Punch","AncientPower"],"note":"Dano estimado por segundo na caça: 157,9."},"pvp":{"tier":"B","score":56.6,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Relaxed","Sassy","Quiet"],"moves":["Mega Punch","Strength","Surf","Psychic"],"note":"Duelo de referência: 61/100 (perfil misto). Gen 3: Uber; set \"Lum Berry Explosion Lead\" com 0/4 golpes por nível (faltam Thunder Wave, Thunder, Fire Blast / Taunt, Explosion).","smogon":{"tier":"Uber","covered":0,"slots":4}}},
      "154": {"id":154,"name":"Meganium","types":["grass"],"stats":{"hp":80,"atk":82,"def":100,"spa":83,"spd":100,"spe":80},"pve":{"tier":"B","score":48.8,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Brave"],"moves":["Razor Leaf","SolarBeam","Body Slam","Tackle"],"note":"Dano estimado por segundo na caça: 117. Usa dano físico e especial."},"pvp":{"tier":"A","score":63.5,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Adamant","Lonely","Brave"],"moves":["Razor Leaf","Synthesis","Body Slam","Reflect"],"note":"Duelo de referência: 67,2/100 (perfil físico). Gen 3: RU; set \"Standard\" com 3/4 golpes por nível (faltam Leech Seed).","smogon":{"tier":"RU","covered":3,"slots":4}}},
      "157": {"id":157,"name":"Typhlosion","types":["fire"],"stats":{"hp":78,"atk":84,"def":78,"spa":109,"spd":85,"spe":100},"pve":{"tier":"A","score":66.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Flamethrower","Ember","Swift"],"note":"Dano estimado por segundo na caça: 159,8."},"pvp":{"tier":"B","score":56,"role":"special","priority":["spa","hp","def"],"natures":["Modest","Quiet","Mild"],"moves":["Ember","Flamethrower","Swift"],"note":"Duelo de referência: 59,6/100 (perfil especial). Gen 3: UUBL; set \"Special Sweeper\" com 1/4 golpes por nível (faltam Substitute, Sunny Day, Hidden Power Grass / Thunder Punch).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "160": {"id":160,"name":"Feraligatr","types":["water"],"stats":{"hp":85,"atk":105,"def":100,"spa":79,"spd":83,"spe":78},"pve":{"tier":"C","score":39.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Slash","Waterfall","Dive"],"note":"Dano estimado por segundo na caça: 94,5."},"pvp":{"tier":"A","score":65.2,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Adamant"],"moves":["Slash","Screech","Strength","Waterfall"],"note":"Duelo de referência: 72,4/100 (perfil físico). Gen 3: UU; set \"Physical Sweeper\" com 1/4 golpes por nível (faltam Earthquake, Hidden Power Flying / Rock Slide, Swords Dance).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "162": {"id":162,"name":"Furret","types":["normal"],"stats":{"hp":85,"atk":76,"def":64,"spa":45,"spd":55,"spe":90},"pve":{"tier":"C","score":39.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Quick Attack","Slam","Strength","Fury Swipes"],"note":"Dano estimado por segundo na caça: 94,4."},"pvp":{"tier":"C","score":39.6,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Amnesia","Quick Attack","Slam","Scratch"],"note":"Duelo de referência: 43,1/100 (perfil físico). Gen 3: PU; set \"Wallbreaker\" com 1/4 golpes por nível (faltam Double-Edge / Return, Shadow Ball, Brick Break).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "164": {"id":164,"name":"Noctowl","types":["normal","flying"],"stats":{"hp":100,"atk":50,"def":50,"spa":76,"spd":96,"spe":70},"pve":{"tier":"D","score":5,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Confusion"],"note":"Dano estimado por segundo na caça: 12,1."},"pvp":{"tier":"D","score":15.6,"role":"special","priority":["spa","hp","spd"],"natures":["Mild","Modest","Rash"],"moves":["Dream Eater","Confusion","Hypnosis","Reflect"],"note":"Duelo de referência: 13,9/100 (perfil especial). Gen 3: ZU; set \"Specially Defensive\" com 2/4 golpes por nível (faltam Psychic, Whirlwind).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "166": {"id":166,"name":"Ledian","types":["bug","flying"],"stats":{"hp":55,"atk":35,"def":50,"spa":55,"spd":110,"spe":85},"pve":{"tier":"D","score":6.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Swift"],"note":"Dano estimado por segundo na caça: 15,1."},"pvp":{"tier":"D","score":13.1,"role":"special","priority":["spa","spe","hp","spd"],"natures":["Calm","Modest","Timid"],"moves":["Swift","Supersonic","Light Screen","Agility"],"note":"Duelo de referência: 11,3/100 (perfil especial). Gen 3: ZU; set \"Dual Screens\" com 3/4 golpes por nível (faltam Substitute).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "168": {"id":168,"name":"Ariados","types":["bug","poison"],"stats":{"hp":70,"atk":90,"def":70,"spa":60,"spd":60,"spe":40},"pve":{"tier":"D","score":12.6,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Fury Swipes","Poison Sting","Leech Life","Agility"],"note":"Dano estimado por segundo na caça: 30,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":25.5,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Sassy","Gentle","Brave"],"moves":["Night Shade","Fury Swipes","Agility","Leech Life"],"note":"Duelo de referência: 27,2/100 (perfil misto). Gen 3: ZU; set \"Baton Pass\" com 2/4 golpes por nível (faltam Sludge Bomb, Baton Pass).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "169": {"id":169,"name":"Crobat","types":["poison","flying"],"stats":{"hp":85,"atk":90,"def":80,"spa":70,"spd":80,"spe":130},"pve":{"tier":"C","score":41.4,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Wing Attack","Bite","Poison Fang","Fly"],"note":"Dano estimado por segundo na caça: 99,3."},"pvp":{"tier":"A","score":59.6,"role":"physical","priority":["atk","spe","hp","spd"],"natures":["Jolly","Careful","Impish"],"moves":["Bite","Wing Attack","Poison Fang","Screech"],"note":"Duelo de referência: 66,8/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 0/4 golpes por nível (faltam Sludge Bomb, Aerial Ace, Hidden Power Ground / Hidden Power Fighting, Shadow Ball).","smogon":{"tier":"UUBL","covered":0,"slots":4}}},
      "171": {"id":171,"name":"Lanturn","types":["water","electric"],"stats":{"hp":125,"atk":58,"def":58,"spa":76,"spd":76,"spe":67},"pve":{"tier":"B","score":49.1,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Gun","Bubble","Hydro Pump"],"note":"Dano estimado por segundo na caça: 117,8."},"pvp":{"tier":"B","score":54.3,"role":"special","priority":["spa","hp","spd","spe"],"natures":["Quiet","Sassy","Modest"],"moves":["Surf","Water Gun","Thunder Wave","Hydro Pump"],"note":"Duelo de referência: 53,6/100 (perfil especial). Gen 3: UU; set \"Parafusion\" com 3/4 golpes por nível (faltam Thunderbolt).","smogon":{"tier":"UU","covered":3,"slots":4}}},
      "176": {"id":176,"name":"Togetic","types":["normal","flying"],"stats":{"hp":55,"atk":40,"def":85,"spa":80,"spd":105,"spe":40},"pve":{"tier":"D","score":18.8,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Double-Edge","Fly"],"note":"Dano estimado por segundo na caça: 45."},"pvp":{"tier":"D","score":19,"role":"physical","priority":["atk","hp","spe","spd"],"natures":["Jolly","Careful","Gentle"],"moves":["Double-Edge","Rock Smash","Charm","Wish"],"note":"Duelo de referência: 19,4/100 (perfil físico). Gen 3: PU; set \"Baton Pass\" com 1/4 golpes por nível (faltam Ancient Power, Baton Pass, Fire Blast / Flamethrower).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "178": {"id":178,"name":"Xatu","types":["psychic","flying"],"stats":{"hp":65,"atk":75,"def":70,"spa":95,"spd":70,"spe":95},"pve":{"tier":"D","score":19.5,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psychic"],"note":"Dano estimado por segundo na caça: 46,7."},"pvp":{"tier":"C","score":43,"role":"special","priority":["spa","hp"],"natures":["Relaxed","Timid","Sassy"],"moves":["Psychic","Night Shade","Wish","Confuse Ray"],"note":"Duelo de referência: 43,7/100 (perfil especial). Gen 3: RU; set \"Baton Pass\" com 2/4 golpes por nível (faltam Baton Pass, Calm Mind).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "181": {"id":181,"name":"Ampharos","types":["electric"],"stats":{"hp":90,"atk":75,"def":75,"spa":115,"spd":90,"spe":55},"pve":{"tier":"C","score":36.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["ThunderShock","Thunder"],"note":"Dano estimado por segundo na caça: 87,2."},"pvp":{"tier":"B","score":52.7,"role":"special","priority":["spa","hp","spd","def"],"natures":["Modest","Rash","Timid"],"moves":["ThunderShock","Growl","Light Screen","Thunder Wave"],"note":"Duelo de referência: 54,1/100 (perfil especial). Gen 3: UU; set \"Focus Punch\" com 2/4 golpes por nível (faltam Focus Punch, Thunderbolt).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "182": {"id":182,"name":"Bellossom","types":["grass"],"stats":{"hp":75,"atk":80,"def":85,"spa":90,"spd":100,"spe":50},"pve":{"tier":"B","score":61.5,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Petal Dance","SolarBeam","Magical Leaf","Acid"],"note":"Dano estimado por segundo na caça: 147,3."},"pvp":{"tier":"B","score":52.9,"role":"special","priority":["spa"],"natures":["Quiet","Modest","Rash"],"moves":["Petal Dance","Stun Spore","Moonlight","SolarBeam"],"note":"Duelo de referência: 57,6/100 (perfil especial). Gen 3: NU; set \"Specially Defensive\" com 3/4 golpes por nível (faltam Giga Drain / Hidden Power Grass).","smogon":{"tier":"NU","covered":3,"slots":4}}},
      "184": {"id":184,"name":"Azumarill","types":["water"],"stats":{"hp":100,"atk":50,"def":80,"spa":50,"spd":80,"spe":50},"pve":{"tier":"B","score":49.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","BubbleBeam","Rain Dance","Hydro Pump"],"note":"Dano estimado por segundo na caça: 118,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":46.1,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Gentle","Lax","Mild"],"moves":["Surf","Rain Dance","Waterfall","BubbleBeam"],"note":"Duelo de referência: 50,2/100 (perfil misto). Gen 3: NU (sem Huge Power no jogo); set \"Choice Band\" com 1/4 golpes por nível (faltam Focus Punch, Return, Hidden Power Ghost).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "185": {"id":185,"name":"Sudowoodo","types":["rock"],"stats":{"hp":70,"atk":100,"def":115,"spa":30,"spd":65,"spe":30},"pve":{"tier":"C","score":34.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Double-Edge","Rock Throw","Rock Slide","Low Kick"],"note":"Dano estimado por segundo na caça: 82,3."},"pvp":{"tier":"C","score":31,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Sassy","Gentle"],"moves":["Strength","Rock Throw","Double-Edge","Rock Slide"],"note":"Duelo de referência: 31,2/100 (perfil físico). Gen 3: NU; set \"Choice Band\" com 2/4 golpes por nível (faltam Earthquake, Focus Punch / Brick Break).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "186": {"id":186,"name":"Politoed","types":["water"],"stats":{"hp":90,"atk":75,"def":75,"spa":90,"spd":100,"spe":70},"pve":{"tier":"A","score":66,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Gun","Rain Dance","Hydro Pump"],"note":"Dano estimado por segundo na caça: 158,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":47.8,"role":"special","priority":["spa","hp","spd"],"natures":["Quiet","Modest","Sassy"],"moves":["Surf","Rain Dance","Bubble","Hydro Pump"],"note":"Duelo de referência: 49,5/100 (perfil especial). Gen 3: RU; set \"Special Attacker + Hypnosis\" com 2/4 golpes por nível (faltam Ice Beam, Hidden Power Grass / Counter).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "189": {"id":189,"name":"Jumpluff","types":["grass","flying"],"stats":{"hp":75,"atk":55,"def":70,"spa":55,"spd":85,"spe":110},"pve":{"tier":"D","score":12.4,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Tackle","Mega Drain"],"note":"Dano estimado por segundo na caça: 29,8. Usa dano físico e especial."},"pvp":{"tier":"D","score":28.9,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Sassy","Relaxed","Quiet"],"moves":["Tackle","Stun Spore","Leech Seed","Synthesis"],"note":"Duelo de referência: 26,6/100 (perfil físico). Gen 3: RUBL; set \"SubSeed\" com 2/4 golpes por nível (faltam Substitute, Encore).","smogon":{"tier":"RUBL","covered":2,"slots":4}}},
      "190": {"id":190,"name":"Aipom","types":["normal"],"stats":{"hp":55,"atk":70,"def":55,"spa":40,"spd":55,"spe":85},"pve":{"tier":"C","score":35.5,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Cut","Strength","Fury Swipes","Agility"],"note":"Dano estimado por segundo na caça: 85, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":34.5,"role":"physical","priority":["atk","spe","hp"],"natures":["Jolly","Naive","Hasty"],"moves":["Cut","Scratch","Agility","Tickle"],"note":"Duelo de referência: 37,3/100 (perfil físico). Gen 3: ZU; set \"Annoyer\" com 2/4 golpes por nível (faltam Thunder Wave, Thief).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "192": {"id":192,"name":"Sunflora","types":["grass"],"stats":{"hp":75,"atk":75,"def":55,"spa":105,"spd":85,"spe":30},"pve":{"tier":"S","score":86.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Petal Dance","SolarBeam","Growth","Giga Drain"],"note":"Dano estimado por segundo na caça: 206,9, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":55.4,"role":"special","priority":["spa","def","hp"],"natures":["Bold","Relaxed","Lax"],"moves":["Petal Dance","Synthesis","SolarBeam","Giga Drain"],"note":"Duelo de referência: 63,9/100 (perfil especial). Gen 3: ZU; set \"Sunny Beam\" com 3/4 golpes por nível (faltam Hidden Power Fire).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "193": {"id":193,"name":"Yanma","types":["bug","flying"],"stats":{"hp":65,"atk":65,"def":45,"spa":75,"spd":45,"spe":95},"pve":{"tier":"D","score":5.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Uproar"],"note":"Dano estimado por segundo na caça: 13."},"pvp":{"tier":"D","score":11.1,"role":"special","priority":["spa"],"natures":["Modest","Bold","Calm"],"moves":["Uproar","SonicBoom","Supersonic"],"note":"Duelo de referência: 9,3/100 (perfil especial). Gen 3: ZU; set \"Reversal Sweeper\" com 1/4 golpes por nível (faltam Substitute / Endure, Reversal, Aerial Ace).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "195": {"id":195,"name":"Quagsire","types":["water","ground"],"stats":{"hp":95,"atk":85,"def":85,"spa":65,"spd":65,"spe":35},"pve":{"tier":"C","score":45.1,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Earthquake","Waterfall","Rain Dance","Dive"],"note":"Dano estimado por segundo na caça: 108, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":50.1,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Impish","Jolly","Relaxed"],"moves":["Slam","Waterfall","Amnesia","Earthquake"],"note":"Duelo de referência: 48,9/100 (perfil físico). Gen 3: UU; set \"Counter\" com 3/4 golpes por nível (faltam Counter).","smogon":{"tier":"UU","covered":3,"slots":4}}},
      "196": {"id":196,"name":"Espeon","types":["psychic"],"stats":{"hp":65,"atk":65,"def":60,"spa":130,"spd":95,"spe":110},"pve":{"tier":"A","score":70.1,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Psybeam","Psychic","Swift","Confusion"],"note":"Dano estimado por segundo na caça: 168,1."},"pvp":{"tier":"A","score":63.5,"role":"special","priority":["spa","spe","def"],"natures":["Modest","Timid","Quiet"],"moves":["Psybeam","Psychic","Swift","Morning Sun"],"note":"Duelo de referência: 65,4/100 (perfil especial). Gen 3: UUBL; set \"EspyJump\" com 2/4 golpes por nível (faltam Calm Mind, Substitute).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "197": {"id":197,"name":"Umbreon","types":["dark"],"stats":{"hp":95,"atk":65,"def":110,"spa":60,"spd":130,"spe":65},"pve":{"tier":"D","score":26.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Faint Attack","Take Down","Pursuit"],"note":"Dano estimado por segundo na caça: 63."},"pvp":{"tier":"S","score":75.7,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Gentle","Hasty","Mild"],"moves":["Bite","Quick Attack","Moonlight","Screech"],"note":"Duelo de referência: 81/100 (perfil físico). Gen 3: UUBL; set \"Mean Look + Baton Pass\" com 3/4 golpes por nível (faltam Taunt).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "198": {"id":198,"name":"Murkrow","types":["dark","flying"],"stats":{"hp":60,"atk":85,"def":42,"spa":85,"spd":42,"spe":91},"pve":{"tier":"C","score":34.8,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Pursuit","Fly","Peck"],"note":"Dano estimado por segundo na caça: 83,3."},"pvp":{"tier":"D","score":28.5,"role":"mixed","priority":["atk","spa"],"natures":["Brave","Lonely","Naughty"],"moves":["Faint Attack","Pursuit","Night Shade","Peck"],"note":"Duelo de referência: 31/100 (perfil misto). Gen 3: NU; set \"Choice Band\" com 0/4 golpes por nível (faltam Drill Peck, Hidden Power Ground / Hidden Power Fighting, Shadow Ball, Double-Edge).","smogon":{"tier":"NU","covered":0,"slots":4}}},
      "199": {"id":199,"name":"Slowking","types":["water","psychic"],"stats":{"hp":95,"atk":75,"def":80,"spa":100,"spd":110,"spe":30},"pve":{"tier":"B","score":61.1,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Psychic","Water Gun","Confusion"],"note":"Dano estimado por segundo na caça: 146,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":63.3,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Calm","Modest"],"moves":["Surf","Psychic","Yawn","Confusion"],"note":"Duelo de referência: 67,4/100 (perfil especial). Gen 3: UU; set \"Calm Mind\" com 2/4 golpes por nível (faltam Calm Mind, Rest).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "200": {"id":200,"name":"Misdreavus","types":["ghost"],"stats":{"hp":60,"atk":60,"def":60,"spa":85,"spd":85,"spe":85},"pve":{"tier":"D","score":14.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psybeam"],"note":"Dano estimado por segundo na caça: 34,3."},"pvp":{"tier":"D","score":20.1,"role":"special","priority":["spa","hp","def"],"natures":["Modest","Bold","Quiet"],"moves":["Psybeam","Confuse Ray","Growl"],"note":"Duelo de referência: 14,1/100 (perfil especial). Gen 3: UU; set \"Perish Trapper\" com 2/4 golpes por nível (faltam Taunt / Destiny Bond, Protect).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "201": {"id":201,"name":"Unown","types":["psychic"],"stats":{"hp":48,"atk":72,"def":48,"spa":72,"spd":48,"spe":48},"pve":{"tier":"D","score":0,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":["Hidden Power"],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero."},"pvp":{"tier":"D","score":1.9,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":["Hidden Power"],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero.","smogon":{"tier":"ZU","covered":0,"slots":1}}},
      "202": {"id":202,"name":"Wobbuffet","types":["psychic"],"stats":{"hp":190,"atk":33,"def":58,"spa":33,"spd":58,"spe":33},"pve":{"tier":"D","score":0,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":["Safeguard","Charm","Encore"],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero."},"pvp":{"tier":"D","score":14.4,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":["Safeguard","Charm","Encore"],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero.","smogon":{"tier":"UU","covered":4,"slots":4}}},
      "203": {"id":203,"name":"Girafarig","types":["normal","psychic"],"stats":{"hp":70,"atk":80,"def":65,"spa":90,"spd":65,"spe":85},"pve":{"tier":"B","score":61.4,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Hasty"],"moves":["Stomp","Psybeam","Strength","Crunch"],"note":"Dano estimado por segundo na caça: 147,2. Usa dano físico e especial."},"pvp":{"tier":"B","score":49.9,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Brave","Relaxed","Sassy"],"moves":["Crunch","Psybeam","Agility","Strength"],"note":"Duelo de referência: 51,5/100 (perfil misto). Gen 3: UU; set \"WishPasser\" com 2/4 golpes por nível (faltam Wish, Substitute).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "205": {"id":205,"name":"Forretress","types":["bug","steel"],"stats":{"hp":75,"atk":90,"def":140,"spa":60,"spd":60,"spe":40},"pve":{"tier":"C","score":29,"role":"physical","priority":["atk"],"natures":["Brave","Adamant","Lonely"],"moves":["Double-Edge","Take Down","Strength","Tackle"],"note":"Dano estimado por segundo na caça: 69,6."},"pvp":{"tier":"C","score":43.8,"role":"physical","priority":["atk","hp","spe","spd"],"natures":["Adamant","Naughty","Jolly"],"moves":["Take Down","Strength","Double-Edge","Protect"],"note":"Duelo de referência: 34,6/100 (perfil físico). Gen 3: OU; set \"Standard\" com 4/4 golpes por nível.","smogon":{"tier":"OU","covered":4,"slots":4}}},
      "206": {"id":206,"name":"Dunsparce","types":["normal"],"stats":{"hp":100,"atk":70,"def":70,"spa":65,"spd":65,"spe":45},"pve":{"tier":"D","score":24.2,"role":"physical","priority":["atk","spe"],"natures":["Brave","Quiet","Relaxed"],"moves":["Take Down","Strength","Pursuit","Rage"],"note":"Dano estimado por segundo na caça: 57,9."},"pvp":{"tier":"C","score":36.4,"role":"physical","priority":["atk","hp","spd"],"natures":["Relaxed","Careful","Sassy"],"moves":["Take Down","Strength","Glare","Screech"],"note":"Duelo de referência: 40,9/100 (perfil físico). Gen 3: PUBL; set \"Paraflinch\" com 0/4 golpes por nível (faltam Headbutt, Thunder Wave / Body Slam, Shadow Ball, Rock Slide).","smogon":{"tier":"PUBL","covered":0,"slots":4}}},
      "207": {"id":207,"name":"Gligar","types":["ground","flying"],"stats":{"hp":65,"atk":75,"def":105,"spa":35,"spd":65,"spe":85},"pve":{"tier":"D","score":25.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Faint Attack","Strength","Quick Attack"],"note":"Dano estimado por segundo na caça: 60,1."},"pvp":{"tier":"C","score":42,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Impish"],"moves":["Slash","Faint Attack","Screech","Harden"],"note":"Duelo de referência: 43,4/100 (perfil físico). Gen 3: UU; set \"Swords Dance\" com 1/4 golpes por nível (faltam Swords Dance, Earthquake, Hidden Power Flying).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "208": {"id":208,"name":"Steelix","types":["steel","ground"],"stats":{"hp":75,"atk":85,"def":200,"spa":55,"spd":65,"spe":30},"pve":{"tier":"C","score":31.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Iron Tail","Double-Edge","Crunch","Slam"],"note":"Dano estimado por segundo na caça: 75,3."},"pvp":{"tier":"A","score":60.3,"role":"physical","priority":["atk","hp","spe","spd"],"natures":["Jolly","Adamant","Brave"],"moves":["Iron Tail","Screech","Crunch","Double-Edge"],"note":"Duelo de referência: 62,8/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 2/4 golpes por nível (faltam Earthquake, Explosion).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "210": {"id":210,"name":"Granbull","types":["normal"],"stats":{"hp":90,"atk":120,"def":75,"spa":60,"spd":60,"spe":45},"pve":{"tier":"C","score":43.1,"role":"physical","priority":["atk","spe"],"natures":["Brave","Adamant","Lonely"],"moves":["Take Down","Strength","Crunch","Bite"],"note":"Dano estimado por segundo na caça: 103,2."},"pvp":{"tier":"C","score":48,"role":"physical","priority":["atk","hp","def","spe"],"natures":["Brave","Relaxed","Impish"],"moves":["Strength","Scary Face","Crunch","Charm"],"note":"Duelo de referência: 53,4/100 (perfil físico). Gen 3: UU; set \"Offensive Utility\" com 0/4 golpes por nível (faltam Return / Body Slam, Focus Punch / Earthquake, Shadow Ball, Heal Bell / Rest).","smogon":{"tier":"UU","covered":0,"slots":4}}},
      "211": {"id":211,"name":"Qwilfish","types":["water","poison"],"stats":{"hp":65,"atk":95,"def":75,"spa":55,"spd":55,"spe":85},"pve":{"tier":"C","score":41.4,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Take Down","Waterfall","Pin Missile","Dive"],"note":"Dano estimado por segundo na caça: 99,2."},"pvp":{"tier":"C","score":39.7,"role":"physical","priority":["atk","hp","spd"],"natures":["Brave","Adamant","Careful"],"moves":["Poison Sting","Waterfall","Harden","Minimize"],"note":"Duelo de referência: 37,9/100 (perfil físico). Gen 3: UU; set \"Spiker\" com 2/4 golpes por nível (faltam Sludge Bomb, Destiny Bond / Self-Destruct).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "212": {"id":212,"name":"Scizor","types":["bug","steel"],"stats":{"hp":70,"atk":130,"def":100,"spa":55,"spd":80,"spe":65},"pve":{"tier":"S","score":94.1,"role":"physical","priority":["atk"],"natures":["Brave","Adamant","Lonely"],"moves":["Metal Claw","Agility","Swords Dance","Quick Attack"],"note":"Dano estimado por segundo na caça: 225,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":74.3,"role":"physical","priority":["atk","spe","hp"],"natures":["Jolly","Naive","Hasty"],"moves":["Metal Claw","Slash","Agility","Swords Dance"],"note":"Duelo de referência: 80,1/100 (perfil físico). Gen 3: UUBL; set \"Swords Dance\" com 2/4 golpes por nível (faltam Silver Wind, Hidden Power Rock).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "213": {"id":213,"name":"Shuckle","types":["bug","rock"],"stats":{"hp":20,"atk":10,"def":230,"spa":10,"spd":230,"spe":5},"pve":{"tier":"D","score":3.2,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Strength","Rock Smash","Wrap","Constrict"],"note":"Dano estimado por segundo na caça: 7,7."},"pvp":{"tier":"D","score":11.2,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Sassy","Impish"],"moves":["Strength","Rock Smash","Rest","Withdraw"],"note":"Duelo de referência: 7,6/100 (perfil físico). Gen 3: PU; set \"Mixed Wall\" com 3/4 golpes por nível (faltam Toxic).","smogon":{"tier":"PU","covered":3,"slots":4}}},
      "214": {"id":214,"name":"Heracross","types":["bug","fighting"],"stats":{"hp":80,"atk":125,"def":75,"spa":40,"spd":95,"spe":85},"pve":{"tier":"B","score":55.9,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Brick Break","Take Down","Strength","Megahorn"],"note":"Dano estimado por segundo na caça: 134,1."},"pvp":{"tier":"A","score":65.2,"role":"physical","priority":["atk","hp"],"natures":["Adamant","Brave","Lonely"],"moves":["Brick Break","Megahorn","Leer","Strength"],"note":"Duelo de referência: 63,5/100 (perfil físico). Gen 3: OU; set \"Standard\" com 3/4 golpes por nível (faltam Rock Slide).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "215": {"id":215,"name":"Sneasel","types":["dark","ice"],"stats":{"hp":55,"atk":95,"def":55,"spa":35,"spd":75,"spe":115},"pve":{"tier":"B","score":53.2,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Metal Claw","Agility","Slash"],"note":"Dano estimado por segundo na caça: 127,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":43.5,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Adamant","Impish"],"moves":["Faint Attack","Slash","Agility","Strength"],"note":"Duelo de referência: 49/100 (perfil físico). Gen 3: RU; set \"Physical Attacker\" com 0/4 golpes por nível (faltam Shadow Ball, Brick Break, Double-Edge, Swords Dance).","smogon":{"tier":"RU","covered":0,"slots":4}}},
      "217": {"id":217,"name":"Ursaring","types":["normal"],"stats":{"hp":90,"atk":130,"def":75,"spa":75,"spd":75,"spe":55},"pve":{"tier":"S","score":93.7,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Slash","Faint Attack","Fury Swipes"],"note":"Dano estimado por segundo na caça: 224,5."},"pvp":{"tier":"S","score":78.9,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Careful","Impish","Relaxed"],"moves":["Thrash","Leer","Slash","Faint Attack"],"note":"Duelo de referência: 91,3/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 0/4 golpes por nível (faltam Return, Earthquake, Hidden Power Ghost, Focus Punch / Sleep Talk).","smogon":{"tier":"UUBL","covered":0,"slots":4}}},
      "219": {"id":219,"name":"Magcargo","types":["fire","rock"],"stats":{"hp":50,"atk":50,"def":120,"spa":80,"spd":80,"spe":30},"pve":{"tier":"C","score":39.2,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Flamethrower","Ember","Smog"],"note":"Dano estimado por segundo na caça: 93,9."},"pvp":{"tier":"C","score":36.1,"role":"special","priority":["spa"],"natures":["Modest","Quiet","Bold"],"moves":["Ember","Flamethrower","Harden","Amnesia"],"note":"Duelo de referência: 40,9/100 (perfil especial). Gen 3: ZU; set \"Specially Defensive\" com 2/4 golpes por nível (faltam Rest, Sleep Talk).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "221": {"id":221,"name":"Piloswine","types":["ice","ground"],"stats":{"hp":100,"atk":100,"def":80,"spa":60,"spd":60,"spe":50},"pve":{"tier":"C","score":27.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Horn Attack","Take Down","Strength","Fury Attack"],"note":"Dano estimado por segundo na caça: 65,4."},"pvp":{"tier":"D","score":28.5,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Adamant","Lonely"],"moves":["Horn Attack","Rock Smash","Strength","Amnesia"],"note":"Duelo de referência: 29,1/100 (perfil físico). Gen 3: PUBL; set \"Choice Band\" com 1/4 golpes por nível (faltam Earthquake, Rock Slide, Double-Edge).","smogon":{"tier":"PUBL","covered":1,"slots":4}}},
      "222": {"id":222,"name":"Corsola","types":["water","rock"],"stats":{"hp":55,"atk":55,"def":85,"spa":65,"spd":85,"spe":35},"pve":{"tier":"C","score":46.8,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","BubbleBeam","Bubble","AncientPower"],"note":"Dano estimado por segundo na caça: 112,2."},"pvp":{"tier":"D","score":30.5,"role":"special","priority":["spa","hp","def"],"natures":["Sassy","Relaxed","Quiet"],"moves":["Surf","BubbleBeam","Recover","AncientPower"],"note":"Duelo de referência: 32,4/100 (perfil especial). Gen 3: ZU; set \"Calm Mind\" com 3/4 golpes por nível (faltam Calm Mind).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "224": {"id":224,"name":"Octillery","types":["water"],"stats":{"hp":75,"atk":105,"def":75,"spa":105,"spd":75,"spe":45},"pve":{"tier":"A","score":71.7,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","BubbleBeam","Water Gun","Ice Beam"],"note":"Dano estimado por segundo na caça: 171,8."},"pvp":{"tier":"B","score":56.3,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Sassy","Gentle","Relaxed"],"moves":["Surf","Waterfall","Octazooka","Hyper Beam"],"note":"Duelo de referência: 61,7/100 (perfil misto). Gen 3: NU; set \"Baton Pass Receiver\" com 2/4 golpes por nível (faltam Hidden Power Electric, Substitute).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "225": {"id":225,"name":"Delibird","types":["ice","flying"],"stats":{"hp":45,"atk":55,"def":45,"spa":65,"spd":45,"spe":75},"pve":{"tier":"D","score":5.6,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Fly"],"note":"Dano estimado por segundo na caça: 13,4."},"pvp":{"tier":"D","score":4,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Fly"],"note":"Duelo de referência: 2,3/100 (perfil físico). Gen 3: ZU; set \"Substitute + 3 Attacks\" com 0/4 golpes por nível (faltam Substitute, Aerial Ace, Ice Beam, Hidden Power Ground).","smogon":{"tier":"ZU","covered":0,"slots":4}}},
      "226": {"id":226,"name":"Mantine","types":["water","flying"],"stats":{"hp":65,"atk":40,"def":70,"spa":80,"spd":140,"spe":70},"pve":{"tier":"B","score":57.6,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","BubbleBeam","Water Pulse","Agility"],"note":"Dano estimado por segundo na caça: 138,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":41.9,"role":"special","priority":["spa","hp","spd"],"natures":["Quiet","Sassy","Relaxed"],"moves":["Surf","BubbleBeam","Agility","Bubble"],"note":"Duelo de referência: 44,9/100 (perfil especial). Gen 3: RU; set \"Hazer\" com 1/4 golpes por nível (faltam Ice Beam, Haze, Toxic).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "227": {"id":227,"name":"Skarmory","types":["steel","flying"],"stats":{"hp":65,"atk":80,"def":140,"spa":40,"spd":70,"spe":70},"pve":{"tier":"C","score":34,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Steel Wing","Peck","Agility","Fly"],"note":"Dano estimado por segundo na caça: 81,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":73.2,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Gentle"],"moves":["Steel Wing","Peck","Leer","Agility"],"note":"Duelo de referência: 78,7/100 (perfil físico). Gen 3: OU; set \"Defensive Spikes\" com 1/4 golpes por nível (faltam Whirlwind / Roar, Toxic / Taunt, Pursuit / Protect / Drill Peck).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "229": {"id":229,"name":"Houndoom","types":["dark","fire"],"stats":{"hp":75,"atk":90,"def":50,"spa":110,"spd":80,"spe":95},"pve":{"tier":"B","score":61.1,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Flamethrower","Ember","Smog"],"note":"Dano estimado por segundo na caça: 146,5."},"pvp":{"tier":"B","score":51.8,"role":"special","priority":["spa","hp","def"],"natures":["Modest","Quiet","Mild"],"moves":["Ember","Flamethrower","Smog"],"note":"Duelo de referência: 51,5/100 (perfil especial). Gen 3: UUBL; set \"Pursuit\" com 2/4 golpes por nível (faltam Pursuit, Will-O-Wisp / Toxic).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "230": {"id":230,"name":"Kingdra","types":["water","dragon"],"stats":{"hp":75,"atk":95,"def":95,"spa":95,"spd":95,"spe":85},"pve":{"tier":"A","score":72.4,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Surf","Twister","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 173,6."},"pvp":{"tier":"A","score":67.8,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Sassy","Relaxed","Gentle"],"moves":["Surf","Waterfall","Twister","Agility"],"note":"Duelo de referência: 71,9/100 (perfil misto). Gen 3: UUBL; set \"Rain Dance Sweeper\" com 2/4 golpes por nível (faltam Rain Dance, Ice Beam).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "232": {"id":232,"name":"Donphan","types":["ground"],"stats":{"hp":90,"atk":120,"def":120,"spa":60,"spd":60,"spe":50},"pve":{"tier":"B","score":62.2,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Earthquake","Double-Edge","Take Down","Horn Attack"],"note":"Dano estimado por segundo na caça: 149,1."},"pvp":{"tier":"B","score":55.1,"role":"physical","priority":["atk","hp","def"],"natures":["Relaxed","Brave","Impish"],"moves":["Horn Attack","Defense Curl","Growl","Earthquake"],"note":"Duelo de referência: 56,5/100 (perfil físico). Gen 3: UUBL; set \"Tank\" com 2/4 golpes por nível (faltam Hidden Power Rock, Rest).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "233": {"id":233,"name":"Porygon2","types":["normal"],"stats":{"hp":85,"atk":80,"def":90,"spa":105,"spd":95,"spe":60},"pve":{"tier":"C","score":32.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psybeam","Tri Attack","Zap Cannon"],"note":"Dano estimado por segundo na caça: 77,5."},"pvp":{"tier":"B","score":53.5,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Calm","Modest"],"moves":["Psybeam","Tri Attack","Zap Cannon","Recover"],"note":"Duelo de referência: 60,3/100 (perfil especial). Gen 3: (OU); set \"Standard\" com 1/4 golpes por nível (faltam Ice Beam, Thunderbolt / Thunder / Toxic, Thunder Wave / Toxic).","smogon":{"tier":"(OU)","covered":1,"slots":4}}},
      "234": {"id":234,"name":"Stantler","types":["normal"],"stats":{"hp":73,"atk":95,"def":62,"spa":85,"spd":65,"spe":85},"pve":{"tier":"B","score":53.9,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Stomp","Take Down","Tackle","Astonish"],"note":"Dano estimado por segundo na caça: 129,2."},"pvp":{"tier":"C","score":43.3,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Naughty"],"moves":["Take Down","Confuse Ray","Stomp","Leer"],"note":"Duelo de referência: 43,4/100 (perfil físico). Gen 3: RU; set \"Calm Mind\" com 2/4 golpes por nível (faltam Thunderbolt, Psychic / Hidden Power Ice).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "235": {"id":235,"name":"Smeargle","types":["normal"],"stats":{"hp":55,"atk":20,"def":35,"spa":20,"spd":45,"spe":75},"pve":{"tier":"D","score":0,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":[],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero."},"pvp":{"tier":"D","score":5,"role":"support","priority":["hp","def","spd"],"natures":[],"moves":[],"note":"Os golpes naturais não causam dano mensurável (Transform, Sketch, Counter ou Present), então a nota fica em zero.","smogon":{"tier":"UUBL","covered":0,"slots":4}}},
      "237": {"id":237,"name":"Hitmontop","types":["fighting"],"stats":{"hp":50,"atk":95,"def":95,"spa":35,"spd":110,"spe":70},"pve":{"tier":"C","score":35.5,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Quick Attack","Strength","Rolling Kick","Pursuit"],"note":"Dano estimado por segundo na caça: 85,1."},"pvp":{"tier":"B","score":55.8,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Impish","Lonely"],"moves":["Agility","Detect","Rock Smash","Pursuit"],"note":"Duelo de referência: 59,2/100 (perfil físico). Gen 3: UU; set \"Counter\" com 2/4 golpes por nível (faltam Brick Break / High Jump Kick, Hidden Power Ghost).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "241": {"id":241,"name":"Miltank","types":["normal"],"stats":{"hp":95,"atk":80,"def":105,"spa":40,"spd":70,"spe":100},"pve":{"tier":"B","score":61.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Stomp","Body Slam","Strength","Tackle"],"note":"Dano estimado por segundo na caça: 146,7."},"pvp":{"tier":"S","score":71.2,"role":"physical","priority":["atk","spd","spe"],"natures":["Brave","Jolly","Adamant"],"moves":["Body Slam","Strength","Milk Drink","Tackle"],"note":"Duelo de referência: 72,3/100 (perfil físico). Gen 3: UUBL; set \"Curse\" com 3/4 golpes por nível (faltam Curse).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "242": {"id":242,"name":"Blissey","types":["normal"],"stats":{"hp":255,"atk":10,"def":10,"spa":75,"spd":135,"spe":55},"pve":{"tier":"D","score":13.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Double-Edge","Strength","Egg Bomb","DoubleSlap"],"note":"Dano estimado por segundo na caça: 31,3."},"pvp":{"tier":"C","score":41.6,"role":"physical","priority":["atk","hp","spd","spe"],"natures":["Careful","Jolly","Sassy"],"moves":["Strength","Light Screen","Rock Smash","Softboiled"],"note":"Duelo de referência: 36,5/100 (perfil físico). Gen 3: OU; set \"Blissey\" com 2/4 golpes por nível (faltam Toxic, Heal Bell).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "243": {"id":243,"name":"Raikou","types":["electric"],"stats":{"hp":90,"atk":85,"def":75,"spa":115,"spd":100,"spe":115},"pve":{"tier":"B","score":54.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["ThunderShock","Thunder","Calm Mind"],"note":"Dano estimado por segundo na caça: 130,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":67.5,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Calm","Relaxed"],"moves":["ThunderShock","Calm Mind","Reflect","Thunder"],"note":"Duelo de referência: 68,6/100 (perfil especial). Gen 3: OU; set \"Calm Mind Sweeper\" com 2/4 golpes por nível (faltam Thunderbolt, Hidden Power Grass / Hidden Power Ice).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "244": {"id":244,"name":"Entei","types":["fire"],"stats":{"hp":115,"atk":115,"def":85,"spa":90,"spd":75,"spe":100},"pve":{"tier":"B","score":50.6,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Stomp","Bite","Strength"],"note":"Dano estimado por segundo na caça: 121,4."},"pvp":{"tier":"A","score":58.9,"role":"physical","priority":["atk","hp"],"natures":["Sassy","Relaxed","Adamant"],"moves":["Bite","Leer","Calm Mind","Stomp"],"note":"Duelo de referência: 59,8/100 (perfil físico). Gen 3: UUBL; set \"SubCM\" com 2/4 golpes por nível (faltam Substitute, Hidden Power Grass).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "245": {"id":245,"name":"Suicune","types":["water"],"stats":{"hp":100,"atk":75,"def":115,"spa":90,"spd":115,"spe":85},"pve":{"tier":"S","score":99.1,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Surf","BubbleBeam","Rain Dance","Calm Mind"],"note":"Dano estimado por segundo na caça: 237,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":75.3,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Modest","Calm"],"moves":["Surf","BubbleBeam","Calm Mind","Aurora Beam"],"note":"Duelo de referência: 75,3/100 (perfil especial). Gen 3: OU; set \"Substitute\" com 3/4 golpes por nível (faltam Substitute).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "248": {"id":248,"name":"Tyranitar","types":["rock","dark"],"stats":{"hp":100,"atk":134,"def":110,"spa":95,"spd":100,"spe":61},"pve":{"tier":"A","score":73.5,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Earthquake","Crunch","Rock Slide"],"note":"Dano estimado por segundo na caça: 176,1."},"pvp":{"tier":"S","score":76.9,"role":"physical","priority":["atk","spe","hp","spd"],"natures":["Jolly","Naive","Hasty"],"moves":["Thrash","Screech","Crunch","Rock Slide"],"note":"Duelo de referência: 80,6/100 (perfil físico). Gen 3: OU; set \"Fast Dragon Dance\" com 2/4 golpes por nível (faltam Dragon Dance, Hidden Power Bug / Hidden Power Grass / Ice Beam).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "249": {"id":249,"name":"Lugia","types":["psychic","flying"],"stats":{"hp":106,"atk":90,"def":130,"spa":90,"spd":154,"spe":110},"pve":{"tier":"B","score":59.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Surf","Swift","Aeroblast"],"note":"Dano estimado por segundo na caça: 142,2."},"pvp":{"tier":"S","score":83.9,"role":"mixed","priority":["atk","spa","def"],"natures":["Lonely","Mild","Lax"],"moves":["Gust","Strength","Waterfall","Recover"],"note":"Duelo de referência: 87,4/100 (perfil misto). Gen 3: Uber; set \"Great Wall\" com 2/4 golpes por nível (faltam Reflect, Toxic).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "250": {"id":250,"name":"Ho-Oh","types":["fire","flying"],"stats":{"hp":106,"atk":130,"def":90,"spa":110,"spd":154,"spe":90},"pve":{"tier":"C","score":38.6,"role":"physical","priority":["atk"],"natures":["Brave","Adamant","Lonely"],"moves":["Strength","Sacred Fire","Fly","Sunny Day"],"note":"Dano estimado por segundo na caça: 92,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":77.4,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Lax","Naughty","Naive"],"moves":["Strength","Sacred Fire","Recover"],"note":"Duelo de referência: 79,2/100 (perfil físico). Gen 3: Uber; set \"Special Attacker\" com 2/4 golpes por nível (faltam Calm Mind, Thunderbolt / Thunder).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "251": {"id":251,"name":"Celebi","types":["psychic","grass"],"stats":{"hp":100,"atk":100,"def":100,"spa":100,"spd":100,"spe":100},"pve":{"tier":"C","score":27,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Cut","Confusion","AncientPower"],"note":"Dano estimado por segundo na caça: 64,8. Usa dano físico e especial."},"pvp":{"tier":"A","score":66.6,"role":"mixed","priority":["spa","atk","hp"],"natures":["Gentle","Sassy","Brave"],"moves":["Cut","Confusion","AncientPower","Recover"],"note":"Duelo de referência: 61,1/100 (perfil misto). Gen 3: OU; set \"Utility\" com 4/4 golpes por nível.","smogon":{"tier":"OU","covered":4,"slots":4}}},
      "254": {"id":254,"name":"Sceptile","types":["grass"],"stats":{"hp":70,"atk":85,"def":65,"spa":105,"spd":85,"spe":120},"pve":{"tier":"D","score":21.3,"role":"special","priority":["spa"],"natures":["Quiet","Mild","Modest"],"moves":["Absorb","Mega Drain","Giga Drain","Agility"],"note":"Dano estimado por segundo na caça: 51,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":34.9,"role":"special","priority":["spa","spe","hp","def"],"natures":["Modest","Timid","Quiet"],"moves":["Absorb","Mega Drain","Giga Drain","Agility"],"note":"Duelo de referência: 33,7/100 (perfil especial). Gen 3: UUBL; set \"SubSeed\" com 1/4 golpes por nível (faltam Leech Seed, Substitute, Hidden Power Ice / Hidden Power Fire).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "257": {"id":257,"name":"Blaziken","types":["fire","fighting"],"stats":{"hp":80,"atk":120,"def":70,"spa":110,"spd":70,"spe":80},"pve":{"tier":"S","score":85.1,"role":"mixed","priority":["atk","spa"],"natures":["Brave","Lonely","Naughty"],"moves":["Flamethrower","Bulk Up","Sky Uppercut","Blaze Kick"],"note":"Dano estimado por segundo na caça: 204,1, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"S","score":70.5,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Double Kick","Sky Uppercut","Bulk Up","Blaze Kick"],"note":"Duelo de referência: 78/100 (perfil físico). Gen 3: UUBL; set \"Mixed Sweeper\" com 1/4 golpes por nível (faltam Swords Dance / Focus Punch, Rock Slide, Fire Blast / Overheat).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "260": {"id":260,"name":"Swampert","types":["water","ground"],"stats":{"hp":100,"atk":110,"def":90,"spa":85,"spd":90,"spe":60},"pve":{"tier":"B","score":61.7,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Earthquake","Take Down","Waterfall","Dive"],"note":"Dano estimado por segundo na caça: 147,8."},"pvp":{"tier":"A","score":69.1,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Adamant"],"moves":["Protect","Waterfall","Strength","Earthquake"],"note":"Duelo de referência: 68,7/100 (perfil físico). Gen 3: OU; set \"Standard Defensive\" com 3/4 golpes por nível (faltam Ice Beam).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "262": {"id":262,"name":"Mightyena","types":["dark"],"stats":{"hp":70,"atk":90,"def":70,"spa":60,"spd":60,"spe":70},"pve":{"tier":"B","score":49.6,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Crunch","Take Down","Howl"],"note":"Dano estimado por segundo na caça: 118,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":49.6,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Adamant","Impish"],"moves":["Bite","Crunch","Howl","Strength"],"note":"Duelo de referência: 55,5/100 (perfil físico). Gen 3: PU; set \"Bulky Heal Bell\" com 2/4 golpes por nível (faltam Heal Bell, Rest / Protect).","smogon":{"tier":"PU","covered":2,"slots":4}}},
      "264": {"id":264,"name":"Linoone","types":["normal"],"stats":{"hp":78,"atk":70,"def":61,"spa":50,"spd":61,"spe":100},"pve":{"tier":"A","score":75.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Belly Drum","Slash","Strength","Headbutt"],"note":"Dano estimado por segundo na caça: 180,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":43.3,"role":"physical","priority":["atk","hp"],"natures":["Adamant","Brave","Naughty"],"moves":["Belly Drum","Strength","Headbutt","Rest"],"note":"Duelo de referência: 41,5/100 (perfil físico). Gen 3: UUBL; set \"Substitute + Flail\" com 2/4 golpes por nível (faltam Substitute / Endure, Shadow Ball).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "267": {"id":267,"name":"Beautifly","types":["bug","flying"],"stats":{"hp":60,"atk":70,"def":50,"spa":90,"spd":50,"spe":65},"pve":{"tier":"C","score":33.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Silver Wind","Mega Drain","Giga Drain"],"note":"Dano estimado por segundo na caça: 79,8."},"pvp":{"tier":"D","score":26.8,"role":"special","priority":["spa","spe"],"natures":["Modest","Timid","Bold"],"moves":["Gust","Absorb","Giga Drain","Silver Wind"],"note":"Duelo de referência: 28,4/100 (perfil especial). Gen 3: ZU; set \"Paralyzer\" com 3/4 golpes por nível (faltam Substitute).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "269": {"id":269,"name":"Dustox","types":["bug","poison"],"stats":{"hp":60,"atk":50,"def":70,"spa":50,"spd":90,"spe":65},"pve":{"tier":"D","score":20.1,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Gust","Psybeam","Confusion","Silver Wind"],"note":"Dano estimado por segundo na caça: 48,2."},"pvp":{"tier":"D","score":25.2,"role":"mixed","priority":["atk","spa","hp","spd"],"natures":["Gentle","Naughty","Sassy"],"moves":["Poison Sting","Protect","Moonlight","Silver Wind"],"note":"Duelo de referência: 25,3/100 (perfil misto). Gen 3: ZU; set \"Specially Defensive\" com 3/4 golpes por nível (faltam Sludge Bomb / Psychic).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "272": {"id":272,"name":"Ludicolo","types":["water","grass"],"stats":{"hp":80,"atk":70,"def":70,"spa":90,"spd":100,"spe":70},"pve":{"tier":"A","score":64.8,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Surf","Hydro Pump","Mega Drain","Rain Dance"],"note":"Dano estimado por segundo na caça: 155,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":46.3,"role":"special","priority":["spa","hp","spe","def"],"natures":["Modest","Mild","Rash"],"moves":["Surf","Mega Drain","Absorb","Growl"],"note":"Duelo de referência: 45,8/100 (perfil especial). Gen 3: UUBL; set \"Rain Dance Sweeper\" com 2/4 golpes por nível (faltam Ice Beam, Leech Seed / Hidden Power Grass).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "275": {"id":275,"name":"Shiftry","types":["grass","dark"],"stats":{"hp":90,"atk":100,"def":60,"spa":90,"spd":60,"spe":80},"pve":{"tier":"B","score":56.2,"role":"mixed","priority":["spa","atk","spe"],"natures":["Hasty","Naive","Mild"],"moves":["Faint Attack","Growth","Razor Wind","Extrasensory"],"note":"Dano estimado por segundo na caça: 134,8, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":55.2,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Lonely","Hasty","Gentle"],"moves":["Faint Attack","Extrasensory","Synthesis","Growth"],"note":"Duelo de referência: 60,4/100 (perfil misto). Gen 3: RU; set \"Choice Band\" com 2/4 golpes por nível (faltam Brick Break, Shadow Ball).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "277": {"id":277,"name":"Swellow","types":["normal","flying"],"stats":{"hp":60,"atk":85,"def":60,"spa":50,"spd":50,"spe":125},"pve":{"tier":"C","score":46.7,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Quick Attack","Aerial Ace","Wing Attack","Peck"],"note":"Dano estimado por segundo na caça: 111,9."},"pvp":{"tier":"B","score":50.1,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Lax","Adamant"],"moves":["Peck","Quick Attack","Aerial Ace","Double Team"],"note":"Duelo de referência: 49,6/100 (perfil físico). Gen 3: UUBL; set \"Endeavor\" com 2/4 golpes por nível (faltam Substitute, Baton Pass).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "279": {"id":279,"name":"Pelipper","types":["water","flying"],"stats":{"hp":60,"atk":50,"def":100,"spa":85,"spd":70,"spe":65},"pve":{"tier":"B","score":53.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Gun","Hydro Pump","Agility"],"note":"Dano estimado por segundo na caça: 127,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":35.9,"role":"special","priority":["spa","spe"],"natures":["Modest","Quiet","Rash"],"moves":["Surf","Water Gun","Hydro Pump","Agility"],"note":"Duelo de referência: 38,2/100 (perfil especial). Gen 3: NU; set \"Defensive\" com 1/4 golpes por nível (faltam Ice Beam / Toxic, Rest, Sleep Talk).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "282": {"id":282,"name":"Gardevoir","types":["psychic"],"stats":{"hp":68,"atk":65,"def":65,"spa":125,"spd":115,"spe":80},"pve":{"tier":"B","score":50.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psychic","Confusion","Calm Mind"],"note":"Dano estimado por segundo na caça: 120,9, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":52,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Relaxed","Modest"],"moves":["Growl","Psychic","Confusion","Calm Mind"],"note":"Duelo de referência: 48,8/100 (perfil especial). Gen 3: UUBL; set \"Trapper\" com 3/4 golpes por nível (faltam Mean Look).","smogon":{"tier":"UUBL","covered":3,"slots":4}}},
      "284": {"id":284,"name":"Masquerain","types":["bug","flying"],"stats":{"hp":70,"atk":60,"def":62,"spa":80,"spd":82,"spe":60},"pve":{"tier":"C","score":37.7,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Gust","BubbleBeam","Agility","Silver Wind"],"note":"Dano estimado por segundo na caça: 90,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":27.7,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Hasty"],"moves":["Gust","BubbleBeam","Agility","Silver Wind"],"note":"Duelo de referência: 30,6/100 (perfil especial). Gen 3: ZU; set \"Defensive\" com 1/4 golpes por nível (faltam Toxic, Hydro Pump, Ice Beam).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "286": {"id":286,"name":"Breloom","types":["grass","fighting"],"stats":{"hp":60,"atk":130,"def":80,"spa":60,"spd":60,"spe":70},"pve":{"tier":"S","score":81.4,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Mach Punch","Sky Uppercut","Cut","Growth"],"note":"Dano estimado por segundo na caça: 195, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":62.7,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Mach Punch","Sky Uppercut","Spore","Strength"],"note":"Duelo de referência: 62,4/100 (perfil físico). Gen 3: OU; set \"Spore\" com 3/4 golpes por nível (faltam Focus Punch).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "289": {"id":289,"name":"Slaking","types":["normal"],"stats":{"hp":150,"atk":160,"def":100,"spa":95,"spd":65,"spe":100},"pve":{"tier":"S","score":81,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Fury Swipes","Strength","Focus Punch"],"note":"Dano estimado por segundo na caça: 194,1."},"pvp":{"tier":"S","score":80.1,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Amnesia","Scratch","Strength","Focus Punch"],"note":"Duelo de referência: 87,8/100 (perfil físico). Gen 3: OU (sem Truant no jogo); set \"Choice Band\" com 1/4 golpes por nível (faltam Double-Edge, Shadow Ball, Hyper Beam / Earthquake).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "291": {"id":291,"name":"Ninjask","types":["bug","flying"],"stats":{"hp":61,"atk":90,"def":45,"spa":50,"spd":50,"spe":160},"pve":{"tier":"A","score":64.8,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Slash","Swords Dance","Dig"],"note":"Dano estimado por segundo na caça: 155,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":30.7,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Adamant","Relaxed"],"moves":["Slash","Swords Dance","Screech","Leech Life"],"note":"Duelo de referência: 30/100 (perfil físico). Gen 3: RUBL; set \"Swords Dance\" com 1/4 golpes por nível (faltam Silver Wind, Aerial Ace, Hidden Power Ground).","smogon":{"tier":"RUBL","covered":1,"slots":4}}},
      "292": {"id":292,"name":"Shedinja","types":["bug","ghost"],"stats":{"hp":1,"atk":90,"def":45,"spa":30,"spd":30,"spe":40},"pve":{"tier":"D","score":22.1,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Dig","Fury Swipes","Scratch"],"note":"Dano estimado por segundo na caça: 52,9."},"pvp":{"tier":"D","score":11.2,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Gentle","Sassy"],"moves":["Metal Claw","Confuse Ray","Dig","Fury Swipes"],"note":"Duelo de referência: 8,5/100 (perfil físico). Gen 3: ZU (sem Wonder Guard no jogo); set \"The Shed\" com 1/4 golpes por nível (faltam Swords Dance / Baton Pass, Hidden Power Fighting, Protect / Toxic / Silver Wind).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "295": {"id":295,"name":"Exploud","types":["normal"],"stats":{"hp":104,"atk":91,"def":63,"spa":91,"spd":63,"spe":68},"pve":{"tier":"A","score":78.3,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Brave"],"moves":["Stomp","Hyper Voice","Strength","Howl"],"note":"Dano estimado por segundo na caça: 187,8, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":51,"role":"physical","priority":["atk","hp"],"natures":["Brave","Adamant","Careful"],"moves":["Strength","Pound","Screech","Rest"],"note":"Duelo de referência: 58,3/100 (perfil físico). Gen 3: RU; set \"Mixed Attacker\" com 0/4 golpes por nível (faltam Return, Shadow Ball / Earthquake, Substitute / Earthquake, Flamethrower / Fire Blast / Overheat).","smogon":{"tier":"RU","covered":0,"slots":4}}},
      "297": {"id":297,"name":"Hariyama","types":["fighting"],"stats":{"hp":144,"atk":120,"def":60,"spa":40,"spd":60,"spe":50},"pve":{"tier":"A","score":70.4,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Arm Thrust","Strength","Vital Throw","Belly Drum"],"note":"Dano estimado por segundo na caça: 168,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":55.3,"role":"physical","priority":["atk","hp","spe","def"],"natures":["Jolly","Impish","Hasty"],"moves":["Seismic Toss","Strength","Vital Throw","Sand-Attack"],"note":"Duelo de referência: 59,4/100 (perfil físico). Gen 3: UUBL; set \"Offensive\" com 1/4 golpes por nível (faltam Cross Chop / Focus Punch, Brick Break / Rock Slide, Hidden Power Bug / Hidden Power Ghost / Rock Slide).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "299": {"id":299,"name":"Nosepass","types":["rock"],"stats":{"hp":30,"atk":45,"def":135,"spa":45,"spd":90,"spe":30},"pve":{"tier":"D","score":15.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Strength","Rock Throw","Rock Slide","Zap Cannon"],"note":"Dano estimado por segundo na caça: 36,9."},"pvp":{"tier":"D","score":16.9,"role":"physical","priority":["atk","hp","def"],"natures":["Impish","Lax","Adamant"],"moves":["Strength","Rock Throw","Harden","Thunder Wave"],"note":"Duelo de referência: 17,8/100 (perfil físico). Gen 3: ZU; set \"Wall\" com 1/4 golpes por nível (faltam Earthquake, Protect, Explosion).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "301": {"id":301,"name":"Delcatty","types":["normal"],"stats":{"hp":70,"atk":65,"def":65,"spa":55,"spd":55,"spe":70},"pve":{"tier":"C","score":35.9,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Double-Edge","Covet","Strength","Faint Attack"],"note":"Dano estimado por segundo na caça: 86."},"pvp":{"tier":"D","score":27.2,"role":"physical","priority":["atk","hp","def","spe"],"natures":["Careful","Relaxed","Adamant"],"moves":["Charm","Strength","Double-Edge","Tail Whip"],"note":"Duelo de referência: 30/100 (perfil físico). Gen 3: ZU; set \"Special Wall\" com 1/4 golpes por nível (faltam Body Slam / Hidden Power Grass, Wish, Protect).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "302": {"id":302,"name":"Sableye","types":["dark","ghost"],"stats":{"hp":50,"atk":75,"def":75,"spa":65,"spd":65,"spe":50},"pve":{"tier":"D","score":19.9,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Astonish","Fury Swipes","Scratch"],"note":"Dano estimado por segundo na caça: 47,7."},"pvp":{"tier":"C","score":43.1,"role":"mixed","priority":["spa","atk","spe","hp"],"natures":["Naive","Hasty","Lax"],"moves":["Faint Attack","Detect","Night Shade","Confuse Ray"],"note":"Duelo de referência: 46,4/100 (perfil misto). Gen 3: NU; set \"Wall\" com 2/4 golpes por nível (faltam Toxic, Recover).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "303": {"id":303,"name":"Mawile","types":["steel"],"stats":{"hp":50,"atk":85,"def":85,"spa":55,"spd":55,"spe":50},"pve":{"tier":"D","score":24.9,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["ViceGrip","Crunch","Strength","Bite"],"note":"Dano estimado por segundo na caça: 59,7."},"pvp":{"tier":"C","score":34.1,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Impish","Brave"],"moves":["Crunch","Strength","Iron Defense","Bite"],"note":"Duelo de referência: 38,1/100 (perfil físico). Gen 3: PU; set \"Defensive\" com 1/4 golpes por nível (faltam Seismic Toss / Hidden Power Steel, Toxic, Protect).","smogon":{"tier":"PU","covered":1,"slots":4}}},
      "306": {"id":306,"name":"Aggron","types":["steel","rock"],"stats":{"hp":70,"atk":110,"def":180,"spa":60,"spd":60,"spe":50},"pve":{"tier":"C","score":47.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Iron Tail","Double-Edge","Take Down"],"note":"Dano estimado por segundo na caça: 113,5."},"pvp":{"tier":"B","score":56.3,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Gentle","Sassy"],"moves":["Take Down","Iron Tail","Protect","Iron Defense"],"note":"Duelo de referência: 60,4/100 (perfil físico). Gen 3: RU; set \"Choice Band\" com 2/4 golpes por nível (faltam Earthquake, Rock Slide).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "308": {"id":308,"name":"Medicham","types":["fighting","psychic"],"stats":{"hp":60,"atk":60,"def":75,"spa":60,"spd":75,"spe":80},"pve":{"tier":"C","score":37.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Hi Jump Kick","Meditate","Fire Punch","Ice Punch"],"note":"Dano estimado por segundo na caça: 89,1, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":43.9,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Adamant","Lonely","Naughty"],"moves":["Hi Jump Kick","Fire Punch","Recover","Detect"],"note":"Duelo de referência: 47,5/100 (perfil físico). Gen 3: NU (sem Pure Power no jogo); set \"Choice Band\" com 1/4 golpes por nível (faltam Shadow Ball, Rock Slide, Fake Out / Focus Punch).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "310": {"id":310,"name":"Manectric","types":["electric"],"stats":{"hp":70,"atk":75,"def":60,"spa":105,"spd":60,"spe":105},"pve":{"tier":"D","score":14.6,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Thunder"],"note":"Dano estimado por segundo na caça: 35."},"pvp":{"tier":"D","score":13.6,"role":"special","priority":["spa"],"natures":["Modest","Quiet","Brave"],"moves":["Thunder","Thunder Wave"],"note":"Duelo de referência: 10,6/100 (perfil especial). Gen 3: RUBL; set \"Special Sweeper\" com 0/4 golpes por nível (faltam Thunderbolt, Substitute, Crunch, Hidden Power Ice / Hidden Power Grass).","smogon":{"tier":"RUBL","covered":0,"slots":4}}},
      "311": {"id":311,"name":"Plusle","types":["electric"],"stats":{"hp":60,"atk":50,"def":40,"spa":85,"spd":75,"spe":95},"pve":{"tier":"D","score":12.3,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Thunder"],"note":"Dano estimado por segundo na caça: 29,4."},"pvp":{"tier":"D","score":16.1,"role":"special","priority":["spa","hp"],"natures":["Mild","Modest","Rash"],"moves":["Thunder","Thunder Wave","Fake Tears","Agility"],"note":"Duelo de referência: 11,7/100 (perfil especial). Gen 3: NU; set \"Special Attacker\" com 2/4 golpes por nível (faltam Thunderbolt, Hidden Power Ice / Hidden Power Grass).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "312": {"id":312,"name":"Minun","types":["electric"],"stats":{"hp":60,"atk":40,"def":50,"spa":75,"spd":85,"spe":95},"pve":{"tier":"D","score":11.1,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Thunder"],"note":"Dano estimado por segundo na caça: 26,5."},"pvp":{"tier":"D","score":13,"role":"special","priority":["spa","hp","spd"],"natures":["Calm","Gentle","Mild"],"moves":["Thunder","Thunder Wave","Charm"],"note":"Duelo de referência: 8,8/100 (perfil especial). Gen 3: PU; set \"Support\" com 2/4 golpes por nível (faltam Thunderbolt, Hidden Power Grass / Seismic Toss / Hidden Power Ice).","smogon":{"tier":"PU","covered":2,"slots":4}}},
      "313": {"id":313,"name":"Volbeat","types":["bug"],"stats":{"hp":65,"atk":73,"def":55,"spa":47,"spd":75,"spe":85},"pve":{"tier":"C","score":27.9,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Double-Edge","Quick Attack","Tackle"],"note":"Dano estimado por segundo na caça: 66,8."},"pvp":{"tier":"D","score":25.8,"role":"physical","priority":["atk","hp","def"],"natures":["Relaxed","Impish","Adamant"],"moves":["Quick Attack","Tackle","Confuse Ray","Moonlight"],"note":"Duelo de referência: 24,9/100 (perfil físico). Gen 3: ZU; set \"Wallbreaker\" com 3/4 golpes por nível (faltam Brick Break).","smogon":{"tier":"ZU","covered":3,"slots":4}}},
      "314": {"id":314,"name":"Illumise","types":["bug"],"stats":{"hp":65,"atk":47,"def":55,"spa":73,"spd":75,"spe":85},"pve":{"tier":"D","score":10.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Covet","Quick Attack","Tackle"],"note":"Dano estimado por segundo na caça: 24,7."},"pvp":{"tier":"D","score":19.7,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Impish","Relaxed"],"moves":["Charm","Quick Attack","Covet","Moonlight"],"note":"Duelo de referência: 19,8/100 (perfil físico). Gen 3: ZU; set \"Support\" com 1/4 golpes por nível (faltam Thunderbolt, Ice Punch, Thunder Wave / Light Screen).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "315": {"id":315,"name":"Roselia","types":["grass","poison"],"stats":{"hp":50,"atk":60,"def":45,"spa":100,"spd":80,"spe":65},"pve":{"tier":"A","score":73.8,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Quiet"],"moves":["Petal Dance","Growth","Magical Leaf","Giga Drain"],"note":"Dano estimado por segundo na caça: 176,8, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":50.3,"role":"special","priority":["spa","hp","spd"],"natures":["Calm","Sassy","Modest"],"moves":["Petal Dance","Stun Spore","Magical Leaf","Giga Drain"],"note":"Duelo de referência: 55,1/100 (perfil especial). Gen 3: NU; set \"Defensive Spikes\" com 3/4 golpes por nível (faltam Spikes).","smogon":{"tier":"NU","covered":3,"slots":4}}},
      "317": {"id":317,"name":"Swalot","types":["poison"],"stats":{"hp":100,"atk":73,"def":83,"spa":73,"spd":83,"spe":55},"pve":{"tier":"C","score":35.3,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Hasty"],"moves":["Sludge","Body Slam","Sludge Bomb","Strength"],"note":"Dano estimado por segundo na caça: 84,6. Usa dano físico e especial."},"pvp":{"tier":"C","score":43.5,"role":"physical","priority":["atk","hp","def","spe"],"natures":["Adamant","Impish","Naughty"],"moves":["Body Slam","Strength","Stockpile","Sludge Bomb"],"note":"Duelo de referência: 44,8/100 (perfil físico). Gen 3: PU; set \"Specially Defensive\" com 3/4 golpes por nível (faltam Explosion).","smogon":{"tier":"PU","covered":3,"slots":4}}},
      "319": {"id":319,"name":"Sharpedo","types":["water","dark"],"stats":{"hp":70,"atk":120,"def":40,"spa":95,"spd":40,"spe":95},"pve":{"tier":"B","score":61.9,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Crunch","Skull Bash","Agility"],"note":"Dano estimado por segundo na caça: 148,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":60.2,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Adamant"],"moves":["Bite","Crunch","Agility","Waterfall"],"note":"Duelo de referência: 67,4/100 (perfil físico). Gen 3: RU; set \"Sharknado\" com 1/4 golpes por nível (faltam Hydro Pump, Ice Beam, Endure).","smogon":{"tier":"RU","covered":1,"slots":4}}},
      "321": {"id":321,"name":"Wailord","types":["water"],"stats":{"hp":170,"atk":90,"def":45,"spa":90,"spd":45,"spe":60},"pve":{"tier":"A","score":68.2,"role":"special","priority":["spa"],"natures":["Quiet","Mild","Rash"],"moves":["Surf","Water Pulse","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 163,5."},"pvp":{"tier":"A","score":60.2,"role":"mixed","priority":["atk","spa","hp","def"],"natures":["Relaxed","Sassy","Quiet"],"moves":["Surf","Waterfall","Strength","Rest"],"note":"Duelo de referência: 66,6/100 (perfil misto). Gen 3: NU; set \"Offensive\" com 2/4 golpes por nível (faltam Self-Destruct, Ice Beam).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "323": {"id":323,"name":"Camerupt","types":["fire","ground"],"stats":{"hp":70,"atk":100,"def":70,"spa":105,"spd":75,"spe":40},"pve":{"tier":"S","score":80.3,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Flamethrower","Earthquake","Double-Edge","Rock Slide"],"note":"Dano estimado por segundo na caça: 192,5. Usa dano físico e especial."},"pvp":{"tier":"A","score":58.9,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Relaxed","Lax","Sassy"],"moves":["Growl","Flamethrower","Amnesia","Earthquake"],"note":"Duelo de referência: 62,6/100 (perfil misto). Gen 3: RU; set \"Physically Defensive\" com 3/4 golpes por nível (faltam Protect / Explosion).","smogon":{"tier":"RU","covered":3,"slots":4}}},
      "324": {"id":324,"name":"Torkoal","types":["fire"],"stats":{"hp":70,"atk":85,"def":140,"spa":85,"spd":70,"spe":20},"pve":{"tier":"B","score":53.3,"role":"special","priority":["spa","spe"],"natures":["Mild","Rash","Quiet"],"moves":["Flamethrower","Heat Wave","Body Slam","Ember"],"note":"Dano estimado por segundo na caça: 127,8."},"pvp":{"tier":"B","score":57.6,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Sassy","Relaxed","Quiet"],"moves":["Flamethrower","Protect","Body Slam","Amnesia"],"note":"Duelo de referência: 64/100 (perfil misto). Gen 3: NU; set \"Tank\" com 2/4 golpes por nível (faltam Toxic, Hidden Power Grass / Rock Slide).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "326": {"id":326,"name":"Grumpig","types":["psychic"],"stats":{"hp":80,"atk":45,"def":65,"spa":90,"spd":110,"spe":80},"pve":{"tier":"C","score":39.6,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psybeam","Psychic"],"note":"Dano estimado por segundo na caça: 94,9."},"pvp":{"tier":"C","score":34.8,"role":"special","priority":["spa","hp","spd"],"natures":["Modest","Rash","Calm"],"moves":["Psybeam","Psychic","Confuse Ray","Rest"],"note":"Duelo de referência: 32/100 (perfil especial). Gen 3: UU; set \"Special Sweeper\" com 2/4 golpes por nível (faltam Calm Mind, Hidden Power Dark / Fire Punch / Ice Punch).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "327": {"id":327,"name":"Spinda","types":["normal"],"stats":{"hp":60,"atk":60,"def":60,"spa":60,"spd":60,"spe":60},"pve":{"tier":"B","score":49.8,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Double-Edge","Dizzy Punch","Psybeam"],"note":"Dano estimado por segundo na caça: 119,3."},"pvp":{"tier":"C","score":35,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Thrash","Double-Edge","Dizzy Punch","Psybeam"],"note":"Duelo de referência: 40,5/100 (perfil físico). Gen 3: ZU; set \"Calm Mind + Baton Pass\" com 1/4 golpes por nível (faltam Thunder Punch / Substitute / Snatch, Calm Mind, Baton Pass).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "330": {"id":330,"name":"Flygon","types":["ground","dragon"],"stats":{"hp":80,"atk":100,"def":80,"spa":80,"spd":80,"spe":100},"pve":{"tier":"C","score":41.6,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Dig","Crunch","Strength"],"note":"Dano estimado por segundo na caça: 99,8."},"pvp":{"tier":"B","score":51.9,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Faint Attack","Crunch","Screech","Dig"],"note":"Duelo de referência: 56,6/100 (perfil físico). Gen 3: OU; set \"Offensive\" com 0/4 golpes por nível (faltam Earthquake, Rock Slide, Hidden Power Bug, Substitute / Fire Blast).","smogon":{"tier":"OU","covered":0,"slots":4}}},
      "332": {"id":332,"name":"Cacturne","types":["grass","dark"],"stats":{"hp":70,"atk":115,"def":60,"spa":115,"spd":60,"spe":55},"pve":{"tier":"B","score":50.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Needle Arm","Growth","Pin Missile"],"note":"Dano estimado por segundo na caça: 120,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":41.5,"role":"physical","priority":["atk","hp","spd"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Needle Arm","Sand-Attack","Pin Missile"],"note":"Duelo de referência: 45,3/100 (perfil físico). Gen 3: NU; set \"Bulky Spikes\" com 2/4 golpes por nível (faltam Giga Drain, Hidden Power Dark).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "334": {"id":334,"name":"Altaria","types":["dragon","flying"],"stats":{"hp":75,"atk":70,"def":90,"spa":70,"spd":105,"spe":80},"pve":{"tier":"C","score":41,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Brave"],"moves":["DragonBreath","Peck","Sky Attack","Dragon Dance"],"note":"Dano estimado por segundo na caça: 98,2, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":58.5,"role":"mixed","priority":["atk","spa","hp","spd"],"natures":["Lax","Naughty","Rash"],"moves":["Peck","DragonBreath","Fury Attack","Dragon Dance"],"note":"Duelo de referência: 64,4/100 (perfil misto). Gen 3: UU; set \"Staller\" com 1/4 golpes por nível (faltam Toxic / Hidden Power Grass, Fire Blast / Flamethrower, Rest).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "335": {"id":335,"name":"Zangoose","types":["normal"],"stats":{"hp":73,"atk":115,"def":60,"spa":60,"spd":60,"spe":90},"pve":{"tier":"S","score":100,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Swords Dance","Strength","Crush Claw"],"note":"Dano estimado por segundo na caça: 239,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":70.7,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Quick Attack","Scratch","Detect","Swords Dance"],"note":"Duelo de referência: 74,9/100 (perfil físico). Gen 3: UUBL; set \"Swords Dance\" com 2/4 golpes por nível (faltam Return, Shadow Ball).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "336": {"id":336,"name":"Seviper","types":["poison"],"stats":{"hp":73,"atk":100,"def":60,"spa":100,"spd":60,"spe":65},"pve":{"tier":"C","score":31.6,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Poison Tail","Crunch","Poison Fang","Bite"],"note":"Dano estimado por segundo na caça: 75,8."},"pvp":{"tier":"C","score":44.1,"role":"physical","priority":["atk","spe","hp"],"natures":["Jolly","Adamant","Impish"],"moves":["Glare","Crunch","Poison Tail","Screech"],"note":"Duelo de referência: 47,5/100 (perfil físico). Gen 3: PU; set \"Mixed Breaker\" com 2/4 golpes por nível (faltam Sludge Bomb, Earthquake).","smogon":{"tier":"PU","covered":2,"slots":4}}},
      "337": {"id":337,"name":"Lunatone","types":["rock","psychic"],"stats":{"hp":70,"atk":55,"def":65,"spa":95,"spd":85,"spe":70},"pve":{"tier":"C","score":26.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psychic","Confusion"],"note":"Dano estimado por segundo na caça: 64,1."},"pvp":{"tier":"D","score":24.2,"role":"special","priority":["spa"],"natures":["Modest","Quiet","Rash"],"moves":["Psychic","Confusion"],"note":"Duelo de referência: 18,9/100 (perfil especial). Gen 3: UU; set \"Calm Mind + Baton Pass\" com 2/4 golpes por nível (faltam Baton Pass, Calm Mind).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "338": {"id":338,"name":"Solrock","types":["rock","psychic"],"stats":{"hp":70,"atk":95,"def":85,"spa":55,"spd":65,"spe":70},"pve":{"tier":"D","score":25.8,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Tackle","Rock Throw","Rock Slide"],"note":"Dano estimado por segundo na caça: 61,9."},"pvp":{"tier":"D","score":25.1,"role":"physical","priority":["atk","hp","def","spe"],"natures":["Impish","Lax","Hasty"],"moves":["Tackle","Rock Throw","Rock Slide","Cosmic Power"],"note":"Duelo de referência: 20,1/100 (perfil físico). Gen 3: UU; set \"Reflect\" com 2/4 golpes por nível (faltam Reflect, Earthquake).","smogon":{"tier":"UU","covered":2,"slots":4}}},
      "340": {"id":340,"name":"Whiscash","types":["water","ground"],"stats":{"hp":110,"atk":78,"def":73,"spa":76,"spd":71,"spe":60},"pve":{"tier":"A","score":68.5,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Mild"],"moves":["Surf","Earthquake","Waterfall","Dive"],"note":"Dano estimado por segundo na caça: 164,3. Usa dano físico e especial."},"pvp":{"tier":"A","score":69.3,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Careful","Adamant"],"moves":["Tickle","Waterfall","Rest","Earthquake"],"note":"Duelo de referência: 77/100 (perfil físico). Gen 3: NU; set \"Defensive\" com 2/4 golpes por nível (faltam Ice Beam, Protect / Sleep Talk).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "342": {"id":342,"name":"Crawdaunt","types":["water","dark"],"stats":{"hp":63,"atk":120,"def":85,"spa":90,"spd":55,"spe":55},"pve":{"tier":"S","score":81,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Swords Dance","Waterfall","Crabhammer","Strength"],"note":"Dano estimado por segundo na caça: 194,2, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":65.1,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Careful","Impish","Gentle"],"moves":["Swords Dance","Waterfall","Crabhammer","ViceGrip"],"note":"Duelo de referência: 73,2/100 (perfil físico). Gen 3: NU; set \"Special Attacker\" com 2/4 golpes por nível (faltam Crunch, Ice Beam).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "344": {"id":344,"name":"Claydol","types":["ground","psychic"],"stats":{"hp":60,"atk":70,"def":105,"spa":70,"spd":120,"spe":75},"pve":{"tier":"C","score":35.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Psybeam","AncientPower","Hyper Beam","Confusion"],"note":"Dano estimado por segundo na caça: 84,8."},"pvp":{"tier":"C","score":45.7,"role":"special","priority":["spa","hp","def","spd"],"natures":["Modest","Bold","Calm"],"moves":["AncientPower","Confusion","Cosmic Power","Mud-Slap"],"note":"Duelo de referência: 43,2/100 (perfil especial). Gen 3: OU; set \"Utility\" com 2/4 golpes por nível (faltam Earthquake, Psychic).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "346": {"id":346,"name":"Cradily","types":["rock","grass"],"stats":{"hp":86,"atk":81,"def":97,"spa":81,"spd":107,"spe":43},"pve":{"tier":"D","score":22.1,"role":"mixed","priority":["atk","spa","spe"],"natures":["Brave","Quiet","Hasty"],"moves":["Strength","Acid","AncientPower","Astonish"],"note":"Dano estimado por segundo na caça: 53. Usa dano físico e especial."},"pvp":{"tier":"C","score":39.6,"role":"mixed","priority":["atk","spa","spe","hp"],"natures":["Naive","Hasty","Naughty"],"moves":["Strength","AncientPower","Confuse Ray","Rock Smash"],"note":"Duelo de referência: 40,8/100 (perfil misto). Gen 3: UU; set \"Staller\" com 1/4 golpes por nível (faltam Barrier, Toxic, Rest).","smogon":{"tier":"UU","covered":1,"slots":4}}},
      "348": {"id":348,"name":"Armaldo","types":["rock","bug"],"stats":{"hp":75,"atk":125,"def":100,"spa":70,"spd":80,"spe":45},"pve":{"tier":"C","score":32,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Slash","Metal Claw","Strength","Rock Blast"],"note":"Dano estimado por segundo na caça: 76,7."},"pvp":{"tier":"C","score":43.5,"role":"physical","priority":["atk","hp","spe","spd"],"natures":["Adamant","Naughty","Jolly"],"moves":["Metal Claw","Protect","Rock Blast","Slash"],"note":"Duelo de referência: 44,7/100 (perfil físico). Gen 3: UUBL; set \"Rapid Spin\" com 1/4 golpes por nível (faltam Hidden Power Bug / Earthquake, Rapid Spin, Swords Dance / Rest).","smogon":{"tier":"UUBL","covered":1,"slots":4}}},
      "350": {"id":350,"name":"Milotic","types":["water"],"stats":{"hp":95,"atk":60,"def":79,"spa":100,"spd":125,"spe":81},"pve":{"tier":"S","score":81.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Surf","Water Pulse","Water Gun","Rain Dance"],"note":"Dano estimado por segundo na caça: 195, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":76.8,"role":"special","priority":["spa","hp","def","spd"],"natures":["Modest","Rash","Mild"],"moves":["Surf","Recover","Water Pulse","Rain Dance"],"note":"Duelo de referência: 77,7/100 (perfil especial). Gen 3: OU; set \"Standard\" com 3/4 golpes por nível (faltam Toxic).","smogon":{"tier":"OU","covered":3,"slots":4}}},
      "351": {"id":351,"name":"Castform","types":["normal"],"stats":{"hp":70,"atk":70,"def":70,"spa":70,"spd":70,"spe":70},"pve":{"tier":"D","score":21.8,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Powder Snow","Rain Dance","Water Gun","Weather Ball"],"note":"Dano estimado por segundo na caça: 52,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":21.6,"role":"special","priority":["spa"],"natures":["Modest","Rash","Mild"],"moves":["Sunny Day","Ember","Powder Snow","Weather Ball"],"note":"Duelo de referência: 20,5/100 (perfil especial). Gen 3: ZU; set \"Sunny Day\" com 2/4 golpes por nível (faltam Thunderbolt / Ice Beam, Solar Beam).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "352": {"id":352,"name":"Kecleon","types":["normal"],"stats":{"hp":60,"atk":90,"def":70,"spa":60,"spd":120,"spe":40},"pve":{"tier":"C","score":31.4,"role":"physical","priority":["atk"],"natures":["Brave","Adamant","Lonely"],"moves":["Slash","Cut","Strength","Faint Attack"],"note":"Dano estimado por segundo na caça: 75,2."},"pvp":{"tier":"C","score":37,"role":"physical","priority":["atk","spe","hp","spd"],"natures":["Relaxed","Sassy","Brave"],"moves":["Slash","Screech","Fury Swipes","Faint Attack"],"note":"Duelo de referência: 41,9/100 (perfil físico). Gen 3: NU; set \"Choice Band\" com 0/4 golpes por nível (faltam Return, Shadow Ball, Focus Punch / Brick Break, Trick).","smogon":{"tier":"NU","covered":0,"slots":4}}},
      "354": {"id":354,"name":"Banette","types":["ghost"],"stats":{"hp":64,"atk":115,"def":65,"spa":83,"spd":63,"spe":65},"pve":{"tier":"D","score":19.8,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Knock Off","Curse"],"note":"Dano estimado por segundo na caça: 47,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":39.5,"role":"mixed","priority":["spa","atk","spe","hp"],"natures":["Naive","Lax","Hasty"],"moves":["Faint Attack","Night Shade","Will-O-Wisp","Curse"],"note":"Duelo de referência: 38,1/100 (perfil misto). Gen 3: RU; set \"Support\" com 3/4 golpes por nível (faltam Hidden Power Fighting).","smogon":{"tier":"RU","covered":3,"slots":4}}},
      "356": {"id":356,"name":"Dusclops","types":["ghost"],"stats":{"hp":40,"atk":70,"def":130,"spa":60,"spd":130,"spe":25},"pve":{"tier":"D","score":21.7,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Shadow Punch","Curse","Pursuit","Astonish"],"note":"Dano estimado por segundo na caça: 52, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":43.3,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Lax","Naive","Gentle"],"moves":["Shadow Punch","Night Shade","Confuse Ray","Will-O-Wisp"],"note":"Duelo de referência: 42,5/100 (perfil misto). Gen 3: UUBL; set \"Staller\" com 2/4 golpes por nível (faltam Focus Punch / Seismic Toss, Pain Split / Rest).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "357": {"id":357,"name":"Tropius","types":["grass","flying"],"stats":{"hp":99,"atk":68,"def":83,"spa":72,"spd":87,"spe":51},"pve":{"tier":"B","score":58.9,"role":"mixed","priority":["atk","spa","spe"],"natures":["Lonely","Naughty","Mild"],"moves":["Razor Leaf","SolarBeam","Stomp","Growth"],"note":"Dano estimado por segundo na caça: 141,2, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"B","score":50.8,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Adamant","Impish"],"moves":["Body Slam","Razor Leaf","Synthesis","Growth"],"note":"Duelo de referência: 58,1/100 (perfil físico). Gen 3: ZU; set \"Bulky Disruptor\" com 2/4 golpes por nível (faltam Hidden Power Grass, Leech Seed).","smogon":{"tier":"ZU","covered":2,"slots":4}}},
      "358": {"id":358,"name":"Chimecho","types":["psychic"],"stats":{"hp":65,"atk":50,"def":70,"spa":95,"spd":80,"spe":65},"pve":{"tier":"C","score":31.1,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psychic","Confusion","Uproar"],"note":"Dano estimado por segundo na caça: 74,5."},"pvp":{"tier":"D","score":28.6,"role":"special","priority":["spa","spe"],"natures":["Modest","Quiet","Rash"],"moves":["Psychic","Confusion","Uproar"],"note":"Duelo de referência: 25,7/100 (perfil especial). Gen 3: NU; set \"Defensive Support\" com 3/4 golpes por nível (faltam Reflect / Light Screen).","smogon":{"tier":"NU","covered":3,"slots":4}}},
      "359": {"id":359,"name":"Absol","types":["dark"],"stats":{"hp":65,"atk":130,"def":60,"spa":75,"spd":60,"spe":75},"pve":{"tier":"S","score":87.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Brave","Lonely"],"moves":["Bite","Quick Attack","Swords Dance","Slash"],"note":"Dano estimado por segundo na caça: 209,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":60.7,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Bite","Swords Dance","Slash","Scratch"],"note":"Duelo de referência: 66,3/100 (perfil físico). Gen 3: RU; set \"Swords Dance + Baton Pass\" com 2/4 golpes por nível (faltam Shadow Ball / Substitute, Baton Pass).","smogon":{"tier":"RU","covered":2,"slots":4}}},
      "362": {"id":362,"name":"Glalie","types":["ice"],"stats":{"hp":80,"atk":80,"def":80,"spa":80,"spd":80,"spe":80},"pve":{"tier":"C","score":47.3,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Powder Snow","Ice Beam","Icy Wind","Blizzard"],"note":"Dano estimado por segundo na caça: 113,3."},"pvp":{"tier":"C","score":45.3,"role":"mixed","priority":["spa","atk","hp","def"],"natures":["Brave","Sassy","Relaxed"],"moves":["Crunch","Protect","Powder Snow","Icy Wind"],"note":"Duelo de referência: 50,7/100 (perfil misto). Gen 3: NUBL; set \"Spikes\" com 0/4 golpes por nível (faltam Spikes, Explosion, Earthquake, Hidden Power Grass).","smogon":{"tier":"NUBL","covered":0,"slots":4}}},
      "365": {"id":365,"name":"Walrein","types":["ice","water"],"stats":{"hp":110,"atk":80,"def":90,"spa":95,"spd":90,"spe":65},"pve":{"tier":"A","score":74.8,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Aurora Beam","Powder Snow","Blizzard"],"note":"Dano estimado por segundo na caça: 179,4."},"pvp":{"tier":"A","score":59.5,"role":"special","priority":["spa","hp","def","spd"],"natures":["Quiet","Modest","Calm"],"moves":["Surf","Aurora Beam","Growl","Blizzard"],"note":"Duelo de referência: 59,5/100 (perfil especial). Gen 3: UU; set \"Standard\" com 3/4 golpes por nível (faltam Ice Beam).","smogon":{"tier":"UU","covered":3,"slots":4}}},
      "367": {"id":367,"name":"Huntail","types":["water"],"stats":{"hp":55,"atk":104,"def":105,"spa":94,"spd":75,"spe":52},"pve":{"tier":"A","score":72.6,"role":"special","priority":["spa"],"natures":["Mild","Rash","Modest"],"moves":["Surf","Water Pulse","Waterfall","Hydro Pump"],"note":"Dano estimado por segundo na caça: 174."},"pvp":{"tier":"B","score":53.5,"role":"mixed","priority":["atk","spa","spe","hp"],"natures":["Naive","Naughty","Lax"],"moves":["Iron Defense","Surf","Waterfall","Crunch"],"note":"Duelo de referência: 58,7/100 (perfil misto). Gen 3: NU; set \"Baton Pass\" com 2/4 golpes por nível (faltam Substitute, Barrier).","smogon":{"tier":"NU","covered":2,"slots":4}}},
      "368": {"id":368,"name":"Gorebyss","types":["water"],"stats":{"hp":55,"atk":84,"def":105,"spa":114,"spd":75,"spe":52},"pve":{"tier":"S","score":80.8,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Pulse","Water Gun","Hydro Pump"],"note":"Dano estimado por segundo na caça: 193,6."},"pvp":{"tier":"A","score":61.8,"role":"special","priority":["spa","hp","spd","def"],"natures":["Modest","Rash","Calm"],"moves":["Surf","Water Pulse","Psychic","Amnesia"],"note":"Duelo de referência: 61,5/100 (perfil especial). Gen 3: UU; set \"Baton Pass\" com 4/4 golpes por nível.","smogon":{"tier":"UU","covered":4,"slots":4}}},
      "369": {"id":369,"name":"Relicanth","types":["water","rock"],"stats":{"hp":100,"atk":90,"def":130,"spa":45,"spd":65,"spe":55},"pve":{"tier":"C","score":38.4,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Double-Edge","Waterfall","Dive","Rock Tomb"],"note":"Dano estimado por segundo na caça: 92."},"pvp":{"tier":"C","score":44,"role":"physical","priority":["atk","hp","def"],"natures":["Adamant","Naughty","Brave"],"moves":["Waterfall","Double-Edge","Harden","Rest"],"note":"Duelo de referência: 48,3/100 (perfil físico). Gen 3: NU; set \"Physical Wall\" com 1/4 golpes por nível (faltam Rock Slide / Hidden Power Rock, Earthquake, Protect / Sleep Talk).","smogon":{"tier":"NU","covered":1,"slots":4}}},
      "370": {"id":370,"name":"Luvdisc","types":["water"],"stats":{"hp":43,"atk":30,"def":55,"spa":40,"spd":65,"spe":97},"pve":{"tier":"C","score":28,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Gun","Agility"],"note":"Dano estimado por segundo na caça: 67, com golpe de reforço mantido ativo."},"pvp":{"tier":"D","score":17.8,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Gun","Sweet Kiss","Agility"],"note":"Duelo de referência: 19/100 (perfil especial). Gen 3: ZU; set \"Rain Dance \"Sweeper\"\" com 1/4 golpes por nível (faltam Rain Dance, Ice Beam / Blizzard, Hidden Power Grass).","smogon":{"tier":"ZU","covered":1,"slots":4}}},
      "373": {"id":373,"name":"Salamence","types":["dragon","flying"],"stats":{"hp":95,"atk":135,"def":80,"spa":110,"spd":80,"spe":100},"pve":{"tier":"A","score":67,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Dragon Claw","Double-Edge","Crunch","Fly"],"note":"Dano estimado por segundo na caça: 160,7."},"pvp":{"tier":"S","score":71.6,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Jolly","Naive","Hasty"],"moves":["Dragon Claw","Bite","Protect","Leer"],"note":"Duelo de referência: 77/100 (perfil físico). Gen 3: OU; set \"Wish Support\" com 1/4 golpes por nível (faltam Flamethrower, Toxic, Wish).","smogon":{"tier":"OU","covered":1,"slots":4}}},
      "376": {"id":376,"name":"Metagross","types":["steel","psychic"],"stats":{"hp":80,"atk":135,"def":130,"spa":95,"spd":90,"spe":70},"pve":{"tier":"A","score":71.5,"role":"physical","priority":["atk"],"natures":["Brave","Adamant","Lonely"],"moves":["Metal Claw","Agility","Meteor Mash","Cut"],"note":"Dano estimado por segundo na caça: 171,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":78.7,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Gentle","Adamant"],"moves":["Meteor Mash","Metal Claw","Iron Defense","Agility"],"note":"Duelo de referência: 82,6/100 (perfil físico). Gen 3: OU; set \"Tank\" com 2/4 golpes por nível (faltam Earthquake, Explosion).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "377": {"id":377,"name":"Regirock","types":["rock"],"stats":{"hp":80,"atk":100,"def":200,"spa":50,"spd":100,"spe":50},"pve":{"tier":"C","score":29.4,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Strength","Rock Throw","Curse","Superpower"],"note":"Dano estimado por segundo na caça: 70,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":56.1,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Strength","Rock Throw","Curse","Superpower"],"note":"Duelo de referência: 57/100 (perfil físico). Gen 3: UUBL; set \"Curse\" com 2/4 golpes por nível (faltam Rock Slide / Hidden Power Rock, Earthquake).","smogon":{"tier":"UUBL","covered":2,"slots":4}}},
      "378": {"id":378,"name":"Regice","types":["ice"],"stats":{"hp":80,"atk":50,"def":100,"spa":100,"spd":200,"spe":50},"pve":{"tier":"C","score":32.6,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Icy Wind","Hyper Beam","AncientPower","Zap Cannon"],"note":"Dano estimado por segundo na caça: 78,1."},"pvp":{"tier":"B","score":53.7,"role":"special","priority":["spa","spe","hp"],"natures":["Timid","Naive","Modest"],"moves":["Icy Wind","AncientPower","Amnesia","Zap Cannon"],"note":"Duelo de referência: 60,2/100 (perfil especial). Gen 3: (OU); set \"Offensive\" com 1/4 golpes por nível (faltam Ice Beam, Thunderbolt / Thunder, Thunder Wave / Hidden Power Fire).","smogon":{"tier":"(OU)","covered":1,"slots":4}}},
      "379": {"id":379,"name":"Registeel","types":["steel"],"stats":{"hp":80,"atk":75,"def":150,"spa":75,"spd":150,"spe":50},"pve":{"tier":"C","score":30.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Strength","Curse","Superpower"],"note":"Dano estimado por segundo na caça: 72,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":70,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Careful","Jolly"],"moves":["Metal Claw","Amnesia","Curse","Hyper Beam"],"note":"Duelo de referência: 72,9/100 (perfil físico). Gen 3: OU; set \"Defensive Setup\" com 2/4 golpes por nível (faltam Seismic Toss, Protect / Rest).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "380": {"id":380,"name":"Latias","types":["dragon","psychic"],"stats":{"hp":80,"atk":80,"def":90,"spa":110,"spd":130,"spe":110},"pve":{"tier":"A","score":68.9,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Quiet"],"moves":["Surf","DragonBreath","Psychic","Mist Ball"],"note":"Dano estimado por segundo na caça: 165,1."},"pvp":{"tier":"S","score":78,"role":"special","priority":["spa","def","hp"],"natures":["Lax","Gentle","Naughty"],"moves":["DragonBreath","Surf","Wish","Mist Ball"],"note":"Duelo de referência: 80/100 (perfil especial). Gen 3: Uber; set \"BoltBeam\" com 2/4 golpes por nível (faltam Thunder, Ice Beam).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "381": {"id":381,"name":"Latios","types":["dragon","psychic"],"stats":{"hp":80,"atk":90,"def":80,"spa":130,"spd":110,"spe":110},"pve":{"tier":"S","score":82.9,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","DragonBreath","Psychic","Dragon Dance"],"note":"Dano estimado por segundo na caça: 198,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":79.6,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Calm","Sassy"],"moves":["DragonBreath","Surf","Dragon Dance","Luster Purge"],"note":"Duelo de referência: 82/100 (perfil especial). Gen 3: Uber; set \"Offensive Utility\" com 2/4 golpes por nível (faltam Thunder / Thunderbolt, Ice Beam / Dragon Claw).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "382": {"id":382,"name":"Kyogre","types":["water"],"stats":{"hp":100,"atk":100,"def":90,"spa":150,"spd":140,"spe":90},"pve":{"tier":"S","score":142.1,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Pulse","Ice Beam","Calm Mind"],"note":"Dano estimado por segundo na caça: 340,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":87.7,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Relaxed","Calm"],"moves":["Surf","Ice Beam","Rest","Calm Mind"],"note":"Duelo de referência: 88,4/100 (perfil especial). Gen 3: Uber; set \"Substitute + Calm Mind\" com 3/4 golpes por nível (faltam Substitute).","smogon":{"tier":"Uber","covered":3,"slots":4}}},
      "383": {"id":383,"name":"Groudon","types":["ground"],"stats":{"hp":100,"atk":150,"def":140,"spa":100,"spd":90,"spe":90},"pve":{"tier":"S","score":105.2,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Earthquake","Slash","Bulk Up","Strength"],"note":"Dano estimado por segundo na caça: 252,2, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":81.5,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Gentle"],"moves":["Rest","Bulk Up","Strength","Earthquake"],"note":"Duelo de referência: 84,4/100 (perfil físico). Gen 3: Uber; set \"RestTalk\" com 2/4 golpes por nível (faltam Sleep Talk, Hidden Power Ghost / Toxic / Roar).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "384": {"id":384,"name":"Rayquaza","types":["dragon","flying"],"stats":{"hp":105,"atk":150,"def":90,"spa":150,"spd":90,"spe":95},"pve":{"tier":"S","score":135.6,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Outrage","Dragon Claw","Dragon Dance","Hyper Beam"],"note":"Dano estimado por segundo na caça: 325, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":94,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Careful"],"moves":["Outrage","Hyper Beam","Fly","Dragon Claw"],"note":"Duelo de referência: 100/100 (perfil físico). Gen 3: Uber; set \"Dragon Dance\" com 2/4 golpes por nível (faltam Hidden Power Ghost / Hidden Power Bug, Earthquake).","smogon":{"tier":"Uber","covered":2,"slots":4}}},
      "385": {"id":385,"name":"Jirachi","types":["steel","psychic"],"stats":{"hp":100,"atk":100,"def":100,"spa":100,"spd":100,"spe":100},"pve":{"tier":"B","score":52,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Lonely"],"moves":["Psychic","Double-Edge","Swift","Confusion"],"note":"Dano estimado por segundo na caça: 124,6. Usa dano físico e especial."},"pvp":{"tier":"A","score":70,"role":"mixed","priority":["spa","atk","hp"],"natures":["Quiet","Mild","Rash"],"moves":["Double-Edge","Psychic","Rest","Confusion"],"note":"Duelo de referência: 71,5/100 (perfil misto). Gen 3: OU; set \"Wish + Calm Mind\" com 2/4 golpes por nível (faltam Calm Mind, Thunder / Thunderbolt / Fire Punch).","smogon":{"tier":"OU","covered":2,"slots":4}}},
      "386": {"id":386,"name":"Deoxys","types":["psychic"],"stats":{"hp":50,"atk":150,"def":50,"spa":150,"spd":50,"spe":150},"pve":{"tier":"A","score":70.2,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Quiet"],"moves":["Psychic","Psycho Boost","Strength","Pursuit"],"note":"Dano estimado por segundo na caça: 168,3. Usa dano físico e especial."},"pvp":{"tier":"B","score":53,"role":"special","priority":["spa","hp","spd","def"],"natures":["Sassy","Quiet","Relaxed"],"moves":["ExtremeSpeed","Psychic","Night Shade","Psycho Boost"],"note":"Duelo de referência: 52,7/100 (perfil especial). Gen 3: Uber; set \"Choice Band\" com 1/4 golpes por nível (faltam Superpower, Shadow Ball, Fire Punch / Thunder / Ice Beam).","smogon":{"tier":"Uber","covered":1,"slots":4}}},
      "3-mega": {"id":"3-mega","name":"Mega Venusaur","types":["grass","poison"],"stats":{"hp":80,"atk":100,"def":123,"spa":122,"spd":120,"spe":80},"pve":{"tier":"A","score":69.9,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["SolarBeam","Sludge Bomb","Growth"],"note":"Dano estimado por segundo na caça: 167,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":53.6,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Calm","Lax"],"moves":["Sludge Bomb","PoisonPowder","Leech Seed","Synthesis"],"note":"Duelo de referência: 48,3/100 (perfil especial). Gen 3: UUBL; set \"Disabler\" com 4/4 golpes por nível.","smogon":{"tier":"UUBL","covered":4,"slots":4}},"baseId":3,"isMega":true},
      "6-mega-x": {"id":"6-mega-x","name":"Mega Charizard X","types":["fire","dragon"],"stats":{"hp":78,"atk":130,"def":111,"spa":130,"spd":85,"spe":100},"pve":{"tier":"S","score":80.5,"role":"mixed","priority":["spa","atk"],"natures":["Mild","Rash","Lonely"],"moves":["Flamethrower","Ember","Slash","Wing Attack"],"note":"Dano estimado por segundo na caça: 193. Usa dano físico e especial."},"pvp":{"tier":"A","score":69.4,"role":"mixed","priority":["spa","atk","hp","spd"],"natures":["Sassy","Relaxed","Lax"],"moves":["Scary Face","Flamethrower","Wing Attack","Strength"],"note":"Duelo de referência: 78,5/100 (perfil misto). Gen 3: OU; set \"Mixed Attacker\" com 0/4 golpes por nível (faltam Fire Blast, Hidden Power Grass, Substitute / Dragon Claw, Focus Punch / Beat Up).","smogon":{"tier":"OU","covered":0,"slots":4}},"baseId":6,"isMega":true},
      "6-mega-y": {"id":"6-mega-y","name":"Mega Charizard Y","types":["fire","flying"],"stats":{"hp":78,"atk":104,"def":78,"spa":159,"spd":115,"spe":100},"pve":{"tier":"S","score":85.9,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Flamethrower","Ember","Fire Spin"],"note":"Dano estimado por segundo na caça: 205,8."},"pvp":{"tier":"A","score":65.9,"role":"special","priority":["spa","hp","def","spd"],"natures":["Bold","Relaxed","Calm"],"moves":["Ember","Flamethrower","Scary Face","Growl"],"note":"Duelo de referência: 74,2/100 (perfil especial). Gen 3: OU; set \"Mixed Attacker\" com 0/4 golpes por nível (faltam Fire Blast, Hidden Power Grass, Substitute / Dragon Claw, Focus Punch / Beat Up).","smogon":{"tier":"OU","covered":0,"slots":4}},"baseId":6,"isMega":true},
      "9-mega": {"id":"9-mega","name":"Mega Blastoise","types":["water"],"stats":{"hp":79,"atk":103,"def":120,"spa":135,"spd":115,"spe":78},"pve":{"tier":"S","score":97,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Water Gun","Rain Dance","Hydro Pump"],"note":"Dano estimado por segundo na caça: 232,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":74.8,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Sassy","Bold"],"moves":["Surf","Rain Dance","Protect","Hydro Pump"],"note":"Duelo de referência: 81,5/100 (perfil especial). Gen 3: UU; set \"Standard\" com 2/4 golpes por nível (faltam Ice Beam, Rest).","smogon":{"tier":"UU","covered":2,"slots":4}},"baseId":9,"isMega":true},
      "15-mega": {"id":"15-mega","name":"Mega Beedrill","types":["bug","poison"],"stats":{"hp":65,"atk":150,"def":40,"spa":15,"spd":80,"spe":145},"pve":{"tier":"A","score":66.1,"role":"physical","priority":["atk"],"natures":["Adamant","Brave","Lonely"],"moves":["Pin Missile","Twineedle","Cut","Agility"],"note":"Dano estimado por segundo na caça: 158,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":46.7,"role":"physical","priority":["atk","hp","spd"],"natures":["Brave","Adamant","Sassy"],"moves":["Twineedle","Pursuit","Fury Attack","Agility"],"note":"Duelo de referência: 53,8/100 (perfil físico). Gen 3: ZU; set \"Choice Band\" com 1/4 golpes por nível (faltam Sludge Bomb, Hidden Power Bug / Hidden Power Rock, Brick Break).","smogon":{"tier":"ZU","covered":1,"slots":4}},"baseId":15,"isMega":true},
      "18-mega": {"id":"18-mega","name":"Mega Pidgeot","types":["normal","flying"],"stats":{"hp":83,"atk":80,"def":80,"spa":135,"spd":80,"spe":121},"pve":{"tier":"C","score":38.4,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Gust"],"note":"Dano estimado por segundo na caça: 92."},"pvp":{"tier":"C","score":47.1,"role":"special","priority":["spa","hp","def"],"natures":["Bold","Modest","Calm"],"moves":["Gust","FeatherDance","Agility"],"note":"Duelo de referência: 52/100 (perfil especial). Gen 3: NU; set \"All-out Attacker\" com 1/4 golpes por nível (faltam Double-Edge, Aerial Ace / Hidden Power Flying, Hidden Power Ground / Return / Toxic / Facade).","smogon":{"tier":"NU","covered":1,"slots":4}},"baseId":18,"isMega":true},
      "65-mega": {"id":"65-mega","name":"Mega Alakazam","types":["psychic"],"stats":{"hp":55,"atk":50,"def":65,"spa":175,"spd":105,"spe":150},"pve":{"tier":"S","score":121.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psybeam","Psychic","Confusion","Calm Mind"],"note":"Dano estimado por segundo na caça: 291,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":68.3,"role":"special","priority":["spa","def"],"natures":["Relaxed","Quiet","Brave"],"moves":["Psybeam","Psychic","Confusion","Recover"],"note":"Duelo de referência: 68,4/100 (perfil especial). Gen 3: UUBL; set \"Calm Mind Sweeper\" com 3/4 golpes por nível (faltam Fire Punch).","smogon":{"tier":"UUBL","covered":3,"slots":4}},"baseId":65,"isMega":true},
      "80-mega": {"id":"80-mega","name":"Mega Slowbro","types":["water","psychic"],"stats":{"hp":95,"atk":75,"def":180,"spa":130,"spd":80,"spe":30},"pve":{"tier":"A","score":76.5,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Surf","Psychic","Water Gun","Confusion"],"note":"Dano estimado por segundo na caça: 183,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":73.4,"role":"special","priority":["spa","hp","spd","def"],"natures":["Modest","Mild","Quiet"],"moves":["Surf","Psychic","Amnesia","Growl"],"note":"Duelo de referência: 79,2/100 (perfil especial). Gen 3: UUBL; set \"Defensive\" com 2/4 golpes por nível (faltam Rest, Calm Mind / Thunder Wave).","smogon":{"tier":"UUBL","covered":2,"slots":4}},"baseId":80,"isMega":true},
      "94-mega": {"id":"94-mega","name":"Mega Gengar","types":["ghost","poison"],"stats":{"hp":60,"atk":65,"def":80,"spa":170,"spd":95,"spe":130},"pve":{"tier":"C","score":36.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Shadow Ball"],"note":"Dano estimado por segundo na caça: 87,9."},"pvp":{"tier":"S","score":79.7,"role":"special","priority":["spa","hp","def","spe"],"natures":["Timid","Hasty","Naive"],"moves":["Shadow Ball","Confuse Ray","Night Shade","Hypnosis"],"note":"Duelo de referência: 80,5/100 (perfil especial). Gen 3: OU; set \"Utility\" com 3/4 golpes por nível (faltam Ice Punch / Taunt / Explosion / Focus Punch).","smogon":{"tier":"OU","covered":3,"slots":4}},"baseId":94,"isMega":true},
      "115-mega": {"id":"115-mega","name":"Mega Kangaskhan","types":["normal"],"stats":{"hp":105,"atk":125,"def":100,"spa":60,"spd":100,"spe":100},"pve":{"tier":"B","score":62.8,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Mega Punch","Strength","Dizzy Punch","Comet Punch"],"note":"Dano estimado por segundo na caça: 150,6."},"pvp":{"tier":"S","score":71.4,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Adamant","Brave","Naughty"],"moves":["Leer","Rage","Strength","Dizzy Punch"],"note":"Duelo de referência: 76,8/100 (perfil físico). Gen 3: UU; set \"Reversal\" com 2/4 golpes por nível (faltam Return, Shadow Ball).","smogon":{"tier":"UU","covered":2,"slots":4}},"baseId":115,"isMega":true},
      "127-mega": {"id":"127-mega","name":"Mega Pinsir","types":["bug","flying"],"stats":{"hp":65,"atk":155,"def":120,"spa":65,"spd":90,"spe":105},"pve":{"tier":"S","score":96.5,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["ViceGrip","Swords Dance","Brick Break","Strength"],"note":"Dano estimado por segundo na caça: 231,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":63.7,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["ViceGrip","Brick Break","Harden","Swords Dance"],"note":"Duelo de referência: 70,2/100 (perfil físico). Gen 3: UU; set \"Swords Dance\" com 1/4 golpes por nível (faltam Earthquake, Hidden Power Bug, Rock Slide).","smogon":{"tier":"UU","covered":1,"slots":4}},"baseId":127,"isMega":true},
      "130-mega": {"id":"130-mega","name":"Mega Gyarados","types":["water","dark"],"stats":{"hp":95,"atk":155,"def":109,"spa":70,"spd":130,"spe":81},"pve":{"tier":"S","score":104.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Thrash","Dragon Dance","Waterfall","Rain Dance"],"note":"Dano estimado por segundo na caça: 249,9, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":85.1,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Thrash","Dragon Dance","Bite","Tackle"],"note":"Duelo de referência: 94,2/100 (perfil físico). Gen 3: OU; set \"Standard\" com 1/4 golpes por nível (faltam Hidden Power Flying / Hidden Power Rock, Earthquake, Double-Edge / Taunt / Thunder Wave).","smogon":{"tier":"OU","covered":1,"slots":4}},"baseId":130,"isMega":true},
      "142-mega": {"id":"142-mega","name":"Mega Aerodactyl","types":["rock","flying"],"stats":{"hp":80,"atk":135,"def":85,"spa":70,"spd":95,"spe":150},"pve":{"tier":"B","score":62,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Wing Attack","Bite","Take Down","Fly"],"note":"Dano estimado por segundo na caça: 148,6."},"pvp":{"tier":"A","score":68.1,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Adamant","Brave","Careful"],"moves":["Bite","Wing Attack","Agility","Strength"],"note":"Duelo de referência: 72,8/100 (perfil físico). Gen 3: OU; set \"Choice Band\" com 1/4 golpes por nível (faltam Earthquake, Hidden Power Rock, Double-Edge).","smogon":{"tier":"OU","covered":1,"slots":4}},"baseId":142,"isMega":true},
      "181-mega": {"id":"181-mega","name":"Mega Ampharos","types":["electric","dragon"],"stats":{"hp":90,"atk":95,"def":105,"spa":165,"spd":110,"spe":45},"pve":{"tier":"C","score":45.3,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["ThunderShock","Thunder"],"note":"Dano estimado por segundo na caça: 108,6."},"pvp":{"tier":"A","score":64.1,"role":"special","priority":["spa","spe","hp","def"],"natures":["Timid","Hasty","Naive"],"moves":["ThunderShock","Thunder Wave","Light Screen","Thunder"],"note":"Duelo de referência: 68,4/100 (perfil especial). Gen 3: UU; set \"Focus Punch\" com 2/4 golpes por nível (faltam Focus Punch, Thunderbolt).","smogon":{"tier":"UU","covered":2,"slots":4}},"baseId":181,"isMega":true},
      "208-mega": {"id":"208-mega","name":"Mega Steelix","types":["steel","ground"],"stats":{"hp":75,"atk":125,"def":230,"spa":55,"spd":95,"spe":30},"pve":{"tier":"C","score":43.5,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Iron Tail","Double-Edge","Crunch","Slam"],"note":"Dano estimado por segundo na caça: 104,2."},"pvp":{"tier":"S","score":72.6,"role":"physical","priority":["atk","hp","spd"],"natures":["Adamant","Brave","Lonely"],"moves":["Iron Tail","Screech","Crunch","Double-Edge"],"note":"Duelo de referência: 78,1/100 (perfil físico). Gen 3: UUBL; set \"Choice Band\" com 2/4 golpes por nível (faltam Earthquake, Explosion).","smogon":{"tier":"UUBL","covered":2,"slots":4}},"baseId":208,"isMega":true},
      "212-mega": {"id":"212-mega","name":"Mega Scizor","types":["bug","steel"],"stats":{"hp":70,"atk":150,"def":140,"spa":65,"spd":100,"spe":75},"pve":{"tier":"S","score":115.8,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Quick Attack","Swords Dance","Wing Attack"],"note":"Dano estimado por segundo na caça: 277,6, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":80.3,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Impish","Adamant"],"moves":["Metal Claw","Slash","Agility","Swords Dance"],"note":"Duelo de referência: 87,5/100 (perfil físico). Gen 3: UUBL; set \"Swords Dance\" com 2/4 golpes por nível (faltam Silver Wind, Hidden Power Rock).","smogon":{"tier":"UUBL","covered":2,"slots":4}},"baseId":212,"isMega":true},
      "214-mega": {"id":"214-mega","name":"Mega Heracross","types":["bug","fighting"],"stats":{"hp":80,"atk":185,"def":115,"spa":40,"spd":105,"spe":75},"pve":{"tier":"A","score":73.3,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Brick Break","Take Down","Megahorn","Horn Attack"],"note":"Dano estimado por segundo na caça: 175,8."},"pvp":{"tier":"S","score":74.1,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Brick Break","Horn Attack","Tackle","Megahorn"],"note":"Duelo de referência: 74,6/100 (perfil físico). Gen 3: OU; set \"Standard\" com 3/4 golpes por nível (faltam Rock Slide).","smogon":{"tier":"OU","covered":3,"slots":4}},"baseId":214,"isMega":true},
      "229-mega": {"id":"229-mega","name":"Mega Houndoom","types":["dark","fire"],"stats":{"hp":75,"atk":90,"def":90,"spa":140,"spd":90,"spe":115},"pve":{"tier":"A","score":76.8,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Flamethrower","Ember","Smog"],"note":"Dano estimado por segundo na caça: 184,1."},"pvp":{"tier":"A","score":66.2,"role":"special","priority":["spa","hp","spd","def"],"natures":["Calm","Sassy","Bold"],"moves":["Ember","Flamethrower","Smog"],"note":"Duelo de referência: 69,5/100 (perfil especial). Gen 3: UUBL; set \"Pursuit\" com 2/4 golpes por nível (faltam Pursuit, Will-O-Wisp / Toxic).","smogon":{"tier":"UUBL","covered":2,"slots":4}},"baseId":229,"isMega":true},
      "248-mega": {"id":"248-mega","name":"Mega Tyranitar","types":["rock","dark"],"stats":{"hp":100,"atk":164,"def":150,"spa":95,"spd":120,"spe":71},"pve":{"tier":"S","score":88.8,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Thrash","Earthquake","Rock Slide","Crunch"],"note":"Dano estimado por segundo na caça: 212,9."},"pvp":{"tier":"S","score":83.6,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Bite","Crunch","Leer","Thrash"],"note":"Duelo de referência: 89/100 (perfil físico). Gen 3: OU; set \"Fast Dragon Dance\" com 2/4 golpes por nível (faltam Dragon Dance, Hidden Power Bug / Hidden Power Grass / Ice Beam).","smogon":{"tier":"OU","covered":2,"slots":4}},"baseId":248,"isMega":true},
      "254-mega": {"id":"254-mega","name":"Mega Sceptile","types":["grass","dragon"],"stats":{"hp":70,"atk":110,"def":75,"spa":145,"spd":85,"spe":145},"pve":{"tier":"C","score":28,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Absorb","Mega Drain","Giga Drain","Agility"],"note":"Dano estimado por segundo na caça: 67,2, com golpe de reforço mantido ativo."},"pvp":{"tier":"C","score":41.2,"role":"special","priority":["spa","hp","spd","def"],"natures":["Quiet","Relaxed","Sassy"],"moves":["Absorb","Mega Drain","Giga Drain","Agility"],"note":"Duelo de referência: 41,6/100 (perfil especial). Gen 3: UUBL; set \"SubSeed\" com 1/4 golpes por nível (faltam Leech Seed, Substitute, Hidden Power Ice / Hidden Power Fire).","smogon":{"tier":"UUBL","covered":1,"slots":4}},"baseId":254,"isMega":true},
      "257-mega": {"id":"257-mega","name":"Mega Blaziken","types":["fire","fighting"],"stats":{"hp":80,"atk":160,"def":80,"spa":130,"spd":80,"spe":100},"pve":{"tier":"S","score":98,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Double Kick","Sky Uppercut","Bulk Up","Blaze Kick"],"note":"Dano estimado por segundo na caça: 235, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":74.2,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Double Kick","Sky Uppercut","Bulk Up","Blaze Kick"],"note":"Duelo de referência: 82,7/100 (perfil físico). Gen 3: UUBL; set \"Mixed Sweeper\" com 1/4 golpes por nível (faltam Swords Dance / Focus Punch, Rock Slide, Fire Blast / Overheat).","smogon":{"tier":"UUBL","covered":1,"slots":4}},"baseId":257,"isMega":true},
      "260-mega": {"id":"260-mega","name":"Mega Swampert","types":["water","ground"],"stats":{"hp":100,"atk":150,"def":110,"spa":95,"spd":110,"spe":70},"pve":{"tier":"S","score":84,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Earthquake","Take Down","Waterfall","Dive"],"note":"Dano estimado por segundo na caça: 201,3."},"pvp":{"tier":"S","score":84.2,"role":"physical","priority":["atk","hp"],"natures":["Adamant","Brave","Lonely"],"moves":["Waterfall","Strength","Earthquake","Protect"],"note":"Duelo de referência: 87,5/100 (perfil físico). Gen 3: OU; set \"Standard Defensive\" com 3/4 golpes por nível (faltam Ice Beam).","smogon":{"tier":"OU","covered":3,"slots":4}},"baseId":260,"isMega":true},
      "282-mega": {"id":"282-mega","name":"Mega Gardevoir","types":["psychic"],"stats":{"hp":68,"atk":85,"def":65,"spa":165,"spd":135,"spe":100},"pve":{"tier":"A","score":64.5,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Psychic","Confusion","Calm Mind"],"note":"Dano estimado por segundo na caça: 154,5, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":75.6,"role":"special","priority":["spa","hp","def","spd"],"natures":["Modest","Bold","Calm"],"moves":["Dream Eater","Psychic","Calm Mind","Hypnosis"],"note":"Duelo de referência: 78,3/100 (perfil especial). Gen 3: UUBL; set \"Trapper\" com 3/4 golpes por nível (faltam Mean Look).","smogon":{"tier":"UUBL","covered":3,"slots":4}},"baseId":282,"isMega":true},
      "302-mega": {"id":"302-mega","name":"Mega Sableye","types":["dark","ghost"],"stats":{"hp":50,"atk":85,"def":125,"spa":85,"spd":115,"spe":20},"pve":{"tier":"D","score":25.5,"role":"mixed","priority":["spa","atk","spe"],"natures":["Mild","Rash","Lonely"],"moves":["Faint Attack","Shadow Ball","Fury Swipes","Astonish"],"note":"Dano estimado por segundo na caça: 61,2. Usa dano físico e especial."},"pvp":{"tier":"B","score":50.1,"role":"special","priority":["spa","spe","hp"],"natures":["Timid","Naive","Hasty"],"moves":["Shadow Ball","Night Shade","Detect","Faint Attack"],"note":"Duelo de referência: 55,1/100 (perfil especial). Gen 3: NU; set \"Wall\" com 2/4 golpes por nível (faltam Toxic, Recover).","smogon":{"tier":"NU","covered":2,"slots":4}},"baseId":302,"isMega":true},
      "303-mega": {"id":"303-mega","name":"Mega Mawile","types":["steel"],"stats":{"hp":50,"atk":105,"def":125,"spa":55,"spd":95,"spe":50},"pve":{"tier":"C","score":29.7,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["ViceGrip","Crunch","Strength","Bite"],"note":"Dano estimado por segundo na caça: 71,1."},"pvp":{"tier":"B","score":51,"role":"physical","priority":["atk","spe","hp"],"natures":["Jolly","Hasty","Naive"],"moves":["Stockpile","Faint Attack","Crunch","Strength"],"note":"Duelo de referência: 59,2/100 (perfil físico). Gen 3: PU; set \"Defensive\" com 1/4 golpes por nível (faltam Seismic Toss / Hidden Power Steel, Toxic, Protect).","smogon":{"tier":"PU","covered":1,"slots":4}},"baseId":303,"isMega":true},
      "306-mega": {"id":"306-mega","name":"Mega Aggron","types":["steel"],"stats":{"hp":70,"atk":140,"def":230,"spa":60,"spd":80,"spe":50},"pve":{"tier":"B","score":58.4,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Iron Tail","Double-Edge","Take Down"],"note":"Dano estimado por segundo na caça: 139,9."},"pvp":{"tier":"S","score":73,"role":"physical","priority":["atk","hp","spd"],"natures":["Careful","Gentle","Sassy"],"moves":["Metal Claw","Iron Tail","Iron Defense","Protect"],"note":"Duelo de referência: 81,3/100 (perfil físico). Gen 3: RU; set \"Choice Band\" com 2/4 golpes por nível (faltam Earthquake, Rock Slide).","smogon":{"tier":"RU","covered":2,"slots":4}},"baseId":306,"isMega":true},
      "308-mega": {"id":"308-mega","name":"Mega Medicham","types":["fighting","psychic"],"stats":{"hp":60,"atk":100,"def":85,"spa":80,"spd":85,"spe":100},"pve":{"tier":"B","score":56.5,"role":"physical","priority":["atk","spe"],"natures":["Brave","Adamant","Lonely"],"moves":["Hi Jump Kick","Meditate","Fire Punch","Ice Punch"],"note":"Dano estimado por segundo na caça: 135,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":67.7,"role":"physical","priority":["atk","spd"],"natures":["Adamant","Brave","Lonely"],"moves":["Hi Jump Kick","Recover","Detect","ThunderPunch"],"note":"Duelo de referência: 77,2/100 (perfil físico). Gen 3: NU (sem Pure Power no jogo); set \"Choice Band\" com 1/4 golpes por nível (faltam Shadow Ball, Rock Slide, Fake Out / Focus Punch).","smogon":{"tier":"NU","covered":1,"slots":4}},"baseId":308,"isMega":true},
      "310-mega": {"id":"310-mega","name":"Mega Manectric","types":["electric"],"stats":{"hp":70,"atk":75,"def":80,"spa":135,"spd":80,"spe":135},"pve":{"tier":"D","score":18.1,"role":"special","priority":["spa"],"natures":["Mild","Modest","Quiet"],"moves":["Thunder"],"note":"Dano estimado por segundo na caça: 43,5."},"pvp":{"tier":"D","score":19.4,"role":"special","priority":["spa","spe"],"natures":["Quiet","Timid","Modest"],"moves":["Thunder","Thunder Wave"],"note":"Duelo de referência: 17,9/100 (perfil especial). Gen 3: RUBL; set \"Special Sweeper\" com 0/4 golpes por nível (faltam Thunderbolt, Substitute, Crunch, Hidden Power Ice / Hidden Power Grass).","smogon":{"tier":"RUBL","covered":0,"slots":4}},"baseId":310,"isMega":true},
      "319-mega": {"id":"319-mega","name":"Mega Sharpedo","types":["water","dark"],"stats":{"hp":70,"atk":140,"def":70,"spa":110,"spd":65,"spe":105},"pve":{"tier":"A","score":72.3,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Crunch","Take Down","Agility"],"note":"Dano estimado por segundo na caça: 173,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":68.3,"role":"physical","priority":["atk","hp"],"natures":["Adamant","Brave","Lonely"],"moves":["Crunch","Agility","Waterfall","Bite"],"note":"Duelo de referência: 77,5/100 (perfil físico). Gen 3: RU; set \"Sharknado\" com 1/4 golpes por nível (faltam Hydro Pump, Ice Beam, Endure).","smogon":{"tier":"RU","covered":1,"slots":4}},"baseId":319,"isMega":true},
      "323-mega": {"id":"323-mega","name":"Mega Camerupt","types":["fire","ground"],"stats":{"hp":70,"atk":120,"def":100,"spa":145,"spd":105,"spe":20},"pve":{"tier":"B","score":55.9,"role":"special","priority":["spa","spe"],"natures":["Mild","Modest","Rash"],"moves":["Flamethrower","Ember"],"note":"Dano estimado por segundo na caça: 134,1."},"pvp":{"tier":"A","score":64.1,"role":"special","priority":["spa","spe","hp","def"],"natures":["Timid","Naive","Bold"],"moves":["Flamethrower","Ember","Amnesia","Growl"],"note":"Duelo de referência: 69,1/100 (perfil especial). Gen 3: RU; set \"Physically Defensive\" com 3/4 golpes por nível (faltam Protect / Explosion).","smogon":{"tier":"RU","covered":3,"slots":4}},"baseId":323,"isMega":true},
      "334-mega": {"id":"334-mega","name":"Mega Altaria","types":["dragon","flying"],"stats":{"hp":75,"atk":110,"def":110,"spa":110,"spd":105,"spe":80},"pve":{"tier":"B","score":59.2,"role":"mixed","priority":["atk","spa"],"natures":["Lonely","Naughty","Brave"],"moves":["DragonBreath","Peck","Sky Attack","Dragon Dance"],"note":"Dano estimado por segundo na caça: 142, com golpe de reforço mantido ativo. Usa dano físico e especial."},"pvp":{"tier":"A","score":66.1,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Careful","Sassy","Impish"],"moves":["Peck","Sing","Astonish","Dragon Dance"],"note":"Duelo de referência: 73,9/100 (perfil físico). Gen 3: UU; set \"Staller\" com 1/4 golpes por nível (faltam Toxic / Hidden Power Grass, Fire Blast / Flamethrower, Rest).","smogon":{"tier":"UU","covered":1,"slots":4}},"baseId":334,"isMega":true},
      "354-mega": {"id":"354-mega","name":"Mega Banette","types":["ghost"],"stats":{"hp":64,"atk":165,"def":75,"spa":93,"spd":83,"spe":75},"pve":{"tier":"C","score":30.2,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Faint Attack","Knock Off","Curse"],"note":"Dano estimado por segundo na caça: 72,4, com golpe de reforço mantido ativo."},"pvp":{"tier":"B","score":56.2,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Adamant","Careful","Impish"],"moves":["Faint Attack","Screech","Will-O-Wisp","Curse"],"note":"Duelo de referência: 58,9/100 (perfil físico). Gen 3: RU; set \"Support\" com 3/4 golpes por nível (faltam Hidden Power Fighting).","smogon":{"tier":"RU","covered":3,"slots":4}},"baseId":354,"isMega":true},
      "359-mega": {"id":"359-mega","name":"Mega Absol","types":["dark"],"stats":{"hp":65,"atk":150,"def":60,"spa":115,"spd":60,"spe":115},"pve":{"tier":"S","score":116.1,"role":"physical","priority":["atk","spe"],"natures":["Adamant","Lonely","Naughty"],"moves":["Bite","Swords Dance","Slash","Quick Attack"],"note":"Dano estimado por segundo na caça: 278,3, com golpe de reforço mantido ativo."},"pvp":{"tier":"A","score":61.5,"role":"physical","priority":["atk","hp","def","spd"],"natures":["Impish","Relaxed","Careful"],"moves":["Bite","Leer","Strength","Slash"],"note":"Duelo de referência: 67,3/100 (perfil físico). Gen 3: RU; set \"Swords Dance + Baton Pass\" com 2/4 golpes por nível (faltam Shadow Ball / Substitute, Baton Pass).","smogon":{"tier":"RU","covered":2,"slots":4}},"baseId":359,"isMega":true},
      "362-mega": {"id":"362-mega","name":"Mega Glalie","types":["ice"],"stats":{"hp":80,"atk":120,"def":80,"spa":120,"spd":80,"spe":100},"pve":{"tier":"A","score":70.7,"role":"special","priority":["spa"],"natures":["Mild","Modest","Rash"],"moves":["Powder Snow","Ice Beam","Icy Wind","Blizzard"],"note":"Dano estimado por segundo na caça: 169,4."},"pvp":{"tier":"A","score":62,"role":"mixed","priority":["atk","spa","hp"],"natures":["Lonely","Naughty","Lax"],"moves":["Bite","Crunch","Protect","Icy Wind"],"note":"Duelo de referência: 71,6/100 (perfil misto). Gen 3: NUBL; set \"Spikes\" com 0/4 golpes por nível (faltam Spikes, Explosion, Earthquake, Hidden Power Grass).","smogon":{"tier":"NUBL","covered":0,"slots":4}},"baseId":362,"isMega":true},
      "373-mega": {"id":"373-mega","name":"Mega Salamence","types":["dragon","flying"],"stats":{"hp":95,"atk":145,"def":130,"spa":120,"spd":90,"spe":120},"pve":{"tier":"A","score":78,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Dragon Claw","Double-Edge","Crunch","Fly"],"note":"Dano estimado por segundo na caça: 187."},"pvp":{"tier":"S","score":79.6,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Impish","Relaxed","Careful"],"moves":["Dragon Claw","Protect","Leer","Headbutt"],"note":"Duelo de referência: 87/100 (perfil físico). Gen 3: OU; set \"Wish Support\" com 1/4 golpes por nível (faltam Flamethrower, Toxic, Wish).","smogon":{"tier":"OU","covered":1,"slots":4}},"baseId":373,"isMega":true},
      "376-mega": {"id":"376-mega","name":"Mega Metagross","types":["steel","psychic"],"stats":{"hp":80,"atk":145,"def":150,"spa":105,"spd":110,"spe":110},"pve":{"tier":"S","score":96.2,"role":"physical","priority":["atk"],"natures":["Adamant","Lonely","Naughty"],"moves":["Metal Claw","Meteor Mash","Agility","Take Down"],"note":"Dano estimado por segundo na caça: 230,7, com golpe de reforço mantido ativo."},"pvp":{"tier":"S","score":79.6,"role":"physical","priority":["atk","hp","spd","def"],"natures":["Adamant","Brave","Lonely"],"moves":["Metal Claw","Meteor Mash","Agility","Iron Defense"],"note":"Duelo de referência: 83,8/100 (perfil físico). Gen 3: OU; set \"Tank\" com 2/4 golpes por nível (faltam Earthquake, Explosion).","smogon":{"tier":"OU","covered":2,"slots":4}},"baseId":376,"isMega":true}
    }
  } /* GUIDE_DATA_END */;

  if (moduleEnabled('tiers')) (() => {
    // ==== src/data/capture.js ====
    // Gerado por build-data.mjs: preço de captura do Pokémon principal de cada hunt. Não edite à mão.
    const CAPTURE = /* CAPTURE_DATA_START */ {"certainAt":3,"profitSchedule":{"start":"2026-11-20","from":0.1,"stepPerDay":-0.025,"to":0.05},"balls":{"poke-ball":200,"ultra-ball":1200},"hunts":{"hoenn-zigzagoon":[263,30,90000],"hoenn-seedot":[273,15,90000],"hoenn-wurmple":[265,15,90000],"hoenn-lotad":[270,15,90000],"hoenn-ralts":[280,15,135000],"hoenn-poochyena":[261,30,90000],"hoenn-taillow":[276,30,90000],"hoenn-shroomish":[285,30,90000],"hoenn-azurill":[298,15,90000],"hoenn-slakoth":[287,15,135000],"hoenn-meditite":[307,30,90000],"hoenn-surskit":[283,30,90000],"hoenn-nincada":[290,30,90000],"hoenn-whismur":[293,15,90000],"hoenn-beldum":[374,15,135000],"hoenn-cascoon":[268,30,90000],"hoenn-silcoon":[266,30,90000],"hoenn-skitty":[300,30,90000],"hoenn-makuhita":[296,30,90000],"hoenn-mudkip":[258,15,135000],"hoenn-torchic":[255,15,135000],"hoenn-treecko":[252,15,135000],"hoenn-wynaut":[360,30,90000],"hoenn-aron":[304,15,90000],"hoenn-sableye":[302,75,96000],"hoenn-electrike":[309,30,90000],"hoenn-gulpin":[316,30,90000],"hoenn-minun":[312,75,96000],"hoenn-plusle":[311,75,96000],"hoenn-volbeat":[313,75,96000],"hoenn-barboach":[339,30,90000],"hoenn-illumise":[314,75,96000],"hoenn-carvanha":[318,30,90000],"hoenn-corphish":[341,30,90000],"hoenn-luvdisc":[370,75,90000],"hoenn-nosepass":[299,75,90000],"hoenn-wailmer":[320,30,90000],"hoenn-beautifly":[267,75,96000],"hoenn-wingull":[278,30,90000],"hoenn-dustox":[269,75,96000],"hoenn-spinda":[327,75,90000],"hoenn-torkoal":[324,75,96000],"hoenn-delcatty":[301,75,96000],"hoenn-lunatone":[337,75,96000],"hoenn-seviper":[336,75,96000],"hoenn-solrock":[338,75,96000],"hoenn-zangoose":[335,75,96000],"hoenn-anorith":[347,30,90000],"hoenn-lileep":[345,30,90000],"hoenn-numel":[322,30,90000],"hoenn-lombre":[271,30,90000],"hoenn-baltoy":[343,30,90000],"hoenn-nuzleaf":[274,30,90000],"hoenn-swablu":[333,30,90000],"hoenn-combusken":[256,30,135000],"hoenn-grovyle":[253,30,135000],"hoenn-cacnea":[331,30,90000],"hoenn-marshtomp":[259,30,135000],"hoenn-spoink":[325,30,90000],"hoenn-trapinch":[328,15,135000],"hoenn-mightyena":[262,75,96000],"hoenn-vigoroth":[288,30,135000],"hoenn-clamperl":[366,30,90000],"hoenn-feebas":[349,30,90000],"hoenn-roselia":[315,75,96000],"hoenn-kirlia":[281,30,135000],"hoenn-linoone":[264,75,96000],"hoenn-loudred":[294,30,90000],"hoenn-metang":[375,30,135000],"hoenn-kecleon":[352,75,96000],"hoenn-ninjask":[291,75,96000],"hoenn-shedinja":[292,75,90000],"hoenn-absol":[359,75,96000],"hoenn-shuppet":[353,30,90000],"hoenn-tropius":[357,75,96000],"hoenn-bagon":[371,15,135000],"hoenn-masquerain":[284,75,96000],"hoenn-swellow":[277,75,96000],"hoenn-castform":[351,75,96000],"hoenn-breloom":[286,75,96000],"hoenn-duskull":[355,30,90000],"hoenn-snorunt":[361,30,90000],"hoenn-chimecho":[358,75,96000],"hoenn-hariyama":[297,75,96000],"hoenn-spheal":[363,15,90000],"hoenn-pelipper":[279,75,96000],"hoenn-manectric":[310,75,96000],"hoenn-swalot":[317,75,96000],"hoenn-ludicolo":[272,75,481000],"hoenn-milotic":[350,75,962000],"hoenn-shiftry":[275,75,481000],"hoenn-relicanth":[369,75,481000],"hoenn-crawdaunt":[342,75,96000],"hoenn-sharpedo":[319,75,96000],"hoenn-shelgon":[372,30,135000],"hoenn-gardevoir":[282,75,962000],"hoenn-whiscash":[340,75,96000],"hoenn-cacturne":[332,75,96000],"hoenn-gorebyss":[368,75,481000],"hoenn-grumpig":[326,75,96000],"hoenn-huntail":[367,75,481000],"hoenn-lairon":[305,30,90000],"hoenn-sealeo":[364,30,90000],"hoenn-camerupt":[323,75,96000],"hoenn-altaria":[334,75,481000],"hoenn-mawile":[303,75,96000],"hoenn-vibrava":[329,30,135000],"hoenn-banette":[354,75,96000],"hoenn-claydol":[344,75,481000],"hoenn-dusclops":[356,75,96000],"hoenn-medicham":[308,75,96000],"hoenn-blaziken":[257,75,962000],"hoenn-sceptile":[254,75,962000],"hoenn-swampert":[260,75,962000],"hoenn-armaldo":[348,75,481000],"hoenn-cradily":[346,75,481000],"hoenn-exploud":[295,75,481000],"hoenn-slaking":[289,75,962000],"hoenn-wailord":[321,75,481000],"hoenn-aggron":[306,75,481000],"hoenn-glalie":[362,75,481000],"hoenn-walrein":[365,75,481000],"hoenn-flygon":[330,75,962000],"hoenn-metagross":[376,75,962000],"hoenn-salamence":[373,75,962000],"kanto-pidgey":[16,5,30],"kanto-rattata":[19,5,30],"kanto-caterpie":[10,5,30],"kanto-mankey-route22":[56,5,90],"kanto-spearow-route22":[21,5,60],"kanto-weedle":[13,5,30],"kanto-kakuna":[14,8,140],"kanto-fish-route22":[118,6,130],"kanto-fish-viridian":[60,6,130],"kanto-metapod":[11,8,140],"kanto-geodude":[74,6,130],"kanto-paras":[46,9,260],"kanto-horsea":[116,9,260],"kanto-krabby":[98,9,260],"kanto-magikarp":[129,7,110],"kanto-psyduck":[54,15,540],"kanto-seel":[86,9,260],"kanto-slowpoke":[79,15,540],"kanto-tentacool":[72,9,260],"kanto-abra":[63,11,360],"kanto-drowzee":[96,19,1100],"kanto-eevee":[133,19,2500],"kanto-ekans":[23,13,450],"kanto-spearow":[21,9,170],"kanto-diglett":[50,10,210],"kanto-pikachu":[25,10,700],"kanto-zubat":[41,10,210],"kanto-beedrill":[15,19,2500],"kanto-butterfree":[12,19,2500],"kanto-meowth":[52,13,450],"kanto-nidoran-f":[29,11,240],"kanto-nidoran-m":[32,11,240],"kanto-onix":[95,34,17000],"kanto-bellsprout":[69,9,260],"kanto-oddish":[43,9,260],"kanto-farfetchd":[83,21,1600],"kanto-machop":[66,19,1100],"kanto-cubone":[104,17,800],"kanto-growlithe":[58,13,450],"kanto-mankey":[56,13,450],"kanto-sandshrew":[27,19,1100],"kanto-vulpix":[37,13,450],"kanto-clefairy":[35,14,1100],"kanto-jigglypuff":[39,14,1100],"kanto-voltorb":[100,13,450],"kanto-dratini":[147,24,5300],"kanto-shellder":[90,19,1100],"kanto-kadabra":[64,30,12000],"kanto-nidorina":[30,19,2500],"kanto-nidorino":[33,19,2500],"kanto-tangela":[114,24,5300],"kanto-doduo":[84,13,450],"kanto-gastly-tower":[92,17,800],"kanto-lickitung":[108,19,2500],"kanto-pidgeotto":[17,19,2500],"kanto-magnemite":[81,17,800],"kanto-venonat":[48,17,800],"kanto-chansey":[113,32,15000],"kanto-exeggcute":[102,19,1100],"kanto-fearow":[22,34,17000],"kanto-fish-gyarados":[130,41,290000],"kanto-hitmonchan":[107,32,15000],"kanto-hitmonlee":[106,32,15000],"kanto-raticate":[20,24,5300],"kanto-fish-seaking":[119,24,5300],"kanto-fish-staryu":[120,15,540],"kanto-gloom":[44,24,5300],"kanto-pinsir":[127,32,73000],"kanto-rhyhorn":[111,26,3100],"kanto-scyther":[123,41,145000],"kanto-weepinbell":[70,15,1200],"kanto-arbok":[24,24,5300],"kanto-golbat":[42,28,9200],"kanto-jolteon":[135,41,290000],"kanto-kangaskhan":[115,41,145000],"kanto-sandslash":[28,34,17000],"kanto-tauros":[128,28,46000],"kanto-vaporeon":[134,41,145000],"kanto-bulbasaur":[1,21,3500],"kanto-charmander":[4,21,3500],"kanto-ivysaur":[2,30,12000],"kanto-squirtle":[7,21,3500],"kanto-grimer":[88,21,1600],"kanto-koffing":[109,24,2400],"kanto-parasect":[47,26,7000],"kanto-charmeleon":[5,30,12000],"kanto-graveler":[75,24,5300],"kanto-haunter":[93,24,5300],"kanto-kabuto":[140,23,2100],"kanto-omanyte":[138,23,2100],"kanto-poliwhirl":[61,24,5300],"kanto-wartortle":[8,30,12000],"kanto-clefable":[36,26,7000],"kanto-dugtrio":[51,26,7000],"kanto-raichu":[26,34,17000],"kanto-wigglytuff":[40,24,5300],"kanto-machoke":[67,34,17000],"kanto-kingler":[99,23,4600],"kanto-marowak":[105,34,17000],"kanto-nidoking":[34,38,118000],"kanto-nidoqueen":[31,38,118000],"kanto-persian":[53,26,7000],"kanto-ponyta":[77,30,12000],"kanto-primeape":[57,28,9200],"kanto-dragonair":[148,38,24000],"kanto-electabuzz":[125,41,145000],"kanto-electrode":[101,26,35000],"kanto-jynx":[124,26,7000],"kanto-magneton":[82,26,7000],"kanto-mr-mime":[122,36,20000],"kanto-dodrio":[85,26,7000],"kanto-venomoth":[49,26,7000],"kanto-seadra":[117,30,12000],"kanto-tentacruel":[73,36,102000],"kanto-seaking":[119,28,9200],"kanto-victreebel":[71,34,87000],"kanto-vileplume":[45,30,60000],"kanto-dewgong":[87,30,12000],"kanto-venusaur":[3,41,290000],"kanto-golduck":[55,30,60000],"kanto-weezing":[110,30,60000],"kanto-pidgeot":[18,36,20000],"kanto-hypno":[97,38,118000],"kanto-slowbro":[80,34,87000],"kanto-blastoise":[9,41,290000],"kanto-charizard":[6,41,290000],"kanto-machamp":[68,34,87000],"kanto-flareon":[136,41,145000],"kanto-magmar":[126,41,145000],"kanto-ninetales":[38,34,87000],"kanto-poliwrath":[62,38,118000],"kanto-kabutops":[141,45,174000],"kanto-muk":[89,38,118000],"kanto-omastar":[139,45,174000],"kanto-rapidash":[78,34,87000],"kanto-cloyster":[91,41,145000],"kanto-exeggutor":[103,41,145000],"kanto-lapras":[131,49,207000],"kanto-starmie":[121,41,290000],"kanto-alakazam":[65,41,290000],"kanto-arcanine":[59,49,413000],"kanto-golem":[76,49,207000],"kanto-snorlax":[143,49,413000],"kanto-gengar":[94,45,349000],"kanto-rhydon":[112,49,207000],"kanto-aerodactyl":[142,50,391000000],"kanto-dragonite":[149,50,430000],"johto-phanpy":[231,30,45000],"johto-teddiursa":[216,30,45000],"johto-dunsparce":[206,65,72000],"johto-sentret":[161,30,45000],"johto-hoppip":[187,15,45000],"johto-hoothoot":[163,30,45000],"johto-unown":[201,65,45000],"johto-cleffa":[173,15,45000],"johto-igglybuff":[174,15,45000],"johto-mareep":[179,15,45000],"johto-pichu":[172,15,45000],"johto-slugma":[218,30,45000],"johto-togepi":[175,30,45000],"johto-tyrogue":[236,30,45000],"johto-ledyba":[165,30,45000],"johto-spinarak":[167,30,45000],"johto-larvitar":[246,15,70000],"johto-cyndaquil":[155,15,70000],"johto-remoraid":[223,30,45000],"johto-smoochum":[238,30,45000],"johto-aipom":[190,65,45000],"johto-heracross":[214,65,724000],"johto-pineco":[204,30,45000],"johto-chikorita":[152,15,70000],"johto-snubbull":[209,30,45000],"johto-totodile":[158,15,70000],"johto-yanma":[193,65,72000],"johto-houndour":[228,30,45000],"johto-miltank":[241,65,362000],"johto-stantler":[234,65,72000],"johto-sunkern":[191,30,45000],"johto-shuckle":[213,65,72000],"johto-wooper":[194,30,45000],"johto-marill":[183,30,45000],"johto-steelix":[208,65,362000],"johto-elekid":[239,30,45000],"johto-magby":[240,30,45000],"johto-quilava":[156,30,70000],"johto-togetic":[176,65,72000],"johto-flaaffy":[180,30,45000],"johto-furret":[162,65,72000],"johto-mantine":[226,65,72000],"johto-wobbuffet":[202,65,72000],"johto-bayleef":[153,30,70000],"johto-natu":[177,30,45000],"johto-smeargle":[235,65,45000],"johto-skiploom":[188,30,45000],"johto-sunflora":[192,65,72000],"johto-croconaw":[159,30,70000],"johto-ledian":[166,65,72000],"johto-azumarill":[184,65,72000],"johto-chinchou":[170,30,45000],"johto-delibird":[225,65,45000],"johto-sneasel":[215,65,72000],"johto-swinub":[220,30,45000],"johto-gligar":[207,65,72000],"johto-corsola":[222,65,72000],"johto-hitmontop":[237,65,72000],"johto-noctowl":[164,65,72000],"johto-quagsire":[195,65,72000],"johto-espeon":[196,65,724000],"johto-murkrow":[198,65,72000],"johto-umbreon":[197,65,362000],"johto-ariados":[168,65,72000],"johto-skarmory":[227,65,72000],"johto-sudowoodo":[185,65,72000],"johto-granbull":[210,65,72000],"johto-slowking":[199,65,362000],"johto-octillery":[224,65,362000],"johto-houndoom":[229,65,362000],"johto-xatu":[178,65,72000],"johto-donphan":[232,65,362000],"johto-misdreavus":[200,65,72000],"johto-lanturn":[171,65,72000],"johto-jumpluff":[189,65,72000],"johto-girafarig":[203,65,72000],"johto-pupitar":[247,30,70000],"johto-forretress":[205,65,72000],"johto-ursaring":[217,65,362000],"johto-ampharos":[181,65,362000],"johto-feraligatr":[160,65,724000],"johto-porygon2":[233,65,362000],"johto-piloswine":[221,65,72000],"johto-bellossom":[182,65,362000],"johto-meganium":[154,65,724000],"johto-qwilfish":[211,65,72000],"johto-crobat":[169,65,724000],"johto-typhlosion":[157,65,724000],"johto-magcargo":[219,65,72000],"johto-politoed":[186,65,362000],"johto-blissey":[242,65,362000],"johto-kingdra":[230,65,724000],"johto-scizor":[212,65,724000],"johto-tyranitar":[248,65,724000],"outland-east":[208,90,690000],"outland-north":[154,90,1381000],"outland-south":[157,90,1381000],"outland-feraligatr":[160,90,1381000],"outland-blastoise":[9,90,1381000],"outland-gyarados":[130,90,1381000],"outland-mantine":[226,90,138000],"outland-pinsir":[127,90,690000],"outland-scyther":[123,90,690000],"outland-heracross":[214,90,1381000],"outland-parasect":[47,90,138000],"outland-girafarig":[203,90,138000],"outland-xatu":[178,90,138000],"outland-alakazam":[65,90,1381000],"outland-hypno":[97,90,690000],"outland-meganium":[154,90,1381000],"outland-venusaur":[3,90,1381000],"outland-remoraid":[223,90,62000],"outland-octillery":[224,90,690000],"outland-corsola":[222,90,138000],"outland-seadra":[117,90,138000],"outland-kingdra":[230,90,1381000],"outland-charmander":[4,90,138000],"outland-charmeleon":[5,90,138000],"outland-magby":[240,90,62000],"outland-magmar":[126,90,690000],"outland-arcanine":[59,90,1381000],"outland-charizard":[6,90,1381000],"outland-magnemite":[81,90,62000],"outland-magneton":[82,90,138000],"outland-voltorb":[100,90,62000],"outland-electrode":[101,90,690000],"outland-elekid":[239,90,62000],"outland-electabuzz":[125,90,690000],"outland-golem":[76,90,690000],"outland-rhydon":[112,90,690000],"outland-pupitar":[247,90,138000],"outland-steelix":[208,90,690000],"outland-gengar":[94,90,1381000],"outland-misdreavus":[200,90,138000],"outland-murkrow":[198,90,138000],"outland-hitmonchan":[107,90,138000],"outland-hitmonlee":[106,90,138000],"outland-hitmontop":[237,90,138000],"outland-nidoking":[34,90,690000],"outland-nidoqueen":[31,90,690000],"outland-donphan":[232,90,690000],"outland-sandslash":[28,90,138000],"outland-marowak":[105,90,138000],"outland-skarmory":[227,90,138000],"outland-noctowl":[164,90,138000],"outland-pidgeot":[18,90,138000],"outland-raichu":[26,90,138000],"outland-ampharos":[181,90,690000],"outland-miltank":[241,90,690000],"outland-wigglytuff":[40,90,138000],"outland-granbull":[210,90,138000],"outland-typhlosion":[157,90,1381000],"outland-piloswine":[221,90,138000],"outland-jynx":[124,90,138000],"outland-dewgong":[87,90,138000],"outland-cloyster":[91,90,690000],"outland-dragonair":[148,90,138000],"outland-crobat":[169,90,1381000],"outland-nightmare-steelix":[208,90,690000],"orre-venusaur-mega":[3,90,1381000],"orre-sceptile-mega":[254,90,1381000],"orre-beedrill-mega":[15,90,138000],"orre-pinsir-mega":[127,90,690000],"orre-scizor-mega":[212,90,1381000],"orre-blastoise-mega":[9,90,1381000],"orre-swampert-mega":[260,90,1381000],"orre-gyarados-mega":[130,90,1381000],"orre-sharpedo-mega":[319,90,138000],"orre-slowbro-mega":[80,90,690000],"orre-tyranitar-mega":[248,90,1381000],"orre-aggron-mega":[306,90,690000],"orre-steelix-mega":[208,90,690000],"orre-camerupt-mega":[323,90,138000],"orre-ampharos-mega":[181,90,690000],"orre-manectric-mega":[310,90,138000],"orre-metagross-mega":[376,90,1381000],"orre-glalie-mega":[362,90,690000],"orre-sableye-mega":[302,90,138000],"orre-mawile-mega":[303,90,138000],"orre-absol-mega":[359,90,138000],"orre-alakazam-mega":[65,90,1381000],"orre-gardevoir-mega":[282,90,1381000],"orre-charizard-mega-x":[6,90,1381000],"orre-charizard-mega-y":[6,90,1381000],"orre-blaziken-mega":[257,90,1381000],"orre-medicham-mega":[308,90,138000],"orre-heracross-mega":[214,90,1381000],"orre-kangaskhan-mega":[115,90,690000],"orre-gengar-mega":[94,90,1381000],"orre-banette-mega":[354,90,138000],"orre-houndoom-mega":[229,90,690000],"orre-aerodactyl-mega":[142,90,391000000],"orre-salamence-mega":[373,90,1381000],"orre-altaria-mega":[334,90,690000],"orre-pidgeot-mega":[18,90,138000],"nightmare-scizor":[212,90,1381000],"nightmare-sceptile":[254,90,1381000],"nightmare-crobat":[169,90,1381000],"nightmare-nidoking":[34,90,690000],"nightmare-gengar":[94,90,1381000],"nightmare-dusclops":[356,90,138000],"nightmare-absol":[359,90,138000],"nightmare-umbreon":[197,90,690000],"nightmare-alakazam":[65,90,1381000],"nightmare-espeon":[196,90,1381000],"nightmare-ampharos":[181,90,690000],"nightmare-jolteon":[135,90,1381000],"nightmare-charizard":[6,90,1381000],"nightmare-ninetales":[38,90,690000],"nightmare-houndoom":[229,90,690000],"nightmare-mightyena":[262,90,138000],"nightmare-gyarados":[130,90,1381000],"nightmare-milotic":[350,90,1381000],"nightmare-lapras":[131,90,690000],"nightmare-kingdra":[230,90,1381000],"nightmare-swampert":[260,90,1381000],"nightmare-vaporeon":[134,90,690000],"nightmare-dragonite":[149,90,1381000],"nightmare-salamence":[373,90,1381000],"nightmare-flygon":[330,90,1381000],"nightmare-dragonair":[148,90,138000],"nightmare-tyranitar":[248,90,1381000],"nightmare-steelix":[208,90,690000],"nightmare-aerodactyl":[142,90,391000000],"nightmare-metagross":[376,90,1381000],"castelo-viridian":[137,50,20592000],"castelo-cerulean":[137,50,20592000],"castelo-pewter":[137,50,20592000]}} /* CAPTURE_DATA_END */;

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
    // Selos de tier e de captura no MAPA, selo na ficha do Pokémon e a seção "Moveset recomendado" da ficha.

    // ---- Capture cost (CAPTURE comes from build-data.mjs; rules in capture.mjs and the game's
    // "Captura" guide). Each ball's chance grows with the ₽ already spent on the species since its
    // last capture; the capture is certain at certainAt × price and costs price / (1 + margin) on
    // average. The margin follows the game's schedule (10% on 2026-11-20, then 2.5 points less a day, down to 5%).
    const captureMoney = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
    const captureFull = new Intl.NumberFormat('pt-BR');
    const capturePercent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

    function captureMargin(now = Date.now()) {
      const schedule = CAPTURE.profitSchedule;
      if (!schedule) return 0;
      const day = Math.floor((now - (Date.parse(`${schedule.start}T00:00:00Z`) + 3 * 3600e3)) / 864e5);
      const value = schedule.from + schedule.stepPerDay * Math.max(0, day);
      return Math.min(Math.max(schedule.from, schedule.to), Math.max(Math.min(schedule.from, schedule.to), value));
    }

    function captureInfo(huntId) {
      const entry = CAPTURE.hunts?.[huntId];
      if (!entry) return null;
      const [dex, level, price] = entry;
      const poke = CAPTURE.balls['poke-ball'];
      const ultra = CAPTURE.balls['ultra-ball'];
      const average = price / (1 + captureMargin());
      return {
        dex, level, price, average,
        guaranteed: CAPTURE.certainAt * price,
        ultraAverage: Math.max(1, Math.round(average / ultra)),
        ultraGuaranteed: Math.ceil(CAPTURE.certainAt * price / ultra),
        firstPoke: Math.min(1, poke / (2 * price)),
      };
    }

    function createCaptureSegment(huntId, name) {
      const info = captureInfo(huntId);
      if (!info) return null;
      const segment = document.createElement('span');
      segment.className = 'pafk-tier-seg pafk-catch-seg';
      segment.dataset.hunt = huntId;
      segment.innerHTML = '<img src="/assets/ui/hud-icons/24-poke-ball.png" alt=""><b></b>';
      segment.querySelector('b').textContent = `₽${captureMoney.format(info.average)}`;
      segment.title = `Captura${name ? ` de ${name}` : ''} nesta caça: chega no Nv. ${info.level}. `
        + `Gasto médio ₽${captureFull.format(Math.round(info.average))} (≈ ${info.ultraAverage} Ultra Ball${info.ultraAverage > 1 ? 's' : ''}); `
        + `garantida em ₽${captureFull.format(info.guaranteed)} (${info.ultraGuaranteed} Ultra Balls). `
        + `Preço de captura ₽${captureFull.format(info.price)}; 1ª Poké Ball ${capturePercent.format(info.firstPoke)}. `
        + 'Sem contar a sorte acumulada nem bônus de captura.';
      segment.setAttribute('aria-label', segment.title);
      return segment;
    }

    // Names are single lines with an ellipsis, so the badges get a line of their own below the place:
    // the tier of the main Pokémon and what it costs to catch it in this hunt.
    function placeMapBadges(host, dex, huntId) {
      if (!host || !dex) return;
      let line = host.querySelector(':scope > .pafk-map-line');
      if (!line) {
        line = document.createElement('span');
        line.className = 'pafk-map-line';
        line.dataset.pafk = '';
        host.append(line);
      }
      placeTierBadge(line, dex);
      const current = line.querySelector(':scope > .pafk-catch-seg');
      if (current?.dataset.hunt === String(huntId ?? '')) return;
      current?.remove();
      // The name is the first text of the row or card ("Fearow", or "Fearow · Rota 17").
      const name = host.querySelector('strong')?.firstChild?.textContent.trim() ?? '';
      const segment = huntId ? createCaptureSegment(huntId, name) : null;
      if (segment && String(captureInfo(huntId).dex) === String(dex)) line.append(segment);
    }

    function decorateMap() {
      for (const row of document.querySelectorAll('.modal .mx-row[data-hunt]')) {
        placeMapBadges(row.querySelector('.mx-row-main'), dexFromAsset(row.querySelector('.icon')?.style.backgroundImage), row.dataset.hunt);
      }
      // The card has no hunt id; it shows the hunt selected in the list.
      const selected = document.querySelector('.modal .mx-row.sel[data-hunt]')?.dataset.hunt;
      for (const card of document.querySelectorAll('.modal .mx-card')) {
        placeMapBadges(card.querySelector('.mx-card-txt'), dexFromAsset(card.querySelector('.mx-card-art img')?.getAttribute('src')), selected);
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
      return { nature: NATURES.includes(rawNature) ? rawNature : null, ivs: readIVs(row.querySelector('.mk-ivs')) };
    }

    function readIVs(grid) {
      const ivs = {};
      for (const stat of grid?.children ?? []) {
        const label = stat.querySelector('small')?.textContent.trim().toUpperCase();
        const value = stat.querySelector('b')?.textContent.trim();
        const key = STAT_KEYS.get(label);
        if (key && /^\d{1,2}$/.test(value)) ivs[key] = Number(value);
      }
      return ivs;
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
            <p>Simula 60 s de caça como o AUTO: usa o golpe pronto mais forte, respeitando recarga e o intervalo entre golpes, que diminui com a Velocidade. Golpes em área acertam mais do bando quanto maior a área: um cone de 4 quadrados (Surf, Flamethrower) ou um círculo de raio 3 (Earthquake) pega os 3 do bando, com 75% do dano em cada um; um cone de 2 quadrados, pouco mais de um. Reforços como Swords Dance e Growth são usados uma vez e repetidos quando o efeito acaba, sem acumular. Sunny Day e Rain Dance contam enquanto duram. A nota 100 é a espécie normal com mais dano por segundo.</p>
          </details>
          <details data-rank-help="pvp" hidden>
            <summary>Como a nota competitiva é calculada</summary>
            <p>Simula duelos de até 180 s contra um atacante físico e um especial de referência, com as regras do jogo e o AUTO da Ranqueada: reforços e reduções de atributo usados uma vez e repetidos quando acabam, sono, paralisia, queimadura, veneno, confusão, recargas de batalha e até 4 curas. No PvP os jogadores desviam: golpes que marcam o chão (projétil, feixe, investida, cone, círculo, área, salto) erram mais quanto maior o tempo de preparo (nada abaixo de 0,25 s, até 70% a partir de 0,75 s); corpo a corpo e golpes que seguem o alvo nunca erram por isso. Enquanto prepara um golpe, o Pokémon fica parado e não desvia dos ataques do oponente. Velocidade e reforços como Agility encurtam o intervalo entre golpes. Cobertura de tipos e resistências também contam. 70% da nota vem do duelo e 30% da referência competitiva da Gen 3 (tiers e sets da Smogon e do Pokémon Showdown). Essa referência é reduzida quando o set da Smogon depende de golpes que a espécie não aprende por nível.</p>
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
        .pafk-map-line { display: inline-flex; align-self: flex-start; align-items: stretch; gap: 3px; margin: 2px 0 0; font-size: 10px; font-weight: 700; line-height: 1.3; white-space: nowrap; }
        .pafk-map-line > .${TIER_BADGE} { margin: 0; font-size: inherit; line-height: inherit; }
        .pafk-map-line .pafk-tier-seg { padding: 0 4px; }
        .pafk-map-line .pafk-tier-seg small { font-size: 9px; }
        /* Capture cost: neutral, so it does not read as another tier. */
        .pafk-catch-seg { align-items: center; --pafk-tier-bg: #f2f5fa; --pafk-tier-fg: #22324f; --pafk-tier-edge: #c9d3e2; font-variant-numeric: tabular-nums; }
        .pafk-catch-seg img { width: 11px; height: 11px; image-rendering: pixelated; }
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

    // ==== src/market/price-data.js ====
    // Comparação de preço a partir dos IVs e dos preços pedidos no mercado.
    const PRICE_HISTORY_KEY = 'pokeafk-market-filtros:price-history';
    const PRICE_HISTORY_AGE = 7 * 24 * 60 * 60 * 1000;
    const IV_MAX_TOTAL = 186;
    const PRICE_SAMPLE_SIZE = 5;
    const priceNumber = new Intl.NumberFormat('pt-BR');
    const priceDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    function priceIVTotal(ivs) {
      const values = STATS.map(([stat]) => ivs?.[stat]);
      return values.every(validIV) ? values.reduce((sum, value) => sum + value, 0) : null;
    }

    function priceVariant(sprite) {
      return sprite?.getAttribute('src')?.match(/\/assets\/mon\/front\/((\d+)[\w-]*)\.png(?:[?#].*)?$/);
    }

    function readPriceTarget(main) {
      if (!main?.parentElement.matches('.mk[data-page="create"]')) return null;
      const preview = main.querySelector('.mk-ivs-pv')?.parentElement;
      const variant = priceVariant(preview?.querySelector('.mk-pv-mon img'));
      const name = preview?.querySelector('.mk-pv-name')?.textContent.trim();
      const ivs = readIVs(preview?.querySelector('.mk-ivs-pv'));
      const total = priceIVTotal(ivs);
      if (!variant || !name || total === null) return null;
      const level = readPriceLevel([...preview.querySelectorAll('.mk-fact b')].find(el =>
        /^Nv\./.test(el.textContent.trim())));
      const own = main.querySelector('[data-own-mon][aria-pressed="true"], [data-own-mon].on');
      const key = own?.dataset.ownMon ?? JSON.stringify([variant[1], name, ivs, level]);
      return { key, dex: Number(variant[2]), variant: variant[1], name, ivs, total, level };
    }

    function defaultPriceCriteria({ ivs, total }) {
      const perfect = STATS.filter(([stat]) => ivs[stat] === 31);
      const best = STATS.reduce((a, b) => ivs[b[0]] > ivs[a[0]] ? b : a);
      const priority = perfect.length ? perfect : [best];
      return {
        total: Math.max(0, total - 5),
        minimums: new Map(priority.map(([stat]) => [stat, Math.max(0, ivs[stat] - (perfect.length ? 0 : 2))])),
      };
    }

    function readPriceAmount(raw = '') {
      const amount = raw.trim().replace(/^₽\s*/, '');
      if (!/^(?:\d+|\d{1,3}(?:[.\s]\d{3})+)$/.test(amount)) return null;
      const value = Number(amount.replace(/\D/g, ''));
      return Number.isSafeInteger(value) && value > 0 ? value : null;
    }

    function readPriceLevel(node) {
      return Number(node?.textContent.trim().match(/^Nv\.\s*([\d.]+)$/)?.[1].replaceAll('.', '')) || 0;
    }

    function readPriceOffers(main) {
      const variants = new Map();
      const rows = main.querySelectorAll(OFFER_ROW);
      for (const row of rows) {
        const id = row.querySelector('[data-buy]')?.dataset.buy;
        const variant = priceVariant(row.querySelector('img.mk-front'))?.[1];
        if (!id || !variant) continue;
        const { ivs, nature } = readOffer(row);
        const total = priceIVTotal(ivs);
        const money = row.querySelector('.mk-coin-n');
        const gems = row.querySelector('.mk-gem-n');
        const price = readPriceAmount(money?.title || money?.textContent);
        if (total === null || price === null) continue;
        if (!variants.has(variant)) variants.set(variant, new Map());
        variants.get(variant).set(id, {
          ivs, total, nature, price,
          gems: readPriceAmount(gems?.title || gems?.textContent),
          level: readPriceLevel(row.querySelector('.mk-lv')),
        });
      }
      return {
        variants: new Map([...variants].map(([variant, offers]) => [variant, [...offers.values()]])),
        rowCount: rows.length,
      };
    }

    function nearestPriceOffers(offers, target, { total, minimums }) {
      const stats = [...minimums];
      const matches = offers.flatMap(offer => {
        if (offer.total < total || stats.some(([stat, min]) => offer.ivs[stat] < min)) return [];
        const statDistance = stats.reduce((sum, [stat]) => sum + Math.abs(offer.ivs[stat] - target.ivs[stat]), 0);
        return [{ offer, distance: Math.abs(offer.total - target.total) + 4 * statDistance }];
      });
      matches.sort((a, b) => a.distance - b.distance ||
        Math.abs(a.offer.level - target.level) - Math.abs(b.offer.level - target.level));
      return { count: matches.length, sample: matches.slice(0, PRICE_SAMPLE_SIZE).map(({ offer }) => offer) };
    }

    function summarizePrice(values) {
      if (!values.length) return null;
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return {
        estimate: sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2),
        min: sorted[0],
        max: sorted.at(-1),
      };
    }

    function readPriceHistory() {
      try {
        const saved = JSON.parse(localStorage.getItem(PRICE_HISTORY_KEY) ?? '[]');
        if (!Array.isArray(saved)) return [];
        return saved.filter(entry => typeof entry?.variant === 'string'
          && Date.now() - entry.at < PRICE_HISTORY_AGE && Array.isArray(entry.offers) && entry.offers.length);
      } catch {
        return [];
      }
    }

    function savePriceHistoryFallback(variant, snapshot) {
      if (!snapshot.offers.length) return;
      const previous = readPriceHistory().filter(entry => entry.variant !== variant);
      try {
        localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify([
          { variant, ...snapshot }, ...previous.slice(0, 11),
        ]));
      } catch {
        // O resultado da consulta continua disponível no formulário.
      }
    }

    // ==== src/market/price-book-data.js ====
    // Vendas públicas individuais e uma observação de preços pedidos por forma e dia.
    const PRICE_BOOK_DB = 'pokeafk-tools-prices';
    const PRICE_BOOK_DAY = 24 * 60 * 60 * 1000;
    const priceBookDay = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short' });
    let priceBookConnection;
    let priceBookImport;
    let priceBookRevision = 0;

    const priceBookText = value => value.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();

    function openPriceBook() {
      if (priceBookConnection) return priceBookConnection;
      priceBookConnection = new Promise((resolve, reject) => {
        const request = indexedDB.open(PRICE_BOOK_DB, 1);
        request.onupgradeneeded = () => {
          for (const kind of ['sales', 'asks']) {
            const store = request.result.createObjectStore(kind, { keyPath: 'id' });
            store.createIndex('at', 'at');
            store.createIndex('variant', 'variant');
          }
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            priceBookConnection = null;
          };
          resolve(db);
        };
      }).catch(error => {
        priceBookConnection = null;
        throw error;
      });
      return priceBookConnection;
    }

    async function writePriceBook(kind, records) {
      if (!records.length) return false;
      const db = await openPriceBook();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(kind, 'readwrite');
        const store = transaction.objectStore(kind);
        let changed = false;
        for (const record of records) {
          const request = store.get(record.id);
          request.onsuccess = () => {
            const previous = request.result;
            // Uma linha resumida do histórico não pode apagar os IVs de um detalhe já aberto.
            const newer = kind === 'asks' ? record.at > previous?.at : record.ivs && !previous?.ivs;
            if (previous && !newer) return;
            store.put(record);
            changed = true;
          };
        }
        transaction.oncomplete = () => {
          if (changed) priceBookRevision++;
          resolve(changed);
        };
        transaction.onabort = () => reject(transaction.error);
      });
    }

    function priceBookAsks(variant, at, offers) {
      return { id: [variant, priceBookDay.format(at)], variant, at, offers };
    }

    async function readPriceBook(kind, since, variant) {
      priceBookImport ??= writePriceBook('asks', readPriceHistory().filter(entry => !entry.scoped)
        .map(entry => priceBookAsks(entry.variant, entry.at, entry.offers)));
      await priceBookImport.catch(() => { priceBookImport = null; });
      const db = await openPriceBook();
      return new Promise((resolve, reject) => {
        const store = db.transaction(kind).objectStore(kind);
        const request = variant
          ? store.index('variant').getAll(variant)
          : store.index('at').getAll(IDBKeyRange.lowerBound(since));
        request.onsuccess = () => resolve(request.result.filter(row => row.at >= since));
        request.onerror = () => reject(request.error);
      });
    }

    function readPriceSale(row) {
      const target = row.querySelector('.mk-history-target');
      const variant = priceVariant(target?.querySelector('img'))?.[1];
      const iv = [...(target?.querySelectorAll('small span') ?? [])]
        .map(el => el.textContent.trim().match(/^IV\s+(\d+)\/186$/)).find(Boolean);
      const total = Number(iv?.[1]);
      const id = row.dataset.histDetail;
      const at = Date.parse(row.querySelector('time')?.dateTime);
      const value = row.querySelector('.mk-history-value .mk-coin-n, .mk-history-value .mk-gem-n');
      const amount = readPriceAmount(value?.title || value?.textContent);
      if (!id || !variant || !Number.isFinite(at) || !amount || !Number.isInteger(total) || total > IV_MAX_TOTAL) return null;
      const level = [...target.querySelectorAll('small span')].map(readPriceLevel).find(Boolean) ?? 0;
      const detail = row.nextElementSibling;
      const ivs = detail?.matches('.mk-history-detail') ? readIVs(detail.querySelector('.mk-ivs')) : null;
      const currency = value.matches('.mk-coin-n') ? 'money' : 'gems';
      return { id, variant, at, amount, currency, total, level, ...(priceIVTotal(ivs) === total ? { ivs } : {}) };
    }

    function priceBookIdentity(variant) {
      const dex = Number(variant.match(/^\d+/)?.[0]);
      const shiny = variant.endsWith('s');
      const form = shiny ? variant.slice(0, -1) : variant;
      const species = MARKET_GUIDE.species[dex]?.name ?? `Pokémon #${dex}`;
      const name = MARKET_GUIDE.profiles[form]?.name ?? (form.includes('-')
        ? `${species} (${form.split('-').slice(1).join(' ')})` : species);
      return { dex, name, form: shiny ? 'Shiny' : form.includes('-') ? 'Forma especial' : 'Normal' };
    }

    function priceBookSnapshotSample(snapshot, { min, max, currency }) {
      return snapshot.offers.flatMap(offer => {
        const amount = currency === 'gems' ? offer.gems : offer.price;
        return amount && offer.total >= min && offer.total <= max ? [amount] : [];
      });
    }

    function priceBookGroups(records, kind, filters) {
      const groups = new Map();
      for (const record of records) {
        if (!groups.has(record.variant)) groups.set(record.variant, []);
        groups.get(record.variant).push(record);
      }
      return [...groups].flatMap(([variant, group]) => {
        group.sort((a, b) => b.at - a.at);
        const sales = kind === 'sales';
        const observations = sales
          ? group.filter(({ total, currency }) => total >= filters.min && total <= filters.max && currency === filters.currency)
          : group;
        let latest = observations[0];
        let sample = [];
        if (sales) sample = observations.map(sale => sale.amount);
        else {
          for (const observation of observations) {
            sample = priceBookSnapshotSample(observation, filters);
            if (!sample.length) continue;
            latest = observation;
            break;
          }
        }
        if (!sample.length) return [];
        return [{
          variant, ...priceBookIdentity(variant), at: latest.at, count: sample.length,
          summary: summarizePrice(sample), observations,
        }];
      });
    }

    // ==== src/market/price-panel.js ====
    // Painel do comparador. O mesmo nó é recolocado quando o jogo redesenha o anúncio.
    const pricePanel = document.createElement('section');
    pricePanel.className = 'pafk-price';
    pricePanel.dataset.pafk = '';
    pricePanel.setAttribute('aria-labelledby', 'pafk-price-title');
    pricePanel.innerHTML = `
      <h4 id="pafk-price-title">Comparar preços</h4>
      <p data-price-target></p>
      <details data-price-filters>
        <summary>Filtros de IV</summary>
        <label class="pafk-price-total">IV total mínimo <input type="number" min="0" max="186" step="1" data-price-total></label>
        <fieldset>
          <legend>IV mínimo por atributo</legend>
          <div class="pafk-price-stats">
            ${STATS.map(([stat, label, short]) => `
              <div>
                <label title="${label}"><input type="checkbox" data-price-stat="${stat}"> ${short}</label>
                <input type="number" min="0" max="31" step="1" aria-label="IV mínimo de ${label}" data-price-min="${stat}">
              </div>`).join('')}
          </div>
        </fieldset>
        <button type="button" class="pafk-price-link" data-price-reset>Restaurar filtros sugeridos</button>
      </details>
      <p class="pafk-price-muted" data-price-criteria></p>
      <button type="button" class="mk-btn mk-pri pafk-price-action" data-price-search>Buscar comparáveis</button>
      <p class="pafk-price-muted" data-price-status role="status"></p>
      <button type="button" class="pafk-price-link" data-price-old hidden>Ver consulta anterior</button>
      <div class="pafk-price-result" data-price-result hidden>
        <div class="pafk-price-estimate">
          <span>Preço aproximado</span>
          <strong data-price-estimate></strong>
          <small data-price-range></small>
          <small data-price-gap hidden></small>
        </div>
        <button type="button" class="mk-btn mk-ghost pafk-price-action" data-price-use>Preencher preço em ₽</button>
        <button type="button" class="pafk-price-link" data-price-use-gems hidden></button>
        <details data-price-comparables>
          <summary></summary>
          <ul></ul>
        </details>
      </div>
      <div class="pafk-price-estimate" data-price-sales hidden>
        <span>Vendas na base por IV total</span>
        <b></b><small></small>
      </div>`;

    const priceSearchButton = pricePanel.querySelector('[data-price-search]');
    const priceTotalInput = pricePanel.querySelector('[data-price-total]');
    const priceStatFields = new Map(STATS.map(([stat, , label]) => [stat, {
      label,
      check: pricePanel.querySelector(`[data-price-stat="${stat}"]`),
      input: pricePanel.querySelector(`[data-price-min="${stat}"]`),
    }]));
    const priceResult = pricePanel.querySelector('[data-price-result]');
    const priceComparables = pricePanel.querySelector('[data-price-comparables]');
    const priceUse = pricePanel.querySelector('[data-price-use]');
    const priceUseGems = pricePanel.querySelector('[data-price-use-gems]');
    const priceOld = pricePanel.querySelector('[data-price-old]');
    const priceStatus = pricePanel.querySelector('[data-price-status]');
    const priceSales = pricePanel.querySelector('[data-price-sales]');

    function setPriceCriteria(target) {
      const { total, minimums } = defaultPriceCriteria(target);
      priceTotalInput.value = total;
      for (const [stat, { check, input }] of priceStatFields) {
        check.checked = minimums.has(stat);
        input.value = minimums.get(stat) ?? target.ivs[stat];
      }
    }

    function priceInputNumber(input) {
      return Math.min(Number(input.max), Math.max(0, Math.round(input.valueAsNumber || 0)));
    }

    function getPriceCriteria() {
      return {
        total: priceInputNumber(priceTotalInput),
        minimums: new Map([...priceStatFields].flatMap(([stat, { check, input }]) =>
          check.checked && input.value !== '' ? [[stat, priceInputNumber(input)]] : [])),
      };
    }

    const formatPriceMoney = amount => `₽${priceNumber.format(amount)}`;

    function formatPriceComparable(offer, criteria) {
      const row = document.createElement('li');
      const strong = document.createElement('b');
      strong.textContent = formatPriceMoney(offer.price);
      const iv = document.createElement('span');
      iv.textContent = [
        `IV ${offer.total}/${IV_MAX_TOTAL}`,
        ...[...criteria.minimums].map(([stat]) => `${priceStatFields.get(stat).label} ${offer.ivs[stat]}`),
      ].join(' · ');
      const detail = document.createElement('small');
      detail.textContent = [
        offer.level && `Nv. ${offer.level}`,
        offer.nature,
        offer.gems && `${priceNumber.format(offer.gems)} diam.`,
      ].filter(Boolean).join(' · ');
      row.append(strong, iv, detail);
      return row;
    }

    function showPriceComparison(state) {
      const { target, snapshot, previous, error, applied } = state;
      const criteria = getPriceCriteria();
      for (const { check, input } of priceStatFields.values()) input.disabled = !check.checked;
      const { count, sample } = nearestPriceOffers(snapshot?.offers ?? [], target, criteria);
      const money = summarizePrice(sample.map(offer => offer.price));
      const gems = summarizePrice(sample.map(offer => offer.gems).filter(Boolean));
      state.money = money?.estimate;
      state.gems = gems?.estimate;
      const filters = [`IV total ≥ ${criteria.total}`, ...[...criteria.minimums].map(([stat, min]) =>
        `${priceStatFields.get(stat).label} ≥ ${min}`)];
      pricePanel.querySelector('[data-price-criteria]').textContent = filters.join(' · ');
      priceSearchButton.textContent = snapshot ? 'Consultar novamente' : 'Buscar comparáveis';
      priceOld.hidden = !previous || previous === snapshot || count > 0 ||
        !nearestPriceOffers(previous.offers, target, criteria).count;
      priceResult.hidden = !money;
      const messages = [error];
      if (snapshot) {
        messages.push(snapshot.historical
          ? `Histórico local de ${priceDate.format(snapshot.at)}.`
          : `Consulta de ${priceDate.format(snapshot.at)}.`);
        if (snapshot.scoped) messages.push('Limpe os filtros do mercado para ampliar a busca.');
        if (!snapshot.offers.length) messages.push('Nenhum anúncio disponível para esta forma.');
        else if (!count) messages.push('Nenhum anúncio comparável. Você pode reduzir os mínimos de IV.');
        else messages.push(`${count} ${count === 1 ? 'anúncio atende' : 'anúncios atendem'} aos filtros.`);
      }
      if (applied) messages.push('Preço preenchido. Você pode editá-lo no anúncio.');
      priceStatus.textContent = messages.filter(Boolean).join(' ');
      showPriceSales(state, criteria.total);
      if (!money) return;

      pricePanel.querySelector('[data-price-estimate]').textContent = `≈ ${formatPriceMoney(money.estimate)}`;
      pricePanel.querySelector('[data-price-range]').textContent = sample.length > 1
        ? `Preços pedidos de ${formatPriceMoney(money.min)} a ${formatPriceMoney(money.max)}${sample.length < 3 ? ' · amostra pequena' : ''}`
        : 'Preço pedido em um único anúncio';
      const gap = sample[0].total - target.total;
      const gapNote = pricePanel.querySelector('[data-price-gap]');
      gapNote.hidden = Math.abs(gap) <= 5;
      if (!gapNote.hidden) {
        gapNote.textContent = `O mais próximo tem IV ${sample[0].total}/186 (${gap > 0 ? '+' : '−'}${Math.abs(gap)}).`;
      }
      priceUseGems.hidden = !gems;
      if (gems) priceUseGems.textContent = `Preencher ≈ ${priceNumber.format(gems.estimate)} diam.`;
      priceComparables.querySelector('summary').textContent = sample.length === 1
        ? '1 anúncio comparável' : `${sample.length} anúncios mais próximos`;
      priceComparables.querySelector('ul').replaceChildren(...sample.map(offer => formatPriceComparable(offer, criteria)));
    }

    function showPriceSales({ target, sales }, minimum) {
      const min = Math.max(0, minimum, target.total - 10);
      const max = Math.min(IV_MAX_TOTAL, target.total + 10);
      const close = (sales ?? []).filter(sale => sale.total >= min && sale.total <= max);
      priceSales.hidden = !close.length;
      if (priceSales.hidden) return;
      const money = summarizePrice(close.filter(sale => sale.currency === 'money').map(sale => sale.amount));
      const gems = summarizePrice(close.filter(sale => sale.currency === 'gems').map(sale => sale.amount));
      priceSales.querySelector('b').textContent = [
        money && `≈ ${formatPriceMoney(money.estimate)}`,
        gems && `≈ ${priceNumber.format(gems.estimate)} diam.`,
      ].filter(Boolean).join(' · ');
      priceSales.querySelector('small').textContent =
        `${close.length} ${close.length === 1 ? 'venda' : 'vendas'} · IV ${min}–${max}/186 · últimos 30 dias`;
    }

    function showPriceTarget(target) {
      const percent = Math.round(target.total / IV_MAX_TOTAL * 100);
      pricePanel.querySelector('[data-price-target]').textContent =
        `${target.name} · IV ${target.total}/${IV_MAX_TOTAL} (${percent}%)`;
      pricePanel.querySelector('[data-price-filters]').open = false;
      priceComparables.open = false;
      setPriceCriteria(target);
    }

    function installPriceStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .mk .pafk-price, .mk .pafk-price-wait {
          display:grid; gap:8px; padding:11px; border:1px solid #bfd7fa; border-radius:12px;
          background:#f5f9ff; color:#152a61; font-size:12px; line-height:1.4;
          font-variant-numeric:tabular-nums;
        }
        .mk .pafk-price { margin:0 0 12px; min-width:0; }
        .mk .pafk-price-wait { margin:0 0 10px; grid-template-columns:1fr auto; align-items:center; }
        .mk .pafk-price [hidden] { display:none !important; }
        .mk .pafk-price h4, .mk .pafk-price p { margin:0; }
        .mk .pafk-price h4 { font-size:14px; text-wrap:balance; }
        .mk .pafk-price [data-price-target] { font-weight:700; }
        .mk .pafk-price-muted, .mk .pafk-price small { color:#425b85; }
        .mk .pafk-price [data-price-status]:empty { display:none; }
        .mk .pafk-price details { border-top:1px solid #d5e3f7; }
        .mk .pafk-price summary { cursor:pointer; padding:8px 0 2px; color:#1556b4; font-weight:750; }
        .mk .pafk-price fieldset { margin:8px 0 4px; padding:0; border:0; min-width:0; }
        .mk .pafk-price legend { margin-bottom:4px; padding:0; }
        .mk .pafk-price-total { display:flex; align-items:center; justify-content:space-between; gap:6px; margin-top:7px; }
        .mk .pafk-price-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:5px; }
        .mk .pafk-price-stats label { display:flex; align-items:center; gap:3px; white-space:nowrap; cursor:pointer; }
        .mk .pafk-price input[type="checkbox"] { flex:none; margin:0; accent-color:#1556b4; }
        .mk[data-page="create"] .pafk-price input[type="number"] {
          box-sizing:border-box; width:100%; min-width:0; min-height:29px; padding:2px 4px;
          border:1px solid #a9c6ee; border-radius:6px; background:#fff; color:#152a61; font:inherit;
        }
        .mk .pafk-price-total input { width:64px !important; }
        .mk[data-page="create"] .pafk-price input[type="number"]:disabled {
          color:#4b6082; background:#eaf0fa; opacity:1;
        }
        .mk[data-page="create"] .pafk-price button.pafk-price-action {
          width:100%; min-height:40px; font-size:12px; white-space:normal;
        }
        .mk .pafk-price-link {
          justify-self:start; color:#1556b4; font:inherit; font-weight:750; background:none;
          border:0; padding:4px 0; cursor:pointer; text-decoration:underline;
        }
        .mk .pafk-price :is(button, input, summary):focus-visible, .mk .pafk-price-wait button:focus-visible {
          outline:2px solid #1556b4; outline-offset:2px;
        }
        .mk .pafk-price-result { display:grid; gap:7px; }
        .mk .pafk-price-estimate {
          display:grid; gap:1px; padding:8px; border:1px solid #c9ddf7; border-radius:8px; background:#eaf3ff;
        }
        .mk .pafk-price-estimate strong { font-size:19px; line-height:1.2; overflow-wrap:anywhere; }
        .mk .pafk-price ul { margin:5px 0 0; padding:0; list-style:none; }
        .mk .pafk-price li { display:grid; gap:1px; padding:5px 0; border-bottom:1px solid #d5e3f7; }
        .mk .pafk-price li:last-child { border-bottom:0; }
      `;
      document.head.append(style);
    }

    // ==== src/market/price-search.js ====
    // Abre a própria página de ofertas do jogo, lê os anúncios e volta ao mesmo rascunho.
    const priceWait = document.createElement('section');
    priceWait.className = 'pafk-price-wait';
    priceWait.dataset.pafk = '';
    priceWait.innerHTML = `
      <span role="status">Consultando anúncios no mercado…</span>
      <button type="button" class="mk-btn mk-ghost">Voltar ao anúncio</button>`;

    let priceState = null;
    let priceLookup = null;
    let priceStylesInstalled = false;
    let priceBrowseFilters = false;
    let priceBrowseQuery = '';

    function syncPriceComparison(main) {
      if (!main) {
        pricePanel.remove();
        priceWait.remove();
        priceLookup = null;
        priceState = null;
        return;
      }
      const page = main.parentElement.dataset.page;
      if (page === 'mons') {
        const region = main.querySelector('[data-dd="region"] span');
        const type = main.querySelector('[data-dd="mon-type"] span');
        priceBrowseQuery = priceBookText(main.querySelector('[data-mon-q]')?.value ?? '');
        priceBrowseFilters = Boolean((region && region.textContent.trim() !== 'Todas as regiões') ||
          (type && type.textContent.trim() !== 'Todos'));
      }
      if (priceLookup && priceSpeciesDex(main) === priceLookup.state.target.dex) {
        if (main.firstElementChild !== priceWait) main.prepend(priceWait);
      } else {
        priceWait.remove();
      }

      const field = main.querySelector('.mk-conf [data-price]')?.closest('.mk-field');
      const target = field && readPriceTarget(main);
      if (!target) {
        pricePanel.remove();
        return;
      }
      if (!priceStylesInstalled) {
        installPriceStyles();
        priceStylesInstalled = true;
      }
      if (priceState?.target.key !== target.key) {
        const cached = readPriceHistory().find(entry => entry.variant === target.variant);
        priceState = { target, snapshot: cached ? { ...cached, historical: true } : null };
        showPriceTarget(target);
        showPriceComparison(priceState);
      }
      if (field.previousElementSibling !== pricePanel) field.before(pricePanel);
      loadPriceBookComparison(priceState);
    }

    // Os botões nativos de navegação usam delegação na raiz .mk.
    function navigatePriceMarket(main, key, value) {
      const action = document.createElement('button');
      action.type = 'button';
      action.dataset[key] = value;
      action.dataset.pafk = '';
      action.hidden = true;
      main.append(action);
      action.click();
      action.remove();
    }

    function priceSpeciesDex(main) {
      if (main?.parentElement.dataset.page !== 'species') return null;
      return Number(main.querySelector('.mk-dexno')?.textContent.trim().slice(1)) || null;
    }

    function speciesPriceTotal(main, dex) {
      if (priceSpeciesDex(main) !== dex) return null;
      const text = main.querySelector('.mk-stat-total b')?.textContent.trim();
      return text === '0' ? 0 : readPriceAmount(text);
    }

    function nativePriceFilters(main) {
      const side = main.parentElement.querySelector('.mk-side');
      const name = priceBookText(main.querySelector('.mk-spec-name h2')?.textContent ?? '');
      return priceBrowseFilters || (priceBrowseQuery && !name.includes(priceBrowseQuery)) || Boolean(side?.querySelector(
        '[data-rar][aria-pressed="true"], [data-tier][aria-pressed="true"], ' +
        '[data-favs-only][aria-pressed="true"], [data-cur]:not([data-cur="all"])[aria-pressed="true"]',
      )) || [...(side?.querySelectorAll('[data-range]') ?? [])].some(input => readPriceAmount(input.value));
    }

    function readSpeciesPriceSnapshot(main, total) {
      const { variants, rowCount } = readPriceOffers(main);
      return { at: Date.now(), variants, scoped: rowCount !== total || Boolean(nativePriceFilters(main)) };
    }

    function loadPriceBookComparison(state) {
      const revision = priceBookRevision;
      if (state.bookRevision === revision) return;
      state.bookRevision = revision;
      const now = Date.now();
      const { variant } = state.target;
      Promise.all([
        readPriceBook('sales', now - 30 * PRICE_BOOK_DAY, variant),
        readPriceBook('asks', now - PRICE_HISTORY_AGE, variant),
      ]).then(([sales, asks]) => {
        if (priceState !== state || state.bookRevision !== revision) return;
        state.sales = sales;
        const latest = asks.reduce((a, b) => !a || b.at > a.at ? b : a, null);
        if (latest && (!state.snapshot || (state.snapshot.historical && latest.at > state.snapshot.at))) {
          state.snapshot = { ...latest, historical: true };
        }
        if (pricePanel.isConnected) showPriceComparison(state);
      }).catch(() => {
        // O preço do anúncio pode ser consultado normalmente sem armazenamento local.
      });
    }

    async function returnToPriceDraft(job) {
      const main = marketMain();
      if (priceLookup !== job || priceSpeciesDex(main) !== job.state.target.dex) return;
      navigatePriceMarket(main, 'go', 'create');
      await waitFor(() => priceLookup !== job ||
        readPriceTarget(marketMain())?.key === job.state.target.key, 2000);
      if (priceLookup !== job) return;
      priceLookup = null;
      const draft = marketMain();
      if (readPriceTarget(draft)?.key !== job.state.target.key) return;
      syncPriceComparison(draft);
      showPriceComparison(job.state);
      draft.scrollTop = job.scroll;
      const list = draft.querySelector('.mk-owns');
      if (list) list.scrollTop = job.listScroll;
      priceSearchButton.focus({ preventScroll: true });
    }

    async function searchPriceOffers() {
      const main = marketMain();
      if (priceLookup || !priceState || !pricePanel.isConnected || !main) return;
      const job = {
        state: priceState, scroll: main.scrollTop, listScroll: main.querySelector('.mk-owns')?.scrollTop ?? 0,
      };
      const { state } = job;
      const { target } = state;
      priceLookup = job;
      state.error = '';
      state.applied = false;
      navigatePriceMarket(main, 'species', String(target.dex));
      await waitFor(() => {
        const current = marketMain();
        const dex = priceSpeciesDex(current);
        return priceLookup !== job || !current ||
          !['create', 'species'].includes(current.parentElement.dataset.page) ||
          (dex !== null && dex !== target.dex) ||
          speciesPriceTotal(current, target.dex) !== null;
      });
      if (priceLookup !== job) return;
      const current = marketMain();
      const total = speciesPriceTotal(current, target.dex);
      if (total === null) {
        state.error = 'O mercado não carregou os anúncios. Tente consultar novamente.';
      } else {
        const { at, variants, scoped } = readSpeciesPriceSnapshot(current, total);
        if (state.snapshot && !state.snapshot.scoped) {
          state.previous = state.snapshot.historical ? state.snapshot : { ...state.snapshot, historical: true };
        }
        state.snapshot = { at, offers: variants.get(target.variant) ?? [], scoped };
        if (!scoped) {
          const snapshot = state.snapshot;
          recordPriceBookAsks(variants, at).then(ok => {
            if (!ok) savePriceHistoryFallback(target.variant, snapshot);
          });
        }
      }
      if (priceSpeciesDex(current) === target.dex) {
        await returnToPriceDraft(job);
      } else if (priceState === state && pricePanel.isConnected) {
        showPriceComparison(state);
      }
      if (priceLookup === job) priceLookup = null;
    }

    function applyPriceEstimate(gems) {
      const main = marketMain();
      if (readPriceTarget(main)?.key !== priceState?.target.key || !priceState) return;
      const amount = gems ? priceState.gems : priceState.money;
      const input = main.querySelector(gems ? '.mk-conf [data-gems]' : '.mk-conf [data-price]');
      if (!amount || !input) return;
      input.value = String(amount);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      priceState.applied = true;
      showPriceComparison(priceState);
      input.focus();
    }

    priceSearchButton.onclick = searchPriceOffers;
    priceWait.querySelector('button').onclick = event => {
      event.stopPropagation();
      const job = priceLookup;
      if (!job) return;
      // Troca a identidade para invalidar a consulta ainda em espera.
      priceLookup = { ...job };
      returnToPriceDraft(priceLookup);
    };
    priceUse.onclick = () => applyPriceEstimate(false);
    priceUseGems.onclick = () => applyPriceEstimate(true);
    priceOld.onclick = () => {
      priceState.snapshot = priceState.previous;
      priceState.applied = false;
      showPriceComparison(priceState);
    };
    pricePanel.querySelector('[data-price-reset]').onclick = () => {
      setPriceCriteria(priceState.target);
      priceState.applied = false;
      showPriceComparison(priceState);
    };
    pricePanel.addEventListener('click', event => event.stopPropagation());
    pricePanel.addEventListener('input', () => {
      priceState.applied = false;
      showPriceComparison(priceState);
    });
    pricePanel.addEventListener('change', ({ target }) => {
      if (target.matches('input[type="number"]') && target.value !== '') target.value = priceInputNumber(target);
    });

    // ==== src/market/price-book.js ====
    // Consulta e coleta passiva das páginas de mercado que o jogador abriu.
    const priceBookTrigger = document.createElement('button');
    priceBookTrigger.type = 'button';
    priceBookTrigger.className = 'mk-nav';
    priceBookTrigger.dataset.pafk = '';
    priceBookTrigger.textContent = 'Base de preços';
    priceBookTrigger.setAttribute('aria-haspopup', 'dialog');

    const priceBookDialog = document.createElement('dialog');
    priceBookDialog.className = 'pafk-book';
    priceBookDialog.dataset.pafk = '';
    priceBookDialog.setAttribute('aria-labelledby', 'pafk-book-title');
    priceBookDialog.innerHTML = `
      <header class="pafk-book-head">
        <h2 id="pafk-book-title">Base de preços</h2>
        <button type="button" data-book-close aria-label="Fechar base de preços">✕</button>
      </header>
      <div class="pafk-book-body">
        <div class="pafk-book-tabs" role="group" aria-label="Origem dos preços">
          <button type="button" data-book-source="sales" aria-pressed="true">Vendas concluídas</button>
          <button type="button" data-book-source="asks" aria-pressed="false">Preços anunciados</button>
        </div>
        <div class="pafk-book-controls">
          <label>Pokémon <input type="search" data-book-query placeholder="Buscar espécie ou nº da Pokédex"></label>
          <label>Moeda <select data-book-currency aria-label="Moeda"><option value="money">₽</option><option value="gems">Diamantes</option></select></label>
          <label>Período <select data-book-days aria-label="Período"><option value="7">7 dias</option><option value="30" selected>30 dias</option>
            <option value="90">90 dias</option><option value="0">Todo o período</option></select></label>
          <label>IV mínimo <input type="number" min="0" max="186" step="1" placeholder="0" data-book-min></label>
          <label>IV máximo <input type="number" min="0" max="186" step="1" placeholder="186" data-book-max></label>
        </div>
        <p class="pafk-book-muted" data-book-status role="status"></p>
        <div class="pafk-book-content" data-book-content hidden>
          <div class="pafk-book-scroll" tabindex="0" aria-label="Tabela de preços">
            <table>
              <thead><tr><th scope="col">Pokémon</th><th scope="col">Mediana</th><th scope="col">Faixa observada</th>
                <th scope="col">Amostra</th><th scope="col">Mais recente</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
          <section class="pafk-book-detail" aria-labelledby="pafk-book-detail-title" hidden>
            <h3 id="pafk-book-detail-title"></h3>
            <p class="pafk-book-muted"></p>
            <ul></ul>
            <button type="button" data-book-species>Ver anúncios da espécie</button>
          </section>
        </div>
      </div>
      <footer class="pafk-book-footer">
        <span>Registros salvos neste navegador.</span>
        <button type="button" data-book-open-history>Ver histórico do jogo</button>
        <button type="button" data-book-open-mons>Explorar Pokémon à venda</button>
      </footer>`;

    const bookStatus = priceBookDialog.querySelector('[data-book-status]');
    const bookQuery = priceBookDialog.querySelector('[data-book-query]');
    const bookCurrency = priceBookDialog.querySelector('[data-book-currency]');
    const bookDays = priceBookDialog.querySelector('[data-book-days]');
    const bookMin = priceBookDialog.querySelector('[data-book-min]');
    const bookMax = priceBookDialog.querySelector('[data-book-max]');
    const bookContent = priceBookDialog.querySelector('[data-book-content]');
    const bookBody = priceBookDialog.querySelector('tbody');
    const bookDetail = priceBookDialog.querySelector('.pafk-book-detail');
    const bookSources = [...priceBookDialog.querySelectorAll('[data-book-source]')];
    let bookSource = 'sales';
    let bookRecords = [];
    let bookSelection = null;
    let bookRequest = 0;
    let bookLoading = false;
    let bookError = false;
    let bookWriteError = false;
    const observedBookSpecies = new WeakSet();
    const observedBookHistory = new WeakSet();
    const observedBookSales = new Map();
    const observedBookAsks = new Map();

    function recordPriceBook(kind, records) {
      return writePriceBook(kind, records).then(changed => {
        bookWriteError = false;
        if (changed && pricePanel.isConnected && priceState) loadPriceBookComparison(priceState);
        if (changed && priceBookDialog.open && kind === bookSource) refreshPriceBook();
        return true;
      }).catch(() => {
        bookWriteError = true;
        if (priceBookDialog.open) renderPriceBook();
        return false;
      });
    }

    function recordPriceBookAsks(variants, at) {
      const records = [];
      for (const [variant, offers] of variants) {
        const snapshot = priceBookAsks(variant, at, offers);
        const signature = `${snapshot.id[1]}|${offers.map(offer => JSON.stringify(offer)).sort().join('|')}`;
        if (observedBookAsks.get(variant) === signature) continue;
        observedBookAsks.set(variant, signature);
        records.push(snapshot);
      }
      return recordPriceBook('asks', records).then(ok => {
        if (!ok) for (const { variant } of records) observedBookAsks.delete(variant);
        return ok;
      });
    }

    function capturePriceBookSales(main) {
      const table = main.querySelector('.mk-history-table');
      if (!table) return;
      const repeated = observedBookHistory.has(table);
      observedBookHistory.add(table);
      const selector = repeated ? '[data-hist-detail^="general:"][aria-expanded="true"]' : '[data-hist-detail^="general:"]';
      const records = [...table.querySelectorAll(selector)].flatMap(row => {
        const seen = observedBookSales.get(row.dataset.histDetail);
        if (seen === true || (seen === false && row.getAttribute('aria-expanded') !== 'true')) return [];
        const sale = readPriceSale(row);
        if (!sale || (seen === false && !sale.ivs)) return [];
        observedBookSales.set(sale.id, Boolean(sale.ivs));
        return [sale];
      });
      if (records.length) recordPriceBook('sales', records).then(ok => {
        if (!ok) for (const { id } of records) observedBookSales.delete(id);
      });
    }

    function syncPriceBook(main) {
      if (!main) {
        if (priceBookDialog.open) priceBookDialog.close();
        return;
      }
      const nav = main.parentElement.querySelector('.mk-side .mk-navs');
      if (nav && priceBookTrigger.parentElement !== nav) nav.append(priceBookTrigger);
      const page = main.parentElement.dataset.page;
      if (page === 'history') capturePriceBookSales(main);
      if (page !== 'species' || priceLookup) return;
      const list = main.querySelector(OFFER_LIST);
      const total = speciesPriceTotal(main, priceSpeciesDex(main));
      if (!list || !total || observedBookSpecies.has(list)) return;
      observedBookSpecies.add(list);
      const { variants, at, scoped } = readSpeciesPriceSnapshot(main, total);
      if (!scoped) recordPriceBookAsks(variants, at);
    }

    function bookAmount(amount, currency) {
      return currency === 'money' ? formatPriceMoney(amount) : `${priceNumber.format(amount)} diam.`;
    }

    function bookRange({ min, max }, currency) {
      return min === max ? bookAmount(min, currency) : `${bookAmount(min, currency)} a ${bookAmount(max, currency)}`;
    }

    function bookFilters() {
      return {
        currency: bookCurrency.value,
        min: bookMin.value === '' ? 0 : priceInputNumber(bookMin),
        max: bookMax.value === '' ? IV_MAX_TOTAL : priceInputNumber(bookMax),
      };
    }

    function bookDetailRows(group, filters) {
      const sales = bookSource === 'sales';
      return group.observations.flatMap(observation => {
        if (sales) {
          const stats = observation.ivs && STATS.map(([stat, , label]) => `${label} ${observation.ivs[stat]}`).join(' ');
          return [{
            at: observation.at,
            amount: bookAmount(observation.amount, filters.currency),
            detail: [`IV ${observation.total}/186`, observation.level && `Nv. ${observation.level}`, stats]
              .filter(Boolean).join(' · '),
          }];
        }
        const sample = priceBookSnapshotSample(observation, filters);
        const summary = summarizePrice(sample);
        return summary ? [{
          at: observation.at,
          amount: `≈ ${bookAmount(summary.estimate, filters.currency)}`,
          detail: `${sample.length} ${sample.length === 1 ? 'anúncio' : 'anúncios'} · ${bookRange(summary, filters.currency)}`,
        }] : [];
      });
    }

    function renderBookDetail(group, filters) {
      bookDetail.hidden = !group;
      bookContent.classList.toggle('pafk-book-has-detail', Boolean(group));
      if (!group) return;
      const rows = bookDetailRows(group, filters);
      const visible = rows.slice(0, 12);
      bookDetail.querySelector('h3').textContent = `${group.name} · ${group.form}`;
      bookDetail.querySelector('p').textContent = bookSource === 'sales'
        ? `${visible.length} de ${rows.length} vendas na faixa de IV.`
        : `${visible.length} de ${rows.length} dias com anúncios na faixa de IV.`;
      bookDetail.querySelector('ul').replaceChildren(...visible.map(row => {
        const item = document.createElement('li');
        const amount = document.createElement('b');
        amount.textContent = row.amount;
        const date = document.createElement('time');
        date.dateTime = new Date(row.at).toISOString();
        date.textContent = priceDate.format(row.at);
        const detail = document.createElement('small');
        detail.textContent = row.detail;
        item.append(amount, date, detail);
        return item;
      }));
      bookDetail.querySelector('[data-book-species]').dataset.dex = group.dex;
    }

    function renderPriceBook() {
      if (!priceBookDialog.open) return;
      const filters = bookFilters();
      const query = priceBookText(bookQuery.value);
      let message = '';
      let groups = [];
      if (bookLoading) message = 'Carregando a base de preços…';
      else if (bookError) message = 'A base local está indisponível. Feche e abra de novo para tentar novamente.';
      else if (filters.min > filters.max) message = 'O IV mínimo deve ser menor ou igual ao máximo.';
      else {
        groups = priceBookGroups(bookRecords, bookSource, filters)
          .filter(group => priceBookText(`${group.name} ${group.form} #${group.dex}`).includes(query))
          .sort((a, b) => b.at - a.at || a.name.localeCompare(b.name, 'pt-BR'));
        if (groups.length) {
          const scope = bookSource === 'sales'
            ? 'Valores pagos no histórico público.'
            : 'Preços pedidos na consulta mais recente que atende aos filtros.';
          message = `${groups.length} ${groups.length === 1 ? 'forma encontrada' : 'formas encontradas'}. ${scope}`;
        } else if (bookRecords.length) message = 'Nenhum preço encontrado com esses filtros.';
        else message = bookSource === 'sales'
          ? 'Abra o histórico do jogo para registrar as vendas exibidas.'
          : 'Abra a página de uma espécie para registrar os anúncios exibidos.';
      }
      bookStatus.textContent = bookWriteError ? `${message} Não foi possível salvar a última leitura.` : message;
      bookContent.hidden = !groups.length;
      renderBookDetail(groups.find(group => group.variant === bookSelection), filters);
      bookBody.replaceChildren(...groups.map(group => {
        const row = document.createElement('tr');
        row.classList.toggle('pafk-book-selected', group.variant === bookSelection);
        const species = document.createElement('button');
        species.type = 'button';
        species.className = 'pafk-book-name';
        species.dataset.bookVariant = group.variant;
        species.setAttribute('aria-expanded', String(group.variant === bookSelection));
        const sprite = document.createElement('img');
        sprite.src = `/assets/mon/front/${group.variant}.png`;
        sprite.alt = '';
        sprite.loading = 'lazy';
        const identity = document.createElement('span');
        const name = document.createElement('b');
        name.textContent = group.name;
        const form = document.createElement('small');
        form.textContent = group.form;
        identity.append(name, form);
        species.append(sprite, identity);
        row.insertCell().append(species);
        row.insertCell().textContent = `≈ ${bookAmount(group.summary.estimate, filters.currency)}`;
        row.insertCell().textContent = bookRange(group.summary, filters.currency);
        const sample = row.insertCell();
        sample.textContent = priceNumber.format(group.count);
        if (group.count < 3) {
          const small = document.createElement('small');
          small.textContent = 'Poucos dados';
          sample.append(small);
        }
        row.insertCell().textContent = priceDate.format(group.at);
        return row;
      }));
    }

    async function refreshPriceBook() {
      const request = ++bookRequest;
      const days = Number(bookDays.value);
      bookLoading = true;
      renderPriceBook();
      try {
        const records = await readPriceBook(bookSource, days ? Date.now() - days * PRICE_BOOK_DAY : 0);
        if (request !== bookRequest) return;
        bookRecords = records;
        bookError = false;
      } catch {
        if (request !== bookRequest) return;
        bookError = true;
      } finally {
        if (request === bookRequest) {
          bookLoading = false;
          renderPriceBook();
        }
      }
    }

    function openPriceBookPage(key, value) {
      const main = marketMain();
      if (!main) return;
      priceBookDialog.close();
      navigatePriceMarket(main, key, value);
    }

    priceBookTrigger.onclick = event => {
      event.stopPropagation();
      if (!priceBookDialog.isConnected) {
        installPriceBookStyles();
        document.body.append(priceBookDialog);
      }
      if (priceBookDialog.open) return;
      priceBookDialog.showModal();
      bookQuery.focus();
      refreshPriceBook();
    };
    priceBookDialog.querySelector('[data-book-close]').onclick = () => priceBookDialog.close();
    priceBookDialog.querySelector('[data-book-open-history]').onclick = async () => {
      openPriceBookPage('go', 'history');
      await waitFor(() => marketMain()?.parentElement.dataset.page === 'history', 2000);
      const main = marketMain();
      if (main?.parentElement.dataset.page === 'history') {
        main.querySelector('[data-hist-scope="general"][aria-pressed="false"]')?.click();
      }
    };
    priceBookDialog.querySelector('[data-book-open-mons]').onclick = () => openPriceBookPage('go', 'mons');
    priceBookDialog.querySelector('[data-book-species]').onclick = ({ currentTarget }) =>
      openPriceBookPage('species', currentTarget.dataset.dex);
    priceBookDialog.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        priceBookDialog.close();
      }
    });
    priceBookDialog.addEventListener('close', () => {
      if (priceBookTrigger.isConnected) priceBookTrigger.focus();
    });
    for (const button of bookSources) button.onclick = () => {
      if (bookSource === button.dataset.bookSource) return;
      bookSource = button.dataset.bookSource;
      for (const tab of bookSources) tab.setAttribute('aria-pressed', String(tab === button));
      refreshPriceBook();
    };
    bookDays.onchange = refreshPriceBook;
    bookCurrency.onchange = renderPriceBook;
    bookQuery.oninput = bookMin.oninput = bookMax.oninput = renderPriceBook;
    for (const input of [bookMin, bookMax]) input.onchange = () => {
      if (input.value !== '') input.value = priceInputNumber(input);
      renderPriceBook();
    };
    bookBody.onclick = ({ target }) => {
      const button = target.closest('[data-book-variant]');
      if (!button) return;
      const { bookVariant } = button.dataset;
      bookSelection = bookVariant === bookSelection ? null : bookVariant;
      renderPriceBook();
      bookBody.querySelector(`[data-book-variant="${CSS.escape(bookVariant)}"]`)?.focus({ preventScroll: true });
      if (!bookDetail.hidden) bookDetail.scrollIntoView({ block: 'nearest' });
    };

    // ==== src/market/price-book-styles.js ====
    function installPriceBookStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .pafk-book {
          box-sizing:border-box; width:min(1060px, calc(100% - 24px)); max-width:none; max-height:calc(100% - 24px);
          padding:0; border:1px solid #b4ccef; border-radius:15px; color:#152a61; background:#f5f9ff;
          font:13px/1.45 system-ui, sans-serif; font-variant-numeric:tabular-nums;
          box-shadow:0 10px 28px #112f673d, 0 2px 6px #112f6730;
        }
        .pafk-book::backdrop { background:#071a499c; }
        .pafk-book [hidden] { display:none !important; }
        .pafk-book :is(h2,h3,p) { margin:0; }
        .pafk-book-head, .pafk-book-footer {
          display:flex; align-items:center; gap:8px; padding:12px 16px; background:#fff;
        }
        .pafk-book-head { justify-content:space-between; border-bottom:1px solid #d6e3f7; }
        .pafk-book-head h2 { font-size:21px; text-wrap:balance; }
        .pafk-book-footer { flex-wrap:wrap; border-top:1px solid #d6e3f7; }
        .pafk-book-footer span { flex:1 1 150px; color:#425b85; }
        .pafk-book-body { display:grid; gap:12px; padding:14px 16px; }
        .pafk-book-tabs { display:flex; flex-wrap:wrap; gap:6px; }
        .pafk-book button {
          min-height:40px; padding:6px 11px; border:1px solid #aac6ee; border-radius:8px;
          color:#1554ad; background:#fff; cursor:pointer; font:inherit; font-weight:700;
        }
        .pafk-book button:hover { background:#eaf3ff; }
        .pafk-book button[aria-pressed="true"] { color:#fff; background:#195cb5; border-color:#195cb5; }
        .pafk-book [data-book-close] { min-width:40px; font-size:16px; }
        .pafk-book :is(button,input,select,[tabindex]):focus-visible { outline:2px solid #1556b4; outline-offset:2px; }
        .pafk-book-controls { display:grid; grid-template-columns:minmax(185px, 2fr) repeat(4, minmax(95px, 1fr)); gap:8px; }
        .pafk-book-controls label { display:grid; gap:4px; min-width:0; color:#294378; font-size:12px; font-weight:700; }
        .pafk-book-controls :is(input,select) {
          box-sizing:border-box; width:100%; min-width:0; min-height:40px; padding:5px 8px;
          border:1px solid #aac6ee; border-radius:7px; background:#fff; color:#152a61; font:inherit;
        }
        .pafk-book-controls input::placeholder { color:#51668b; font-weight:400; opacity:1; }
        .pafk-book-muted { color:#425b85; text-wrap:pretty; }
        .pafk-book-content { display:grid; align-items:start; gap:12px; min-width:0; }
        .pafk-book-has-detail { grid-template-columns:minmax(0, 1fr) 252px; }
        .pafk-book-scroll, .pafk-book-detail {
          min-width:0; max-height:clamp(200px, 47vh, 474px); overflow:auto;
          border:1px solid #c9ddf7; border-radius:9px; background:#fff;
        }
        .pafk-book table { width:100%; border-collapse:separate; border-spacing:0; text-align:left; }
        .pafk-book :is(th,td) { border-bottom:1px solid #dce8f9; padding:6px 9px; white-space:nowrap; }
        .pafk-book th { position:sticky; top:0; z-index:1; background:#eaf3ff; color:#294378; font-size:12px; }
        .pafk-book tr:last-child td { border-bottom:0; }
        .pafk-book td:nth-child(2) { font-weight:750; }
        .pafk-book .pafk-book-name {
          display:flex; align-items:center; gap:6px; text-align:left; padding:0 4px;
          border:0; color:#152a61; background:transparent;
        }
        .pafk-book-name span, .pafk-book td small { display:block; }
        .pafk-book small { color:#425b85; font-size:11px; font-weight:400; }
        .pafk-book-name img { width:36px; height:36px; object-fit:contain; image-rendering:pixelated; }
        .pafk-book .pafk-book-name:hover b { text-decoration:underline; }
        .pafk-book tr.pafk-book-selected { background:#eaf3ff; }
        .pafk-book-detail { padding:10px; }
        .pafk-book-detail h3 { font-size:15px; }
        .pafk-book-detail ul { list-style:none; padding:0; margin:5px 0 10px; }
        .pafk-book-detail li {
          display:grid; grid-template-columns:1fr auto; gap:2px 5px; align-items:baseline;
          padding:5px 0; border-bottom:1px solid #dce8f9;
        }
        .pafk-book-detail time { font-size:10px; color:#425b85; }
        .pafk-book-detail small { grid-column:1 / -1; }
        @media (max-width:840px) {
          .pafk-book-has-detail { grid-template-columns:minmax(0, 1fr); }
        }
        @media (max-width:630px) {
          .pafk-book-head, .pafk-book-footer, .pafk-book-body { padding:10px; }
          .pafk-book-controls { grid-template-columns:repeat(2, minmax(0, 1fr)); }
          .pafk-book-controls label:first-child { grid-column:1 / -1; }
          .pafk-book-has-detail .pafk-book-scroll { max-height:220px; }
        }
      `;
      document.head.append(style);
    }

    // ==== src/tiers/nature-tips.js ====
    // Pedido do usuário: o nome da natureza nos cartões do jogo (PC `.pcx-nat`, troca `.t5-mini-nat`,
    // bolsa `.bag-nat`) tem só title="Natureza". O title passa a dizer o que ela faz.
    // Each element is handled once: the new title no longer matches the selector.
    function natureTip(nature) {
      const effect = NATURE_EFFECTS.get(nature);
      if (!effect) return '';
      if (effect.up === effect.down) return `Natureza ${nature}: neutra, não muda nenhum atributo`;
      return `Natureza ${nature}: +10% ${STAT_LABELS.get(effect.up)}, −10% ${STAT_LABELS.get(effect.down)}`;
    }

    function decorateNatures() {
      for (const element of document.querySelectorAll('[title="Natureza"]')) {
        const tip = natureTip(element.textContent.trim());
        if (tip) element.title = tip;
      }
    }

    // ==== src/tiers/pc-potential.js ====
    // Pedido do usuário (2026-11-23): o PC do jogo só filtra por IV total, e achar Pokémon com
    // potencial na caixa é difícil. Cada cartão do PC (`.t5-mon.pcx[data-pc]`) é lido do DOM e
    // comparado com a build da espécie no guia (forma final de referência, lista escolhida):
    //   - IV do ataque principal (o primeiro entre Atq e Atq. Esp. nos IVs prioritários) ≥ 28;
    //   - HP e Velocidade ≥ 25 (secundários, valem para todos);
    //   - classe de IV do jogo Tier 1 ou 2.
    // A natureza que aumenta o ataque principal não é exigida: só aparece como ponto positivo (em verde no cartão).
    // O botão "Potencial" na barra da caixa esconde os outros cartões da página aberta (o jogo
    // pagina de 40 em 40) e "Próxima com potencial" passa as páginas até achar um.
    const POT_MAIN_IV = PRIORITY_IV;
    const POT_SECONDARY_IV = 25;
    const POT_MAX_IV_TIER = 2;
    const POT_KEY = 'pokeafk-market-filtros:pc-potential';
    const POT_ATTR = 'data-pafk-pot';
    const POT_CARD = '.t5-pc [data-pc-zone] .t5-mon.pcx[data-pc]';
    const POT_BOX_CARD = '.t5-pc [data-pc-zone="box"] .t5-mon.pcx[data-pc]';
    const POT_IV_LABELS = { hp: 'HP', atk: 'ATQ', spa: 'AT.E', spe: 'VEL' };

    let potStylesInstalled = false;
    let potScan = null; // { status: 'running' | 'found' | 'end', text }

    class PotPageTimeout extends Error {}

    function readPotEnabled() {
      try {
        return localStorage.getItem(POT_KEY) === '1';
      } catch {
        return false;
      }
    }

    function savePotEnabled(on) {
      try {
        localStorage.setItem(POT_KEY, on ? '1' : '0');
      } catch {
        // Without storage the choice lasts until the page reloads.
      }
    }

    let potEnabled = readPotEnabled();

    // Reference build: the profile of the sprite's form (Megas) or the species' best final evolution.
    function potProfile(card, mode) {
      const src = card.querySelector('.pcx-spr')?.getAttribute('src') ?? '';
      const match = src.match(/\/assets\/mon\/front\/(\d+)(-[a-z-]+?)?s?\.png/);
      if (!match) return null;
      const form = match[2] ? MARKET_GUIDE?.profiles?.[`${match[1]}${match[2]}`] : null;
      if (form && rated(form, mode)) return form;
      return speciesRating(match[1], mode);
    }

    function mainAttackStat(profile, mode) {
      const first = profile[mode]?.priority?.find(stat => stat === 'atk' || stat === 'spa');
      if (first) return first;
      return profile.stats.atk >= profile.stats.spa ? 'atk' : 'spa';
    }

    function readPcCard(card) {
      const ivs = {};
      for (const cell of card.querySelectorAll('.pcx-ivc')) {
        const stat = STAT_KEYS.get(cell.querySelector('small')?.textContent.trim());
        const value = Number(cell.querySelector('b')?.textContent.trim());
        if (stat && Number.isFinite(value)) ivs[stat] = value;
      }
      const tier = Number(card.querySelector('.pcx-tier')?.textContent.match(/(\d)/)?.[1]);
      // In sale mode the card shows the price instead of the nature.
      const nature = card.querySelector('.pcx-nat')?.textContent.trim() || null;
      return { ivs, tier, nature };
    }

    function evaluatePotential(card, mode) {
      const profile = potProfile(card, mode);
      const { ivs, tier, nature } = readPcCard(card);
      if (!profile || !Number.isFinite(tier) || ['hp', 'atk', 'spa', 'spe'].some(stat => !(stat in ivs))) return null;
      const main = mainAttackStat(profile, mode);
      const checks = [
        { stat: main, need: POT_MAIN_IV },
        { stat: 'hp', need: POT_SECONDARY_IV },
        { stat: 'spe', need: POT_SECONDARY_IV },
      ].map(check => ({ ...check, value: ivs[check.stat], ok: ivs[check.stat] >= check.need }));
      const effect = nature ? NATURE_EFFECTS.get(nature) : null;
      let natureFit = null;
      if (effect && effect.up !== effect.down) {
        if (effect.up === main) natureFit = 'up';
        else if (effect.down === main) natureFit = 'down';
      }
      const ok = tier <= POT_MAX_IV_TIER && checks.every(check => check.ok);
      return { ok, profile, main, checks, tier, nature, natureFit };
    }

    function potTitle(result, mode) {
      const reference = result.profile.name;
      const parts = result.checks.map(({ stat, value, need, ok }) =>
        `${STAT_LABELS.get(stat)} ${value}/31 (mín. ${need}) ${ok ? '✓' : '✗'}`);
      parts.push(`classe de IV Tier ${result.tier} (até Tier ${POT_MAX_IV_TIER}) ${result.tier <= POT_MAX_IV_TIER ? '✓' : '✗'}`);
      let natureText = '';
      if (result.natureFit === 'up') natureText = `Natureza ${result.nature} aumenta ${STAT_LABELS.get(result.main)} (ponto positivo).`;
      else if (result.natureFit === 'down') natureText = `Natureza ${result.nature} reduz ${STAT_LABELS.get(result.main)}.`;
      const head = result.ok ? 'Potencial' : 'Sem potencial';
      return `${head} (${MODES[mode].title}, ${reference}: ataque principal ${STAT_LABELS.get(result.main)}). `
        + `${parts.join(' · ')}.${natureText ? ` ${natureText}` : ''}`;
    }

    function decoratePcCard(card, mode) {
      const stamp = `${mode}:`;
      if (card.getAttribute(POT_ATTR)?.startsWith(stamp)) return;
      card.querySelectorAll('.pafk-pot-iv').forEach(cell => cell.classList.remove('pafk-pot-iv'));
      card.querySelector('.pafk-pot-nat')?.classList.remove('pafk-pot-nat');
      // The game's own title is kept aside so a mode change does not stack two explanations.
      if (!card.hasAttribute('data-pafk-title')) card.setAttribute('data-pafk-title', card.title);
      card.title = card.getAttribute('data-pafk-title');
      const result = evaluatePotential(card, mode);
      if (!result) {
        card.setAttribute(POT_ATTR, `${stamp}unknown`);
        return;
      }
      card.setAttribute(POT_ATTR, `${stamp}${result.ok ? 'yes' : 'no'}`);
      if (!result.ok) return;
      const wanted = new Map(result.checks.map(check => [POT_IV_LABELS[check.stat], check]));
      for (const cell of card.querySelectorAll('.pcx-ivc')) {
        if (wanted.has(cell.querySelector('small')?.textContent.trim())) cell.classList.add('pafk-pot-iv');
      }
      // Pedido do usuário: nada em cima da foto. O motivo vai no title do cartão e a natureza que
      // aumenta o ataque principal fica em verde.
      card.title = `${card.getAttribute('data-pafk-title')} · ${potTitle(result, mode)}`;
      if (result.natureFit === 'up') card.querySelector('.pcx-nat')?.classList.add('pafk-pot-nat');
    }

    function boxPageCounts() {
      const cards = [...document.querySelectorAll(POT_BOX_CARD)];
      return { total: cards.length, found: cards.filter(card => card.getAttribute(POT_ATTR)?.endsWith(':yes')).length };
    }

    function potToolbar(tools, mode) {
      let bar = tools.querySelector(':scope > .pafk-pot');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'pafk-pot';
        bar.dataset.pafk = '';
        bar.innerHTML = `
          <button type="button" class="pafk-pot-toggle" data-pot-toggle aria-pressed="false"
            title="Mostra só os Pokémon da caixa com IV ≥ ${POT_MAIN_IV} no ataque principal da build, HP e Velocidade ≥ ${POT_SECONDARY_IV} e classe de IV até Tier ${POT_MAX_IV_TIER}. Natureza que aumenta o ataque principal fica em verde.">★ Potencial</button>
          <span class="pafk-pot-modes" role="group" aria-label="Build de referência">
            ${Object.entries(MODES).map(([key, info]) => `<button type="button" data-pot-mode="${key}" aria-pressed="false">${info.short}</button>`).join('')}
          </span>
          <span class="pafk-pot-status" data-pot-status aria-live="polite"></span>
          <button type="button" class="pafk-pot-next" data-pot-next>Próxima com potencial ›</button>`;
        bar.addEventListener('click', event => {
          const button = event.target.closest('button');
          if (!button) return;
          event.stopPropagation();
          if (button.matches('[data-pot-toggle]')) {
            potEnabled = !potEnabled;
            savePotEnabled(potEnabled);
            potScan = null;
          } else if (button.dataset.potMode) {
            saveMode(button.dataset.potMode);
            potScan = null;
          } else if (button.matches('[data-pot-next]')) {
            findNextPotentialPage();
          }
          decoratePc();
        });
        tools.append(bar);
      }
      const toggle = bar.querySelector('[data-pot-toggle]');
      toggle.setAttribute('aria-pressed', String(potEnabled));
      for (const button of bar.querySelectorAll('[data-pot-mode]')) {
        button.setAttribute('aria-pressed', String(button.dataset.potMode === mode));
      }
      const { total, found } = boxPageCounts();
      const next = nextPageButton();
      const running = potScan?.status === 'running';
      let text = potScan?.text ?? '';
      if (!text && potEnabled) {
        text = found ? `${found} de ${total} nesta página` : `Nenhum dos ${total} desta página`;
      } else if (!text) {
        text = found ? `${found} com potencial nesta página` : '';
      }
      const status = bar.querySelector('[data-pot-status]');
      if (status.textContent !== text) status.textContent = text;
      const nextButton = bar.querySelector('[data-pot-next]');
      nextButton.hidden = !potEnabled || (!next && !running);
      nextButton.disabled = running || !next || next.disabled;
      nextButton.textContent = running ? 'Procurando…' : 'Próxima com potencial ›';
    }

    function nextPageButton() {
      return document.querySelector('.t5-pc [data-pc-zone="box"] .t5-pc-bar:not(.is-bottom) [data-pc-page="1"]');
    }

    function pageLabel() {
      return document.querySelector('.t5-pc [data-pc-zone="box"] .t5-pc-bar:not(.is-bottom) .t5-pc-pages b')?.textContent.trim() ?? '';
    }

    async function waitPageChange(before) {
      const started = Date.now();
      while (Date.now() - started < 4000) {
        await new Promise(resolve => setTimeout(resolve, 120));
        if (pageLabel() && pageLabel() !== before) return;
      }
      throw new PotPageTimeout('A caixa não mudou de página.');
    }

    async function findNextPotentialPage() {
      if (potScan?.status === 'running') return;
      potScan = { status: 'running', text: 'Procurando nas próximas páginas…' };
      decoratePc();
      try {
        let checked = 0;
        for (;;) {
          const next = nextPageButton();
          if (!next || next.disabled) {
            potScan = { status: 'end', text: checked ? `Fim da caixa: nenhum nas ${checked} páginas seguintes` : 'Esta é a última página' };
            break;
          }
          const before = pageLabel();
          next.click();
          await waitPageChange(before);
          checked++;
          decoratePc();
          const { found } = boxPageCounts();
          if (found) {
            potScan = null;
            document.querySelector(`${POT_BOX_CARD}[${POT_ATTR}$=":yes"]`)?.scrollIntoView({ block: 'center' });
            break;
          }
          potScan = { status: 'running', text: `Procurando… página ${pageLabel()}` };
          decoratePc();
        }
      } catch (error) {
        if (!(error instanceof PotPageTimeout)) {
          potScan = { status: 'end', text: `Erro: ${error.message}` };
          decoratePc();
          throw error;
        }
        potScan = { status: 'end', text: 'A caixa não respondeu; tente de novo' };
      }
      decoratePc();
    }

    function ensurePotStyles() {
      if (potStylesInstalled) return;
      potStylesInstalled = true;
      const style = document.createElement('style');
      style.dataset.pafk = '';
      style.textContent = `
        html.pafk-pot-on ${POT_BOX_CARD}:not([${POT_ATTR}$=":yes"]) { display: none !important; }
        .t5-pc .pcx-nat.pafk-pot-nat { color: #1d6b34; font-weight: 900; }
        .t5-pc .pcx-nat.pafk-pot-nat::before { content: "▲ "; }
        .t5-pc .pcx-ivc.pafk-pot-iv { outline: 2px solid #1f9d55; outline-offset: 0; border-radius: 4px; }
        .t5-pc-tools .pafk-pot {
          display: flex; flex-wrap: wrap; align-items: center; gap: 6px; flex-basis: 100%;
          font-size: 12px; color: #152964;
        }
        .pafk-pot button {
          min-height: 34px; padding: 4px 12px; border: 2px solid #14206b; border-radius: 8px;
          background: #fff; color: #14206b; font: inherit; font-weight: 800; cursor: pointer;
          box-shadow: 0 2px 0 #14206b;
        }
        .pafk-pot button:disabled { opacity: .55; cursor: default; }
        .pafk-pot button[hidden] { display: none; }
        .pafk-pot .pafk-pot-toggle[aria-pressed="true"] { background: #ffd34d; color: #5a3b00; }
        .pafk-pot-modes { display: inline-flex; }
        .pafk-pot-modes button { border-radius: 0; min-width: 48px; }
        .pafk-pot-modes button:first-child { border-radius: 8px 0 0 8px; }
        .pafk-pot-modes button + button { border-left-width: 0; border-radius: 0 8px 8px 0; }
        .pafk-pot-modes button[aria-pressed="true"] { background: #14206b; color: #fff; }
        .pafk-pot-status { font-variant-numeric: tabular-nums; font-weight: 700; color: #465982; }
      `;
      document.head.append(style);
    }

    function decoratePc() {
      const pc = document.querySelector('.t5-pc');
      document.documentElement.classList.toggle('pafk-pot-on', Boolean(pc && potEnabled));
      if (!pc) return;
      ensurePotStyles();
      const mode = readMode();
      for (const card of document.querySelectorAll(POT_CARD)) decoratePcCard(card, mode);
      const tools = pc.querySelector('[data-pc-zone="box"] .t5-pc-tools');
      if (tools) potToolbar(tools, mode);
    }

    // ==== src/tiers/observer.js ====
    // Sincronização com a tela do jogo: um único MutationObserver para mercado, MAPA e ficha.
    function syncAll() {
      if (document.querySelector('.mk, .modal .mx-row, .modal .mx-card, .lab[data-lab-dex]')) ensureStyles();
      decorateMap();
      decorateSheet();
      decorateNatures();
      decoratePc();
      syncMarket();
    }

    function syncMarket() {
      if (document.querySelector('.mk')) {
        ensureStyles();
        decorateTierBadges();
      }
      const main = document.querySelector('.mk > .mk-main');
      syncPriceComparison(main);
      syncPriceBook(main);
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
    // Fights the trainers of the day in the order of the MAPA's NPC list sorted by XP ("Mais XP
    // primeiro", which leaves out the locked and the beaten ones), whatever their level.
    // Each fight: open MAPA → NPCs → pick the trainer → "Teleportar até lá" →
    // talk to the trainer → LUTAR → wait for the result → CONTINUAR. Input from the player stops
    // the loop, as do failures where it would be unsafe to continue.
    (() => {
      const FIGHT_TIMEOUT = 10 * 60 * 1000;
      const KEYS_STORAGE = 'pokeafk.ui.keys';
      const HEAL_BELOW = 0.5;
      const NEARBY_DIRECTIONS = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
      // Trainers in a row where the game did not react before the daily gives up.
      const MAX_UNREACHABLE_STREAK = 4;

      class Stop extends Error {}
      // The game did not react in time. Only this kind of failure skips a trainer; any other error
      // is a bug and stops the daily, instead of passing for an unreachable trainer.
      class NoResponse extends Error {}
      // Tampermonkey's sandbox has no bare window globals such as dispatchEvent (Firefox reports
      // "(intermediate value).dispatchEvent is not a function"), so events go to the page's window.
      const pageWindow = document.defaultView ?? window;
      let run = null;

      const box = document.createElement('section');
      box.id = 'pafk-daily';
      box.dataset.pafk = '';
      box.setAttribute('aria-label', 'Daily de treinadores');
      box.innerHTML = `
        <button type="button" class="pafk-daily-toggle" aria-expanded="false" aria-controls="pafk-daily-panel" data-daily-toggle>
          <span aria-hidden="true">⚔</span> Daily
        </button>
        <div class="pafk-daily-body" id="pafk-daily-panel" hidden data-daily-body>
          <header>
            <h2 title="Arraste para mover. Clique duas vezes para voltar ao lugar.">Treinadores do dia</h2>
            <button type="button" class="pafk-daily-x" aria-label="Fechar painel do Daily" data-daily-toggle>×</button>
          </header>
          <div class="pafk-daily-content">
            <div class="pafk-daily-main">
              <img alt="" hidden data-daily-sprite>
              <div>
                <strong data-daily-main>Pokémon principal</strong>
                <p class="pafk-daily-note" data-daily-note></p>
              </div>
            </div>
            <div class="pafk-daily-progress" hidden data-daily-progress>
              <div class="pafk-daily-count"><strong data-daily-left></strong><span>Vitórias <span data-daily-total></span></span></div>
              <div class="pafk-daily-bar" role="progressbar" aria-label="Vitórias" aria-valuemin="0" data-daily-bar><i></i></div>
            </div>
            <p class="pafk-daily-status" role="status" aria-live="polite" data-daily-status></p>
            <ol class="pafk-daily-route" aria-label="Rota de treinadores" hidden data-daily-route></ol>
            <div class="pafk-daily-options">
              <label class="pafk-daily-avoid">
                <input type="checkbox" aria-describedby="pafk-daily-avoid-help" data-daily-avoid checked>
                <span><strong>Evitar vantagem de tipo</strong><small id="pafk-daily-avoid-help">O Daily aprende o time de cada treinador na primeira luta.</small></span>
              </label>
              <label class="pafk-daily-avoid">
                <input type="checkbox" aria-describedby="pafk-daily-swim-help" data-daily-swimmers checked>
                <span><strong>Pular nadadores</strong><small id="pafk-daily-swim-help">Ficam na água, longe do ponto do teleporte.</small></span>
              </label>
            </div>
          </div>
          <div class="pafk-daily-actions">
            <button type="button" class="pafk-daily-go" data-daily-go>Fazer daily</button>
            <button type="button" class="pafk-daily-stop" hidden data-daily-stop>Parar</button>
          </div>
        </div>`;
      const toggleButton = box.querySelector('.pafk-daily-toggle');
      const body = box.querySelector('[data-daily-body]');
      const goButton = box.querySelector('[data-daily-go]');
      const stopButton = box.querySelector('[data-daily-stop]');
      const statusEl = box.querySelector('[data-daily-status]');
      const noteEl = box.querySelector('[data-daily-note]');
      const mainEl = box.querySelector('[data-daily-main]');
      const spriteEl = box.querySelector('[data-daily-sprite]');
      const progressEl = box.querySelector('[data-daily-progress]');
      const routeEl = box.querySelector('[data-daily-route]');
      const avoidBox = box.querySelector('[data-daily-avoid]');
      const swimmersBox = box.querySelector('[data-daily-swimmers]');

      const style = document.createElement('style');
      style.dataset.pafk = '';
      style.textContent = `
        #pafk-daily {
          --daily-ink: #15264f; --daily-muted: #485d7e; --daily-line: #d9e4f3;
          --daily-blue: #2459aa; --daily-navy: #14265a;
          position: fixed; right: 8px; top: 96px; z-index: 40;
          display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
          font: 13px/1.4 system-ui, sans-serif; color: var(--daily-ink);
          font-variant-numeric: tabular-nums; -webkit-font-smoothing: antialiased;
        }
        #pafk-daily [hidden] { display: none !important; }
        #pafk-daily :is(h2, p, ol) { margin: 0; }
        #pafk-daily :focus-visible { outline: 2px solid #3279cf; outline-offset: 2px; }
        #pafk-daily button { font: inherit; cursor: pointer; }
        #pafk-daily .pafk-daily-toggle {
          display: inline-flex; gap: 7px; align-items: center; min-height: 40px;
          border: 1px solid #5875ac; border-radius: 9px; background: var(--daily-navy); color: #fff;
          padding: 0 12px; font-weight: 800; box-shadow: 0 2px 0 #0e1b3e, 0 4px 12px rgb(13 29 64 / .22);
        }
        #pafk-daily .pafk-daily-toggle:is(:hover, [aria-expanded="true"]),
        #pafk-daily[data-running] .pafk-daily-toggle { background: var(--daily-blue); }
        #pafk-daily .pafk-daily-body {
          box-sizing: border-box; width: min(334px, calc(100vw - 16px));
          max-height: calc(var(--daily-room, 80vh) - 46px); overflow: hidden;
          display: flex; flex-direction: column;
          border: 1px solid #a7bce1; border-radius: 14px; background: #fff;
          box-shadow: 0 2px 6px rgb(12 29 64 / .17), 0 12px 30px rgb(12 29 64 / .28);
        }
        #pafk-daily .pafk-daily-body > header {
          display: flex; align-items: center; justify-content: space-between; flex: none;
          gap: 8px; padding: 4px 6px 4px 14px; background: var(--daily-navy); color: #fff;
        }
        #pafk-daily h2 { font: 800 15px/1.2 system-ui, sans-serif; text-wrap: balance; }
        #pafk-daily :is(.pafk-daily-toggle, .pafk-daily-body > header) { cursor: grab; touch-action: none; user-select: none; }
        #pafk-daily[data-dragging] :is(.pafk-daily-toggle, .pafk-daily-body > header) { cursor: grabbing; }
        #pafk-daily .pafk-daily-x {
          display: grid; place-items: center; flex: 0 0 40px; height: 40px;
          border: 0; border-radius: 8px; background: transparent; color: #fff; padding: 0;
          font-size: 23px; line-height: 1;
        }
        #pafk-daily .pafk-daily-x:hover { background: #294275; }
        #pafk-daily .pafk-daily-content {
          display: grid; align-content: start; gap: 10px; padding: 12px; overflow: auto; overscroll-behavior: contain;
        }
        #pafk-daily .pafk-daily-main {
          display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 10px;
          border-radius: 9px; background: #eaf2ff; overflow-wrap: anywhere;
        }
        #pafk-daily .pafk-daily-main img {
          width: 48px; height: 48px; flex: none; object-fit: contain; image-rendering: pixelated;
        }
        #pafk-daily .pafk-daily-main strong { font-size: 14px; }
        #pafk-daily :is(.pafk-daily-note, .pafk-daily-options small) {
          color: var(--daily-muted); font-size: 12px; text-wrap: pretty;
        }
        #pafk-daily .pafk-daily-options { border: 1px solid var(--daily-line); border-radius: 9px; }
        #pafk-daily[data-running] .pafk-daily-options { display: none; }
        #pafk-daily .pafk-daily-options label { display: flex; align-items: center; gap: 10px; padding: 8px 10px; }
        #pafk-daily .pafk-daily-options small { display: block; margin-top: 2px; }
        #pafk-daily .pafk-daily-avoid { cursor: pointer; }
        #pafk-daily .pafk-daily-avoid + .pafk-daily-avoid { border-top: 1px solid var(--daily-line); }
        #pafk-daily .pafk-daily-avoid:has(input:disabled) { cursor: default; }
        #pafk-daily .pafk-daily-avoid input { width: 17px; height: 17px; flex: none; margin: 0; accent-color: var(--daily-blue); }
        #pafk-daily .pafk-daily-count { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 2px 8px; }
        #pafk-daily .pafk-daily-count strong { font-size: 15px; }
        #pafk-daily .pafk-daily-count span { color: var(--daily-muted); }
        #pafk-daily .pafk-daily-bar { height: 7px; border-radius: 4px; background: #e1e9f6; overflow: hidden; margin-top: 5px; }
        #pafk-daily .pafk-daily-bar i { display: block; height: 100%; width: 0; border-radius: inherit; background: #23744c; }
        #pafk-daily .pafk-daily-status {
          padding: 7px 9px; border-radius: 6px; border-left: 3px solid #507cb9; background: #eff5ff; text-wrap: pretty;
        }
        #pafk-daily .pafk-daily-status:empty { display: none; }
        #pafk-daily .pafk-daily-status[data-tone="stop"] { border-color: #ad6216; background: #fff1de; color: #713a05; }
        #pafk-daily .pafk-daily-status[data-tone="done"] { border-color: #23744c; background: #e7f6ed; color: #17603d; }
        #pafk-daily .pafk-daily-route {
          list-style: none; padding: 0; max-height: 168px; overflow: auto;
          border: 1px solid var(--daily-line); border-radius: 9px; scrollbar-width: thin;
        }
        #pafk-daily .pafk-daily-route li {
          display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center;
          gap: 8px; padding: 7px 9px; font-size: 12px;
        }
        #pafk-daily .pafk-daily-route li + li { border-top: 1px solid var(--daily-line); }
        #pafk-daily .pafk-daily-route li div { overflow-wrap: anywhere; }
        #pafk-daily .pafk-daily-route li :is(strong, small) { display: block; }
        #pafk-daily .pafk-daily-route li small { color: var(--daily-muted); font-size: 11px; }
        #pafk-daily .pafk-daily-route li b {
          border-radius: 5px; padding: 3px 6px; background: #edf0f6; color: #455473; font-size: 11px;
        }
        #pafk-daily .pafk-daily-route li b:empty { display: none; }
        #pafk-daily .pafk-daily-route li[data-state="current"] { background: #edf4ff; box-shadow: inset 3px 0 var(--daily-blue); }
        #pafk-daily .pafk-daily-route li[data-state="current"] b { color: #174683; background: #dceaff; }
        #pafk-daily .pafk-daily-route li[data-state="won"] b { color: #17603d; background: #e0f3e8; }
        #pafk-daily .pafk-daily-route li[data-state="lost"] b { color: #a02735; background: #fbe7ea; }
        #pafk-daily .pafk-daily-route li:is([data-state="avoided"], [data-state="swimmer"], [data-state="unreachable"]) b { color: #713a05; background: #fff0da; }
        #pafk-daily .pafk-daily-actions {
          display: flex; flex: none; padding: 10px 12px 12px; border-top: 1px solid var(--daily-line); background: #f6f9ff;
        }
        #pafk-daily .pafk-daily-actions button {
          flex: 1; border-radius: 8px; min-height: 42px; padding: 6px 10px; font-weight: 800; border: 1px solid transparent;
        }
        #pafk-daily .pafk-daily-go { background: var(--daily-blue); color: #fff; }
        #pafk-daily .pafk-daily-go:hover { background: #194985; }
        #pafk-daily .pafk-daily-stop { background: #fff0f0; color: #a02735; border-color: #f0bac1; }
        #pafk-daily .pafk-daily-stop:hover { background: #fce0e4; }
        /* Phones on their side (the game asks for landscape): the button sits under the Contas chip,
           the open card takes the full height on the right, and both stay under the game's windows. */
        @media (max-height: 500px) {
          #pafk-daily .pafk-daily-toggle { min-height: 34px; }
          #pafk-daily .pafk-daily-body { position: fixed; top: 8px; right: 8px; max-height: calc(100vh - 16px); }
          #pafk-daily:has(.pafk-daily-body:not([hidden])) { z-index: 42; }
          #pafk-daily .pafk-daily-content { gap: 8px; padding: 8px 10px; }
          #pafk-daily .pafk-daily-actions { padding: 8px 10px; }
          body:has(.hud .modal.open) #pafk-daily:not([data-running]) { display: none; }
        }
        @media (prefers-reduced-motion: no-preference) {
          #pafk-daily .pafk-daily-actions button { transition: scale .12s ease-out; }
          #pafk-daily .pafk-daily-actions button:active { scale: .96; }
          #pafk-daily .pafk-daily-bar i { transition: width .2s ease-out; }
        }
      `;
      document.head.append(style);
      document.body.append(box);

      // Until the player drags it, it sits under the game's quick actions column (CAÇAR, Poke
      // Center, Poke Market). On a phone on its side that column is full (XP boost, Mecânicas,
      // Analisador, CAPTURA), so it goes under the Contas chip instead.
      // A dragged position is kept, anchored by the top right corner.
      const POSITION_STORAGE = 'pokeafk-market-filtros:daily-pos';
      const SHORT_SCREEN = matchMedia('(max-height: 500px)');
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(POSITION_STORAGE) ?? 'null');
      } catch {
        saved = null;
      }
      // On short screens the open card is pinned to the viewport, so only the button needs room.
      const onlyButton = () => body.hidden || getComputedStyle(body).position === 'fixed';
      function clampPosition({ right, top }) {
        const width = (onlyButton() ? toggleButton.offsetWidth : body.offsetWidth) || 80;
        return {
          right: Math.min(Math.max(0, right), Math.max(0, innerWidth - width)),
          top: Math.min(Math.max(0, top), Math.max(0, innerHeight - (onlyButton() ? 40 : 230))),
        };
      }
      function defaultPosition() {
        const rect = selector => {
          const found = document.querySelector(selector)?.getBoundingClientRect();
          return found && found.width > 0 ? found : null;
        };
        if (SHORT_SCREEN.matches) {
          // Under the Contas chip, left edges lined up (the wild Pokémon's box is to its left and
          // the quick actions below AUTO); without the monitor, left of AUTO.
          const chip = rect('#pafk-monitor .pafk-mon-chip');
          const auto = rect('.hud.world-hud .hud-auto-toggle');
          const width = toggleButton.offsetWidth || 80;
          if (chip) return { top: Math.round(chip.bottom + 6), right: Math.round(innerWidth - chip.left - width) };
          if (auto) return { top: Math.round(auto.top), right: Math.round(innerWidth - auto.left + 8) };
        }
        const quick = rect('.hud.world-hud .hud-quick');
        return quick
          ? { top: Math.round(quick.bottom + 6), right: Math.max(8, Math.round(innerWidth - quick.right)) }
          : { top: 96, right: 8 };
      }
      function placeBox() {
        const position = saved ?? defaultPosition();
        const { right, top } = clampPosition(position);
        box.style.top = `${top}px`;
        box.style.right = `${right}px`;
        box.style.setProperty('--daily-room', `${innerHeight - top - 6}px`);
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
          toggleButton.setAttribute('aria-expanded', String(!body.hidden));
          if (body.hidden && toggle !== toggleButton) toggleButton.focus();
          if (!body.hidden && !run) showMain();
          placeBox();
        });
      }

      // ---- Reading the game ----
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const text = element => element?.textContent.replace(/\s+/g, ' ').trim() ?? '';
      const fold = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
      function mainPokemon() {
        const button = $('button.hud-active-button');
        const label = button?.getAttribute('aria-label') ?? '';
        const match = label.match(/Resumo de (.+), nível (\d+)/i);
        const sprite = button?.querySelector('img.front')?.getAttribute('src') ?? '';
        const dex = Number(sprite.match(/\/(\d+)[^/]*\.png/)?.[1] ?? 0);
        return match ? { name: match[1], level: Number(match[2]), dex, sprite } : null;
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
      // Saves what a fight showed: the opposing team and, after a win, the XP it gave
      // (`xp` for the trainer, `monXp` for the main Pokémon). Keeps what is already known.
      function saveFight(npc, dexes, gain) {
        const teams = readTeams();
        const entry = { ...teams[npc.id], name: npc.name, at: new Date().toISOString().slice(0, 10) };
        if (dexes.length) entry.dex = [...dexes];
        if (gain) Object.assign(entry, gain);
        if (!entry.dex && !entry.xp) return;
        teams[npc.id] = entry;
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
      // Exact XP total from the HUD bars' tooltips ("… XP total: 6.681.268."). It keeps growing
      // across level-ups, so the difference around a fight is the XP that fight gave.
      function xpTotal(selector) {
        const total = ($(selector)?.getAttribute('title') ?? '').match(/XP total:\s*([\d.]+)/i);
        return total ? Number(total[1].replace(/\./g, '')) : null;
      }
      const xpNow = () => ({ trainer: xpTotal('.hud-trainer-xp'), mon: xpTotal('.hud-xp-line') });
      const formatXp = value => value.toLocaleString('pt-BR');

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

      // Swimmers (NADADOR/NADADORA) stand in the water, far from where the teleport leaves the
      // player, so talking from the shore fails and costs time (user's call: skip them by default).
      const SWIMMERS_STORAGE = 'pokeafk-market-filtros:daily-skip-swimmers';
      const isSwimmer = npc => /^NADADORA?\b/.test(fold(npc.name)) || /swimmer/i.test(npc.gfx);
      try {
        swimmersBox.checked = localStorage.getItem(SWIMMERS_STORAGE) !== 'off';
      } catch {
        // Defaults to on.
      }
      swimmersBox.addEventListener('change', () => {
        try {
          localStorage.setItem(SWIMMERS_STORAGE, swimmersBox.checked ? 'on' : 'off');
        } catch {
          // The choice lasts only for this page.
        }
      });


      // Dex of the opposing Pokémon in play, from the arena's red card icon.
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
          const talk = Array.isArray(keys?.talk) ? keys.talk.find(key => typeof key === 'string' && key) : keys?.talk;
          if (typeof talk === 'string' && talk) return talk;
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
          if (performance.now() - started > timeout) throw new NoResponse(`O jogo não respondeu: ${what}.`);
          await sleep(150);
        }
      }
      function stop(reason) {
        if (!run || run.stopped) return;
        run.stopped = true;
        run.reason = reason;
      }
      function setStatus(message, tone = 'info') {
        statusEl.dataset.tone = tone;
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
        else pageWindow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
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

      async function buildRoute() {
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

        // Same order as the list ("Mais XP primeiro"), whatever the level. The list has no XP
        // numbers, so with several regions each region's list comes after the previous one.
        return {
          route: all.filter(npc => !npc.beaten && !npc.locked),
          beaten: all.filter(npc => npc.beaten).length,
          locked: all.filter(npc => npc.locked).length,
        };
      }

      // ---- One fight ----
      const mapTeleportError = () => mapWindow()?.querySelector('.mx-card > .mx-msg.bad[role="alert"]');
      const teleportPending = () => $('.zone-fade.on, .zone-loading:not([hidden])');
      const cancelFailedTeleport = () => $('.zone-loading:not([hidden]) .zl-fail [data-zone="back"]');

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
        // The selected card may report an access requirement outside the shared error alert.
        const restriction = card.parentElement.querySelector(':scope > .mx-msg:not(.bad)');
        if (/abre quando|ins[ií]gnia/i.test(text(restriction))) {
          npc.failure = text(restriction);
          return 'closed';
        }

        await pause(150, 400);
        const tp = await until(() => {
          const button = mapWindow()?.querySelector('.mx-card:has(> .mx-card-in.npc) [data-act="tp"]');
          return button && !button.disabled ? button : null;
        }, 15000, 'liberar o teleporte');
        const previousError = mapTeleportError();
        const previousMessage = text(previousError);
        const newError = () => {
          const error = mapTeleportError();
          const message = text(error);
          return error !== previousError || message !== previousMessage ? message : '';
        };
        tp.click();

        // The MAPA closes when the transition starts. A refusal finishes the transition and
        // reopens the MAPA, where the old alert can persist across NPC selections.
        let started = false;
        const arrival = await until(() => {
          if (cancelFailedTeleport()) return 'unreachable';
          if (teleportPending()) {
            started = true;
            return null;
          }
          if (!mapWindow()) return 'there';
          if (newError()) return 'closed';
          return started ? 'reopened' : null;
        }, 15000, 'teleportar');
        if (arrival === 'closed' || arrival === 'reopened') {
          if (arrival === 'reopened') await pause(250, 450);
          const rejection = newError();
          if (rejection) {
            npc.failure = rejection;
            return 'closed';
          }
          // An open MAPA without a new error does not prove the move failed.
          await closeMap();
          return 'there';
        }
        if (arrival === 'unreachable') {
          cancelFailedTeleport()?.click();
          npc.failure = 'O teleporte não terminou.';
        }
        return arrival;
      }

      // After a step that went nowhere: decline an open challenge and close the MAPA.
      async function recoverScreen() {
        if (teleportPending()) throw new Stop('Parado. O teleporte ainda está em andamento.');
        challenge()?.querySelector('[data-nofight]')?.click();
        await closeMap();
        await pause(200, 400);
      }

      // ---- Finding a trainer on screen ----
      // Trainers that wander may have left the spot the teleport faces. The world canvas draws
      // sprites 1:1 from /assets/npcs/{gfx}.png (frame size in npcs.json), so the trainer's frames
      // are searched in the canvas pixels, nearest to the centre (the player) first. A click on
      // the trainer makes the game walk up to it and talk.
      let npcMetaCache;
      async function npcMeta() {
        npcMetaCache ??= fetch(new URL('/assets/npcs/npcs.json', location.href)).then(response => response.json()).catch(() => ({}));
        return npcMetaCache;
      }
      const appearanceCache = new Map();
      async function npcAppearance(gfx) {
        if (appearanceCache.has(gfx)) return appearanceCache.get(gfx);
        const meta = (await npcMeta())[gfx];
        const templates = [];
        let markerToTile = meta?.hd?.tall ? meta.hd.tall + 6 : null;
        // The blue badge is on the main canvas even when the sprite is drawn on the HD layer.
        if (meta && !meta.hd && meta.w && meta.h) {
          let headRow = Infinity;
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
                    if (data[at + 3]) headRow = Math.min(headRow, y);
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
          // The game draws the badge 13 px above the visible top of the sprite.
          markerToTile = meta.h + 5 - (Number.isFinite(headRow) ? headRow : 10);
        }
        const appearance = { templates, markerToTile };
        appearanceCache.set(gfx, appearance);
        return appearance;
      }

      function worldCanvas() {
        const scene = $('canvas:has(+ canvas.scene-names)');
        if (scene?.width && scene.getBoundingClientRect().width) return scene;
        return $$('canvas')
          .filter(canvas => canvas.width && canvas.getBoundingClientRect().width / canvas.width > 1.2
            && !canvas.closest('[hidden]') && !canvas.classList.contains('title-scene'))
          .sort((a, b) => b.width * b.height - a.width * a.height)[0];
      }

      function nearbyBattleMarker(data, width, height, markerToTile) {
        if (markerToTile === null) return null;
        const cx = width / 2;
        const cy = height / 2;
        const radius = 16 * 3;
        const isColor = (x, y, red, green, blue) => {
          const index = (y * width + x) * 4;
          return data[index] === red && data[index + 1] === green && data[index + 2] === blue;
        };
        const dark = (x, y) => isColor(x, y, 19, 43, 99);
        let best = null;
        let nearest = radius;
        for (let top = Math.max(0, Math.floor(cy - markerToTile - radius));
          top + 11 < height && top <= cy - markerToTile + radius; top += 1) {
          for (let left = Math.max(0, Math.floor(cx - 5 - radius));
            left + 9 < width && left <= cx - 5 + radius; left += 1) {
            // The main layer contains the blue fill, navy outline and two-pixel tail.
            if (!isColor(left + 1, top + 1, 40, 124, 224) || !isColor(left + 8, top + 8, 40, 124, 224)
              || !dark(left + 1, top) || !dark(left + 8, top) || !dark(left, top + 4)
              || !dark(left + 9, top + 4) || !dark(left + 4, top + 11) || !dark(left + 5, top + 11)) continue;
            const x = left + 5;
            const y = top + markerToTile;
            const distance = Math.hypot(x - cx, y - cy);
            if (y < 0 || y >= height || distance >= nearest) continue;
            best = { x, y };
            nearest = distance;
          }
        }
        return best;
      }

      // Read the target sprite first, or the closest blue marker if the sprite is covered.
      async function locateTrainer(npc) {
        const { templates, markerToTile } = await npcAppearance(npc.gfx);
        const canvas = worldCanvas();
        if (!canvas || (!templates.length && markerToTile === null)) return null;
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
        const centre = [width / 2, height / 2];
        const best = matches.sort((a, b) => Math.hypot(a.x - centre[0], a.y - centre[1]) - Math.hypot(b.x - centre[0], b.y - centre[1]))[0]
          ?? nearbyBattleMarker(data, width, height, markerToTile);
        if (!best) return null;
        const rect = canvas.getBoundingClientRect();
        return { canvas, x: rect.left + best.x * rect.width / width, y: rect.top + best.y * rect.height / height };
      }

      function clickTrainer(spot) {
        const init = {
          bubbles: true, cancelable: true, clientX: spot.x, clientY: spot.y,
          button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', isPrimary: true,
        };
        spot.canvas.dispatchEvent(new PointerEvent('pointerdown', init));
        spot.canvas.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0 }));
      }

      const interactionWindow = () => challenge() ?? $('.b5-again') ?? $('.npc-dialogue-backdrop, .quest-backdrop, .modal.open .win');
      function tapKey(key) {
        const init = { key: key.length === 1 ? key.toLowerCase() : key, bubbles: true, cancelable: true };
        pageWindow.dispatchEvent(new KeyboardEvent('keydown', init));
        pageWindow.dispatchEvent(new KeyboardEvent('keyup', init));
      }

      async function findTrainer(npc) {
        const expected = fold(npc.name);
        const key = talkKey();
        let replied = false;

        async function tryInteraction(action, timeout) {
          alive();
          if (inArena() || resultWindow()) throw new Stop('Parado porque uma batalha foi aberta.');
          if (!interactionWindow()) await action();

          let response;
          try {
            response = await until(interactionWindow, timeout, 'responder à interação');
          } catch (error) {
            if (error instanceof Stop) throw error;
            return null;
          }

          replied = true;
          const fight = response.querySelector('[data-fight]');
          const foe = text(response.querySelector('.b5-ch-name'));
          const trainer = foe
            ? [text(response.querySelector('.b5-ch-cls')), foe].filter(Boolean).join(' ')
            : text(response.querySelector('.b5-ch-msg')).match(/^(.+) quer batalhar\.$/i)?.[1];
          if (fight && trainer && fold(trainer) === expected) return { fight };

          // Talking can return the cooldown notice instead of a challenge, even if the MAPA
          // listed the trainer as available. Only credit a win for the named trainer.
          const ofToday = text(response.querySelector('.b5-again-head span')).replace(/\.$/, '')
            || text(response.querySelector('.b5-plain-text')).match(/^(.+?):\s*Já batalhamos hoje\b/i)?.[1];
          const beatToday = response.matches('.b5-again') && ofToday && fold(ofToday) === expected;
          const dismiss = response.querySelector('[data-nofight], [data-npc-close], [data-quest-close], button[aria-label="Fechar"]')
            ?? (response.matches('.b5-again') ? response.querySelector('[data-ok]') : null);
          if (!dismiss) throw new Stop('Parado. Feche a janela aberta no jogo.');
          dismiss.click();
          try {
            await until(() => interactionWindow() !== response, 2500, 'fechar a resposta do NPC');
          } catch (error) {
            if (error instanceof Stop) throw error;
            throw new Stop('Parado. A resposta do NPC ficou aberta.');
          }
          return beatToday ? { outcome: 'won' } : null;
        }

        await pause(350, 700);
        for (let attempt = 0; attempt < 2 && !replied; attempt += 1) {
          const result = await tryInteraction(() => tapKey(key), 3500);
          if (result) return result;
        }

        async function tryVisibleTrainer() {
          const spot = npc.gfx ? await locateTrainer(npc) : null;
          if (!spot && !interactionWindow()) return null;
          setStatus(`Tentando alcançar ${npc.name} pelo mapa...`);
          return tryInteraction(() => { if (spot) clickTrainer(spot); }, 6000);
        }

        // Walk to the intended sprite before a direction tap can move the player away.
        const visible = await tryVisibleTrainer();
        if (visible) return visible;

        // A quick direction tap faces a new side. If already facing that way, the first tap
        // may take one step. Talk after the server has had time to receive the new facing.
        setStatus(`Procurando ${npc.name} entre os NPCs próximos...`);
        for (const direction of NEARBY_DIRECTIONS) {
          const result = await tryInteraction(async () => {
            tapKey(direction);
            await pause(280, 380);
            // In the game, Z/E also accept an open challenge. Never use talk over a response.
            if (!interactionWindow()) tapKey(key);
          }, 1600);
          if (result) return result;
        }

        const afterTurning = await tryVisibleTrainer();
        if (afterTurning) return afterTurning;
        npc.failure = replied ? 'Nenhuma resposta confirmou este desafio.' : 'O NPC não respondeu à interação.';
        return { outcome: replied ? 'skipped' : 'unreachable' };
      }

      async function talkAndFight(npc) {
        const { fight, outcome } = await findTrainer(npc);
        if (outcome) return outcome;
        await pause(200, 500);
        if (challenge()?.querySelector('[data-fight]') !== fight) return 'skipped';
        const before = xpNow();
        fight.click();
        await until(() => inArena() || resultWindow(), 15000, 'começar a batalha');
        setStatus(`Lutando contra ${npc.name}...`);
        const seen = new Set();
        const result = await until(() => {
          const dex = foeInPlay();
          if (dex) seen.add(dex);
          return resultWindow();
        }, FIGHT_TIMEOUT, 'terminar a batalha');
        const battleResult = result.dataset.result;
        const sentToCenter = /Centro Pokémon/i.test(text(result));
        await pause();
        result.querySelector('[data-ah="ok"]')?.click();
        await until(() => !resultWindow(), 8000, 'fechar o resultado');
        const gain = battleResult === 'win' ? await xpGain(before) : null;
        saveFight(npc, [...seen], gain);
        if (gain) {
          npc.gain = gain.xp;
          run.xp += gain.xp;
        }
        return battleResult === 'win' ? 'won' : (sentToCenter ? 'lost-healed' : 'lost');
      }

      // XP a won fight gave, from the HUD totals. The HUD can update a moment after the result,
      // so it waits up to 3 s; with no change (trainer at the level cap) there is nothing to save.
      async function xpGain(before) {
        if (before.trainer === null) return null;
        let after = xpNow();
        for (let waited = 0; after.trainer === before.trainer && waited < 3000; waited += 250) {
          await sleep(250);
          alive();
          after = xpNow();
        }
        const xp = after.trainer - before.trainer;
        if (!(xp > 0)) return null;
        const monXp = before.mon !== null && after.mon !== null ? after.mon - before.mon : 0;
        return monXp > 0 ? { xp, monXp } : { xp };
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
        unreachable: 'Inacessível', closed: 'Inacessível', avoided: 'Evitado', swimmer: 'Pulado', current: 'Agora', todo: '',
      };
      function renderProgress() {
        const { route, done, total } = run;
        const left = total - done;
        progressEl.hidden = !total;
        box.querySelector('[data-daily-left]').textContent = left ? (left === 1 ? 'Falta 1' : `Faltam ${left}`) : 'Tudo feito!';
        box.querySelector('[data-daily-total]').textContent = `${done} de ${total}`;
        const bar = box.querySelector('[data-daily-bar]');
        bar.setAttribute('aria-valuemax', String(total));
        bar.setAttribute('aria-valuenow', String(done));
        bar.querySelector('i').style.width = `${total ? Math.round(done / total * 100) : 100}%`;
        routeEl.hidden = !route.length;
        const scrollTop = routeEl.scrollTop;
        routeEl.replaceChildren(...route.map(npc => {
          const item = document.createElement('li');
          item.dataset.state = npc.state;
          if (npc.state === 'current') item.setAttribute('aria-current', 'step');
          item.innerHTML = '<div><strong></strong><small></small></div><b></b>';
          item.querySelector('strong').textContent = `${npc.name} · Nv. ${npc.level}`;
          const edge = npc.edge ? `time com ${TYPE_NAMES[npc.edge] ?? npc.edge}`
            : npc.state === 'swimmer' ? 'nadador, na água' : '';
          // XP measured in this run, or the one saved from an earlier win.
          const xp = npc.gain ? `+${formatXp(npc.gain)} XP` : npc.knownXp ? `~${formatXp(npc.knownXp)} XP` : '';
          item.querySelector('small').textContent = [npc.place, xp, edge, npc.failure].filter(Boolean).join(' · ');
          item.querySelector('b').textContent = LABELS[npc.state] ?? '';
          return item;
        }));
        routeEl.scrollTop = scrollTop;
        const current = routeEl.querySelector('[aria-current]');
        if (current && !body.hidden) {
          const list = routeEl.getBoundingClientRect();
          const row = current.getBoundingClientRect();
          routeEl.scrollTop += Math.min(0, row.top - list.top) + Math.max(0, row.bottom - list.bottom);
        }
      }

      function showMain() {
        const main = mainPokemon();
        mainEl.textContent = main ? `${main.name} · Nv. ${main.level}` : 'Pokémon principal';
        spriteEl.hidden = !main?.sprite;
        if (main?.sprite && spriteEl.getAttribute('src') !== main.sprite) spriteEl.src = main.sprite;
        noteEl.textContent = main
          ? 'Todos os treinadores do dia, na ordem do MAPA: mais XP primeiro.'
          : 'Entre no jogo para ver o Pokémon principal.';
      }

      function setRunning(on) {
        const restoreFocus = document.activeElement === (on ? goButton : stopButton);
        goButton.hidden = on;
        stopButton.hidden = !on;
        avoidBox.disabled = on;
        swimmersBox.disabled = on;
        box.toggleAttribute('data-running', on);
        if (restoreFocus) (on ? stopButton : goButton).focus({ preventScroll: true });
      }

      stopButton.addEventListener('click', () => stop('Parado.'));

      goButton.addEventListener('click', async () => {
        if (run) return;
        const main = mainPokemon();
        showMain();
        if (!main) {
          setStatus('Não achei o Pokémon principal no HUD.', 'stop');
          return;
        }
        run = { stopped: false, reason: '', route: [], done: 0, total: 0, xp: 0 };
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
          const { route, beaten, locked } = await buildRoute();
          const known = readTeams();
          run.route = route.map(npc => {
            const swimmer = swimmersBox.checked && isSwimmer(npc);
            const edge = !swimmer && avoidBox.checked ? typeEdge(npc, main.dex) : null;
            const state = swimmer ? 'swimmer' : edge ? 'avoided' : 'todo';
            return { ...npc, edge, knownXp: known[npc.id]?.xp, state };
          });
          const avoided = run.route.filter(npc => npc.state === 'avoided').length;
          const swimmers = run.route.filter(npc => npc.state === 'swimmer').length;
          const leftOut = [avoided && `${avoided} evitado(s) por vantagem de tipo`,
            swimmers && `${swimmers} nadador(es) pulado(s)`].filter(Boolean).join(' e ');
          // Trainers left out on purpose do not count in "Faltam N".
          run.total = route.length - avoided - swimmers + beaten;
          run.done = beaten;
          renderProgress();
          if (!run.route.some(npc => npc.state === 'todo')) {
            if (leftOut) {
              await closeMap();
              setStatus(`Nada a fazer: ${leftOut}.`);
              return;
            }
            await closeMap();
            setStatus(locked
              ? `Nada a fazer: ${locked} treinador(es) ainda bloqueado(s).`
              : 'Nada a fazer: todos os treinadores já foram vencidos hoje.');
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
              if (arrival !== 'there') await closeMap();
              outcome = arrival === 'there' ? await talkAndFight(npc) : arrival;
            } catch (error) {
              // The game did not react (teleport or talk went nowhere): skip this trainer, unless
              // a battle is on screen, where moving on would be unsafe.
              if (!(error instanceof NoResponse) || inArena() || resultWindow()) throw error;
              await recoverScreen();
              npc.failure = error.message;
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
            // A closed place (gym without the badges) or a locked trainer cannot be done today,
            // so it does not count in "Faltam N".
            if (outcome === 'closed' || outcome === 'locked') run.total -= 1;
            renderProgress();
            await pause();
          }
          await closeMap().catch(() => {});
          const lost = run.route.filter(npc => npc.state === 'lost').length;
          const skipped = run.route.filter(npc => npc.state === 'skipped' || npc.state === 'locked').length;
          const unreachable = run.route.filter(npc => npc.state === 'unreachable').length;
          const closed = run.route.filter(npc => npc.state === 'closed').length;
          setStatus(['Daily concluído.', run.xp && `+${formatXp(run.xp)} XP de treinador.`,
            lost && `${lost} derrota(s).`, skipped && `${skipped} pulado(s).`,
            unreachable && `${unreachable} sem resposta do jogo.`,
            closed && `${closed} em lugar fechado (falta insígnia).`,
            leftOut && `${leftOut[0].toUpperCase()}${leftOut.slice(1)}.`]
            .filter(Boolean).join(' '), 'done');
        } catch (error) {
          const current = run.route.find(npc => npc.state === 'current');
          if (current) current.state = 'todo';
          if (run.route.length) renderProgress();
          setStatus(error instanceof Stop ? error.message
            : error instanceof NoResponse || !(error instanceof TypeError || error instanceof ReferenceError)
              ? `Parado: ${error.message}`
              : `Parado por um erro do script: ${error.message}`, 'stop');
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
    // A phone on its side (the game asks for landscape) fits the four accounts only in the compact list.
    const SHORT_SCREEN = matchMedia('(max-height: 500px)');

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
        // Channel ("Canal 1"): trades only work between trainers on the same channel.
        canal: text($('.hud-canal .hud-canal-t')) || null,
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
        record.afkBalls, record.money, record.canal, record.main?.level, record.main?.name, record.main?.front, hpStep, record.foe?.name,
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
        <p class="pafk-mon-foot">⚠ com menos de ${LOW_BALLS} bolas ou ${LOW_POTIONS} poções.<span class="pafk-mon-hover-hint"> Passe o mouse nos números para ver cada tipo.</span></p>
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
      /* Touch screens have no hover, so the per-type tooltips never show. */
      @media (hover: none) { #pafk-monitor .pafk-mon-hover-hint { display: none; } }
      /* On a phone the game's windows (market, MAPA, ficha) fill the screen; stay under them. */
      @media (max-height: 500px) { body:has(.hud .modal.open) #pafk-monitor { display: none; } }
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
      #pafk-monitor .pafk-mon-trade {
        flex: none; border: 1px solid #b7c6db; border-radius: 5px; background: #fff; color: ${NAVY};
        padding: 0 7px; font: 600 11px/20px system-ui, sans-serif; white-space: nowrap;
      }
      #pafk-monitor .pafk-mon-meta .pafk-mon-trade { border: 1px solid #b7c6db; color: ${NAVY}; padding: 0 7px; margin-right: 2px; font-size: 11px; }
      #pafk-monitor .pafk-mon-trade:not(:disabled):hover { background: ${NAVY}; color: #fff; }
      #pafk-monitor .pafk-mon-trade:disabled { color: ${MUTED}; background: #f3f6fb; cursor: default; }
      #pafk-monitor .pafk-mon-row .pafk-mon-name .pafk-mon-trade { margin-left: 6px; }
      #pafk-monitor .pafk-mon-row .pafk-mon-name .pafk-mon-age + .pafk-mon-trade { margin-left: 4px; }
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
    // ---- Trade with another account ----
    // The game's path is menu → Amigos → the friend → Ver perfil → TROCAR. The Amigos window also
    // has "Buscar jogador", which opens any trainer's profile by name, so the button does:
    // menu → Amigos → Buscar jogador (name) → the profile's TROCAR (`.pa1-act[data-tr]`), which sends
    // the invite and closes the profile. Only DOM clicks, as a player would do them.
    const TRADE_STATES = new Set(['daily', 'battle', 'hunting', 'fishing', 'idle']);
    let trading = false;

    function tradeButtonHtml(name) {
      return `<button type="button" class="pafk-mon-trade" data-mon-trade hidden aria-label="Trocar com ${esc(name)}">⇄ Trocar</button>`;
    }

    const visible = element => Boolean(element && element.getClientRects().length && !element.closest('[hidden], [inert]'));
    async function waitFor(test, timeout, what) {
      const end = performance.now() + timeout;
      for (;;) {
        const value = test();
        if (value) return value;
        if (performance.now() > end) throw new Error(`o jogo não respondeu (${what})`);
        await new Promise(resolve => setTimeout(resolve, 120));
      }
    }

    // Sends a trade invite to `name` through the game's own screens. Throws when the game does not
    // react (the message says why).
    async function sendInvite(name) {
      if ($('.in-arena') || $('.ah-result[data-result]')) throw new Error('termine a batalha antes');
      // Amigos window, from the trainer menu.
      let dmName = $('.friends-window:not([hidden]) [data-friends-dm-name]');
      if (!visible(dmName)) {
        const menuItem = $('.hud-pm-item[data-act="friends"]');
        if (!menuItem) throw new Error('não achei Amigos no menu do treinador');
        if (menuItem.closest('[inert]')) {
          $('[data-act="playerMenu"]')?.click();
          await waitFor(() => !menuItem.closest('[inert]'), 3000, 'abrir o menu');
        }
        menuItem.click();
        dmName = await waitFor(() => {
          const input = $('.friends-window:not([hidden]) [data-friends-dm-name]');
          return visible(input) ? input : null;
        }, 5000, 'abrir Amigos');
      }
      // "Buscar jogador" opens the profile and closes the Amigos window.
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setValue.call(dmName, name);
      dmName.dispatchEvent(new Event('input', { bubbles: true }));
      const search = dmName.form?.querySelector('[data-friends-action="dm"]');
      if (!search) throw new Error('não achei Buscar jogador em Amigos');
      search.click();
      const tradeButton = await waitFor(() => {
        const profile = $$('.pa1-trainer').find(element => visible(element)
          && nameKey($('.pa1-name', element)?.textContent) === nameKey(name));
        const found = profile && $('.pa1-act[data-tr]', profile);
        return found && !found.disabled ? found : null;
      }, 8000, 'abrir o perfil');
      tradeButton.click();
    }
    // Only the game not reacting is expected; anything else is a bug and goes to the console too.
    const INVITE_EXPECTED = /o jogo não respondeu|não achei|termine a batalha/;

    async function startTrade(name, button) {
      if (trading || autoTradeBusy()) return;
      trading = true;
      button.dataset.busy = '';
      button.disabled = true;
      const label = button.textContent;
      button.textContent = '⇄ Abrindo...';
      let message = '';
      try {
        await sendInvite(name);
        message = '⇄ Convite enviado';
      } catch (error) {
        if (!INVITE_EXPECTED.test(error.message)) console.error(error);
        message = '⇄ Não abriu';
        button.title = `Trocar com ${name}: ${error.message}. Tente pelo menu do jogo.`;
      } finally {
        trading = false;
        button.textContent = message;
        // The panel leaves a busy button alone, so the result stays readable for a moment.
        setTimeout(() => {
          button.textContent = label;
          delete button.dataset.busy;
          button.disabled = false;
        }, message.includes('enviado') ? 2500 : 6000);
      }
    }

    let shownMode = null;
    let editing = null;
    const mode = () => (store.get(COMPACT_KEY, SHORT_SCREEN.matches) ? 'compact' : 'full');

    function makeRow(name, compact) {
      const item = document.createElement('li');
      if (compact) {
        item.className = 'pafk-mon-row';
        item.innerHTML = `
          <span data-f="pic"></span>
          <div style="min-width: 0">
            <div class="pafk-mon-name"><b data-f="name"></b><small data-f="sub"></small><span class="pafk-mon-age" data-f="age"></span>${tradeButtonHtml(name)}</div>
            <div class="pafk-mon-line" data-f="line"></div>
          </div>
          <div class="pafk-mon-counts" data-f="counts"></div>`;
        $('[data-mon-trade]', item).addEventListener('click', event => startTrade(name, event.currentTarget));
        return item;
      }
      item.className = 'pafk-mon-card';
      item.innerHTML = `
        <span data-f="pic" style="grid-row: 1 / 5; align-self: start"></span>
        <div class="pafk-mon-name"><b data-f="name"></b><small data-f="sub"></small></div>
        <div class="pafk-mon-meta">
          <span class="pafk-mon-age" data-f="age"></span>
          ${tradeButtonHtml(name)}
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
      $('[data-mon-trade]', item).addEventListener('click', event => startTrade(name, event.currentTarget));
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
        // A trade needs both accounts in the game, and this tab not busy with the Daily.
        const trade = $('[data-mon-trade]', item);
        if (trade && !trade.dataset.busy) {
          const why = record.name === myName ? 'esta aba'
            : !TRADE_STATES.has(state) ? `${info.label.toLowerCase()}: a conta precisa estar no jogo`
              : $('#pafk-daily[data-running]') ? 'espere o Daily desta aba terminar' : '';
          trade.hidden = record.name === myName;
          trade.disabled = Boolean(why);
          trade.title = why ? `Trocar com ${record.name}: ${why}` : `Abrir uma troca com ${record.name} nesta aba`;
        }

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

    // ==== src/trade.js ====
    // ---- Troca automática entre as suas contas ----
    // Pedido do usuário: no menu de um Pokémon do PC (`.t5-pick`, aberto ao clicar nele), o bloco
    // "Trocar com" tem um botão por conta aberta em outra aba. Ao clicar, as duas abas fazem a troca
    // sozinhas, só com cliques na tela, como o jogador faria:
    //   quem envia: convite (menu → Amigos → Buscar jogador → TROCAR) → espera a janela TROCA →
    //               acha o Pokémon (busca pelo nome e páginas) → oferece → espera a oferta da outra
    //               conta → CONFIRMAR → CONTINUAR TROCANDO.
    //   quem recebe: aceita o convite dessa conta → espera a oferta → oferece um Pokémon qualquer da
    //               caixa (não favorito, não brilhante) → CONFIRMAR → CONTINUAR TROCANDO.
    // As abas conversam pelo armazenamento do Tampermonkey (o mesmo `store` do monitor, que vale para
    // todas as abas e contêineres): `trade:ask:<quem recebe>` (pedido, gravado por quem envia) e
    // `trade:ans:<quem envia>` (erro do outro lado). Sem esse pedido, nenhum convite é aceito sozinho.
    // Depois de CONTINUAR TROCANDO a sessão fica aberta: quem recebe continua respondendo sozinho às
    // próximas ofertas da mesma conta até a janela fechar (ENCERRAR ou CANCELAR).

    const ASK_PREFIX = 'trade:ask:';
    const ANSWER_PREFIX = 'trade:ans:';
    const ASK_FRESH = 60 * 1000;            // a request older than this is ignored
    const PARTNER_STATES = new Set(['hunting', 'fishing', 'idle']);
    const TRADE_ICON = '/assets/ui/win/trade.png';

    // Expected stops: the game did not react, a window closed, the player stopped it, preconditions.
    class TradeStop extends Error {}

    let job = null;      // this tab sending: { partner, stopped }
    let follow = null;   // this tab answering: { partner, id, at, opened, gone, offeredAt, okAt, againAt }
    let handledAsk = '';
    const autoTradeBusy = () => Boolean(job || follow);

    const sameName = (a, b) => Boolean(a && b) && nameKey(a) === nameKey(b);
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    const tradeWindow = () => $$('.modal.open .t5-trade').find(visible) ?? null;
    // "KETER oferece" while choosing; the done screen only says "Você recebeu".
    const partnerOf = win => text($('.t5-offer:not(.is-mine) .t5-offer-h > span', win)).replace(/\s*oferece$/i, '');
    const offerButton = (win, uid) => $$('[data-offer]', win).find(button => button.dataset.offer === uid) ?? null;

    function typeInto(input, value) {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setValue.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // ---- Status bar (both tabs) ----
    const bar = document.createElement('div');
    bar.id = 'pafk-trade';
    bar.dataset.pafk = '';
    bar.hidden = true;
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML = `
      <i class="pafk-trade-dot" aria-hidden="true"></i>
      <span class="pafk-trade-txt"><b>TROCA AUTOMÁTICA</b><span data-trade-msg></span></span>
      <button type="button" data-trade-stop>Parar</button>
      <button type="button" data-trade-close aria-label="Fechar aviso">✕</button>`;
    const barMsg = $('[data-trade-msg]', bar);
    let barTimer = 0;

    function status(message, tone = 'run') {
      clearTimeout(barTimer);
      bar.hidden = false;
      bar.dataset.tone = tone;
      barMsg.textContent = message;
      $('[data-trade-stop]', bar).hidden = tone !== 'run';
      $('[data-trade-close]', bar).hidden = tone === 'run';
      if (tone === 'ok') barTimer = setTimeout(() => { bar.hidden = true; }, 10000);
    }
    $('[data-trade-stop]', bar).addEventListener('click', () => {
      if (job) job.stopped = 'parada por você';
      if (follow) {
        follow = null;
        status('Parada nesta aba. A janela de troca continua aberta.', 'bad');
      }
    });
    $('[data-trade-close]', bar).addEventListener('click', () => { bar.hidden = true; });

    const tradeStyle = document.createElement('style');
    tradeStyle.dataset.pafk = '';
    tradeStyle.textContent = `
      #pafk-trade {
        position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 43;
        display: flex; align-items: center; gap: 10px; box-sizing: border-box;
        max-width: min(560px, calc(100vw - 32px)); padding: 7px 8px 7px 12px;
        border: 4px solid transparent; border-image: url("${IMG.frame}") 10 fill / 4px;
        box-shadow: 2px 3px 0 rgb(7 26 63 / .33); font: 13px/1.35 system-ui, sans-serif; color: ${NAVY};
      }
      #pafk-trade[hidden], #pafk-trade [hidden] { display: none !important; }
      #pafk-trade .pafk-trade-dot { flex: none; width: 10px; height: 10px; border-radius: 2px; background: #2459aa; }
      #pafk-trade[data-tone="run"] .pafk-trade-dot { animation: pafk-trade-blink 1s steps(2) infinite; }
      #pafk-trade[data-tone="ok"] .pafk-trade-dot { background: #2f9e44; }
      #pafk-trade[data-tone="bad"] .pafk-trade-dot { background: #c92a2a; }
      #pafk-trade .pafk-trade-txt { display: flex; flex-direction: column; min-width: 0; }
      #pafk-trade .pafk-trade-txt b { font: 12px "HUD Pixel", system-ui, sans-serif; letter-spacing: .03em; color: ${MUTED}; }
      #pafk-trade button {
        flex: none; font: 600 12px system-ui, sans-serif; color: ${NAVY}; cursor: pointer;
        border: 1px solid #b7c6db; border-radius: 5px; background: #fff; padding: 4px 10px;
      }
      #pafk-trade button:hover { background: ${NAVY}; color: #fff; }
      @keyframes pafk-trade-blink { 50% { opacity: .35; } }
      @media (prefers-reduced-motion: reduce) { #pafk-trade .pafk-trade-dot { animation: none !important; } }

      /* "Trocar com" inside the game's Pokémon menu: the game's own action row, with one chip per account */
      .t5-pick-act.pafk-trade-act { cursor: default; }
      .pafk-trade-act .pafk-trade-ic { width: 24px; height: 24px; image-rendering: pixelated; }
      .pafk-trade-act .pafk-trade-chips { display: flex; flex-wrap: wrap; gap: 5px; margin: 4px 0 2px; }
      .pafk-trade-act .pafk-trade-chip {
        font: 600 12px/1 system-ui, sans-serif; color: ${NAVY}; cursor: pointer; padding: 6px 10px;
        border: 2px solid #9fb4d8; border-radius: 6px; background: #fff; box-shadow: 0 2px 0 rgb(7 26 63 / .18);
      }
      .pafk-trade-act .pafk-trade-chip:not(:disabled):hover { background: ${NAVY}; border-color: ${NAVY}; color: #fff; }
      .pafk-trade-act .pafk-trade-chip:disabled { cursor: default; color: ${MUTED}; background: #eef2f8; border-color: #d3dceb; box-shadow: none; }
      .pafk-trade-act[data-off] .pafk-trade-ic { opacity: .5; }
    `;
    document.head.append(tradeStyle);
    document.body.append(bar);

    // ---- Why a trade cannot start now ----
    function myWhy() {
      if (!myName) return 'entre no jogo primeiro';
      if ($('#pafk-daily[data-running]')) return 'espere o Daily desta aba terminar';
      if ($('.in-arena') || $('.ah-result[data-result]')) return 'termine a batalha antes';
      if (job || follow || trading) return 'já há uma troca em andamento';
      return '';
    }

    function partnerWhy(record, now) {
      const state = viewState(record, now);
      if (state === 'daily') return 'está fazendo o Daily';
      if (state === 'battle') return 'está em batalha';
      if (!PARTNER_STATES.has(state)) return `${(STATES[state] ?? STATES.stale).label.toLowerCase()}: a conta precisa estar no jogo`;
      if (record.canal && me?.canal && record.canal !== me.canal) return `está no ${record.canal} e você no ${me.canal}`;
      return '';
    }

    function pickInfo(pick) {
      return {
        uid: pick.dataset.pick,
        name: text($('.t5-pick-who strong', pick)),
        inBox: /na caixa/i.test(text($('.t5-pick-who', pick))),
        fav: Boolean($('[data-pick-fav="off"]', pick)),
      };
    }

    // ---- "Trocar com" in the Pokémon menu ----
    function makeBlock() {
      const block = document.createElement('div');
      block.className = 't5-pick-act pafk-trade-act';
      block.dataset.pafk = '';
      block.innerHTML = `<span class="t5-pick-ic" aria-hidden="true"><img class="pafk-trade-ic" src="${TRADE_ICON}" alt="" draggable="false"></span>
        <span class="t5-pick-t"><b>Trocar com</b><span class="pafk-trade-chips" role="group" aria-label="Trocar com outra conta"></span><small></small></span>`;
      block.addEventListener('click', event => {
        const chip = event.target.closest('[data-pafk-trade]');
        const pick = block.closest('.t5-pick[data-pick]');
        if (!chip || chip.disabled || !pick) return;
        event.stopPropagation();
        sendTrade(chip.dataset.pafkTrade, pickInfo(pick));
      });
      return block;
    }

    function syncBlock(block, info) {
      const now = Date.now();
      const others = records().filter(record => record.name !== myName).sort(byName);
      const blockWhy = !info.inBox ? 'Está na equipe: guarde no PC antes de trocar.'
        : info.fav ? 'É favorito: tire a estrela antes de trocar.'
          : !others.length ? 'Abra o jogo com as outras contas em outras abas.'
            : myWhy();
      const chips = others.map(record => {
        const why = blockWhy || partnerWhy(record, now);
        const label = displayName(record.name);
        return { name: record.name, label, why, title: why ? `${label}: ${why}` : `Trocar ${info.name} com ${label}` };
      });
      const hint = blockWhy || (chips.some(chip => !chip.why)
        ? 'A outra conta aceita e oferece um Pokémon qualquer da caixa.'
        : 'Nenhuma outra conta pode trocar agora (passe o mouse para ver o motivo).');
      const signature = JSON.stringify([blockWhy, hint, chips]);
      if (block.dataset.sig === signature) return;
      block.dataset.sig = signature;
      block.toggleAttribute('data-off', Boolean(blockWhy) || chips.every(chip => chip.why));
      $('.pafk-trade-chips', block).innerHTML = chips.map(chip => `<button type="button" class="pafk-trade-chip" data-pafk-trade="${esc(chip.name)}" title="${esc(chip.title)}"${chip.why ? ' disabled' : ''}>${esc(chip.label)}</button>`).join('');
      $('small', block).textContent = hint;
    }

    function syncPicks() {
      for (const pick of $$('.t5-pick[data-pick]')) {
        const acts = $('.t5-pick-acts', pick);
        if (!acts) continue;
        let block = $('.pafk-trade-act', acts);
        if (!block) {
          block = makeBlock();
          const fav = $('[data-pick-fav]', acts);
          acts.insertBefore(block, fav ?? null);
        }
        syncBlock(block, pickInfo(pick));
      }
    }

    // ---- Sending ----
    // Waits for `test` to return something; the test may throw TradeStop. Stops when the player does.
    async function until(test, timeout, why) {
      const end = performance.now() + timeout;
      for (;;) {
        if (job?.stopped) throw new TradeStop(job.stopped);
        const value = test();
        if (value) return value;
        if (performance.now() > end) throw new TradeStop(why);
        await pause(150);
      }
    }

    // The trade window, or a stop if it closed (someone cancelled). A re-render may hide it for an instant.
    function liveWindow(state) {
      const win = tradeWindow();
      if (win) {
        state.goneAt = 0;
        return win;
      }
      state.goneAt ||= performance.now();
      if (performance.now() - state.goneAt > 1500) throw new TradeStop('a janela de troca fechou (alguém cancelou?)');
      return null;
    }

    function checkAnswer(id, partner) {
      const answer = store.get(ANSWER_PREFIX + myName, null);
      if (answer?.id === id && answer.error) throw new TradeStop(`${displayName(partner)}: ${answer.error}`);
    }

    // Finds the Pokémon in the "Escolha seu Pokémon" grid: first narrowed by its name, then page by page.
    async function findOffer(uid, label, state) {
      for (const query of label ? [label, ''] : ['']) {
        const input = $('[data-pc-q]', liveWindow(state) ?? document);
        if (input && input.value !== query) {
          typeInto(input, query);
          await pause(250);
        }
        for (let page = 0; page < 80; page++) {
          const win = await until(() => liveWindow(state), 3000, 'a janela de troca fechou');
          const found = offerButton(win, uid);
          if (found) return found;
          const pages = text($('.t5-pc-pages b', win));
          const next = $('[data-pc-page="1"]:not([disabled])', win);
          if (!next) break;
          next.click();
          await until(() => {
            const current = liveWindow(state);
            return current && text($('.t5-pc-pages b', current)) !== pages;
          }, 4000, 'a página da lista não mudou');
        }
      }
      throw new TradeStop(`não achei ${label || 'o Pokémon'} na lista da troca`);
    }

    async function sendTrade(partner, info) {
      const why = myWhy();
      if (why) {
        status(why, 'bad');
        return;
      }
      const record = store.get(PREFIX + partner, null);
      const partnerProblem = record ? partnerWhy(record, Date.now()) : 'conta não encontrada';
      if (partnerProblem) {
        status(`${displayName(partner)} ${partnerProblem}.`, 'bad');
        return;
      }
      const dn = displayName(partner);
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
      const state = { goneAt: 0 };
      job = { partner, stopped: '' };
      try {
        let win = tradeWindow();
        const reuse = win && !win.matches('.is-done') && sameName(partnerOf(win), partner);
        if (win && !reuse) throw new TradeStop('já há uma janela de troca aberta: termine-a antes');
        if (!reuse) {
          // The other tab accepts only an invite it was told about.
          store.del(ANSWER_PREFIX + myName);
          store.set(ASK_PREFIX + partner, { id, from: myName, to: partner, at: Date.now() });
          status(`Enviando o convite para ${dn}…`);
          try {
            await sendInvite(partner);
          } catch (error) {
            if (INVITE_EXPECTED.test(error.message)) throw new TradeStop(error.message);
            throw error;
          }
          status(`Esperando ${dn} aceitar…`);
          win = await until(() => {
            checkAnswer(id, partner);
            const open = tradeWindow();
            return open && !open.matches('.is-done') ? open : null;
          }, 30000, `${dn} não aceitou o convite (a aba dela está aberta no jogo?)`);
          if (!sameName(partnerOf(win), partner)) throw new TradeStop(`abriu uma troca com ${partnerOf(win) || 'outro treinador'}`);
        }

        status(`Procurando ${info.name} na lista…`);
        (await findOffer(info.uid, info.name, state)).click();
        await until(() => {
          const open = liveWindow(state);
          return open && offerButton(open, info.uid)?.classList.contains('sel');
        }, 8000, `${info.name} não entrou na oferta`);

        status(`Esperando a oferta de ${dn}…`);
        const ok = await until(() => {
          checkAnswer(id, partner);
          const open = liveWindow(state);
          if (!open) return null;
          if (!offerButton(open, info.uid)?.classList.contains('sel')) throw new TradeStop(`a oferta mudou: ${info.name} saiu`);
          return $('[data-ok]:not(.disabled)', open);
        }, 60000, `${dn} não ofereceu um Pokémon`);
        ok.click();

        status('Confirmando a troca…');
        const done = await until(() => {
          checkAnswer(id, partner);
          const open = liveWindow(state);
          return open?.matches('.is-done') ? open : null;
        }, 45000, 'a troca não foi concluída');
        const got = text($('.t5-done-h', done)).replace(/^✓\s*/, '');
        $('[data-again]:not(.disabled)', done)?.click();
        status(`${got || 'Troca feita!'} ${info.name} foi para ${dn}. A janela fica aberta para continuar trocando.`, 'ok');
      } catch (error) {
        if (!(error instanceof TradeStop)) console.error(error);
        status(`Não terminou: ${error.message}.`, 'bad');
      } finally {
        job = null;
        store.del(ASK_PREFIX + partner);
      }
    }

    // Stops on the player's own click or key in this tab (the script's clicks are not trusted).
    for (const type of ['pointerdown', 'keydown']) {
      addEventListener(type, event => {
        if (!event.isTrusted || event.target?.closest?.('#pafk-trade')) return;
        if (job) job.stopped = 'parada porque você mexeu no jogo';
        if (follow) {
          follow = null;
          status('Parada nesta aba porque você mexeu no jogo.', 'bad');
        }
      }, true);
    }

    // ---- Answering (the other tab) ----
    function answer(to, id, error) {
      store.set(ANSWER_PREFIX + to, { id, error, at: Date.now() });
    }

    function pickRandom(win) {
      const choices = $$('[data-offer]', win).filter(button => !button.matches('.shiny, .locked, .fainted'));
      if (choices.length) return choices[Math.floor(Math.random() * choices.length)];
      return null;
    }

    let lastAnswerTick = 0;
    function answerTick() {
      const now = Date.now();
      if (now - lastAnswerTick < 150) return;
      lastAnswerTick = now;
      if (!myName || job) return;

      // A request for this account: accept the invite from that account only.
      const ask = store.get(ASK_PREFIX + myName, null);
      if (ask && ask.id !== handledAsk && now - ask.at < ASK_FRESH && !follow) {
        const busy = $('#pafk-daily[data-running]') ? 'esta conta está fazendo o Daily'
          : trading ? 'esta conta está abrindo outra troca' : '';
        if (busy) {
          handledAsk = ask.id;
          answer(ask.from, ask.id, busy);
        } else {
          const card = $$('.inv-card').find(element => !element.hidden && /troca/i.test(text($('small', element)))
            && sameName(text($('.inv-name b', element)), ask.from));
          if (card) {
            handledAsk = ask.id;
            follow = { partner: ask.from, id: ask.id, at: now, opened: false, gone: 0, offeredAt: 0, okAt: 0, againAt: 0 };
            status(`Aceitando o convite de ${displayName(ask.from)}…`);
            $('[data-inv="yes"]', card)?.click();
          } else if (now - ask.at > 20000) {
            handledAsk = ask.id;
            answer(ask.from, ask.id, 'o convite não apareceu (em batalha, ou com convites desligados?)');
          }
        }
      }
      if (follow) followTrade(now);
    }

    function followTrade(now) {
      const partner = displayName(follow.partner);
      const win = tradeWindow();
      if (!win) {
        if (follow.opened) {
          follow.gone ||= now;
          if (now - follow.gone > 1500) {
            follow = null;
            status(`A troca com ${partner} terminou.`, 'ok');
          }
        } else if (now - follow.at > 15000) {
          answer(follow.partner, follow.id, 'a janela de troca não abriu (a conta estava ocupada?)');
          follow = null;
          status(`A troca com ${partner} não abriu.`, 'bad');
        }
        return;
      }
      follow.gone = 0;
      if (win.matches('.is-done')) {
        follow.opened = true;
        const again = $('[data-again]:not(.disabled)', win);
        if (again && now - follow.againAt > 3000) {
          follow.againAt = now;
          status(`${text($('.t5-done-h', win)).replace(/^✓\s*/, '')} Continuando a sessão com ${partner}.`, 'run');
          again.click();
        }
        return;
      }
      // Another trainer's trade: not ours to answer.
      if (!sameName(partnerOf(win), follow.partner)) return;
      follow.opened = true;
      follow.at = now;
      const theirs = $('.t5-offer:not(.is-mine):not(.is-empty)', win);
      const mine = $('.t5-offer.is-mine:not(.is-empty)', win);
      if (!theirs) {
        status(`Esperando ${partner} escolher o Pokémon…`);
        return;
      }
      if (!mine) {
        if (now - follow.offeredAt < 3000) return;
        const choice = pickRandom(win);
        if (choice) {
          follow.offeredAt = now;
          status(`Oferecendo um Pokémon da caixa para ${partner}…`);
          choice.click();
          return;
        }
        const clear = $('[data-pc-clear]', win);
        const next = $('[data-pc-page="1"]:not([disabled])', win);
        if (clear || next) {
          follow.offeredAt = now;
          (clear ?? next).click();
          return;
        }
        answer(follow.partner, follow.id, 'não tem Pokémon disponível na caixa para oferecer');
        follow = null;
        status(`Sem Pokémon na caixa para oferecer a ${partner}.`, 'bad');
        return;
      }
      const ok = $('[data-ok]:not(.disabled)', win);
      if (ok && now - follow.okAt > 3000) {
        follow.okAt = now;
        status(`Confirmando a troca com ${partner}…`);
        ok.click();
      }
    }

    // The game redraws its windows when the server answers, so DOM changes drive both sides; the
    // interval covers the rest (a background tab still runs it about once a second).
    new MutationObserver(() => {
      // A freshly drawn menu gets the block right away (no flash); the interval keeps it current.
      const pick = $('.t5-pick[data-pick]');
      if (pick && !$('.pafk-trade-act', pick)) syncPicks();
      if (myName && (follow || store.get(ASK_PREFIX + myName, null))) answerTick();
    }).observe(document.body, { childList: true, subtree: true });
    setInterval(() => {
      syncPicks();
      answerTick();
    }, 700);
    if (typeof GM_addValueChangeListener === 'function') {
      // Requests for this account, as soon as another tab writes them.
      let listeningFor = '';
      setInterval(() => {
        if (!myName || listeningFor === myName) return;
        listeningFor = myName;
        const key = ASK_PREFIX + myName;
        GM_addValueChangeListener(key, (_key, _old, value, remote) => {
          if (remote && value && key === ASK_PREFIX + myName) answerTick();
        });
      }, 1000);
    }
  })();

  if (moduleEnabled('dodge')) (() => {
    // ==== src/dodge.js ====
    // ---- Desvio de golpes em área ----------------------------------------------------------------
    // Adds a DESVIO button to the combat bar. While it is on, the hunt keeps its mode (AUTO or
    // MANUAL) and, when the red warning of an enemy area attack covers the main Pokémon, the script
    // steps out of it with the arrow keys. Only the canvas pixels are read (no game internals: the
    // client detects hooks). The warning reaches the client already late by the network delay, so
    // 0.3 s attacks cannot be dodged; slow ones (0.6 s and more) can.
    //
    // From AUTO the first step makes the game ask the server for MANUAL (one round trip) and the
    // script clicks AUTO again once the attack has passed. In MANUAL steps go out at once and the
    // server's "AUTO POR INATIVIDADE" keeps attacking between dodges. The game only takes movement
    // in the focused tab, so nothing happens in background tabs.
    (() => {
      const STORAGE = 'pokeafk-market-filtros:dodge';
      const TILE = 16;
      // More steps never fit in the warning time (a step takes 267 ms).
      const MAX_STEPS = 2;
      const SCAN_EVERY = 30;
      // The first step from AUTO waits for the server to switch to MANUAL.
      const FIRST_STEP_TIMEOUT = 900;
      const STEP_TIMEOUT = 350;
      // Keeps still a little after the steps so the hit lands before AUTO walks back.
      const SETTLE_MS = 350;
      // Real input from the player pauses the dodging for this long.
      const USER_QUIET = 3000;
      const BLOCKED_FOR = 2500;
      const KEYS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
      const DELTA = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

      let enabled = readEnabled();
      let raf = 0;
      let lastScan = 0;
      let frame = null;
      let pet = null;
      let petMisses = 0;
      let sprite = null;
      let dodging = false;
      let restUntil = 0;
      let lastUserInput = 0;
      const blocked = new Map();
      const tries = new Map();
      const stats = { tried: 0, out: 0, late: 0, blocked: 0 };

      function readEnabled() {
        try {
          return localStorage.getItem(STORAGE) === '1';
        } catch {
          return false;
        }
      }

      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

      // ---- Page state ----

      const modeNow = () => document.querySelector('.mb-modes .mb-mode.on')?.dataset.mode ?? null;
      const hunting = () => !!document.querySelector('.hud-act.hunt.on, .hud.world-hud.hunting');

      function canAct() {
        if (!enabled || document.hidden || !document.hasFocus()) return false;
        if (!hunting() || document.querySelector('#pafk-daily[data-running]')) return false;
        const bar = document.querySelector('.mb-modes');
        if (!bar || bar.closest('[hidden]')) return false;
        const active = document.activeElement;
        return !active?.matches?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
      }

      function worldCanvas() {
        return [...document.querySelectorAll('canvas')]
          .filter(canvas => canvas.width && !canvas.dataset.pafk
            && canvas.getBoundingClientRect().width / canvas.width > 1.2
            && !canvas.closest('[hidden]') && !canvas.classList.contains('title-scene'))
          .sort((a, b) => b.width * b.height - a.width * a.height)[0];
      }

      function readFrame() {
        const canvas = worldCanvas();
        if (!canvas) return null;
        try {
          const { width: w, height: h } = canvas;
          return { d: canvas.getContext('2d').getImageData(0, 0, w, h).data, w, h };
        } catch {
          return null;
        }
      }

      const near = (f, x, y, [r, g, b], tol) => {
        if (x < 0 || y < 0 || x >= f.w || y >= f.h) return false;
        const k = (y * f.w + x) * 4;
        return Math.abs(f.d[k] - r) <= tol && Math.abs(f.d[k + 1] - g) <= tol && Math.abs(f.d[k + 2] - b) <= tol;
      };

      // ---- Where the main Pokémon is ----
      // The game draws a 16 px HP bar (18×4 box in #283840) 4 px above the head of each Pokémon. The
      // player's one is the bar whose fill matches the HP in the HUD; its left edge is the tile's
      // left edge, and the tile's top comes from the visible height of the overworld sprite.

      const BAR = [40, 56, 64];
      const BAR_BG = [80, 104, 96];

      function hudHp() {
        const m = (document.querySelector('.hud-hp-numbers')?.textContent || '').replace(/\./g, '')
          .match(/(\d+)\s*\/\s*(\d+)/);
        return m && +m[2] ? { hp: +m[1], max: +m[2] } : null;
      }

      function petSprite() {
        const src = document.querySelector('.hud-active-button img.front')?.getAttribute('src') || '';
        const id = src.match(/\/front\/([\w-]+)\.png/)?.[1];
        if (!id) return null;
        if (sprite?.id === id) return sprite.visH ? sprite : null;
        sprite = { id, visH: 0 };
        const current = sprite;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let top = 0;
          outer: for (; top < canvas.height; top++)
            for (let x = 0; x < canvas.width; x++) if (data[(top * canvas.width + x) * 4 + 3]) break outer;
          current.visH = canvas.height - top;
        };
        img.src = `/assets/mon/ow/${id}.png`;
        return null;
      }

      function findBars(f) {
        const bars = [];
        for (let y = 1; y < f.h - 3; y++) {
          let run = 0;
          for (let x = 0; x <= f.w; x++) {
            if (x < f.w && near(f, x, y, BAR, 10)) { run++; continue; }
            const x0 = x - 18;
            if (run === 18 && near(f, x0, y + 3, BAR, 10) && near(f, x0 + 17, y + 3, BAR, 10)
              && near(f, x0, y + 1, BAR, 10) && near(f, x0 + 17, y + 1, BAR, 10) && !near(f, x0 + 1, y + 1, BAR, 10)) {
              let fill = 0;
              while (fill < 16 && !near(f, x0 + 1 + fill, y + 1, BAR_BG, 14)) fill++;
              bars.push({ x: x0 + 1, y: y + 1, fill });
            }
            run = 0;
          }
        }
        return bars;
      }

      function locatePet(f) {
        const look = petSprite();
        const hp = hudHp();
        const bars = look && hp ? findBars(f) : [];
        const want = hp ? Math.ceil(16 * Math.max(0, hp.hp / hp.max)) : 0;
        const prev = pet;
        let best = null;
        let bestScore = Infinity;
        for (const bar of bars) {
          const off = prev ? Math.abs(bar.x - prev.x) + Math.abs(bar.y + 4 - TILE + look.visH - prev.top) : 0;
          const miss = Math.abs(bar.fill - want);
          // The HUD may lag a hit behind the bar; a bar right where the pet was still counts.
          if (miss > 1 && !(prev && off <= 20 && miss <= 3)) continue;
          const score = miss * 1000 + off;
          if (score < bestScore) { best = bar; bestScore = score; }
        }
        if (best) {
          pet = { x: best.x, top: best.y + 4 - TILE + look.visH };
          petMisses = 0;
        } else if (++petMisses > 10) pet = null;
      }

      // ---- Warnings ----
      // Enemy warnings have opaque #f86048 edges around the tiles they will hit (the fill is
      // translucent). Edge runs are grouped into boxes; the tiles inside are told apart by the
      // edges on the Pokémon's row and column.

      const EDGE = [248, 96, 72];
      const isEdge = (f, x, y) => near(f, x, y, EDGE, 6);

      function findBoxes(f) {
        const { w, h } = f;
        const mask = new Uint8Array(w * h);
        for (let i = 0, k = 0; i < w * h; i++, k += 4) {
          if (Math.abs(f.d[k] - 248) <= 6 && Math.abs(f.d[k + 1] - 96) <= 6 && Math.abs(f.d[k + 2] - 72) <= 6) mask[i] = 1;
        }
        const segs = [];
        for (let y = 0; y < h; y++) {
          let run = 0;
          for (let x = 0; x <= w; x++) {
            if (x < w && mask[y * w + x]) { run++; continue; }
            if (run >= 12) segs.push([x - run, y, x - 1, y]);
            run = 0;
          }
        }
        for (let x = 0; x < w; x++) {
          let run = 0;
          for (let y = 0; y <= h; y++) {
            if (y < h && mask[y * w + x]) { run++; continue; }
            if (run >= 12) segs.push([x, y - run, x, y - 1]);
            run = 0;
          }
        }
        const boxes = [];
        for (const seg of segs) {
          let box = seg.slice();
          for (let i = boxes.length - 1; i >= 0; i--) {
            const b = boxes[i];
            if (b[0] <= box[2] + 1 && box[0] <= b[2] + 1 && b[1] <= box[3] + 1 && box[1] <= b[3] + 1) {
              box = [Math.min(b[0], box[0]), Math.min(b[1], box[1]), Math.max(b[2], box[2]), Math.max(b[3], box[3])];
              boxes.splice(i, 1);
            }
          }
          boxes.push(box);
        }
        return boxes.filter(b => b[2] - b[0] >= 14 && b[3] - b[1] >= 14);
      }

      const boxSize = box => [Math.round((box[2] - box[0] + 1) / TILE), Math.round((box[3] - box[1] + 1) / TILE)];
      const cellIn = (box, p) => [Math.round((p.x - box[0]) / TILE), Math.round((p.top - box[1]) / TILE)];

      function tileEdge(f, box, col, row, side) {
        const tx = box[0] + col * TILE;
        const ty = box[1] + row * TILE;
        for (let i = 2; i <= 13; i++) {
          if (side === 'left' && isEdge(f, tx, ty + i)) return true;
          if (side === 'right' && isEdge(f, tx + TILE - 1, ty + i)) return true;
          if (side === 'top' && isEdge(f, tx + i, ty)) return true;
          if (side === 'bottom' && isEdge(f, tx + i, ty + TILE - 1)) return true;
        }
        return false;
      }

      // Steps to leave the warning in each direction, or null when the Pokémon is not inside it.
      function exitsFrom(f, box, p) {
        const [cols, rows] = boxSize(box);
        const [col, row] = cellIn(box, p);
        if (col < 0 || row < 0 || col >= cols || row >= rows) return null;
        // Walking away from the Pokémon, the first edge met tells which side of the shape it is on.
        const scan = (from, to, step, exitSide, entrySide, at) => {
          for (let k = from; k !== to; k += step) {
            if (at(k, exitSide)) return { exit: Math.abs(k - from) + 1 };
            if (k !== from && at(k, entrySide)) return { outside: true };
          }
          return { exit: null };
        };
        const onRow = (k, side) => tileEdge(f, box, k, row, side);
        const onCol = (k, side) => tileEdge(f, box, col, k, side);
        const right = scan(col, cols, 1, 'right', 'left', onRow);
        const left = scan(col, -1, -1, 'left', 'right', onRow);
        const down = scan(row, rows, 1, 'bottom', 'top', onCol);
        const up = scan(row, -1, -1, 'top', 'bottom', onCol);
        if (right.outside || left.outside || down.outside || up.outside) return null;
        return {
          right: right.exit ?? cols - col,
          left: left.exit ?? col + 1,
          down: down.exit ?? rows - row,
          up: up.exit ?? row + 1,
        };
      }

      function planDodge(f, boxes) {
        const now = performance.now();
        for (const box of boxes) {
          const exits = exitsFrom(f, box, pet);
          if (!exits) continue;
          const key = box.join(',');
          if ((tries.get(key) ?? 0) >= 2) continue;
          const options = Object.entries(exits)
            .filter(([dir, steps]) => steps <= MAX_STEPS && (blocked.get(dir) ?? 0) < now)
            .filter(([dir, steps]) => {
              const [dx, dy] = DELTA[dir];
              const to = { x: pet.x + dx * steps * TILE, top: pet.top + dy * steps * TILE };
              return to.x >= 0 && to.top >= 0 && to.x + TILE <= f.w && to.top + TILE <= f.h
                && !boxes.some(other => other !== box && exitsFrom(f, other, to));
            })
            .sort((a, b) => a[1] - b[1]);
          if (!options.length) continue;
          tries.set(key, (tries.get(key) ?? 0) + 1);
          if (tries.size > 50) tries.delete(tries.keys().next().value);
          return { box, options: options.map(([dir, steps]) => ({ dir, steps })) };
        }
        return null;
      }

      // ---- Dodging ----

      function press(dir) {
        const init = { key: KEYS[dir], code: KEYS[dir], bubbles: true, cancelable: true };
        // Tampermonkey's sandbox has no bare dispatchEvent; send to the page's window.
        const target = document.defaultView ?? window;
        target.dispatchEvent(new KeyboardEvent('keydown', init));
        target.dispatchEvent(new KeyboardEvent('keyup', init));
      }

      async function waitFor(test, timeout) {
        const end = performance.now() + timeout;
        while (performance.now() < end) {
          if (test()) return true;
          await sleep(20);
        }
        return test();
      }

      // The warning being dodged, followed from frame to frame: it stays put in the world while the
      // camera may pan with the Pokémon, so moves are measured against it, not against the screen.
      let target = null;
      let frameBoxes = [];

      function followTarget() {
        if (!target) return null;
        let best = null;
        let bestDist = TILE * 1.5;
        for (const box of frameBoxes) {
          const dist = Math.abs(box[0] + box[2] - target[0] - target[2]) / 2
            + Math.abs(box[1] + box[3] - target[1] - target[3]) / 2;
          if (dist < bestDist) { best = box; bestDist = dist; }
        }
        target = best;
        return best;
      }

      const petCell = () => {
        const box = followTarget();
        return box && pet ? cellIn(box, pet) : null;
      };

      // One step: 'moved', 'blocked' (a wall, another Pokémon, the hunt's edge) or 'gone' (the
      // warning ended, so the attack landed before the step showed).
      async function step(dir, timeout) {
        const [dx, dy] = DELTA[dir];
        const cell = petCell();
        const screen = pet;
        press(dir);
        let moved = false;
        await waitFor(() => {
          const now = petCell();
          if (cell && now) moved = (now[0] - cell[0]) * dx + (now[1] - cell[1]) * dy >= 1;
          else if (!cell && screen && pet) moved = (pet.x - screen.x) * dx + (pet.top - screen.top) * dy >= TILE / 2;
          return moved || (cell && !target);
        }, timeout);
        if (moved) return 'moved';
        return cell && !target ? 'gone' : 'blocked';
      }

      async function runDodge(plan) {
        dodging = true;
        target = plan.box;
        stats.tried++;
        const fromAuto = modeNow() === 'auto';
        const started = performance.now();
        try {
          let result = 'blocked';
          let firstStep = true;
          // A blocked way is dropped for a while and the next best one is tried.
          ways: for (const { dir, steps } of plan.options) {
            for (let i = 0; i < steps; i++) {
              const moved = await step(dir, firstStep && fromAuto ? FIRST_STEP_TIMEOUT : STEP_TIMEOUT);
              firstStep = false;
              if (moved === 'gone') { result = 'late'; break ways; }
              if (moved === 'blocked') {
                blocked.set(dir, performance.now() + BLOCKED_FOR);
                break;
              }
              if (i === steps - 1) {
                // Out in time only if the warning is still there once the Pokémon has left it.
                const box = followTarget();
                result = box && pet && !exitsFrom(frame, box, pet) ? 'out' : 'late';
                break ways;
              }
            }
          }
          stats[result]++;
          await sleep(SETTLE_MS);
        } finally {
          target = null;
          if (fromAuto) restoreAuto(started);
          restUntil = performance.now() + 250;
          dodging = false;
          updateButton();
        }
      }

      // Back to AUTO after a dodge that started there. The server may still be answering the switch
      // to MANUAL, so it checks again a few times; the player's own input always wins.
      async function restoreAuto(since) {
        for (let i = 0; i < 4 && enabled; i++) {
          if (lastUserInput > since || modeNow() !== 'manual') return;
          document.querySelector('.mb-modes .mb-mode[data-mode="auto"]')?.click();
          await sleep(700);
        }
      }

      function tick(now) {
        raf = enabled ? requestAnimationFrame(tick) : 0;
        if (now - lastScan < SCAN_EVERY) return;
        lastScan = now;
        if (!canAct()) {
          pet = null;
          return;
        }
        frame = readFrame();
        if (!frame) return;
        locatePet(frame);
        frameBoxes = findBoxes(frame);
        if (dodging || !pet || now < restUntil || now - lastUserInput < USER_QUIET) return;
        const plan = planDodge(frame, frameBoxes);
        if (plan) runDodge(plan);
      }

      // Real input from the player wins: dodging pauses for a while.
      const onPlayerInput = event => {
        if (!event.isTrusted || button.contains(event.target)) return;
        if (event.type === 'keydown' && !/^(Arrow|[wasdWASD1-4]$)/.test(event.key)) return;
        if (event.type === 'pointerdown' && !event.target.closest?.('canvas, .mb-modes, .mb-slots')) return;
        lastUserInput = performance.now();
      };
      addEventListener('keydown', onPlayerInput, true);
      addEventListener('pointerdown', onPlayerInput, true);

      // ---- Button ----
      // A one-button group next to AUTO/MANUAL with the same look, copied from the game's own
      // buttons at runtime: filled when on, plain text when off.

      const group = document.createElement('span');
      group.className = 'pafk-dodge-group';
      group.dataset.pafk = '';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pafk-dodge';
      button.textContent = 'DESVIO';
      group.append(button);

      const style = document.createElement('style');
      style.dataset.pafk = '';
      style.textContent = `
        .pafk-dodge-group {
          display: inline-flex; align-items: center; margin-left: 6px;
          background: var(--pafk-g-bg, #fff); border: var(--pafk-g-border, 1px solid #b9cde6);
          border-radius: var(--pafk-g-radius, 6px); padding: var(--pafk-g-pad, 1px);
        }
        .pafk-dodge {
          appearance: none; border: 0; margin: 0; cursor: pointer;
          font: var(--pafk-b-font, inherit); padding: var(--pafk-b-pad, 0 7px);
          height: var(--pafk-b-h, auto); border-radius: var(--pafk-b-radius, 4px);
          background: var(--pafk-off-bg, transparent); color: var(--pafk-off-fg, #3f5585);
        }
        .pafk-dodge[aria-pressed="true"] {
          background: var(--pafk-on-bg, #14c2f0); color: var(--pafk-on-fg, #062a63);
          box-shadow: var(--pafk-on-shadow, none);
        }
        .pafk-dodge:focus-visible { outline: 2px solid var(--pafk-on-fg, #062a63); outline-offset: 1px; }`;
      document.head.append(style);

      function copyTheme() {
        const modes = document.querySelector('.mb-modes');
        const on = modes?.querySelector('.mb-mode.on');
        const off = modes?.querySelector('.mb-mode:not(.on)');
        if (!modes || !on || !off) return;
        const g = getComputedStyle(modes);
        const a = getComputedStyle(on);
        const b = getComputedStyle(off);
        const vars = {
          '--pafk-g-bg': g.background, '--pafk-g-border': `${g.borderTopWidth} ${g.borderTopStyle} ${g.borderTopColor}`,
          '--pafk-g-radius': g.borderRadius, '--pafk-g-pad': g.padding,
          '--pafk-b-font': b.font, '--pafk-b-pad': b.padding, '--pafk-b-h': b.height, '--pafk-b-radius': b.borderRadius,
          '--pafk-off-bg': b.background, '--pafk-off-fg': b.color,
          '--pafk-on-bg': a.background, '--pafk-on-fg': a.color, '--pafk-on-shadow': a.boxShadow,
        };
        for (const [name, value] of Object.entries(vars)) group.style.setProperty(name, value);
      }

      function updateButton() {
        button.setAttribute('aria-pressed', String(enabled));
        const result = stats.tried
          ? ` Nesta sessão: ${stats.tried} tentados, ${stats.out} saíram antes do golpe, ${stats.late} tarde demais, ${stats.blocked} sem caminho livre.`
          : '';
        button.title = enabled
          ? `Desvio LIGADO: sai dos golpes em área lentos andando 1 ou 2 quadrados. Só funciona com a aba em foco. Clique para desligar.${result}`
          : 'Desvio DESLIGADO. Clique para ligar: sai dos golpes em área lentos durante a caça (só com a aba em foco).';
      }

      button.addEventListener('click', event => {
        event.stopPropagation();
        enabled = !enabled;
        try {
          localStorage.setItem(STORAGE, enabled ? '1' : '0');
        } catch {}
        updateButton();
        if (enabled && !raf) raf = requestAnimationFrame(tick);
      });

      function mount() {
        const modes = document.querySelector('.mb-modes');
        if (!modes) return;
        if (group.previousElementSibling !== modes) modes.after(group);
        copyTheme();
        updateButton();
      }
      mount();
      setInterval(mount, 1000);
      if (enabled) raf = requestAnimationFrame(tick);
    })();
  })();
})();
