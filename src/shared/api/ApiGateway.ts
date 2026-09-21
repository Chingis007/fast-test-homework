import { API_BASE } from "../config";
import { ApiError, NetworkError, type HttpGateway } from "./HttpGateway";

export class ApiGateway implements HttpGateway {
  constructor(private readonly baseUrl: string = API_BASE) {}

  get = async <T>(path: string): Promise<T> => {
    const response = await this.send(path, () => fetch(this.url(path)));
    return this.toJson<T>(response, path);
  };

  post = async <T>(path: string, payload: unknown): Promise<T> => {
    const response = await this.send(path, () =>
      fetch(this.url(path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    );
    return this.toJson<T>(response, path);
  };

  private url = (path: string): string => `${this.baseUrl}${path}`;

  private send = async (path: string, request: () => Promise<Response>): Promise<Response> => {
    try {
      return await request();
    } catch (error) {
      throw new NetworkError(this.url(path), error);
    }
  };

  private toJson = async <T>(response: Response, path: string): Promise<T> => {
    if (!response.ok) {
      throw new ApiError(response.status, this.url(path));
    }
    return (await response.json()) as T;
  };
}
