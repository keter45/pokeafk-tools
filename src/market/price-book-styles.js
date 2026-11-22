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
