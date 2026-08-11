import katex from 'katex'

const test = (label, tex) => {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: false })
    console.log(`OK   ${label}: ${JSON.stringify(tex)}`)
  } catch (e) {
    console.log(`FAIL ${label}: ${JSON.stringify(tex)}  -> ${e.message.slice(0, 80)}`)
  }
}

// warn-char conversions
test('circ', '\\DeltaG^{\\circ}')
test('bar-over', '\\overset{\\bar{}}{C}')
test('square', '\\square \\in {\\wedge,\\vee}')
test('theta-italic', '\\cos \\theta')
test('mu', '(\\mu)')

// command-boundary fixes
test('Rightarrowx->space', '\\Rightarrow\\ x = 0')
test('toR', 'R\\to\\ R')
test('inR', '\\in\\ R')
test('circC', '27^{\\circ}\\ C')
test('mathbfR', '\\mathbf R')
test('sinx', '\\sin\\ x')
test('overleftarrow intact', '\\overleftarrow{AB}')
test('Rightarrown', '\\Rightarrow\\ n')
test('pielectrons', '\\pi\\ electrons')
test('alphaand', '\\alpha\\ and\\ \\beta')
test('DeltaABC', '\\Delta\\ ABC')
test('rightarrowQ', 'I\\rightarrow\\ Q')
test('mathrmCrO5', '\\mathrm{Cr\\ O_5}')
test('Expected-group-underscore', '\\mathrm{HCN}\\ is')

// what does an unmatched _ produce?
test('underscore-space', 'm \\ n')
test('_ space', 'a_ b')

// char metric check
for (const c of ['₂', 'º', 'µ']) {
  try {
    katex.renderToString(`x${c}y`, { throwOnError: true, strict: false })
    console.log(`OK   char ${JSON.stringify(c)} renders (no throw)`)
  } catch (e) {
    console.log(`THROW char ${JSON.stringify(c)} -> ${e.message.slice(0, 60)}`)
  }
}
