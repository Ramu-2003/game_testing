/**
 * Deterministic Heuristic Validator for Coding Challenges
 * Ensures players can always validate code and progress even when
 * Groq AI is unconfigured, rate-limited, or offline.
 */

function extractQuotedStrings(str) {
  const matches = str.match(/['"`“]([^'"`”]+)['"`”]/g);
  if (!matches) return [];
  return matches.map(m => m.slice(1, -1).trim()).filter(Boolean);
}

function sourceIncludesToken(code, token) {
  const source = code.toLowerCase().replace(/\s+/g, ' ').trim();
  const required = token.toLowerCase().replace(/\s+/g, ' ').trim();
  return source.includes(required)
    || source.replace(/\s/g, '').includes(required.replace(/\s/g, ''));
}

function stripCodeComments(source, language) {
  const normalizedLanguage = String(language || '').toLowerCase();
  if (normalizedLanguage === 'html' || normalizedLanguage === 'web') {
    return String(source).replace(/<!--[\s\S]*?-->/g, '');
  }
  if (normalizedLanguage === 'css') {
    return String(source).replace(/\/\*[\s\S]*?\*\//g, '');
  }

  const lineComment = normalizedLanguage === 'python' ? '#' : ['javascript', 'js', 'java'].includes(normalizedLanguage) ? '//' : null;
  const blockComments = ['javascript', 'js', 'java'].includes(normalizedLanguage);
  if (!lineComment && !blockComments) return String(source);

  const input = String(source);
  let output = '';
  let quote = null;
  let escaped = false;
  for (let index = 0; index < input.length; index += 1) {
    const current = input[index];
    const next = input[index + 1];

    if (quote) {
      output += current;
      if (escaped) escaped = false;
      else if (current === '\\') escaped = true;
      else if (current === quote) quote = null;
      continue;
    }

    if (current === '"' || current === "'" || (current === '`' && ['javascript', 'js'].includes(normalizedLanguage))) {
      quote = current;
      output += current;
      continue;
    }

    if (blockComments && current === '/' && next === '*') {
      index += 2;
      while (index < input.length && !(input[index] === '*' && input[index + 1] === '/')) index += 1;
      index += 1;
      output += ' ';
      continue;
    }

    if (lineComment && (lineComment === '#' ? current === '#' : current === '/' && next === '/')) {
      while (index < input.length && input[index] !== '\n') index += 1;
      output += '\n';
      continue;
    }

    output += current;
  }

  return output;
}

function stripStringLiterals(source) {
  const input = String(source);
  let output = '';
  let quote = null;
  let escaped = false;
  for (const character of input) {
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      output += ' ';
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      output += ' ';
    } else {
      output += character;
    }
  }
  return output;
}

