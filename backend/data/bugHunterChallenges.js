const CATALOG_VERSION = 'v1';
const XP_REWARDS = Object.freeze({ Easy: 25, Medium: 50, Hard: 100 });
const DIFFICULTIES = Object.freeze(Object.keys(XP_REWARDS));
const LANGUAGES = Object.freeze(['HTML', 'CSS', 'JavaScript', 'Python', 'Java']);

// Curated source-repair puzzles. The reference implementation stays on the server;
// submissions are checked as text and are never evaluated or executed here.
const challenges = [
  {
    id: 'html-easy-heading', language: 'HTML', difficulty: 'Easy', type: 'incorrect-structure',
    title: 'Repair the heading',
    description: 'The welcome heading opens as h1 but closes as h2. Make the document structure valid.',
    starterCode: '<main>\n  <h1>Welcome, coder!</h2>\n</main>',
    solutionCode: '<main>\n  <h1>Welcome, coder!</h1>\n</main>',
    observedBehavior: 'The heading element is malformed, so the page structure is unreliable.',
    expectedBehavior: 'Render one valid level-one heading that says “Welcome, coder!”.',
    sample: { input: 'Load the page', output: '<h1>Welcome, coder!</h1>' },
    hints: ['Compare the opening and closing tag names.', 'The closing tag should match the opening h1 tag.'],
    explanation: 'An HTML element must close with the same tag name it opened with.',
    timeLimitSeconds: 300,
  },
  {
    id: 'html-medium-list', language: 'HTML', difficulty: 'Medium', type: 'missing-code',
    title: 'Complete the task list',
    description: 'Add three list items inside the unordered list. Keep each task in its own li element.',
    starterCode: '<section>\n  <h2>Today</h2>\n  <ul>\n    <!-- add: Review, Practice, Ship -->\n  </ul>\n</section>',
    solutionCode: '<section>\n  <h2>Today</h2>\n  <ul>\n    <li>Review</li>\n    <li>Practice</li>\n    <li>Ship</li>\n  </ul>\n</section>',
    observedBehavior: 'The task list is empty.',
    expectedBehavior: 'Show Review, Practice, and Ship as separate list items.',
    sample: { input: 'Load the page', output: '• Review  • Practice  • Ship' },
    hints: ['The list needs three li elements.', 'Place one task label inside each li pair.'],
    explanation: 'Unordered list entries belong inside individual li elements nested within ul.',
    timeLimitSeconds: 420,
  },
  {
    id: 'html-hard-table', language: 'HTML', difficulty: 'Hard', type: 'incorrect-semantics',
    title: 'Fix the score table semantics',
    description: 'The score values are incorrectly marked as headers. Use data cells for values and retain headers for the column labels.',
    starterCode: '<table>\n  <tr><th>Player</th><th>Score</th></tr>\n  <tr><th>Ada</th><th>42</th></tr>\n</table>',
    solutionCode: '<table>\n  <tr><th>Player</th><th>Score</th></tr>\n  <tr><td>Ada</td><td>42</td></tr>\n</table>',
    observedBehavior: 'The player row is announced as a second set of column headings.',
    expectedBehavior: 'Keep Player and Score as headings; mark Ada and 42 as table data.',
    sample: { input: 'Read the table', output: 'Player: Ada; Score: 42' },
    hints: ['Only the first row contains column labels.', 'Change both cells in the second row to td.'],
    explanation: 'Use th for header cells and td for ordinary table data.',
    timeLimitSeconds: 600,
  },
  {
    id: 'css-easy-selector', language: 'CSS', difficulty: 'Easy', type: 'incorrect-selector',
    title: 'Target the score panel',
    description: 'The page element uses id="score-panel", but the style targets a class. Correct the selector.',
    starterCode: '#score-panel {\n  color: #ffffff;\n}\n.score-panel {\n  background: #111827;\n}',
    solutionCode: '#score-panel {\n  color: #ffffff;\n}\n#score-panel {\n  background: #111827;\n}',
    observedBehavior: 'The dark panel background rule does not apply.',
    expectedBehavior: 'The element with id score-panel has white text on a dark background.',
    sample: { input: '<div id="score-panel">42</div>', output: 'Dark panel with white text' },
    hints: ['An id selector starts with #.', 'The second selector should target the same id as the first.'],
    explanation: 'CSS uses #name for an id and .name for a class.',
    timeLimitSeconds: 300,
  },
  {
    id: 'css-medium-grid', language: 'CSS', difficulty: 'Medium', type: 'layout',
    title: 'Restore the three-column grid',
    description: 'The gallery should display three equal columns with a 12px gap, but currently has two.',
    starterCode: '.gallery {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 12px;\n}',
    solutionCode: '.gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n}',
    observedBehavior: 'Six gallery cards wrap into two columns.',
    expectedBehavior: 'Show three equal columns while retaining the 12px gap.',
    sample: { input: 'Six cards on a wide screen', output: 'Three columns, two rows' },
    hints: ['The repeat count controls the number of columns.', 'Change the count from two to three.'],
    explanation: 'repeat(3, 1fr) creates three equal-width grid tracks.',
    timeLimitSeconds: 420,
  },
  {
    id: 'css-hard-responsive', language: 'CSS', difficulty: 'Hard', type: 'responsive-layout',
    title: 'Make the card layout responsive',
    description: 'The cards must use two equal columns on wide screens and one column at 640px or narrower.',
    starterCode: '.cards {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n}\n@media (max-width: 640px) {\n  .cards { grid-template-columns: repeat(2, 1fr); }\n}',
    solutionCode: '.cards {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n}\n@media (max-width: 640px) {\n  .cards { grid-template-columns: 1fr; }\n}',
    observedBehavior: 'On narrow screens each card remains compressed into a two-column layout.',
    expectedBehavior: 'Switch to one column at the 640px breakpoint.',
    sample: { input: 'Viewport width 390px', output: 'One card per row' },
    hints: ['The media query is already in place.', 'Use a single flexible column inside the media query.'],
    explanation: 'A one-column grid is declared with grid-template-columns: 1fr.',
    timeLimitSeconds: 600,
  },
  {
    id: 'javascript-easy-even', language: 'JavaScript', difficulty: 'Easy', type: 'incorrect-condition',
    title: 'Correct the even check',
    description: 'isEven returns true for odd numbers. Correct the comparison while keeping the modulo operation.',
    starterCode: 'function isEven(value) {\n  return value % 2 === 1;\n}',
    solutionCode: 'function isEven(value) {\n  return value % 2 === 0;\n}',
    observedBehavior: 'isEven(3) returns true and isEven(4) returns false.',
    expectedBehavior: 'Return true exactly when value is divisible by two.',
    sample: { input: 'isEven(4), isEven(3)', output: 'true, false' },
    hints: ['A remainder of zero means the number is divisible by two.', 'Compare the remainder to 0.'],
    explanation: 'Even integers have a remainder of zero when divided by two.',
    timeLimitSeconds: 300,
  },
  {
    id: 'javascript-medium-loop', language: 'JavaScript', difficulty: 'Medium', type: 'off-by-one',
    title: 'Include the final value',
    description: 'sumThrough should add every integer from 1 through limit, but the loop currently stops one step early.',
    starterCode: 'function sumThrough(limit) {\n  let total = 0;\n  for (let value = 1; value < limit; value += 1) {\n    total += value;\n  }\n  return total;\n}',
    solutionCode: 'function sumThrough(limit) {\n  let total = 0;\n  for (let value = 1; value <= limit; value += 1) {\n    total += value;\n  }\n  return total;\n}',
    observedBehavior: 'sumThrough(4) returns 6.',
    expectedBehavior: 'Include limit in the sum; sumThrough(4) returns 10.',
    sample: { input: 'sumThrough(4)', output: '10' },
    hints: ['Check the loop boundary.', 'The final iteration must run when value equals limit.'],
    explanation: 'A <= comparison includes the endpoint; < excludes it.',
    timeLimitSeconds: 420,
  },
  {
    id: 'javascript-hard-palindrome', language: 'JavaScript', difficulty: 'Hard', type: 'normalization',
    title: 'Normalize palindrome input',
    description: 'isPalindrome should ignore spaces and letter case before comparing a string with its reverse.',
    starterCode: 'function isPalindrome(text) {\n  const normalized = text;\n  return normalized === normalized.split(\'\').reverse().join(\'\');\n}',
    solutionCode: 'function isPalindrome(text) {\n  const normalized = text.toLowerCase().replace(/\\s/g, \'\');\n  return normalized === normalized.split(\'\').reverse().join(\'\');\n}',
    observedBehavior: 'isPalindrome("Never odd or even") returns false.',
    expectedBehavior: 'Ignore whitespace and letter case before the reverse comparison.',
    sample: { input: 'isPalindrome("Never odd or even")', output: 'true' },
    hints: ['Normalize case first.', 'Remove whitespace with a regular expression before comparing.'],
    explanation: 'Normalize user input before comparing its characters with the reversed string.',
    timeLimitSeconds: 600,
  },
  {
    id: 'python-easy-even', language: 'Python', difficulty: 'Easy', type: 'incorrect-condition',
    title: 'Correct the even check',
    description: 'is_even returns true for odd numbers. Correct the comparison while keeping the modulo operation.',
    starterCode: 'def is_even(value):\n    return value % 2 == 1',
    solutionCode: 'def is_even(value):\n    return value % 2 == 0',
    observedBehavior: 'is_even(3) returns True and is_even(4) returns False.',
    expectedBehavior: 'Return True exactly when value is divisible by two.',
    sample: { input: 'is_even(4), is_even(3)', output: 'True, False' },
    hints: ['A remainder of zero means the number is divisible by two.', 'Compare the remainder to 0.'],
    explanation: 'Even integers have a remainder of zero when divided by two.',
    timeLimitSeconds: 300,
  },
  {
    id: 'python-medium-range', language: 'Python', difficulty: 'Medium', type: 'off-by-one',
    title: 'Include the last item',
    description: 'count_positive should inspect every value, but the range stops before the last index.',
    starterCode: 'def count_positive(values):\n    count = 0\n    for index in range(len(values) - 1):\n        if values[index] > 0:\n            count += 1\n    return count',
    solutionCode: 'def count_positive(values):\n    count = 0\n    for index in range(len(values)):\n        if values[index] > 0:\n            count += 1\n    return count',
    observedBehavior: 'count_positive([-1, 2, 3]) returns 1.',
    expectedBehavior: 'Inspect the last list element as well; the sample returns 2.',
    sample: { input: 'count_positive([-1, 2, 3])', output: '2' },
    hints: ['range should include every valid list index.', 'The stop value for range is len(values).'],
    explanation: 'range(stop) visits indexes from zero up to, but not including, stop.',
    timeLimitSeconds: 420,
  },
  {
    id: 'python-hard-palindrome', language: 'Python', difficulty: 'Hard', type: 'normalization',
    title: 'Normalize palindrome input',
    description: 'is_palindrome should ignore spaces and letter case before comparing a string with its reverse.',
    starterCode: 'def is_palindrome(text):\n    normalized = text\n    return normalized == normalized[::-1]',
    solutionCode: 'def is_palindrome(text):\n    normalized = text.replace(" ", "").lower()\n    return normalized == normalized[::-1]',
    observedBehavior: 'is_palindrome("Never odd or even") returns False.',
    expectedBehavior: 'Ignore whitespace and letter case before the reverse comparison.',
    sample: { input: 'is_palindrome("Never odd or even")', output: 'True' },
    hints: ['Normalize case first.', 'Remove spaces before comparing the reverse slice.'],
    explanation: 'Normalize input before comparing it with its reversed form.',
    timeLimitSeconds: 600,
  },
  {
    id: 'java-easy-even', language: 'Java', difficulty: 'Easy', type: 'incorrect-condition',
    title: 'Correct the even check',
    description: 'isEven returns true for odd numbers. Correct the comparison while keeping the modulo operation.',
    starterCode: 'static boolean isEven(int value) {\n    return value % 2 != 0;\n}',
    solutionCode: 'static boolean isEven(int value) {\n    return value % 2 == 0;\n}',
    observedBehavior: 'isEven(3) returns true and isEven(4) returns false.',
    expectedBehavior: 'Return true exactly when value is divisible by two.',
    sample: { input: 'isEven(4), isEven(3)', output: 'true, false' },
    hints: ['A remainder of zero means the number is divisible by two.', 'Compare the remainder to 0.'],
    explanation: 'Even integers have a remainder of zero when divided by two.',
    timeLimitSeconds: 300,
  },
  {
    id: 'java-medium-loop', language: 'Java', difficulty: 'Medium', type: 'off-by-one',
    title: 'Include the final array value',
    description: 'sumValues should include every array value, but the loop stops before the last index.',
    starterCode: 'static int sumValues(int[] values) {\n    int total = 0;\n    for (int i = 0; i < values.length - 1; i++) {\n        total += values[i];\n    }\n    return total;\n}',
    solutionCode: 'static int sumValues(int[] values) {\n    int total = 0;\n    for (int i = 0; i < values.length; i++) {\n        total += values[i];\n    }\n    return total;\n}',
    observedBehavior: 'sumValues([2, 3, 5]) returns 5.',
    expectedBehavior: 'Include the final array value; the sample returns 10.',
    sample: { input: 'sumValues([2, 3, 5])', output: '10' },
    hints: ['Check the loop stop condition.', 'The loop should continue while i is less than values.length.'],
    explanation: 'Valid array indexes run from zero through length minus one, so the condition is i < length.',
    timeLimitSeconds: 420,
  },
  {
    id: 'java-hard-palindrome', language: 'Java', difficulty: 'Hard', type: 'normalization',
    title: 'Normalize palindrome input',
    description: 'isPalindrome should ignore spaces and letter case before comparing a string with its reverse.',
    starterCode: 'static boolean isPalindrome(String text) {\n    String normalized = text;\n    String reversed = new StringBuilder(normalized).reverse().toString();\n    return normalized.equals(reversed);\n}',
    solutionCode: 'static boolean isPalindrome(String text) {\n    String normalized = text.replaceAll("\\\\s", "").toLowerCase();\n    String reversed = new StringBuilder(normalized).reverse().toString();\n    return normalized.equals(reversed);\n}',
    observedBehavior: 'isPalindrome("Never odd or even") returns false.',
    expectedBehavior: 'Ignore whitespace and letter case before the reverse comparison.',
    sample: { input: 'isPalindrome("Never odd or even")', output: 'true' },
    hints: ['Normalize case first.', 'Remove whitespace with replaceAll before reversing.'],
    explanation: 'Normalize the string before comparing it with its reversed value.',
    timeLimitSeconds: 600,
  },
];

