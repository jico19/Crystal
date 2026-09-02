import { NextRequest, NextResponse } from 'next/server';
import { submitTrainingQuizDb } from '@/lib/db';
import { SubmitQuizSchema } from '@crystal/validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/training/quiz/submit
 * Grades submitted end-of-module quiz, enforces >= 80% passing threshold,
 * generates tamper-evident certificate SHA-256 hash upon passing.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = SubmitQuizSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { caregiver_id, module_id, answers } = parsed.data;

    const result = await submitTrainingQuizDb(caregiver_id, module_id, answers);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Quiz Submission Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to submit quiz.',
      },
      { status: 500 }
    );
  }
}
