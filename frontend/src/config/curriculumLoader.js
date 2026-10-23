import curriculumLimits from './curriculumLimits';

const VALID_COURSES = new Set(['html', 'css', 'javascript', 'python', 'java']);
const phaseRequests = new Map();

// Lessons are static, server-reviewed curriculum assets. Fetch one course phase
// when it is opened so a learner does not download the entire catalog up front.
export async function loadCoursePhase(course, phase) {
  const phaseNumber = Number(phase);
  if (!VALID_COURSES.has(course)
    || !Number.isInteger(phaseNumber)
    || phaseNumber < 1
    || phaseNumber > curriculumLimits.phaseCount) {
    return null;
  }

  const key = `${course}:${phaseNumber}`;
  if (phaseRequests.has(key)) return phaseRequests.get(key);

  const assetPath = `${import.meta.env.BASE_URL}curriculum/${course}-phase-${phaseNumber}.json`;
  const request = fetch(assetPath, { headers: { Accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) throw new Error(`Curriculum asset returned ${response.status}.`);
      return response.json();
    })
    .then((levels) => {
      if (!levels || typeof levels !== 'object' || Array.isArray(levels)) {
        throw new Error('Curriculum asset has an invalid shape.');
      }
      return levels;
    })
    .catch((error) => {
      phaseRequests.delete(key);
      throw error;
    });

  phaseRequests.set(key, request);
  return request;
}
