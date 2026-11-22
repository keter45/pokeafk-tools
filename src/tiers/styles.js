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
