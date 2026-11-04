export type QueryParams = Record<string, string | number | boolean | undefined>;

export type Endpoint = {
  (params?: QueryParams): string;
  path: (...segments: (string | number)[]) => Endpoint;
};

export function endpoint(base: string): Endpoint {
  const build = (params: QueryParams = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        query.set(key, String(value));
      }
    }
    const search = query.toString();
    return search ? `${base}?${search}` : base;
  };

  return Object.assign(build, {
    path: (...segments: (string | number)[]) =>
      endpoint(
        [base, ...segments.map((s) => encodeURIComponent(String(s)))].join("/"),
      ),
  });
}

export const v1 = endpoint("/v1");
