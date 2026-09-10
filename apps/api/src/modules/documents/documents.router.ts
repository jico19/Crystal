import { Router } from 'express';
import { verifyJWT, requireRole, requireOrg } from '../../middleware/auth.middleware.js';
import { documentsController } from './documents.controller.js';

export const documentsRouter = Router();

// 1. Request presigned upload URL
documentsRouter.post(
  '/upload-url',
  verifyJWT,
  requireOrg,
  documentsController.requestUploadUrl.bind(documentsController)
);

// 2. Request ephemeral download URL
documentsRouter.get(
  '/:id/download-url',
  verifyJWT,
  documentsController.getDownloadUrl.bind(documentsController)
);

// 3. Clinical / Compliance Staff Review (Approve / Reject)
documentsRouter.patch(
  '/:id/review',
  verifyJWT,
  requireRole('super_admin', 'agency_admin', 'care_coordinator'),
  documentsController.reviewDocument.bind(documentsController)
);

// 4. List caregiver's uploaded documents
documentsRouter.get(
  '/caregiver/:caregiverId',
  verifyJWT,
  documentsController.getCaregiverDocuments.bind(documentsController)
);

// 5. Compliance score breakdown
documentsRouter.get(
  '/caregiver/:caregiverId/compliance',
  verifyJWT,
  documentsController.getComplianceScore.bind(documentsController)
);

// 6. Local file system storage drivers (zero-cloud local development)
documentsRouter.put(
  '/local-storage/upload',
  documentsController.handleLocalUpload.bind(documentsController)
);

documentsRouter.get(
  '/local-storage/download',
  documentsController.handleLocalDownload.bind(documentsController)
);
