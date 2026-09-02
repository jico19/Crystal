import { NextRequest, NextResponse } from 'next/server';
import { generateStateAuditReportDb, convertAuditReportToCsvDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/audit-export
 * Generates official state compliance survey reports for Georgia DCH and Indiana FSSA.
 * Supports format=csv (downloadable file) or format=json.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get('state_code') || 'ALL';
    const format = searchParams.get('format') || 'csv';

    const records = await generateStateAuditReportDb(stateCode);

    if (format === 'csv') {
      const csvContent = convertAuditReportToCsvDb(records);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `crystal-state-audit-${stateCode.toLowerCase()}-${timestamp}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      records,
      total_count: records.length,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Admin Audit Export Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to generate audit report.',
      },
      { status: 500 }
    );
  }
}
