module.exports = (str) => {
  // \# -> #
  const simpleSymbols = ['#', '$', '%', '&', '_', '{', '}'];
  // \alpha -> α
  const greeks = [{ s: 'alpha', t: 'α' }, { s: 'beta', t: 'β' }, { s: 'gamma', t: 'γ' }, , { s: 'delta', t: 'δ' }, { s: 'epsilon', t: 'ϵ' },
  { s: 'varepsilon', t: 'ε' }, { s: 'zeta', t: 'ζ' }, { s: 'eta', t: 'η' }, { s: 'theta', t: 'θ' }, { s: 'vartheta', t: 'ϑ' },
  { s: 'iota', t: 'ι' }, { s: 'kappa', t: 'κ' }, { s: 'lambda', t: 'λ' }, { s: 'mu', t: 'μ' }, { s: 'nu', t: 'ν' },
  { s: 'xi', t: 'ξ' },/*{s:'o',t:'o'},*/{ s: 'pi', t: 'π' }, { s: 'varpi', t: 'ϖ' }, { s: 'rho', t: 'ρ' }, { s: 'varrho', t: 'ϱ' },
  { s: 'sigma', t: 'σ' }, , { s: 'varsigma', t: 'ς' }, { s: 'tau', t: 'τ' }, { s: 'upsilon', t: 'υ' },
  { s: 'chi', t: 'χ' }, { s: 'psi', t: 'ψ' }, { s: 'omega', t: 'ω' }, { s: 'Gamma', t: 'Γ' }, { s: 'Lambda', t: 'Λ' }, { s: 'Sigma', t: 'Σ' },
  { s: 'Psi', t: 'Ψ' }, { s: 'Delta', t: 'Δ' }, { s: 'Xi', t: 'Ξ' }, { s: 'Upsilon', t: 'Υ' }, { s: 'Omega', t: 'Ω' }, { s: 'Theta', t: 'Θ' },
  { s: 'Pi', t: 'Π' }, { s: 'Phi', t: 'Φ' }, { s: 'sum', t: '∑' }, { s: 'prod', t: '∏' }
  ];
  // \pm -> ±
  const maths = [
    { s: 'pm', t: '±' }, { s: 'mp', t: '∓' }, { s: 'times', t: '×' }, { s: 'div', t: '÷' }, { s: 'ast', t: '∗' }, { s: 'star', t: '⋆' },
    { s: 'circ', t: '∘' }, { s: 'bullet', t: '∙' }, { s: 'cdot', t: '⋅' }, { s: 'diamond', t: '⋄' }, { s: 'bigtriangleup', t: '△' },
    { s: 'bigtriangledown', t: '▽' }, { s: 'traiangleleft', t: '◃' }, { s: 'traiangleright', t: '	▹' }, { s: 'bigcirc', t: '◯' },
    { s: 'dagger', t: '†' }, { s: 'leq', t: '≤' }, { s: 'geq', t: '≥' }, { s: 'equiv', t: '≡' }, { s: 'sim', t: '∼' }, { s: 'simeq', t: '≃' },
    { s: 'approx', t: '≈' }, { s: 'neq', t: '≠' }, { s: 'propto', t: '∝' }, { s: 'prep', t: '⊥' }, { s: 'parallel', t: '∥' },
    { s: 'leftarrow', t: '←' }, { s: 'Leftarrow', t: '⇐' }, { s: 'rightarrow', t: '→' }, { s: 'Rightarrow', t: '⇒' },
    { s: 'leftrightarrow', t: '↔' }, { s: 'Leftrightarrow', t: '⇔' }, { s: 'longleftarrow', t: '⟵' }, { s: 'Longleftarrow', t: '⟸' },
    { s: 'longrightarrow', t: '⟶' }, { s: 'Longrightarrow', t: '⟹' }, { s: 'uparrow', t: '↑' }, { s: 'Uparrow', t: '⇑' },
    { s: 'downarrow', t: '↓' }, { s: 'Downarrow', t: '⇓' }, { s: 'updownarrow', t: '↕' }, { s: 'Updownarrow', t: '⇕' },
    { s: 'nearrow', t: '↗' }, { s: 'searrow', t: '↘' }, { s: 'swarrow', t: '↙' }, { s: 'nwarrow', t: '↖' }, { s: 'angle', t: '∠' },
    { s: 'flat', t: '♭' }, { s: 'natural', t: '♮' }, { s: 'sharp', t: '♯' }, { s: 'backslash', t: '	∖' }, { s: 'partial', t: '∂' },
    { s: 'infinity', t: '∞' }, { s: 'triangle', t: '△' }, { s: 'clubsuit', t: '♣' }, { s: 'diamondsuit', t: '♢' }, { s: 'heartsuit', t: '♡' }, { s: 'spadesuit', t: '♠' }
  ];

  greeks.forEach(st => {
    str = str.replace(new RegExp(`\\\\${st.s}`, 'g'), st.t);
  });

  maths.forEach(st => {
    str = str.replace(new RegExp(`\\\\${st.s}`, 'g'), st.t);
  });

  // fontStyle: \texttt{abc} -> abc
  str = str.replace(/\\text.+?\{(.+?)\}/g, '$1')

  // simple Math: $abc$ -> abc
  str = str.replace(/\$([a-zA-Z]+?)\$/g, '$1');

  simpleSymbols.forEach(s => {
    str = str.replace(new RegExp(`\\\\${s}`, 'g'), s);
  });

  return str;
}

