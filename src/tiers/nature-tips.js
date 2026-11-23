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
