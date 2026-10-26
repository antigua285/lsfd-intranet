/** Types et règles des examens, partagés entre le serveur et le navigateur (aucun accès base ici). */

export const QUESTION_TYPES = ["single", "multiple", "short", "long", "criterion"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  single: "Choix unique",
  multiple: "QCM (plusieurs réponses)",
  short: "Réponse courte",
  long: "Réponse longue",
  criterion: "Critère pratique (noté par l'instructeur)",
};

/** Examen écrit (passé par le candidat avec une clé) ou pratique (rempli par l'instructeur). */
export type ExamKind = "written" | "practical";
export const EXAM_KIND_LABEL: Record<ExamKind, string> = { written: "Écrit", practical: "Pratique" };
/** Les types de question possibles selon le genre d'examen. */
export const typesForKind = (kind: ExamKind): QuestionType[] => (kind === "practical" ? ["criterion"] : ["single", "multiple", "short", "long"]);

export const isChoice = (type: QuestionType) => type === "single" || type === "multiple";

export type ExamOption = { id: string; label: string; correct?: boolean };

export type ExamQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  /** Mise en situation (facultative). */
  situation: string;
  /** Image (facultative) : identifiant dans exam_images. */
  imageId: string | null;
  points: number;
  options?: ExamOption[];
  /** Critère pratique éliminatoire : il doit être validé en totalité, sinon l'examen ne peut pas être « réussi ». */
  eliminatory?: boolean;
};

/** Question sans les bonnes réponses : seule version que le candidat reçoit. */
export type PublicQuestion = Omit<ExamQuestion, "options"> & { options?: { id: string; label: string }[] };

export const EXAM_LIMITS = {
  title: 120,
  description: 1500,
  prompt: 1000,
  situation: 2000,
  option: 300,
  questions: 100,
  options: 10,
  maxPoints: 100,
  shortAnswer: 300,
  longAnswer: 4000,
  comment: 1000,
  key: 64,
  keyMin: 4,
};

export type ExamRecord = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number | null;
  thresholdPercent: number | null;
  maxAttempts: number;
  published: boolean;
  hasKey: boolean;
  kind: ExamKind;
  /** Si non vide : seuls les TD qui possèdent un de ces flags gèrent et corrigent cet examen. */
  manageFlags: string[];
  questions: ExamQuestion[];
  createdAt: string;
  updatedAt: string;
};

export type ExamSnapshot = {
  /** Absent sur les anciens passages : examen écrit. */
  kind?: ExamKind;
  title: string;
  description: string;
  durationMinutes: number | null;
  thresholdPercent: number | null;
  questions: ExamQuestion[];
};

export type Candidate = { name: string; username: string; grade: string; station: string };

export type AttemptStatus = "in_progress" | "submitted" | "sent";
export type Verdict = "pass" | "fail";

/** string = choix unique / texte ; string[] = QCM. */
export type AnswerValue = string | string[];
export type Grade = { points: number | null; comment: string };

export type AttemptSummary = {
  id: string;
  examId: string | null;
  examTitle: string;
  status: AttemptStatus;
  candidate: Candidate;
  startedAt: string;
  submittedAt: string | null;
  sentAt: string | null;
  verdict: Verdict | null;
  kind: ExamKind;
};

export type Attempt = AttemptSummary & {
  userId: string | null;
  snapshot: ExamSnapshot;
  answers: Record<string, AnswerValue>;
  deadline: string | null;
  grades: Record<string, Grade>;
  comment: string;
  graderName: string;
};

export function totalPoints(questions: { points: number }[]): number {
  return Math.round(questions.reduce((n, q) => n + q.points, 0) * 100) / 100;
}

export function formatPoints(n: number): string {
  return String(Math.round(n * 100) / 100).replace(".", ",");
}

/** Réponse du candidat sous forme de texte lisible (une entrée par choix pour les QCM). */
export function answerLines(q: { type: QuestionType; options?: { id: string; label: string }[] }, answer: AnswerValue | undefined): string[] {
  if (answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0)) return [];
  if (isChoice(q.type)) {
    const ids = Array.isArray(answer) ? answer : [answer];
    return ids.map((id) => q.options?.find((o) => o.id === id)?.label ?? "(choix supprimé)");
  }
  return [String(answer)];
}

export const VERDICT_LABEL: Record<Verdict, string> = { pass: "Réussi", fail: "Non réussi" };
export const STATUS_LABEL: Record<AttemptStatus, string> = {
  in_progress: "En cours",
  submitted: "En attente de correction",
  sent: "Résultat disponible",
};
