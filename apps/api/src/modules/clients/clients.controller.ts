import type { Request, Response } from 'express';
import { clientsService } from './clients.service.js';
import { CreateClientIntakeSchema, UpdateClientStatusSchema } from '@crystal/validation';
import type { ClientStatus, ClientDocCategory } from '@crystal/types';

export class ClientsController {
  async createClient(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const orgId = (req as any).orgId || req.body.org_id;
      const parsed = CreateClientIntakeSchema.safeParse({
        ...req.body,
        org_id: orgId,
      });

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const client = await clientsService.createIntake(parsed.data, user, req.ip);
      res.status(201).json(client);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async listClients(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const orgId = (req as any).orgId;
      const status = req.query.status as ClientStatus | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;

      const result = await clientsService.listClients(
        {
          org_id: orgId,
          status,
          search,
          limit,
          offset,
        },
        user
      );

      res.status(200).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async getClientById(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const orgId = (req as any).orgId;
      const clientId = String(req.params.id);

      const client = await clientsService.getClientById(clientId, orgId, user, req.ip);
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      res.status(200).json(client);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const orgId = (req as any).orgId;
      const clientId = String(req.params.id);

      const parsed = UpdateClientStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const updated = await clientsService.updateClientStatus(
        clientId,
        orgId,
        parsed.data,
        user,
        req.ip
      );

      if (!updated) {
        res.status(404).json({ error: 'Client not found or update unauthorized' });
        return;
      }

      res.status(200).json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const orgId = (req as any).orgId;
      const clientId = String(req.params.id);

      const { category, file_name, mime_type, file_size_bytes, expiration_date } = req.body;

      if (!category || !file_name || !mime_type) {
        res.status(400).json({ error: 'Missing required document fields (category, file_name, mime_type)' });
        return;
      }

      const result = await clientsService.createDocumentUpload(
        clientId,
        orgId,
        {
          category: category as ClientDocCategory,
          fileName: file_name,
          mimeType: mime_type,
          fileSizeBytes: file_size_bytes || 1024 * 1024,
          expirationDate: expiration_date,
        },
        user,
        req.ip
      );

      res.status(201).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async listDocuments(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const orgId = (req as any).orgId;
      const clientId = String(req.params.id);

      const docs = await clientsService.listDocuments(clientId, orgId, user);
      res.status(200).json(docs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async getSchedules(req: Request, res: Response): Promise<void> {
    try {
      const clientId = String(req.params.id);
      const schedules = await clientsService.getSchedules(clientId);
      res.status(200).json({ success: true, data: schedules });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  }

  async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      const clientId = String(req.params.id);
      const orgId = (req as any).orgId || req.body.org_id;
      const { caregiver_id, caregiver_name, service_date, start_time, end_time, service_type, notes } = req.body;

      if (!service_date || !start_time || !end_time) {
        res.status(400).json({ success: false, error: 'service_date, start_time, and end_time are required' });
        return;
      }

      const schedule = await clientsService.createSchedule({
        clientId,
        orgId,
        caregiverId: caregiver_id,
        caregiverName: caregiver_name,
        serviceDate: service_date,
        startTime: start_time,
        endTime: end_time,
        serviceType: service_type,
        notes,
      });

      res.status(201).json({ success: true, data: schedule });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  }

  downloadAdmissionPacket(req: Request, res: Response): void {
    const stateCode = (req.query.state_code as string) || 'GA';
    const packetContent = clientsService.generateAdmissionPacket(stateCode);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="client_admission_packet_${stateCode.toLowerCase()}.txt"`
    );
    res.send(packetContent);
  }
}

export const clientsController = new ClientsController();
