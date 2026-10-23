import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { loadCoursePhase } from "../config/curriculumLoader";

// Import course-specific editor templates
import LevelTemplate from "../components/levels/LevelTemplate"; // html
import CSSLevelTemplate from "../components/levels/CSSLevelTemplate"; // css
import JSLevelTemplate from "../components/levels/JSLevelTemplate"; // javascript
import PythonLevelTemplate from "../components/levels/PythonLevelTemplate"; // python
import JavaLevelTemplate from "../components/levels/JavaLevelTemplate"; // java

const TEMPLATE_MAP = {
  html: LevelTemplate,
  css: CSSLevelTemplate,
  javascript: JSLevelTemplate,
  python: PythonLevelTemplate,
  java: JavaLevelTemplate,
};

export const GenericPlayLevelPage = () => {
  const { courseId, phaseId, levelId } = useParams();
  const [phaseLevels, setPhaseLevels] = useState(null);
  const [loadedPhaseKey, setLoadedPhaseKey] = useState(null);
  const [failedPhaseKey, setFailedPhaseKey] = useState(null);

  // Extract numbers from strings like "phase1" and "level5"
  const phaseNum = Number(phaseId?.replace("phase", "") || "1");
  const levelNum = Number(levelId?.replace("level", "") || "1");
  const phaseKey = `${courseId}:${phaseNum}`;

  useEffect(() => {
    let active = true;
    loadCoursePhase(courseId, phaseNum)
      .then((levels) => {
        if (!levels) {
          if (active) setFailedPhaseKey(phaseKey);
          return;
        }
        if (active) {
          setPhaseLevels(levels);
          setLoadedPhaseKey(phaseKey);
        }
      })
      .catch((error) => {
        console.error('Unable to load course lesson:', error);
        if (active) setFailedPhaseKey(phaseKey);
      });
    return () => { active = false; };
  }, [courseId, phaseNum, phaseKey]);

  if (failedPhaseKey === phaseKey) return <Navigate to="/levels-mode" replace />;

  if (!phaseLevels || loadedPhaseKey !== phaseKey) {
    return <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-[#090d16] text-violet-200">Loading lesson…</div>;
  }

  // Read only the requested lesson from its lazily loaded course/phase chunk.
  const challenge = phaseLevels ? phaseLevels[levelNum] : null;

  // Fallback / redirect if route parameters are invalid
  if (!challenge) {
    console.error(`Invalid level configuration: ${courseId} Phase ${phaseNum} Level ${levelNum}`);
    return <Navigate to="/dashboard" replace />;
  }

  // Get matching template component for the language
  const TemplateComponent = TEMPLATE_MAP[courseId] || LevelTemplate;

  return (
    <TemplateComponent
      challenge={challenge}
      course={courseId}
      phase={phaseNum}
      levelNumber={levelNum}
    />
  );
};

export default GenericPlayLevelPage;
