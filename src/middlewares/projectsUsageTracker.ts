import { Request, Response, NextFunction } from 'express';

const usageMap: Record<string, { requests: number; totalBytes: number }> = {};

export function trackUsage(req: Request, res: Response, next: NextFunction) {
  const match = req.url.match(/^\/uploads\/([^\/]+)/);
  if (!match) return next();

  const folder = match[1];

  res.on('finish', () => {
    const size = parseInt(res.getHeader('Content-Length')?.toString() || '0');

    if (!usageMap[folder]) {
      usageMap[folder] = { requests: 0, totalBytes: 0 };
    }

    usageMap[folder].requests += 1;
    usageMap[folder].totalBytes += size;
  });

  next();
}

export function getProjectUsage() {
  return usageMap;
}
