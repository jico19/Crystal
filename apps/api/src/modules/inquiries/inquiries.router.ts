import { Router } from 'express';
import { submitPublicInquiryController } from './inquiries.controller.js';

export const inquiriesRouter = Router();

// POST /api/v1/inquiries
inquiriesRouter.post('/', submitPublicInquiryController);
