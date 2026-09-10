import crypto from 'crypto';
import { clientsRepository } from './clients.repository.js';
import { auditService } from '../audit/audit.service.js';
import { getStorageProvider } from '../../integrations/storage/index.js';
import type { ClientProfile, ClientDocument, ClientStatus, ClientDocCategory, AuthenticatedUser } from '@crystal/types';
import type { CreateClientIntakeInput, UpdateClientStatusInput } from '@crystal/validation';
import type { ClientFilterOptions, ClientWithSummary } from './clients.types.js';

export class ClientsService {
  async createIntake(
    input: CreateClientIntakeInput,
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<ClientProfile> {
    const client = await clientsRepository.create({
      org_id: input.org_id,
      first_name: input.first_name,
      last_name: input.last_name,
      dob: input.dob,
      gender: input.gender,
      medicaid_id: input.medicaid_id,
      status: 'intake_draft',
      service_address: input.service_address,
      emergency_contacts: input.emergency_contacts,
      care_needs: input.care_needs,
      payer_details: input.payer_details,
    });

    await auditService.logAuditEvent({
      orgId: client.org_id,
      userId: user.id,
      eventType: 'RECORD_MUTATION',
      resourceType: 'client_profile',
      resourceId: client.id,
      ipAddress: ipAddress,
      metadata: {
        action: 'CREATE_CLIENT_INTAKE',
        status: client.status,
      },
    });

    return client;
  }

  async listClients(
    options: ClientFilterOptions,
    user: AuthenticatedUser
  ): Promise<{ clients: ClientWithSummary[]; total: number }> {
    return await clientsRepository.findMany(options);
  }

  async getClientById(
    clientId: string,
    orgId: string,
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<ClientProfile | null> {
    const client = await clientsRepository.findById(clientId, orgId);
    if (!client) {
      return null;
    }

    // HIPAA PHI Access Audit Logging
    await auditService.logAuditEvent({
      orgId: orgId,
      userId: user.id,
      eventType: 'PHI_ACCESS',
      resourceType: 'client_profile',
      resourceId: client.id,
      ipAddress: ipAddress,
      metadata: {
        action: 'VIEW_CLIENT_PROFILE',
      },
    });

    return client;
  }

  async updateClientStatus(
    clientId: string,
    orgId: string,
    input: UpdateClientStatusInput,
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<ClientProfile | null> {
    const updated = await clientsRepository.updateStatus(clientId, orgId, input.status, input.notes);
    if (!updated) {
      return null;
    }

    await auditService.logAuditEvent({
      orgId: orgId,
      userId: user.id,
      eventType: 'RECORD_MUTATION',
      resourceType: 'client_profile',
      resourceId: clientId,
      ipAddress: ipAddress,
      metadata: {
        action: 'UPDATE_CLIENT_STATUS',
        new_status: input.status,
      },
    });

    return updated;
  }

  async createDocumentUpload(
    clientId: string,
    orgId: string,
    params: {
      category: ClientDocCategory;
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
      expirationDate?: string;
    },
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<{ uploadUrl: string; document: ClientDocument }> {
    const client = await clientsRepository.findById(clientId, orgId);
    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    const fileId = crypto.randomUUID();
    const cleanFileName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `clients/${clientId}/${params.category}/${fileId}_${cleanFileName}`;

    const storageProvider = getStorageProvider();
    const presigned = await storageProvider.getUploadUrl({
      storagePath,
      mimeType: params.mimeType,
      maxSizeBytes: params.fileSizeBytes,
    });

    const document = await clientsRepository.addDocument({
      client_id: clientId,
      org_id: orgId,
      category: params.category,
      storage_path: storagePath,
      file_name: params.fileName,
      mime_type: params.mimeType,
      expiration_date: params.expirationDate,
      uploaded_by: user.id,
    });

    await auditService.logAuditEvent({
      orgId: orgId,
      userId: user.id,
      eventType: 'RECORD_MUTATION',
      resourceType: 'client_document',
      resourceId: document.id,
      ipAddress: ipAddress,
      metadata: {
        action: 'UPLOAD_CLIENT_DOCUMENT',
        category: params.category,
        client_id: clientId,
      },
    });

    return { uploadUrl: presigned.uploadUrl, document };
  }

  async listDocuments(
    clientId: string,
    orgId: string,
    user: AuthenticatedUser
  ): Promise<ClientDocument[]> {
    return await clientsRepository.findDocumentsByClient(clientId, orgId);
  }

  async getSchedules(clientId: string): Promise<any[]> {
    return await clientsRepository.findSchedulesByClient(clientId);
  }

  async createSchedule(params: {
    clientId: string;
    orgId: string;
    caregiverId?: string;
    caregiverName?: string;
    serviceDate: string;
    startTime: string;
    endTime: string;
    serviceType?: string;
    notes?: string;
  }): Promise<any> {
    return await clientsRepository.createSchedule(params);
  }

  generateAdmissionPacket(stateCode: string = 'GA'): string {
    return `================================================================================
CRYSTAL MULTI-STATE HOME CARE PLATFORM
OFFICIAL CLIENT ADMISSION & SERVICE AGREEMENT PACKET
State Jurisdiction: ${stateCode.toUpperCase()}
================================================================================

TABLE OF CONTENTS:
--------------------------------------------------------------------------------
1. Client Rights & Responsibilities Statement
2. Notice of Privacy Practices (HIPAA)
3. Direct Care Service Agreement & Advance Directives
4. Emergency Care & Disaster Evacuation Plan
5. Complaint & Grievance Procedures (State Ombudsman Hotline)

--------------------------------------------------------------------------------
SECTION 1: PATIENT BILL OF RIGHTS
--------------------------------------------------------------------------------
As a client of Crystal Home Care, you have the right to:
- Be treated with dignity, courtesy, and respect for your person and property.
- Be informed in advance about care to be furnished and active authorization units.
- Participate in the planning of care and be informed of choices and risks.
- Confidentiality of all records and personal health information under HIPAA.
- Be free from physical, verbal, mental, or financial abuse and neglect.

--------------------------------------------------------------------------------
SECTION 2: SCHEDULE OF SERVICES & VISITS
--------------------------------------------------------------------------------
Authorized Personal Support Services, Attendant Care, Respite, and Homemaker
visits are delivered in accordance with your physician's Plan of Care (CMS-485)
and state prior authorization approval.

Client / Representative Name: __________________________________________________
Service Address: ______________________________________________________________
Assigned Clinical Care Coordinator: ___________________________________________

--------------------------------------------------------------------------------
SECTION 3: EMERGENCY EVACUATION & CONTACT PROTOCOL
--------------------------------------------------------------------------------
In the event of medical emergencies, staff are trained in CPR and will dial 911.
Primary Family Emergency Contact: ___________________ Phone: ___________________
Preferred Hospital: ___________________________________________________________

--------------------------------------------------------------------------------
SECTION 4: ACKNOWLEDGEMENT & E-SIGNATURE ATTESTATION
--------------------------------------------------------------------------------
I acknowledge that I have received a copy of the Crystal Home Care Admission Packet,
Client Rights, and HIPAA Notice of Privacy Practices.

Client / Legal Guardian Signature: ______________________ Date: _________________
Printed Name: __________________________________________

================================================================================
Client Self-Service Portal: https://crystalhomecare.com/portal/client
================================================================================`;
  }
}

export const clientsService = new ClientsService();
