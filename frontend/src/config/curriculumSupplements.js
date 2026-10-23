import { authoredChallengeBatches } from './authoredLessons';

const CURRICULUM = {
  css: [
    { topic: 'CSS selectors and visual states', tokens: ['.card', 'color', 'font-size', 'text-align', ':hover', 'background-color', 'border', 'box-shadow', 'transition', 'outline'] },
    { topic: 'Typography and readable text', tokens: ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'text-decoration', 'text-shadow', 'word-break'] },
    { topic: 'The box model', tokens: ['box-sizing', 'width', 'max-width', 'padding', 'margin', 'border', 'border-radius', 'box-shadow', 'min-height', 'overflow'] },
    { topic: 'Background gradients', tokens: ['background-color', 'linear-gradient', 'radial-gradient', 'background-size', 'background-position', 'background-repeat', 'background-attachment', 'background-image', 'opacity', 'border-radius'] },
    { topic: 'Flexbox alignment', tokens: ['display: flex', 'flex-direction', 'justify-content', 'align-items', 'gap', 'flex-wrap', 'align-self', 'order', 'flex-grow', 'flex-basis'] },
    { topic: 'CSS grid placement', tokens: ['display: grid', 'grid-template-columns', 'grid-template-rows', 'gap', 'grid-column', 'grid-row', 'justify-items', 'align-items', 'minmax(', 'repeat('] },
    { topic: 'Z-index and layered elements', tokens: ['position: relative', 'position: absolute', 'z-index', 'inset', 'transform', 'pointer-events', 'isolation', 'position: fixed', 'opacity', 'z-index: 1'] },
    { topic: 'CSS animation timing', tokens: ['@keyframes', 'animation-name', 'animation-duration', 'animation-delay', 'animation-timing-function', 'animation-iteration-count', 'animation-fill-mode', 'transition', 'transform', 'prefers-reduced-motion'] },
    { topic: 'Responsive media rules', tokens: ['@media', 'max-width', 'min-width', 'clamp(', 'minmax(', 'flex-wrap', 'grid-template-columns', 'vw', 'rem', 'prefers-reduced-motion'] },
    { topic: 'Named grid areas', tokens: ['display: grid', 'grid-template-areas', 'grid-area', 'grid-template-columns', 'grid-template-rows', 'gap', 'minmax(', 'repeat(', '@media', 'grid-column'] },
  ],
  javascript: [
    { topic: 'Functions and basic calculations', tokens: ['function', 'return', 'console.log', 'const', 'add', 'if', 'for', 'Math.max', 'Array.isArray', 'reduce('] },
    { topic: 'Variables, values, and conversion', tokens: ['const', 'let', 'typeof', 'Number(', 'String(', 'Boolean(', 'parseInt(', 'Number.isNaN', '${', 'JSON.stringify'] },
    { topic: 'Conditions and decision making', tokens: ['if', 'else', '===', '!==', '&&', '||', 'switch', 'case', '?', 'default'] },
    { topic: 'Arrays and iteration', tokens: ['[]', 'length', 'for', 'forEach(', 'map(', 'filter(', 'find(', 'some(', 'sort(', 'reduce('] },
    { topic: 'Objects and property access', tokens: ['{}', 'key', 'value', 'Object.keys(', 'Object.values(', 'Object.entries(', '?.', '??', '...'] },
    { topic: 'Arrow functions and callbacks', tokens: ['=>', 'return', 'map(', 'filter(', 'forEach(', 'callback(', '= ', '...args', 'Array.from(', 'sort('] },
    { topic: 'DOM styling and interaction', tokens: ['querySelector(', 'addEventListener(', 'textContent', 'classList', 'style.', 'createElement(', 'append(', 'remove(', 'preventDefault(', 'dataset'] },
    { topic: 'Promises and asynchronous work', tokens: ['Promise.resolve(', '.then(', '.catch(', 'async', 'await', 'Promise.all(', 'Promise.reject(', 'finally(', 'try', 'throw'] },
    { topic: 'Optional chaining and safe access', tokens: ['?.', '??', '&&', 'Array.isArray(', 'Object.hasOwn(', 'find(', 'typeof', 'Number.isFinite(', '?.length', '?? []'] },
    { topic: 'Application statistics and summaries', tokens: ['reduce(', 'filter(', 'map(', 'length', 'total', 'average', 'Math.round(', 'Object.values(', 'sort(', 'console.log'] },
  ],
  python: [
    { topic: 'Strings and small functions', tokens: ['def', 'return', 'print(', 'f"', 'len(', 'str(', 'join(', 'lower(', 'split(', 'strip('] },
    { topic: 'Integer and type conversion', tokens: ['int(', 'float(', 'str(', 'bool(', 'input(', 'type(', 'isinstance(', 'round(', 'try:', 'except'] },
    { topic: 'Loops over collections', tokens: ['for', 'in', 'range(', 'enumerate(', 'if', 'break', 'continue', 'sum(', 'zip(', 'else:'] },
    { topic: 'List slicing and transformations', tokens: ['[', ':', 'append(', 'extend(', 'sorted(', 'list(', 'enumerate(', 'reversed(', 'for', 'len('] },
    { topic: 'Dictionary lookups and updates', tokens: ['dict', 'get(', 'keys(', 'values(', 'items(', 'in', 'update(', 'pop(', 'setdefault(', 'sorted('] },
    { topic: 'Function arguments and return values', tokens: ['def', 'return', '=', '*args', '**kwargs', 'lambda', 'map(', 'filter(', 'name=', '__doc__'] },
    { topic: 'Reading files safely', tokens: ['with open(', 'read(', 'readline(', 'readlines(', 'encoding=', 'strip(', 'try:', 'except', 'pathlib', 'close('] },
    { topic: 'Classes and constructors', tokens: ['class', '__init__', 'self', 'super(', '@property', '@classmethod', '@staticmethod', '__str__', 'isinstance(', 'self.'] },
    { topic: 'Exceptions and recovery', tokens: ['try:', 'except', 'finally:', 'raise', 'ValueError', 'Exception', 'else:', 'as ', 'class ', 'assert'] },
    { topic: 'Mini algorithms and data handling', tokens: ['sorted(', 'sum(', 'max(', 'min(', 'set(', 'enumerate(', 'zip(', 'Counter(', 'while', 'key='] },
  ],
  java: [
    { topic: 'Printing and small methods', tokens: ['class Main', 'public static void main', 'System.out.println(', 'static', 'return', 'int', 'boolean', 'String', 'Math.max(', 'Math.min('] },
    { topic: 'Static types and conversion', tokens: ['int', 'double', 'String', 'boolean', 'final', 'Integer.parseInt(', 'Double.parseDouble(', 'String.valueOf(', 'Scanner', '(int)'] },
    { topic: 'Conditions and branches', tokens: ['if', 'else', 'switch', 'case', 'break', '&&', '||', '!', '?', 'default'] },
    { topic: 'Arrays and iteration', tokens: ['int[]', '.length', 'for', 'for (', 'Arrays.sort(', 'Arrays.toString(', 'new int[', 'continue', 'break', 'sum'] },
    { topic: 'Methods and reusable calculations', tokens: ['static', 'return', 'int', 'double', 'int a', 'add(', 'Math.', 'void', 'main', 'println('] },
    { topic: 'Classes and student records', tokens: ['class', 'private', 'this.', 'Student(', 'getName(', 'getScore(', 'toString(', 'new Student(', 'private String', 'public String'] },
    { topic: 'Inheritance and polymorphism', tokens: ['extends', 'super(', '@Override', 'abstract', 'interface', 'implements', 'protected', 'instanceof', 'Animal', 'Dog('] },
    { topic: 'HashMap lookups and updates', tokens: ['HashMap<', 'put(', 'get(', 'containsKey(', 'getOrDefault(', 'entrySet(', 'keySet(', 'remove(', 'Map<', 'size('] },
    { topic: 'Exceptions and safe recovery', tokens: ['try', 'catch', 'finally', 'throw', 'throws', 'Exception', 'IllegalArgumentException', 'getMessage(', 'close(', 'extends Exception'] },
    { topic: 'Sorting and searching arrays', tokens: ['Arrays.sort(', 'Arrays.binarySearch(', 'Comparator', 'compareTo(', 'Collections.sort(', 'int[]', 'for', '.length', 'new int[', 'Arrays.toString('] },
  ],
};

