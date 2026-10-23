import { additionalAuthoredChallengeBatches } from './authoredCourseBatches';
import { advancedAuthoredBatches } from './authoredAdvancedBatches';
import { authoredExpansionBatches } from './authoredExpansionBatch1';
import { authoredExpansionBatch2 } from './authoredExpansionBatch2';
import { authoredExpansionBatch3 } from './authoredExpansionBatch3';
import { authoredExpansionBatch4 } from './authoredExpansionBatch4';
import { authoredExpansionBatch5 } from './authoredExpansionBatch5';
import { authoredExpansionBatch6 } from './authoredExpansionBatch6';
import { authoredExpansionBatch7 } from './authoredExpansionBatch7';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function makeConditionalLesson({ title, objective, story, signature, exampleInput, exampleOutput, steps, hint, explanation, checks, timeLimit = 300 }) {
  const safeTitle = escapeHtml(title);
  const safeInput = escapeHtml(exampleInput);
  const safeOutput = escapeHtml(exampleOutput);
  return {
    title,
    description: story,
    learningObjective: objective,
    instructions: steps,
    workedExample: {
      input: exampleInput,
      output: exampleOutput,
      explanation: `Trace the condition with ${exampleInput}, then compare the returned result with the expected value.`,
    },
    hint,
    explanation,
    contentStatus: 'authored',
    assessmentMode: 'source-rubric',
    timeLimit,
    testCases: checks.map((description, index) => ({ id: index + 1, description })),
    expectedOutput: `<!doctype html><html><body style="font:16px system-ui;padding:24px;background:#090d16;color:#e5e7eb"><main style="max-width:620px;margin:auto;padding:24px;border:1px solid #334155;border-radius:14px;background:#111827"><p style="color:#a78bfa;font:700 11px monospace;letter-spacing:.12em">WORKED EXAMPLE</p><h1>${safeTitle}</h1><p><strong>Input:</strong> ${safeInput}</p><p style="color:#a7f3d0"><strong>Expected value:</strong> ${safeOutput}</p><p>Use the editor to write and inspect your own solution.</p></main></body></html>`,
    expectedOutputHint: `Worked example — input: ${exampleInput}; expected value: ${exampleOutput}. This is reference guidance, not the output of your submitted program.`,
    starterCode: `function ${signature} {\n  // Return the result described in the task.\n}\n\nconsole.log(${signature.slice(0, signature.indexOf('('))}(${exampleInput}));`,
  };
}