const byId = new Map(challenges.map((challenge) => [challenge.id, challenge]));

function listChallengeIds(language, difficulty) {
  return challenges
    .filter((challenge) => (!language || challenge.language === language)
      && (!difficulty || challenge.difficulty === difficulty))
    .map((challenge) => challenge.id);
}

function getPublicChallenge(challengeId) {
  const challenge = byId.get(challengeId);
  if (!challenge) return null;
  const { solutionCode, hints, ...publicFields } = challenge;
  return { ...publicFields, catalogVersion: CATALOG_VERSION, hintCount: hints.length };
}

function validateRepair(challengeId, submittedCode) {
  const challenge = byId.get(challengeId);
  if (!challenge || typeof submittedCode !== 'string' || !submittedCode.trim() || submittedCode.length > 20000) {
    return { valid: false, message: 'Submit a non-empty repair under 20,000 characters.' };
  }
  const normalize = (code) => code.replace(/\r\n?/g, '\n').split('\n').map((line) => line.trimEnd()).join('\n').trim();
  const valid = normalize(submittedCode) === normalize(challenge.solutionCode);
  return {
    valid,
    message: valid ? 'Repair accepted.' : 'Repair not accepted yet. Review the expected behavior and try another edit.',
    explanation: valid ? challenge.explanation : undefined,
  };
}

function getHint(challengeId, hintIndex) {
  const challenge = byId.get(challengeId);
  if (!challenge || !Number.isInteger(hintIndex) || hintIndex < 0 || hintIndex >= challenge.hints.length) return null;
  return challenge.hints[hintIndex];
}

function getChallenge(challengeId) {
  return byId.get(challengeId) || null;
}

module.exports = {
  XP_REWARDS,
  CATALOG_VERSION,
  DIFFICULTIES,
  LANGUAGES,
  listChallengeIds,
  getPublicChallenge,
  getChallenge,
  validateRepair,
  getHint,
  challengeCount: challenges.length,
};
