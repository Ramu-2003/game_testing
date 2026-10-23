import { htmlPhase1Levels } from './htmlPhase1Levels';
import { htmlPhase2Levels } from './htmlPhase2Levels';
import { htmlPhase3Levels } from './htmlPhase3Levels';
import { htmlPhase4Levels } from './htmlPhase4Levels';
import { htmlPhase5Levels } from './htmlPhase5Levels';
import { htmlPhase6Levels } from './htmlPhase6Levels';
import { htmlPhase7Levels } from './htmlPhase7Levels';
import { htmlPhase8Levels } from './htmlPhase8Levels';
import { htmlPhase9Levels } from './htmlPhase9Levels';
import { htmlPhase10Levels } from './htmlPhase10Levels';
import { cssPhase1Levels } from './cssPhase1Levels';
import { cssPhase2Levels } from './cssPhase2Levels';
import { cssPhase3Levels } from './cssPhase3Levels';
import { cssPhase4Levels } from './cssPhase4Levels';
import { cssPhase5Levels } from './cssPhase5Levels';
import { cssPhase6Levels } from './cssPhase6Levels';
import { cssPhase7Levels } from './cssPhase7Levels';
import { cssPhase8Levels } from './cssPhase8Levels';
import { cssPhase9Levels } from './cssPhase9Levels';
import { cssPhase10Levels } from './cssPhase10Levels';
import { javascriptPhase1Levels } from './javascriptPhase1Levels';
import { javascriptPhase2Levels } from './javascriptPhase2Levels';
import { javascriptPhase3Levels } from './javascriptPhase3Levels';
import { javascriptPhase4Levels } from './javascriptPhase4Levels';
import { javascriptPhase5Levels } from './javascriptPhase5Levels';
import { javascriptPhase6Levels } from './javascriptPhase6Levels';
import { javascriptPhase7Levels } from './javascriptPhase7Levels';
import { javascriptPhase8Levels } from './javascriptPhase8Levels';
import { javascriptPhase9Levels } from './javascriptPhase9Levels';
import { javascriptPhase10Levels } from './javascriptPhase10Levels';
import { pythonPhase1Levels } from './pythonPhase1Levels';
import { pythonPhase2Levels } from './pythonPhase2Levels';
import { pythonPhase3Levels } from './pythonPhase3Levels';
import { pythonPhase4Levels } from './pythonPhase4Levels';
import { pythonPhase5Levels } from './pythonPhase5Levels';
import { pythonPhase6Levels } from './pythonPhase6Levels';
import { pythonPhase7Levels } from './pythonPhase7Levels';
import { pythonPhase8Levels } from './pythonPhase8Levels';
import { pythonPhase9Levels } from './pythonPhase9Levels';
import { pythonPhase10Levels } from './pythonPhase10Levels';
import { javaPhase1Levels } from './javaPhase1Levels';
import { javaPhase2Levels } from './javaPhase2Levels';
import { javaPhase3Levels } from './javaPhase3Levels';
import { javaPhase4Levels } from './javaPhase4Levels';
import { javaPhase5Levels } from './javaPhase5Levels';
import { javaPhase6Levels } from './javaPhase6Levels';
import { javaPhase7Levels } from './javaPhase7Levels';
import { javaPhase8Levels } from './javaPhase8Levels';
import { javaPhase9Levels } from './javaPhase9Levels';
import { javaPhase10Levels } from './javaPhase10Levels';
import { resolvePhaseChallenges } from './curriculumRegistryHelpers';

export const levelsRegistry = {
  html: {
    1: htmlPhase1Levels,
    2: htmlPhase2Levels,
    3: htmlPhase3Levels,
    4: htmlPhase4Levels,
    5: htmlPhase5Levels,
    6: htmlPhase6Levels,
    7: htmlPhase7Levels,
    8: htmlPhase8Levels,
    9: htmlPhase9Levels,
    10: htmlPhase10Levels,
  },
  css: {
    1: cssPhase1Levels,
    2: cssPhase2Levels,
    3: cssPhase3Levels,
    4: cssPhase4Levels,
    5: cssPhase5Levels,
    6: cssPhase6Levels,
    7: cssPhase7Levels,
    8: cssPhase8Levels,
    9: cssPhase9Levels,
    10: cssPhase10Levels,
  },
  javascript: {
    1: javascriptPhase1Levels,
    2: javascriptPhase2Levels,
    3: javascriptPhase3Levels,
    4: javascriptPhase4Levels,
    5: javascriptPhase5Levels,
    6: javascriptPhase6Levels,
    7: javascriptPhase7Levels,
    8: javascriptPhase8Levels,
    9: javascriptPhase9Levels,
    10: javascriptPhase10Levels,
  },
  python: {
    1: pythonPhase1Levels,
    2: pythonPhase2Levels,
    3: pythonPhase3Levels,
    4: pythonPhase4Levels,
    5: pythonPhase5Levels,
    6: pythonPhase6Levels,
    7: pythonPhase7Levels,
    8: pythonPhase8Levels,
    9: pythonPhase9Levels,
    10: pythonPhase10Levels,
  },
  java: {
    1: javaPhase1Levels,
    2: javaPhase2Levels,
    3: javaPhase3Levels,
    4: javaPhase4Levels,
    5: javaPhase5Levels,
    6: javaPhase6Levels,
    7: javaPhase7Levels,
    8: javaPhase8Levels,
    9: javaPhase9Levels,
    10: javaPhase10Levels,
  },
};

// Several advanced phases shipped repeated placeholder rubrics after their first
// few levels. Expand those entries at the registry boundary so every course
// keeps the same route/data contract while presenting a real, phase-specific task.
for (const [course, phases] of Object.entries(levelsRegistry)) {
  for (const [phase, levels] of Object.entries(phases)) {
    phases[phase] = resolvePhaseChallenges(course, phase, levels);
  }
}
