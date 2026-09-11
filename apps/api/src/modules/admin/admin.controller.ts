import type { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';

export class AdminController {
  async getKpis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stateCode = req.query.state_code as string | undefined;
      const data = await adminService.getKpis(stateCode);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async exportAuditPacket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stateCode = req.query.state_code as string | undefined;
      const csv = await adminService.generateAuditPacketCsv(stateCode);

      const filename = `audit_packet_${stateCode || 'ALL'}_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }

  async getReferralSourcesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stateCode = req.query.state_code as string | undefined;
      const data = await adminService.getReferralSources(stateCode);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getTrainingComplianceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stateCode = req.query.state_code as string | undefined;
      const data = await adminService.getTrainingCompliance(stateCode);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAuthorizationsSummaryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stateCode = req.query.state_code as string | undefined;
      const data = await adminService.getAuthorizationsSummary(stateCode);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
