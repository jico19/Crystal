import type { Request, Response } from 'express';
import { clientsService } from './clients.service.js';
import { CreateClientIntakeSchema, UpdateClientStatusSchema } from '@crystal/validation';
import type { ClientStatus, ClientDocCategory } from '@crystal/types';
import { AppError } from '../../lib/errors.js';

export class ClientsController {
  async createClient(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.body.org_id;
    const parsed = CreateClientIntakeSchema.safeParse({
      ...req.body,
      org_id: orgId,
    });

    if (!parsed.success) {
      throw AppError.unprocessable('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const client = await clientsService.createIntake(parsed.data, req.user!, req.ip);
    res.status(201).json(client);
  }

  async listClients(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id;
    if (!orgId) {
      throw AppError.badRequest('Organization context required');
    }
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
      req.user!
    );

    res.status(200).json(result);
  }

  async getClientById(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id || '';
    const clientId = String(req.params.id);

    const client = await clientsService.getClientById(clientId, orgId, req.user!, req.ip);
    if (!client) {
      throw AppError.notFound('Client not found');
    }

    res.status(200).json(client);
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id || '';
    const clientId = String(req.params.id);

    const parsed = UpdateClientStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.unprocessable('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const updated = await clientsService.updateClientStatus(
      clientId,
      orgId,
      parsed.data,
      req.user!,
      req.ip
    );

    if (!updated) {
      throw AppError.notFound('Client not found or update unauthorized');
    }

    res.status(200).json(updated);
  }

  async uploadDocument(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id || '';
    const clientId = String(req.params.id);
    const { category, file_name, mime_type, file_size_bytes, expiration_date } = req.body;

    if (!category || !file_name || !mime_type) {
      throw AppError.badRequest('Missing required document fields (category, file_name, mime_type)');
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
      req.user!,
      req.ip
    );

    res.status(201).json(result);
  }

  async listDocuments(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id || '';
    const clientId = String(req.params.id);

    const docs = await clientsService.listDocuments(clientId, orgId, req.user!);
    res.status(200).json(docs);
  }

  async getSchedules(req: Request, res: Response): Promise<void> {
    const clientId = String(req.params.id);
    const schedules = await clientsService.getSchedules(clientId);
    res.status(200).json({ success: true, data: schedules });
  }

  async createSchedule(req: Request, res: Response): Promise<void> {
    const clientId = String(req.params.id);
    const orgId = req.orgId || req.body.org_id;
    const { caregiver_id, caregiver_name, service_date, start_time, end_time, service_type, notes } = req.body;

    if (!service_date || !start_time || !end_time) {
      throw AppError.badRequest('service_date, start_time, and end_time are required');
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