const TOPICS = {
  css: ['Selectors', 'Typography', 'Box Model', 'Backgrounds', 'Flexbox', 'Grid', 'Layering', 'Animation', 'Responsive Design', 'Grid Areas'],
  javascript: ['Calculations', 'Variables', 'Conditions', 'Arrays', 'Objects', 'Arrow Functions', 'DOM Styling', 'Promises', 'Optional Chaining', 'Application Stats'],
  python: ['String Concatenation', 'Type Conversion', 'List Loops', 'List Slices', 'Dictionary Checks', 'Function Keywords', 'File Reading', 'Constructors', 'Exception Handling', 'Mini Algorithms'],
  java: ['Printing Values', 'Static Types', 'Conditions', 'Array Iteration', 'Double Sum', 'Student Records', 'Inheritance', 'HashMaps', 'Try and Catch', 'Array Sorting'],
};

function isPlaceholder(challenge) {
  return /Practice .* in this .* level challenge|Verify step \d+:/i.test(challenge?.description || '');
}

function buildStarterCode(course, topic, feature) {
  if (course === 'css') {
    return `/* ${topic}: ${feature} */\n.card {\n  /* Add the requested styles here. */\n}\n`;
  }
  if (course === 'javascript') {
    return `// ${topic}: ${feature}\nfunction solve() {\n  // Implement the requirement.\n}\nconsole.log(solve());\n`;
  }
  if (course === 'python') {
    return `# ${topic}: ${feature}\ndef solve():\n    # Implement the requirement.\n    pass\n\nprint(solve())\n`;
  }
  return `public class Main {\n    public static void main(String[] args) {\n        // ${topic}: ${feature}\n    }\n}\n`;
}

