import { formatPoints, type PublicQuestion } from "@/lib/exams-types";

/** Mise en situation, image et énoncé d'une question (même rendu pour le candidat, la correction et l'éditeur). */
export function ExamQuestionHead({ question, index, showPoints = true }: { question: Pick<PublicQuestion, "situation" | "imageId" | "prompt" | "points">; index: number; showPoints?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {question.situation && (
        <div className="border-l-4 border-slate-400 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 whitespace-pre-wrap">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">Situation</span>
          {question.situation}
        </div>
      )}
      {question.imageId && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/exam-images/${question.imageId}`} alt="Illustration de la question" className="max-h-80 max-w-full rounded border border-slate-200 object-contain self-start" />
      )}
      <p className="text-[15px] font-bold text-slate-900 whitespace-pre-wrap">
        {index + 1}. {question.prompt}
        {showPoints && <span className="ml-2 text-[12px] font-normal text-slate-500">({formatPoints(question.points)} pt{question.points > 1 ? "s" : ""})</span>}
      </p>
    </div>
  );
}