const javascriptConditionalLessons = {
  1: makeConditionalLesson({
    title: 'Score Gate: if', focus: 'if',
    objective: 'Use a one-way if branch to award a pass at the inclusive score threshold of 60.',
    story: 'A practice quiz needs a `scoreLabel(score)` helper. Return "Pass" when the score is 60 or higher; otherwise return "Retry". Keep the boundary inclusive: a score of exactly 60 passes.',
    signature: 'scoreLabel(score)', exampleInput: '60', exampleOutput: '"Pass"',
    steps: ['Write the scoreLabel(score) function.', 'Add an if condition for score >= 60.', 'Return "Pass" for a passing score and "Retry" for a lower score.', 'Check both 59 and 60 to verify the boundary.'],
    hint: 'The threshold should be checked with >=. The branch can return immediately, so no extra variable is required.',
    explanation: 'An if branch runs only when its condition is true. Using >= includes the threshold itself, while the function’s final return covers the remaining scores.',
    checks: ['Use the code token `if` and return "Retry" when score is 59.', 'Use the code token `if` and return "Pass" when score is 60.', 'Return "Pass" when score is 87.'],
  }),
  2: makeConditionalLesson({
    title: 'Shipping Threshold: else', focus: 'else',
    objective: 'Pair if and else branches so every subtotal produces exactly one shipping fee.',
    story: 'A small shop offers free shipping on orders of 50 or more. Implement `shippingFee(subtotal)`: return 0 at or above 50 and return 6 below 50.',
    signature: 'shippingFee(subtotal)', exampleInput: '49', exampleOutput: '6',
    steps: ['Create the shippingFee(subtotal) function.', 'Check whether subtotal >= 50.', 'Return 0 in the qualifying branch and 6 in the else branch.', 'Try a value below the threshold and one exactly at the threshold.'],
    hint: 'The else branch represents every subtotal that did not satisfy subtotal >= 50.',
    explanation: 'if/else forms a two-way decision. The second branch makes the rule exhaustive without repeating the original condition.',
    checks: ['Use the code token `else` and return 6 for subtotal 49.', 'Use the code token `else` and return 0 for subtotal 50.', 'Return 0 for subtotal 125.'],
  }),
  3: makeConditionalLesson({
    title: 'Exact Coupon Match: strict equality', focus: '===',
    objective: 'Use strict equality to compare a coupon code without converting its type or letter case.',
    story: 'The checkout accepts only the exact string "LEVELUP". Implement `isValidCoupon(code)` so the exact code returns true; other values, including different letter case, return false.',
    signature: 'isValidCoupon(code)', exampleInput: '"LEVELUP"', exampleOutput: 'true',
    steps: ['Write isValidCoupon(code).', 'Compare code with the exact string "LEVELUP" using strict equality.', 'Return the comparison result.', 'Check a lowercase variation to confirm the match is case-sensitive.'],
    hint: 'Use === so the comparison checks both value and type. Do not lowercase the input; the exercise requires an exact match.',
    explanation: 'Strict equality does not coerce values before comparing. String comparison is also case-sensitive, so "levelup" differs from "LEVELUP".',
    checks: ['Use the code token `===` and return true for "LEVELUP".', 'Use the code token `===` and return false for "levelup".', 'Return false for an empty string.'],
  }),
  4: makeConditionalLesson({
    title: 'Review Queue: not equal', focus: '!==',
    objective: 'Use strict inequality to identify every status that is not approved.',
    story: 'A moderation dashboard sends every item except "approved" to a review queue. Implement `needsReview(status)` and return a boolean.',
    signature: 'needsReview(status)', exampleInput: '"pending"', exampleOutput: 'true',
    steps: ['Create needsReview(status).', 'Compare status with "approved" using strict inequality.', 'Return the boolean comparison directly.', 'Check approved, pending, and rejected statuses.'],
    hint: 'The result of status !== "approved" is already a boolean; return it directly.',
    explanation: '!== is true when either the value or type differs. Here it cleanly expresses the rule “anything other than approved needs review.”',
    checks: ['Use the code token `!==` and return false for "approved".', 'Use the code token `!==` and return true for "pending".', 'Return true for "rejected".'],
  }),
  5: makeConditionalLesson({
    title: 'Verified Room Entry: logical AND', focus: '&&',
    objective: 'Combine two boolean requirements so access is granted only when both are true.',
    story: 'A private coding room requires a verified account and an age of at least 13. Implement `canJoinRoom(isVerified, age)`; both requirements must be satisfied.',
    signature: 'canJoinRoom(isVerified, age)', exampleInput: 'true, 14', exampleOutput: 'true',
    steps: ['Create canJoinRoom(isVerified, age).', 'Check isVerified and age >= 13 in one expression.', 'Return the boolean result.', 'Try a verified adult, an unverified adult, and a verified 12-year-old.'],
    hint: '&& is true only when both sides are true. Keep the age comparison in parentheses if that makes the rule easier to read.',
    explanation: 'Logical AND combines independent conditions. If either verification fails or the age is below 13, the complete expression evaluates to false.',
    checks: ['Use the code token `&&` and return true for true, 14.', 'Use the code token `&&` and return false for false, 14.', 'Return false for true, 12.'],
  }),
  6: makeConditionalLesson({
    title: 'Guest Name Fallback: logical OR', focus: '||',
    objective: 'Use a fallback expression for an empty display name while preserving a supplied name.',
    story: 'A profile card should display "Guest" when its nickname is empty. Implement `displayName(nickname)` with a logical OR fallback; a non-empty nickname must be returned unchanged.',
    signature: 'displayName(nickname)', exampleInput: '"Mira"', exampleOutput: '"Mira"',
    steps: ['Create displayName(nickname).', 'Return nickname with "Guest" as the fallback.', 'Check both an empty string and a non-empty name.', 'Make sure the non-empty name is not replaced.'],
    hint: 'In JavaScript, an empty string is falsy, so nickname || "Guest" selects the fallback only for the empty case.',
    explanation: 'The || operator returns the first truthy operand, or the final operand when earlier values are falsy. It preserves a non-empty nickname.',
    checks: ['Use the code token `||` and return "Guest" for an empty string.', 'Use the code token `||` and return "Mira" for "Mira".', 'Return "Guest" for an empty nickname.'],
  }),
  7: makeConditionalLesson({
    title: 'Weekday Lookup: switch', focus: 'switch',
    objective: 'Use switch to map numeric weekday codes to readable names.',
    story: 'A scheduling widget stores weekdays as numbers 1 through 7. Implement `weekdayName(day)` to return Monday through Sunday in order, and return "Invalid day" for any other number.',
    signature: 'weekdayName(day)', exampleInput: '1', exampleOutput: '"Monday"',
    steps: ['Create weekdayName(day).', 'Use a switch statement on day.', 'Add a return for each number from 1 to 7.', 'Return "Invalid day" after the switch for values outside the range.'],
    hint: 'Each case should return its name. Returning from a case avoids accidental fall-through.',
    explanation: 'switch compares one expression against several case values. A final fallback handles inputs that do not match any weekday.',
    checks: ['Use the code token `switch` and return "Monday" for 1.', 'Use the code token `switch` and return "Sunday" for 7.', 'Return "Invalid day" for 8.'],
    timeLimit: 420,
  }),
  8: makeConditionalLesson({
    title: 'Traffic Signal: grouped cases', focus: 'case',
    objective: 'Write explicit switch cases for three known values and a safe fallback for unknown values.',
    story: 'Implement `signalAction(color)` for a traffic signal: "red" means "stop", "yellow" means "wait", and "green" means "go". Unknown colors should return "check signal".',
    signature: 'signalAction(color)', exampleInput: '"yellow"', exampleOutput: '"wait"',
    steps: ['Create signalAction(color).', 'Use switch with cases for red, yellow, and green.', 'Return the matching action from each case.', 'Add a fallback for an unrecognized color.'],
    hint: 'Make each case return a value so one match cannot continue into another case.',
    explanation: 'Each case is one explicit branch of the decision. The fallback prevents an unrecognized value from producing undefined.',
    checks: ['Use the code token `case` and return "stop" for "red".', 'Use the code token `case` and return "go" for "green".', 'Return "check signal" for "blue".'],
    timeLimit: 420,
  }),
  9: makeConditionalLesson({
    title: 'Membership Label: conditional operator', focus: '?',
    objective: 'Use the conditional operator for a short two-outcome label based on a points threshold.',
    story: 'A learner earns the "Pro" label at 100 points. Implement `membershipLabel(points)` with the conditional operator: return "Pro" at 100 or more, otherwise return "Starter".',
    signature: 'membershipLabel(points)', exampleInput: '100', exampleOutput: '"Pro"',
    steps: ['Create membershipLabel(points).', 'Write the condition points >= 100.', 'Use ? and : to choose between "Pro" and "Starter".', 'Check 99 and 100.'],
    hint: 'The form is condition ? valueWhenTrue : valueWhenFalse.',
    explanation: 'The conditional operator is a compact expression for one simple two-outcome choice. A regular if/else is clearer when branches need multiple statements.',
    checks: ['Use the code token `?` and return "Starter" for 99.', 'Use the code token `?` and return "Pro" for 100.', 'Return "Pro" for 250.'],
  }),
  10: makeConditionalLesson({
    title: 'Command Router: default branch', focus: 'default',
    objective: 'Provide a deliberate default branch so unknown commands receive a useful response.',
    story: 'Implement `commandMessage(command)` for a tiny control panel. "start" returns "Session started" and "pause" returns "Session paused"; any unknown command returns "Unknown command".',
    signature: 'commandMessage(command)', exampleInput: '"pause"', exampleOutput: '"Session paused"',
    steps: ['Create commandMessage(command).', 'Use switch cases for "start" and "pause".', 'Return the matching message from each case.', 'Use default to return "Unknown command".'],
    hint: 'The default branch runs only when no case matches. It should return a clear fallback string.',
    explanation: 'A default case defines behavior for values outside the known command set, avoiding an undefined result.',
    checks: ['Use the code token `default` and return "Session started" for "start".', 'Use the code token `default` and return "Unknown command" for "restart".', 'Return "Session paused" for "pause".'],
    timeLimit: 420,
  }),
};

const authoredChallengeBatches = { ...additionalAuthoredChallengeBatches };

function mergeAuthoredBatches(batches) {
  for (const [course, phases] of Object.entries(batches)) {
    authoredChallengeBatches[course] ||= {};
    for (const [phase, lessons] of Object.entries(phases)) {
      authoredChallengeBatches[course][phase] = {
        ...authoredChallengeBatches[course][phase],
        ...lessons,
      };
    }
  }
}

mergeAuthoredBatches(advancedAuthoredBatches);
mergeAuthoredBatches(authoredExpansionBatches);
mergeAuthoredBatches(authoredExpansionBatch2);
mergeAuthoredBatches(authoredExpansionBatch3);
mergeAuthoredBatches(authoredExpansionBatch4);
mergeAuthoredBatches(authoredExpansionBatch5);
mergeAuthoredBatches(authoredExpansionBatch6);
mergeAuthoredBatches(authoredExpansionBatch7);

authoredChallengeBatches.javascript ||= {};
authoredChallengeBatches.javascript[3] = {
  ...authoredChallengeBatches.javascript[3],
  ...javascriptConditionalLessons,
};

export { authoredChallengeBatches };
