export interface Result<T = any> {
  code: number;
  message: string;
  data?: T;
}

export class ResultHelper {
  static success<T = any>(data?: T, message = 'success'): Result<T> {
    return { code: 0, message, data };
  }
  static fail<T = any>(message = 'error', data?: T, code = 1): Result<T> {
    return { code, message, data };
  }
  static toSSEMessage<T = any>(result: Result<T>): string {
    return `data: ${JSON.stringify(result)}\n\n`;
  }
}
