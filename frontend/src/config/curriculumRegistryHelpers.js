import { expandPlaceholderChallenge } from './curriculumSupplements';
import { authoredChallengeBatches } from './authoredLessons';

export function resolvePhaseChallenges(course, phase, challenges) {
  const resolved = Object.fromEntries(
    Object.entries(challenges || {}).map(([level, challenge]) => {
      const resolved = expandPlaceholderChallenge(course, Number(phase), Number(level), challenge);
      return [level, {
        ...resolved,
        starterCode: typeof resolved.starterCode === 'string' ? resolved.starterCode : '',
      }];
    })
  );

  const authoredAdditions = authoredChallengeBatches[course]?.[phase] || {};
  for (const [level, challenge] of Object.entries(authoredAdditions)) {
    if (!Object.hasOwn(resolved, level)
      || resolved[level].contentStatus === 'template-generated-needs-review') {
      resolved[level] = {
        ...challenge,
        starterCode: typeof challenge.starterCode === 'string' ? challenge.starterCode : '',
      };
    }
  }

  return resolved;
}
