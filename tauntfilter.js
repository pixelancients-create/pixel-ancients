/*
 * Taunt filter: keeps slurs and abuse out of taunts.
 * Wraps the open-source `obscenity` word list (vendor/obscenity.min.js) and first undoes common disguises:
 * letter swaps (1 for i, @ for a), spaced-out letters (a b c), stretched letters (aaaa), accents and caps.
 * Admins add local-language words in config.js -> taunts.blockedWords.
 * If the word list fails to load, every taunt counts as blocked, so nothing unchecked is ever shown.
 */
(function (root) {
  const LEET = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '+': 't', '8': 'b', '9': 'g', '6': 'g', '2': 'z' };
  const base = t => String(t || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const deleet = t => t.replace(/[0-9!|@$+]/g, c => LEET[c] || c);
  const lettersOnly = t => t.replace(/[^a-z]/g, '');
  const collapse = (t, n) => t.replace(/([a-z])\1+/g, (m, c) => c.repeat(Math.min(m.length, n)));
  // "a b c", "a.b.c", "a-b-c" -> "abc" (runs of single letters only, so normal words keep their spaces)
  const joinSingles = t => t.replace(/(^|[^a-z])([a-z](?:[\s._*\-~]+[a-z])+)(?=[^a-z]|$)/g, (m, pre, run) => pre + run.replace(/[^a-z]/g, ''));

  function create(O, opts) {
    opts = opts || {};
    let matcher = null;
    try { matcher = new O.RegExpMatcher({ ...O.englishDataset.build(), ...O.englishRecommendedTransformers }); } catch (e) { matcher = null; }
    // Terms the library lists but only matches in narrow forms: also block them as whole words.
    // Read from the library's own data at runtime, so no word list lives in this file.
    let wholeRe = null, longCompact = [];
    const wordSet = new Set();
    if (matcher) {
      const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const extra = [];
      for (const c of (O.englishDataset.containers || [])) {
        const w = c.metadata && c.metadata.originalWord;
        if (w && !matcher.hasMatch(w)) extra.push(esc(base(w)));
      }
      if (extra.length) wholeRe = new RegExp('(^|[^a-z])(' + extra.join('|') + ')(?=[^a-z]|$)');
      // longer ones (6+ letters) are also caught when spelled out letter by letter
      longCompact = extra.map(w => w.replace(/[^a-z]/g, '')).filter(w => w.length >= 6);
      // every listed word, compared as a whole word after stretched letters are squashed;
      // multi-word phrases are also compared with their spaces removed
      for (const c of (O.englishDataset.containers || [])) {
        const w = c.metadata && c.metadata.originalWord;
        if (!w) continue;
        const bw = base(w);
        if (/\s/.test(bw)) { const flat = lettersOnly(bw); if (flat.length >= 6) longCompact.push(flat); }
        else wordSet.add(lettersOnly(bw));
      }
    }
    // A word matches a listed word exactly, or with stretched letters (3+ in a row) squashed;
    // squashing every double letter is only allowed for long words, so short everyday words never collide.
    const squashedLong = new Set();
    function tokenHit(tok) {
      if (!squashedLong.size) for (const w of wordSet) { const sq = collapse(w, 1); if (sq.length >= 5) squashedLong.add(sq); }
      if (wordSet.has(tok)) return true;
      const t1 = tok.replace(/([a-z])\1{2,}/g, '$1'), t2 = tok.replace(/([a-z])\1{2,}/g, '$1$1');
      if (wordSet.has(t1) || wordSet.has(t2)) return true;
      const sq = collapse(tok, 1);
      return sq.length >= 5 && squashedLong.has(sq);
    }
    const allow = ['shiitake'].concat(opts.allowedWords || []).map(w => base(w)).filter(Boolean);
    const blocked = (opts.blockedWords || []).map(w => collapse(lettersOnly(deleet(base(w))), 1)).filter(w => w.length >= 2);

    function variants(t) {
      const out = new Set();
      for (let b of [base(t), deleet(base(t)), deleet(base(t).replace(/!+(?=[^a-z]|$)/g, ' '))]) {
        for (const w of allow) b = b.split(w).join(' ');
        out.add(b); out.add(collapse(b, 2)); out.add(collapse(b, 1)); out.add(b.replace(/([a-z])\1{2,}/g, '$1'));
      }
      for (const v of [...out]) out.add(joinSingles(v));
      return [...out];
    }

    return {
      ready: !!matcher,
      isBlocked(text) {
        const t = String(text || '').trim();
        if (!t) return false;
        if (!matcher) return true;
        const vs = variants(t);
        if (vs.some(v => matcher.hasMatch(v))) return true;
        if (wholeRe && vs.some(v => wholeRe.test(v))) return true;
        if (wordSet.size && vs.some(v => v.split(/[^a-z]+/).some(tok => tok && tokenHit(tok)))) return true;
        if (longCompact.length) {
          const flat = vs.map(v => lettersOnly(v));
          if (longCompact.some(w => flat.some(c => c.includes(w) || collapse(c, 1).includes(collapse(w, 1))))) return true;
        }
        if (!blocked.length) return false;
        const compact = vs.map(v => collapse(lettersOnly(v), 1));
        return blocked.some(w => compact.some(c => c.includes(w)));
      },
    };
  }

  const api = { create, _internals: { base, deleet, lettersOnly, collapse, joinSingles } };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TauntFilter = api;
})(typeof self !== 'undefined' ? self : this);
