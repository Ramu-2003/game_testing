import PropTypes from 'prop-types';

function LessonGuide({ challenge }) {
  if (!challenge?.learningObjective && !challenge?.instructions?.length) return null;

  return (
    <section className="mt-4 rounded-lg border border-white/10 bg-white/[.03] p-3 text-[11px] leading-relaxed text-slate-300" aria-label="Learning guide">
      {challenge.learningObjective && <div>
        <p className="mb-1 text-[9px] font-bold tracking-[.16em] text-violet-200/75">LEARNING OBJECTIVE</p>
        <p>{challenge.learningObjective}</p>
      </div>}
      {challenge.instructions?.length > 0 && <div className="mt-3">
        <p className="mb-1 text-[9px] font-bold tracking-[.16em] text-slate-400">YOUR TASK</p>
        <ol className="list-decimal space-y-1 pl-4">
          {challenge.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
        </ol>
      </div>}
      {challenge.workedExample && <details className="mt-3 border-t border-white/10 pt-2">
        <summary className="cursor-pointer font-semibold text-emerald-200/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300">Worked example</summary>
        <dl className="mt-2 grid grid-cols-[52px_1fr] gap-x-2 gap-y-1 font-mono text-[10px]">
          <dt className="text-slate-500">Input</dt><dd className="break-words">{challenge.workedExample.input}</dd>
          <dt className="text-slate-500">Output</dt><dd className="break-words text-emerald-200">{challenge.workedExample.output}</dd>
        </dl>
        {challenge.workedExample.explanation && <p className="mt-2 text-slate-400">{challenge.workedExample.explanation}</p>}
      </details>}
      {challenge.hint && <details className="mt-2 border-t border-white/10 pt-2">
        <summary className="cursor-pointer font-semibold text-amber-200/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300">Need a hint?</summary>
        <p className="mt-2 text-amber-100/75">{challenge.hint}</p>
      </details>}
      {challenge.explanation && <details className="mt-2 border-t border-white/10 pt-2">
        <summary className="cursor-pointer font-semibold text-slate-200/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300">Why it works</summary>
        <p className="mt-2 text-slate-400">{challenge.explanation}</p>
      </details>}
    </section>
  );
}

LessonGuide.propTypes = {
  challenge: PropTypes.shape({
    learningObjective: PropTypes.string,
    instructions: PropTypes.arrayOf(PropTypes.string),
    workedExample: PropTypes.shape({
      input: PropTypes.string,
      output: PropTypes.string,
      explanation: PropTypes.string,
    }),
    hint: PropTypes.string,
    explanation: PropTypes.string,
  }).isRequired,
};

export default LessonGuide;
