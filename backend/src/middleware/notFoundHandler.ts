import { Request, Response } from 'express';
import { ApiResponse } from '../types';

export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: '404',
      message: `Route ${req.originalUrl} bulunamadı`,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(404).json(response);
};
