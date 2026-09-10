import type { Request, Response } from 'express';
import { adminService } from './admin.service.js';

export class AdminController {
  async getKpis(req: Request, res: Response): Promise<void> {
    try {
      const stateCode = req.query.state_code as string | undefined;
      const data = await adminService.getKpis(stateCode);
      res.status(200).json(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async exportAuditPacket(req: Request, res: Response): Promise<void> {
    try {
      const stateCode = req.query.state_code as string | undefined;
      const csv = await adminService.generateAuditPacketCsv(stateCode);

      const filename = `audit_packet_${stateCode || 'ALL'}_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async getReferralSourcesReport(req: Request, res: Response): Promise<void> {
    try {
      const stateCode = req.query.state_code as string | undefined;
      const data = await adminService.getReferralSources(stateCode);
      res.status(200).json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  }

  async getTrainingComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const stateCode = req.query.state_code as string | undefined;
      const data = await adminService.getTrainingCompliance(stateCode);
      res.status(200).json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  }

  async getAuthorizationsSummaryReport(req: Request, res: Response): Promise<void> {
    try {
      const stateCode = req.query.state_code as string | undefined;
      const data = await adminService.getAuthorizationsSummary(stateCode);
      res.status(200).json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  }
}

export const adminController = new AdminController();
