// Shared class-token audit: every class is a prefixed Tailwind utility or an allowed Bootstrap class.
const BOOTSTRAP = new Set(('navbar navbar-expand-md fixed-top navbar-toggler collapse navbar-collapse modal fade ' +
  'modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg modal-content modal-header modal-body ' +
  'btn-close btn-close-white toast toast-body visually-hidden visually-hidden-focusable bi').split(' '));

// Utility part of a Tailwind token: text after the last ':' that is outside [...].
function utilityPart(token) {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === '[') depth++;
    else if (token[i] === ']') depth--;
    else if (token[i] === ':' && depth === 0) cut = i;
  }
  return token.slice(cut + 1);
}

export function badClassTokens(source) {
  const bad = [];
  for (const m of source.matchAll(/\sclass="([^"]*)"/g)) {
    for (const token of m[1].split(/\s+/).filter(Boolean)) {
      const u = utilityPart(token).replace(/^!/, '');
      const ok = u.startsWith('tw-') || u.startsWith('-tw-') || BOOTSTRAP.has(token) || token.startsWith('bi-');
      if (!ok) bad.push(token);
    }
  }
  return [...new Set(bad)];
}