function buildExpectedOutput(course, title, objective) {
  const safeTitle = title.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const safeObjective = objective.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  if (course === 'css') {
    return `<!doctype html><html><body style="font:16px sans-serif;padding:24px;background:#eef2ff"><article class="card" style="padding:20px;border-radius:12px;background:white"><h1>${safeTitle}</h1><p>${safeObjective}</p></article></body></html>`;
  }
  return `<!doctype html><html><body><pre style="font:14px monospace;background:#111827;color:#34d399;padding:20px;border-radius:8px;white-space:pre-wrap">Expected behavior\n${safeTitle}\n${safeObjective}</pre></body></html>`;
}

export function expandPlaceholderChallenge(course, phase, level, challenge) {
  const authored = authoredChallengeBatches[course]?.[phase]?.[level];
  if (authored) return authored;
  if (!isPlaceholder(challenge) || !CURRICULUM[course] || !TOPICS[course]) return challenge;

  const curriculum = CURRICULUM[course][phase - 1];
  const topic = curriculum.topic;
  const feature = curriculum.tokens[level - 1];
  const levelTopic = TOPICS[course][phase - 1];
  const title = `${levelTopic}: ${feature}`;
  const action = course === 'css'
    ? `Style the supplied demo to practice ${topic}, focusing on ${feature}.`
    : course === 'javascript'
      ? `Extend a small JavaScript solution for ${topic} and demonstrate ${feature} in your code.`
      : course === 'python'
        ? `Write a small Python solution for ${topic} and demonstrate ${feature} in your code.`
        : `Update the Java Main program for ${topic} and demonstrate ${feature} in your code.`;
  const secondary = course === 'css'
    ? (feature.includes('display') || feature.includes('@') ? 'gap' : 'color')
    : course === 'javascript'
      ? (level <= 5 ? 'return' : 'console.log')
      : course === 'python'
        ? (level <= 5 ? 'return' : 'print(')
        : (level <= 5 ? 'static' : 'System.out.println(');
  const requirements = [feature, secondary].filter((token, index, all) => all.indexOf(token) === index);
  const testCases = requirements.map((token, index) => ({
    id: index + 1,
    description: `Use the code token \`${token}\` to satisfy the ${topic} requirement.`,
  }));
  const timeLimit = level <= 3 ? 180 : level <= 6 ? 300 : 420;
  const expectedOutput = buildExpectedOutput(course, title, action);

  return {
    title,
    description: `${action} Keep the solution focused and make the requested behavior clear.`,
    contentStatus: 'template-generated-needs-review',
    assessmentMode: 'source-rubric',
    timeLimit,
    testCases,
    expectedOutput,
    starterCode: buildStarterCode(course, topic, feature),
    expectedOutputHint: `Your solution should demonstrate ${feature} for ${topic}.`,
    ...(course === 'css' ? {
      htmlCode: '<main><article class="card"><h1>Game Trail</h1><p>Style this challenge card.</p></article></main>',
    } : {}),
  };
}
