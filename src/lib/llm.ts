import { sendStreamRequest } from './sse';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const FUNCTION_URL = `${supabaseUrl}/functions/v1/large-language-model`;

export const DR_LAB_SYSTEM_PROMPT =
  `You are Dr. Lab, a friendly AI science tutor for high school and college students. ` +
  `You answer questions about science experiments clearly, accurately, and concisely. ` +
  `When a student asks a question, give a direct helpful answer (under 80 words). ` +
  `Use simple language, connect ideas to real-world examples. Be warm and encouraging. ` +
  `Never start a response with "I" or "As Dr. Lab". Never add unsolicited follow-up questions.`;

export interface DrLabMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DrLabStreamOptions {
  userPrompt: string;
  history: DrLabMessage[];
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

function parseRateLimitError(err: unknown): boolean {
  const s = String(err);
  return s.includes('429') || s.toLowerCase().includes('rate') || s.toLowerCase().includes('limit');
}

export function streamDrLab(options: DrLabStreamOptions): void {
  const { userPrompt, history, onChunk, onComplete, onError, signal } = options;

  const messages: DrLabMessage[] = [
    ...history.slice(-12),
    { role: 'user', content: userPrompt },
  ];

  try {
    sendStreamRequest({
      functionUrl: FUNCTION_URL,
      requestBody: { system: DR_LAB_SYSTEM_PROMPT, messages },
      supabaseAnonKey,
      onData: (data) => {
        if (!data || data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            error?: { message?: string; code?: number };
          };
          // Handle API-level rate limit inside SSE stream
          if (parsed?.error) {
            const msg = parsed.error.message ?? '';
            if (parsed.error.code === 429 || msg.includes('limit') || msg.includes('quota')) {
              onError(Object.assign(new Error('rate_limit'), { code: 429 }));
              return;
            }
          }
          const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (chunk) onChunk(chunk);
        } catch {
          // Incomplete SSE frame — silently skip
        }
      },
      onComplete,
      onError: (err) => {
        if (parseRateLimitError(err)) {
          onError(Object.assign(new Error('rate_limit'), { code: 429 }));
        } else {
          onError(err);
        }
      },
      signal,
    });
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function streamDrLabBlocking(
  options: Omit<DrLabStreamOptions, 'onChunk' | 'onComplete' | 'onError'>
): Promise<string> {
  return new Promise<string>((resolve) => {
    let fullText = '';
    streamDrLab({
      ...options,
      onChunk: (chunk) => { fullText += chunk; },
      onComplete: () => resolve(fullText),
      onError: () => resolve(fullText || ''),
    });
  });
}

// ── Quiz generation ────────────────────────────────────────────────
export interface QuizGenOptions {
  experimentName: string;
  subjectId: string;
  chatContext: string;
}

export async function generateQuiz(opts: QuizGenOptions): Promise<import('@/types').QuizQuestion[]> {
  const prompt =
    `Generate exactly 5 multiple-choice quiz questions about the "${opts.experimentName}" ` +
    `(${opts.subjectId}) experiment. ` +
    `Base them on core scientific concepts covered. ` +
    `Return ONLY a valid JSON array, no markdown, no explanation: ` +
    `[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"one sentence why"}]`;

  const raw = await streamDrLabBlocking({
    userPrompt: prompt,
    history: opts.chatContext
      ? [{ role: 'user', content: `Context: ${opts.chatContext}` }, { role: 'assistant', content: 'Got it.' }]
      : [],
  });

  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('no array');
    const parsed = JSON.parse(match[0]) as Array<{
      question: string;
      options: [string, string, string, string];
      correctIndex: number;
      explanation: string;
    }>;
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('empty');
    return parsed.slice(0, 5).map(q => ({
      question: q.question ?? '',
      options: (q.options ?? ['', '', '', '']).slice(0, 4) as [string, string, string, string],
      correctIndex: Number(q.correctIndex ?? 0),
      explanation: q.explanation ?? '',
    }));
  } catch {
    // Fallback static questions
    return getFallbackQuestions(opts.experimentName);
  }
}

function getFallbackQuestions(name: string): import('@/types').QuizQuestion[] {
  return [
    {
      question: `What is the primary scientific principle demonstrated in the ${name} experiment?`,
      options: ['Conservation of energy', 'Equilibrium and dynamic balance', 'Cellular homeostasis', 'Newton\'s third law'],
      correctIndex: 1,
      explanation: 'Equilibrium and dynamic balance are foundational to most lab experiments.',
    },
    {
      question: 'Which variable is considered the independent variable in a controlled experiment?',
      options: ['The one that is measured', 'The one that is changed by the experimenter', 'The one kept constant', 'The control group'],
      correctIndex: 1,
      explanation: 'The independent variable is deliberately changed to observe its effect.',
    },
    {
      question: 'What does increasing the concentration of a reactant typically do to reaction rate?',
      options: ['Decreases it', 'Has no effect', 'Increases it', 'Stops the reaction'],
      correctIndex: 2,
      explanation: 'More reactant molecules = more collisions = faster reaction rate.',
    },
    {
      question: 'In an experiment, what is the purpose of a control group?',
      options: ['To maximise results', 'To provide a baseline for comparison', 'To speed up the experiment', 'To eliminate all variables'],
      correctIndex: 1,
      explanation: 'A control group provides a reference point without the experimental treatment.',
    },
    {
      question: 'Which of the following best describes a hypothesis?',
      options: ['A proven scientific fact', 'A testable prediction based on prior knowledge', 'A summary of experimental results', 'A random guess'],
      correctIndex: 1,
      explanation: 'A hypothesis is a testable, evidence-based prediction.',
    },
  ];
}
