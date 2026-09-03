import type { Request, Response, NextFunction } from 'express';
import { CreatePublicInquirySchema } from '@crystal/validation';
import { inquiriesService } from './inquiries.service.js';

export async function submitPublicInquiryController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Zod payload validation
    const validation = CreatePublicInquirySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(422).json({
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    // Extract client IP address
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    // 2. Execute service logic
    const result = await inquiriesService.submitInquiry(validation.data, clientIp);

    // 3. Return response (200 for bot drop, 201 for real submission)
    if (result.isHoneypot) {
      res.status(200).json({
        success: true,
        data: { inquiryId: 'noop' },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: { inquiryId: result.inquiryId },
    });
  } catch (error) {
    next(error);
  }
}
