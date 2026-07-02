"use client";

import { FormEvent, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  quizApi,
  type ApiResponse,
  type QuizQuestion,
  type QuizQuestionPayload,
} from "@/lib/api";
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";

const sampleQuestions: QuizQuestionPayload[] = [
  {
    question: "Who was the mother of Samuel the prophet?",
    options: ["Deborah", "Hannah", "Ruth", "Naomi"],
    correctAnswer: "Hannah",
    level: 10,
    difficulty: "expert",
  },
  {
    question: "How many years did the Israelites wander in the wilderness?",
    options: ["20 years", "30 years", "40 years", "50 years"],
    correctAnswer: "40 years",
    level: 10,
    difficulty: "expert",
  },
  {
    question: "Who wrote the book of Revelation?",
    options: ["Paul", "Peter", "John", "Luke"],
    correctAnswer: "John",
    level: 10,
    difficulty: "expert",
  },
];

const sampleJson = JSON.stringify(sampleQuestions, null, 2);

function isQuestionPayload(value: unknown): value is QuizQuestionPayload {
  if (!value || typeof value !== "object") return false;
  const question = value as QuizQuestionPayload;

  return (
    typeof question.question === "string" &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    question.options.every((option) => typeof option === "string") &&
    typeof question.correctAnswer === "string" &&
    question.options.includes(question.correctAnswer) &&
    typeof question.level === "number" &&
    typeof question.difficulty === "string"
  );
}

function parseQuestions(value: string) {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed) || !parsed.every(isQuestionPayload)) {
    throw new Error(
      "Enter a JSON array of questions. Each question needs question, options, correctAnswer, level, and difficulty.",
    );
  }

  return parsed;
}

function getResponseCount(
  response: ApiResponse<QuizQuestion[]> | QuizQuestion[],
) {
  if (Array.isArray(response)) return response.length;
  if (Array.isArray(response.data)) return response.data.length;
  return 0;
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    return response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export default function QuizPage() {
  const [payload, setPayload] = useState(sampleJson);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const parsedQuestions = useMemo(() => {
    try {
      return parseQuestions(payload);
    } catch {
      return [];
    }
  }, [payload]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const questions = parseQuestions(payload);
      const response = await quizApi.createBulk(questions);
      const count = getResponseCount(response) || questions.length;
      const message = Array.isArray(response) ? "" : response.message;
      setSuccess(
        message || `${count} quiz question${count === 1 ? "" : "s"} created.`,
      );
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Bulk quiz upload failed. Confirm the JSON and POST /admin/quiz/bulk.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Quiz">
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-300">Quiz operations</p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              Bulk create quiz questions
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Paste a JSON array and send it to POST /api/admin/quiz/bulk.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPayload(sampleJson);
              setError("");
              setSuccess("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Load sample
          </button>
        </div>

        {error && <Notice tone="error" message={error} />}
        {success && <Notice tone="success" message={success} />}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]"
        >
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Bulk payload
                </h3>
                <p className="text-sm text-slate-400">
                  correctAnswer must match one of the options exactly.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSaving || !parsedQuestions.length}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                Create bulk quiz
              </button>
            </div>

            <textarea
              value={payload}
              onChange={(event) => {
                setPayload(event.target.value);
                setError("");
                setSuccess("");
              }}
              spellCheck={false}
              className="min-h-[560px] w-full resize-y rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
            />
          </section>

          <aside className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">Preview</h3>
              <p className="text-sm text-slate-400">
                Showing the first parsed questions from the JSON editor.
              </p>
            </div>

            {parsedQuestions.length ? (
              <div className="space-y-3">
                {parsedQuestions.slice(0, 6).map((question, index) => (
                  <article
                    key={`${question.question}-${index}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <p className="text-sm font-semibold text-white">
                      {question.question}
                    </p>
                    <p className="mt-1 text-xs capitalize text-slate-400">
                      Level {question.level} / {question.difficulty}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                Valid quiz JSON will appear here.
              </div>
            )}
          </aside>
        </form>
      </div>
    </DashboardLayout>
  );
}

function Notice({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  const isError = tone === "error";

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      {isError ? (
        <ClipboardList className="h-4 w-4" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      {message}
    </div>
  );
}