function hasExplicitCodeToken(code, description) {
  const token = description.match(/use the code token `([^`]+)`/i)?.[1];
  return !token || sourceIncludesToken(stripStringLiterals(code), token);
}

function extractTags(str) {
  const matches = str.match(/<\/?([a-z0-9-]+)/gi);
  if (!matches) return [];
  const set = new Set();
  for (const m of matches) {
    const clean = m.replace(/[<\/]/g, '').toLowerCase();
    if (clean) set.add(clean);
  }
  const headingRange = str.match(/<h([1-6])>\s+to\s+<h([1-6])/i);
  if (headingRange) {
    const first = Number(headingRange[1]);
    const last = Number(headingRange[2]);
    for (let level = Math.min(first, last); level <= Math.max(first, last); level += 1) {
      set.add(`h${level}`);
    }
  }
  return Array.from(set);
}

function extractTagTexts(str) {
  const re = /<([a-z0-9-]+)[^>]*>([^<]+)<\/([a-z0-9-]+)>/gi;
  const texts = [];
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m[1].toLowerCase() === m[3].toLowerCase() && m[2].trim()) {
      texts.push(m[2].trim().toLowerCase());
    }
  }
  return texts;
}

function evaluateHtmlTestCase(code, lowerCode, desc) {
  let checks = 0;
  if (desc.includes('doctype')) {
    checks += 1;
    return lowerCode.includes('!doctype') || lowerCode.includes('<!doctype html>');
  }

  // Check for HTML tags mentioned in description
  const tags = extractTags(desc);
  if (tags.length > 0) {
    checks += 1;
    const allTagsPresent = tags.every(tag => {
      return lowerCode.includes(`<${tag}`) || lowerCode.includes(`</${tag}>`);
    });
    if (!allTagsPresent) return false;
  }

  // Check for inner text of tags mentioned in description like <title>My First Page</title>
  const tagTexts = extractTagTexts(desc);
  if (tagTexts.length > 0) {
    checks += 1;
    const allTextsPresent = tagTexts.every(t => lowerCode.includes(t));
    if (!allTextsPresent) return false;
  }

  // Check for quoted text in description (e.g., "Hello World", 'My Page')
  const quoted = extractQuotedStrings(desc);
  if (quoted.length > 0) {
    checks += 1;
    const allQuotedPresent = quoted.every(q => sourceIncludesToken(code, q));
    if (!allQuotedPresent) return false;
  }

  // Check for common attributes if explicitly mentioned as standalone word
  const attrs = ['href', 'src', 'alt', 'class', 'id', 'style', 'type', 'placeholder', 'target', 'for', 'name', 'value', 'required', 'min', 'max', 'pattern', 'width', 'height', 'controls', 'datetime', 'role', 'aria-label'];
  for (const attr of attrs) {
    const attrRegex = new RegExp(`\\b${attr}\\b`, 'i');
    if (attrRegex.test(desc) && !desc.includes(`<${attr}`)) {
      checks += 1;
      const codeAttrRegex = ['required', 'controls'].includes(attr)
        ? new RegExp(`\\b${attr}(?:\\s|>|=)`, 'i')
        : new RegExp(`\\b${attr}\\s*=`, 'i');
      if (!codeAttrRegex.test(lowerCode)) return false;
    }
  }

  return checks > 0;
}

function evaluateCssTestCase(code, lowerCode, desc) {
  if (!hasExplicitCodeToken(code, desc)) return false;
  const cssProps = [
    'color', 'background', 'background-color', 'font-size', 'font-weight', 'font-family',
    'display', 'flex', 'grid', 'margin', 'padding', 'border', 'border-radius',
    'width', 'height', 'text-align', 'justify-content', 'align-items', 'gap',
    'box-shadow', 'opacity', 'transform', 'transition', 'position', 'top', 'left', 'z-index'
  ];

  const mentionedProps = cssProps.filter(p => {
    const reg = new RegExp(`\\b${p}\\b`, 'i');
    return reg.test(desc);
  });
  if (mentionedProps.length > 0) {
    if (!mentionedProps.every(p => lowerCode.includes(p))) return false;
  }

  const quoted = extractQuotedStrings(desc);
  if (quoted.length > 0) {
    const allQuotedPresent = quoted.every(q => sourceIncludesToken(code, q));
    if (!allQuotedPresent) return false;
  }

  if (!code.includes('{') || !code.includes('}')) {
    return false;
  }

  return mentionedProps.length > 0 || quoted.length > 0;
}

function evaluateJsTestCase(code, lowerCode, desc) {
  if (!hasExplicitCodeToken(code, desc)) return false;
  const quoted = extractQuotedStrings(desc);
  if (quoted.length > 0) {
    const allQuotedPresent = quoted.every(q => sourceIncludesToken(code, q));
    if (!allQuotedPresent) return false;
  }

  if (desc.includes('console.log') && !lowerCode.includes('console.log')) {
    return false;
  }

  if (desc.includes('return') && !lowerCode.includes('return')) {
    return false;
  }

  if (desc.includes('function') || desc.includes('arrow')) {
    if (!lowerCode.includes('function') && !lowerCode.includes('=>')) {
      return false;
    }
  }

  if (desc.includes('loop') || desc.includes('for') || desc.includes('while')) {
    if (!lowerCode.includes('for') && !lowerCode.includes('while') && !lowerCode.includes('map') && !lowerCode.includes('foreach')) {
      return false;
    }
  }

  return quoted.length > 0
    || desc.includes('console.log')
    || desc.includes('return')
    || desc.includes('function')
    || desc.includes('arrow')
    || desc.includes('loop')
    || desc.includes('for')
    || desc.includes('while');
}

function evaluatePythonTestCase(code, lowerCode, desc) {
  if (!hasExplicitCodeToken(code, desc)) return false;
  const quoted = extractQuotedStrings(desc);
  if (quoted.length > 0) {
    const allQuotedPresent = quoted.every(q => sourceIncludesToken(code, q));
    if (!allQuotedPresent) return false;
  }

  if (desc.includes('print') && !lowerCode.includes('print')) {
    return false;
  }

  if (desc.includes('def') || desc.includes('function')) {
    if (!lowerCode.includes('def')) return false;
  }

  if (desc.includes('return') && !lowerCode.includes('return')) {
    return false;
  }

  return quoted.length > 0
    || desc.includes('print')
    || desc.includes('def')
    || desc.includes('function')
    || desc.includes('return');
}

function evaluateJavaTestCase(code, lowerCode, desc) {
  if (!hasExplicitCodeToken(code, desc)) return false;
  const quoted = extractQuotedStrings(desc);
  if (quoted.length > 0) {
    const allQuotedPresent = quoted.every(q => lowerCode.includes(q.toLowerCase()));
    if (!allQuotedPresent) return false;
  }

  if ((desc.includes('print') || desc.includes('output')) && !lowerCode.includes('system.out.print')) {
    return false;
  }

  if (desc.includes('class') && !lowerCode.includes('class')) {
    return false;
  }

  if (desc.includes('main') && !lowerCode.includes('main')) {
    return false;
  }

  return quoted.length > 0
    || desc.includes('print')
    || desc.includes('output')
    || desc.includes('class')
    || desc.includes('main');
}

function evaluateGenericTestCase(code, lowerCode, desc) {
  const quoted = extractQuotedStrings(desc);
  if (quoted.length > 0) {
    return quoted.every(q => sourceIncludesToken(code, q));
  }
  return false;
}

function validateCodeHeuristic({ language, userCode, testCases = [], expectedOutput = '', challengeTitle = '' }) {
  if (!userCode || typeof userCode !== 'string' || userCode.trim().length === 0) {
    return {
      allTestsPassed: false,
      testResults: testCases.map(tc => ({
        id: tc.id,
        passed: false,
        message: 'No code submitted. Please write your solution.'
      })),
      errors: [{ line: 1, message: 'Empty code submission', type: 'EmptyCode' }],
      summary: 'Please write code before submitting.',
      completionPercentage: 0
    };
  }

  const cleanCode = stripCodeComments(userCode.trim(), language).trim();
  const lowerCode = cleanCode.toLowerCase();
  const errors = [];

  const testResults = testCases.map((tc, idx) => {
    const desc = (tc.description || '').toLowerCase();
    let passed = false;

    if (language === 'html' || language === 'web') {
      passed = evaluateHtmlTestCase(cleanCode, lowerCode, desc);
    } else if (language === 'css') {
      passed = evaluateCssTestCase(cleanCode, lowerCode, desc);
    } else if (language === 'javascript' || language === 'js') {
      passed = evaluateJsTestCase(cleanCode, lowerCode, desc);
    } else if (language === 'python') {
      passed = evaluatePythonTestCase(cleanCode, lowerCode, desc);
    } else if (language === 'java') {
      passed = evaluateJavaTestCase(cleanCode, lowerCode, desc);
    } else {
      passed = evaluateGenericTestCase(cleanCode, lowerCode, desc);
    }

    return {
      id: tc.id || idx + 1,
      passed,
      message: passed
        ? `Checkpoint verified: ${tc.description}`
        : `Requirement not satisfied: ${tc.description}`
    };
  });

  const allTestsPassed = testResults.length > 0 && testResults.every(r => r.passed);
  const passedCount = testResults.filter(r => r.passed).length;
  const totalCount = testResults.length || 1;
  const completionPercentage = Math.round((passedCount / totalCount) * 100);

  const summary = allTestsPassed
    ? 'All test checkpoints passed successfully!'
    : `Completed ${passedCount} of ${totalCount} checkpoints. Review the remaining requirements.`;

  return {
    allTestsPassed,
    testResults,
    errors,
    summary,
    completionPercentage
  };
}

module.exports = {
  validateCodeHeuristic
};
