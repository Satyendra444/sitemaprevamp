import type { APIRequestContext } from '@playwright/test';

export async function checkHttpStatus(request: APIRequestContext, path: string): Promise<number> {
  try {
    const response = await request.head(path, { maxRedirects: 10 });
    return response.status();
  } catch {
    try {
      const response = await request.get(path, { maxRedirects: 10 });
      return response.status();
    } catch {
      return -1;
    }
  }
}
