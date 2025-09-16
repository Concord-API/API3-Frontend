export type HttpClient = {
  get: <T>(url: string, init?: RequestInit) => Promise<T>
  post: <T>(url: string, body?: unknown, init?: RequestInit) => Promise<T>
}


export const api: HttpClient = {
  get: async () => {

    return {} as unknown as never
  },
  post: async () => {

    return {} as unknown as never
  },
}


