const Groq = require('groq-sdk');
const { tryWithFallback } = require('../config/computerModeApiKeys');

// ─────────────────────────────────────────────────────────────────────────────
// Test case count per difficulty
// ─────────────────────────────────────────────────────────────────────────────
const getTestCaseCount = (difficulty) => {
  return { Beginner: 3, Moderate: 4, Advanced: 5, Hard: 5 }[difficulty] || 3;
};

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE CONCEPT POOLS
// Full runnable concepts from each language's complete curriculum.
// The AI picks from these + topic to produce a unique, appropriate challenge.
// ─────────────────────────────────────────────────────────────────────────────
const CONCEPT_POOLS = {
  HTML: [
    // Structure
    'DOCTYPE declaration and root html element',
    'head section with title and meta charset',
    'body content area',
    // Text
    'h1 heading tag', 'h2 to h6 heading hierarchy', 'p paragraph tag',
    'strong bold emphasis', 'em italic emphasis', 'small text tag',
    'blockquote for quotations', 'pre preformatted text', 'code inline code tag',
    // Links & Media
    'anchor a href tag for links', 'anchor with target blank',
    'img tag with src and alt', 'img with width and height',
    'audio tag with controls', 'video tag with controls and src',
    // Lists
    'ul unordered list with li items', 'ol ordered list with li items',
    'nested ul inside li', 'dl description list with dt and dd',
    // Tables
    'table with tr th td', 'thead tbody tfoot sections',
    'table with colspan and rowspan', 'caption for table',
    // Forms
    'form with action and method', 'input type text with placeholder',
    'input type email', 'input type password', 'input type number',
    'input type checkbox', 'input type radio with name group',
    'select dropdown with option tags', 'textarea for multiline input',
    'button type submit', 'label with for attribute',
    'fieldset and legend for form grouping',
    // Semantic
    'header semantic tag', 'nav semantic tag', 'main semantic tag',
    'article semantic tag', 'section semantic tag', 'aside semantic tag',
    'footer semantic tag', 'figure and figcaption',
    'details and summary expandable section',
    // Layout & Inline
    'div block container', 'span inline container',
    'hr horizontal rule', 'br line break',
    // Attributes
    'id and class attributes', 'style attribute for inline CSS',
    'data-* custom data attributes', 'aria-label accessibility attribute',
  ],
  CSS: [
    // Selectors
    'element selector', 'class selector with dot', 'id selector with hash',
    'descendant selector', 'child selector with >', 'adjacent sibling with +',
    'pseudo-class :hover', 'pseudo-class :focus', 'pseudo-class :nth-child',
    'pseudo-element ::before', 'pseudo-element ::after',
    // Text & Font
    'color property', 'font-size in px and rem', 'font-family with fallbacks',
    'font-weight bold and numbers', 'font-style italic', 'text-align center left right',
    'text-decoration underline none', 'text-transform uppercase', 'line-height',
    'letter-spacing', 'text-shadow', 'white-space nowrap',
    // Box Model
    'width and height', 'padding shorthand and individual sides',
    'margin shorthand and auto for centering', 'border width style color',
    'border-radius for rounded corners', 'box-sizing border-box',
    'overflow hidden scroll auto',
    // Background
    'background-color', 'background-image with url', 'background-size cover contain',
    'background-position center', 'background-repeat no-repeat',
    // Display & Position
    'display block inline inline-block none',
    'position relative absolute fixed sticky',
    'top right bottom left with position', 'z-index stacking',
    'float left right and clearfix',
    // Flexbox
    'display flex', 'flex-direction row column',
    'justify-content flex-start center space-between space-around',
    'align-items flex-start center stretch',
    'flex-wrap wrap', 'gap between flex items',
    'flex-grow flex-shrink', 'align-self on flex child',
    // Grid
    'display grid', 'grid-template-columns with fr and repeat',
    'grid-template-rows', 'grid-gap or gap', 'grid-column span',
    'grid-row span', 'grid-template-areas',
    // Transitions & Animations
    'transition property duration ease', 'transform translate scale rotate',
    '@keyframes animation', 'animation name duration iteration',
    // Variables & Shadows
    'CSS custom properties var(--name)', 'box-shadow inset and offset',
    'text-shadow', 'filter blur brightness',
    // Responsive
    '@media query min-width max-width', 'viewport meta tag awareness',
  ],
  JavaScript: [
    // Variables & Types
    'var let const declaration', 'string number boolean null undefined types',
    'typeof operator', 'template literals with backticks',
    // Operators & Control
    'arithmetic operators + - * / %', 'comparison == === != !==',
    'logical && || ! operators', 'ternary operator condition ? a : b',
    'if else if else statement', 'switch case statement',
    'for loop with index', 'while loop', 'do while loop',
    'for...of loop over arrays', 'for...in loop over objects', 'break and continue',
    // Functions
    'function declaration with parameters and return',
    'function expression stored in variable',
    'arrow function () => expression',
    'arrow function with block body and return',
    'default parameter values',
    'rest parameters ...args', 'arguments object',
    'IIFE immediately invoked function',
    'recursive function calling itself',
    // Arrays
    'array literal with values', 'array push pop shift unshift',
    'array length property', 'array forEach loop',
    'array map to transform', 'array filter to select',
    'array reduce to accumulate', 'array find and findIndex',
    'array some and every', 'array sort with comparator',
    'array slice and splice', 'array flat and flatMap',
    'spread operator with arrays', 'Array.from() and Array.isArray()',
    // Objects
    'object literal with key value pairs', 'dot notation and bracket notation',
    'Object.keys() Object.values() Object.entries()',
    'destructuring objects', 'destructuring arrays',
    'spread operator with objects', 'optional chaining ?.',
    'nullish coalescing ??',
    // Strings
    'string length', 'string toUpperCase toLowerCase',
    'string includes startsWith endsWith',
    'string split join', 'string trim', 'string replace replaceAll',
    'string indexOf lastIndexOf', 'string slice substring',
    'string padStart padEnd', 'string repeat',
    // Classes & OOP
    'class declaration with constructor',
    'class methods', 'class getters and setters',
    'class inheritance with extends and super',
    'static methods on class',
    // Async & Promises
    'setTimeout for delay', 'setInterval for repeat',
    'Promise new resolve reject',
    'Promise.then().catch()', 'async function with await',
    'Promise.all() for parallel', 'fetch API for HTTP request',
    // DOM (for browser JS)
    'document.getElementById querySelector',
    'element.textContent innerHTML',
    'element.addEventListener click',
    'element.classList add remove toggle',
    'element.style property',
    'document.createElement appendChild',
    // Error Handling
    'try catch finally', 'throw new Error message',
    'custom error class extending Error',
    // Modules
    'export default and named export', 'import statement',
    // Math & Date
    'Math.max min floor ceil round', 'Math.random()', 'Math.sqrt pow',
    'Date object new Date()', 'Date.now()',
    // JSON
    'JSON.stringify() and JSON.parse()',
    // Map & Set
    'Map set get has delete', 'Set for unique values',
  ],
  Python: [
    // Basics
    'print() function', 'input() for user data', 'variable assignment',
    'int float str bool type conversions', 'f-string formatting',
    'string concatenation', 'multiline string with triple quotes',
    // Operators & Control
    'arithmetic operators + - * / // % **',
    'comparison operators == != < > <= >=',
    'logical operators and or not',
    'if elif else statement', 'ternary expression value if condition else',
    'for loop with range()', 'while loop with condition',
    'break continue pass', 'enumerate() in for loop',
    'zip() to combine iterables',
    // Functions
    'def function with parameters and return',
    'default parameter values',
    'keyword arguments', '*args and **kwargs',
    'lambda anonymous function',
    'recursive function', 'nested functions',
    'docstring for documentation',
    // Lists
    'list literal and indexing', 'list append extend insert remove pop',
    'list slicing [start:end:step]', 'list comprehension [x for x in list]',
    'list comprehension with condition', 'sorted() and list.sort()',
    'list len min max sum', 'list count index',
    'list copy shallow copy',
    // Tuples & Sets
    'tuple immutable sequence', 'tuple unpacking a b = t',
    'set literal and operations union intersection difference',
    'set add discard in operator',
    // Dictionaries
    'dict literal key value pairs', 'dict get method with default',
    'dict keys() values() items()', 'dict comprehension',
    'dict update merge', 'dict pop and del',
    'defaultdict from collections', 'Counter from collections',
    // Strings
    'string upper lower strip',
    'string split join replace',
    'string format .format()',
    'string startswith endswith',
    'string find count index',
    'string isdigit isalpha',
    // Classes
    'class with __init__ and self',
    'instance methods and attributes',
    'class inheritance with super()',
    '__str__ and __repr__ magic methods',
    'property decorator @property',
    'class method @classmethod static @staticmethod',
    // File & Error
    'try except else finally',
    'raise Exception custom',
    'custom exception class',
    'with open() as file read write',
    // Libraries
    'math module sqrt pow floor ceil',
    'random module randint choice shuffle',
    'datetime module date time',
    'os module path exists listdir',
    'json module dumps loads',
    // Itertools & Functional
    'map() filter() zip()',
    'any() all() built-ins',
    'enumerate() with index',
    'list(map(lambda))',
    'list(filter(lambda))',
  ],
  Java: [
    // Basics
    'public class with main method',
    'System.out.println() for output',
    'variable declaration int double String boolean',
    'final constant variable', 'type casting int to double',
    'Scanner class for user input',
    // Operators & Control
    'arithmetic operators + - * / %',
    'comparison operators == != < > <= >=',
    'logical operators && || !',
    'if else if else statement', 'switch case with break',
    'ternary operator condition ? a : b',
    'for loop with index', 'while loop', 'do while loop',
    'for-each loop over arrays and collections',
    'break and continue statements',
    // Arrays
    'array declaration and initialization int[]',
    'array length and indexing', 'array iteration with for loop',
    'Arrays.sort() for sorting', 'Arrays.toString() for printing',
    '2D array declaration and access',
    // Strings
    'String concatenation with +', 'String length() method',
    'String charAt() substring() indexOf()',
    'String toUpperCase() toLowerCase() trim()',
    'String equals() compareTo() contains()',
    'String.valueOf() and Integer.parseInt()',
    'StringBuilder append and toString',
    // Methods
    'static method declaration with return type',
    'method with parameters and return statement',
    'void method without return', 'method overloading same name different params',
    'recursive method', 'passing array to method',
    // OOP Classes
    'class with instance fields private',
    'constructor matching class name',
    'getter and setter methods',
    'toString() override for readability',
    'class inheritance with extends',
    'super() to call parent constructor', 'method override @Override',
    'abstract class and abstract methods',
    'interface declaration and implements',
    'polymorphism through interface reference',
    // Collections
    'ArrayList<Type> add get size remove',
    'LinkedList as queue or stack',
    'HashMap<K,V> put get containsKey',
    'HashSet<Type> add contains remove',
    'Collections.sort() shuffle min max',
    'Iterator and enhanced for-each',
    // Exception Handling
    'try catch finally block',
    'throw new Exception message',
    'custom exception extending Exception',
    'checked vs unchecked exceptions',
    // Generics & Functional
    'generic class <T>', 'generic method <T>',
    'lambda expression with ->',
    'stream().filter().map().collect()',
    'Comparator with lambda', 'Optional<T> orElse isPresent',
    // IO & Other
    'Math.max min abs pow sqrt',
    'Integer.parseInt Double.parseDouble',
    'String.format() for formatted output',
    'enum declaration', 'varargs method int...args',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// TIME-BASED SIZING: how much code the user writes and its complexity
// CRITICAL: Challenges MUST be completable within the time limit!
// Each minute = ~10-15 lines of simple code that a beginner can type
// ─────────────────────────────────────────────────────────────────────────────
const TIME_SPEC = {
  3:  {
    lines: '3-8',
    rule: 'ULTRA SIMPLE - ONE basic element/tag/line. User writes 3-8 lines MAX. Think: absolute beginner, first time coding.',
    example: 'HTML: just <!DOCTYPE html><html><body><h1>Hello</h1></body></html>. JS: just function add(a,b){return a+b}. Python: just def hello(): print("hi")',
  },
  4:  {
    lines: '8-12',
    rule: 'VERY SIMPLE - TWO basic elements. User writes 8-12 lines MAX. Still beginner level.',
    example: 'HTML: DOCTYPE + html with h1 and p. JS: function with one if statement. Python: function with one condition.',
  },
  5:  {
    lines: '10-15',
    rule: 'SIMPLE - ONE small component. User writes 10-15 lines MAX. Basic structure only.',
    example: 'HTML: basic page with 2-3 elements. JS: simple function with loop. Python: function with for loop.',
  },
  6:  {
    lines: '12-18',
    rule: 'EASY - Small feature with 2-3 elements. User writes 12-18 lines MAX.',
    example: 'HTML: form with 2 inputs. CSS: style 2-3 elements. JS: function with array operation.',
  },
  7:  {
    lines: '15-22',
    rule: 'MODERATE - Small complete feature. User writes 15-22 lines MAX.',
    example: 'HTML: simple form. JS: class with 1 method. Python: class with init and 1 method.',
  },
  8:  {
    lines: '18-28',
    rule: 'MODERATE+ - Feature with multiple parts. User writes 18-28 lines MAX.',
    example: 'HTML: form with validation. JS: class with 2 methods. Python: class with 2 methods.',
  },
  9:  {
    lines: '22-35',
    rule: 'CHALLENGING - Complete feature. User writes 22-35 lines MAX.',
    example: 'HTML: multi-section page. JS: class with 3 methods. Python: class with error handling.',
  },
  10: {
    lines: '28-45',
    rule: 'ADVANCED - Complex feature. User writes 28-45 lines MAX. For experienced users.',
    example: 'HTML: full page structure. JS: multiple classes. Python: complete module.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATOR — 100% AI, no predefined tasks
// ─────────────────────────────────────────────────────────────────────────────
const generateChallenge = async (language, difficulty, timeMinutes) => {
  const testCaseCount = getTestCaseCount(difficulty);
  const uniqueId = Math.random().toString(36).substring(2, 12);

  // Pick 2-4 random concepts from the language pool for inspiration
  const pool = CONCEPT_POOLS[language] || CONCEPT_POOLS.HTML;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const pickedConcepts = shuffled.slice(0, timeMinutes <= 4 ? 1 : timeMinutes <= 6 ? 2 : 3);

  const spec = TIME_SPEC[timeMinutes] || TIME_SPEC[5];

  const prompt = `You are a challenge generator for a competitive real-time coding game.

Generate a SIMPLE, ACHIEVABLE ${language} coding challenge. Seed: ${uniqueId}-${Date.now()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Language : ${language}
Difficulty: ${difficulty}
Time Limit: ${timeMinutes} minute(s)
Lines of Code: ${spec.lines} (MAXIMUM!)
Concepts to USE: ${pickedConcepts.join(', ')}

SIZING RULE: ${spec.rule}
Example scale: ${spec.example}

⚠️ CRITICAL: The challenge MUST be completable in ${timeMinutes} minutes by a ${difficulty} level coder!
⚠️ Keep it SIMPLE! Users need time to type, think, and test.
⚠️ For ${timeMinutes} minutes, expect user can type ~${timeMinutes * 10} lines of simple code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASES — EXACTLY ${testCaseCount} steps:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each test case = ONE TINY coding step the user performs.
Write them as SIMPLE, CLEAR instructions.
Together, all ${testCaseCount} steps build the COMPLETE solution.
Each step should take about ${Math.round((timeMinutes * 60) / testCaseCount)}s to type.

MAKE STEPS VERY SIMPLE:
  ✅ "Add <!DOCTYPE html> and <html> tags"
  ✅ "Create <body> with <h1>Hello World</h1>"
  ✅ "Add a function add(a, b) that returns a + b"
  ❌ "Implement the complete navigation system" (too complex)
  ❌ "Add error handling and validation" (too advanced)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPECTED OUTPUT — iframe-renderable HTML:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The "expectedOutput" field MUST be a complete standalone HTML document
(starts with <!DOCTYPE html>) showing what the finished code looks like.
Use ONLY inline styles. No external links or CDN.

For HTML challenges → show the rendered HTML output.
For CSS challenges → show the styled elements rendered.
For JS/Python/Java → wrap actual output in:
  <!DOCTYPE html><html><body><pre style="font-family:monospace;background:#1a1a2e;color:#00ff88;padding:20px;margin:20px;border-radius:8px;font-size:14px">[ACTUAL CONSOLE OUTPUT HERE]</pre></body></html>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Respond with ONLY a raw JSON object (no markdown, no code fences):
{
  "title": "Short descriptive title (max 5 words)",
  "objective": "One simple sentence: exactly what to build.",
  "testCases": [
${Array.from({ length: testCaseCount }).map((_, i) => `    {"id": ${i + 1}, "description": "Step ${i + 1}: [ONE simple action]"}`).join(',\n')}
  ],
  "expectedOutput": "<!DOCTYPE html><html>...",
  "hints": ["Simple tip about ${pickedConcepts[0]}", "Another basic tip"]
}`;

  try {
    const result = await tryWithFallback('challenge', async (apiKey, model) => {
      const groq = new Groq({ apiKey });

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model,
        temperature: 0.9,
        max_tokens: 2500,
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      // Strip markdown fences if AI wraps with them
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const challenge = JSON.parse(jsonMatch[0]);

      // Validate minimum fields
      if (!challenge.title || !challenge.testCases?.length) {
        throw new Error('Challenge missing required fields');
      }

      // Ensure exact test case count
      while (challenge.testCases.length < testCaseCount) {
        const i = challenge.testCases.length + 1;
        challenge.testCases.push({ id: i, description: `Step ${i}: Complete the remaining implementation` });
      }
      challenge.testCases = challenge.testCases.slice(0, testCaseCount);

      return {
        id: `${Date.now()}-${uniqueId}`,
        ...challenge,
        language,
        difficulty,
        timeMinutes,
        testCaseCount,
        concepts: pickedConcepts,
      };
    });

    return result;
  } catch (error) {
    console.error('Challenge generation failed, using emergency AI fallback:', error.message);
    return generateEmergencyFallback(language, difficulty, timeMinutes, testCaseCount, pickedConcepts, uniqueId);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EMERGENCY FALLBACK — still uses a second API call, with simpler prompt
// Only runs if the main call completely fails.
// ─────────────────────────────────────────────────────────────────────────────
const generateEmergencyFallback = async (language, difficulty, timeMinutes, testCaseCount, concepts, uid) => {
  const concept = concepts[0] || 'basic element';
  const simplePrompt = `Generate a VERY SIMPLE ${language} coding challenge teaching "${concept}".
Time: ${timeMinutes} minutes. Steps: EXACTLY ${testCaseCount}.
CRITICAL: Challenge must be completable in ${timeMinutes} minutes! Keep it ULTRA SIMPLE!
Maximum ${timeMinutes * 10} lines of code.

Respond with raw JSON only:
{"title":"Simple ${concept}","objective":"Build a basic ${language} example using ${concept}","testCases":[${Array.from({length:testCaseCount},(_,i)=>`{"id":${i+1},"description":"Step ${i+1}: Add one simple ${concept} element"}`).join(',')}],"expectedOutput":"<!DOCTYPE html><html><body><pre style='font-family:monospace;background:#1a1a2e;color:#00ff88;padding:20px;border-radius:8px'>[Simple output here]</pre></body></html>","hints":["Keep it simple","Focus on ${concept}"]}`;

  try {
    const result = await tryWithFallback('challenge', async (apiKey, model) => {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: simplePrompt }],
        model,
        temperature: 0.3,
        max_tokens: 1200,
      });
      const raw = completion.choices[0]?.message?.content || '{}';
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');
      const ch = JSON.parse(jsonMatch[0]);
      return { id: `fallback-${Date.now()}`, ...ch, language, difficulty, timeMinutes, testCaseCount };
    });
    return result;
  } catch {
    // Absolute last resort - minimal challenge
    return {
      id: `emergency-${Date.now()}`,
      title: `Simple ${language} Challenge`,
      objective: `Write a very basic ${language} solution using ${concept}.`,
      testCases: Array.from({ length: testCaseCount }, (_, i) => ({
        id: i + 1,
        description: `Step ${i + 1}: ${['Add basic structure','Add main element','Add content','Test output','Verify result'][i] || `Complete step ${i + 1}`}`,
      })),
      expectedOutput: `<!DOCTYPE html><html><body><pre style="font-family:monospace;background:#1a1a2e;color:#00ff88;padding:20px;margin:20px;border-radius:8px">Write your ${language} solution\nusing: ${concept}\n\nKeep it simple!\nYou have ${timeMinutes} minutes.</pre></body></html>`,
      hints: [`Focus on ${concept}`, 'Keep it very simple', `You have ${timeMinutes} minutes`],
      language,
      difficulty,
      timeMinutes,
      testCaseCount,
    };
  }
};

module.exports = { generateChallenge, getTestCaseCount };
