import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubStalledFetch() {
  const fetchMock = vi.fn(
    (_url: URL, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(init.signal?.reason),
        );
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function stubTimeout() {
  const timeout = new AbortController();
  const timeoutSpy = vi
    .spyOn(AbortSignal, "timeout")
    .mockReturnValue(timeout.signal);
  return { timeout, timeoutSpy };
}

describe("api client", () => {
  it("parses and returns the JSON body on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: "Thing" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("GET", "/things/1")).resolves.toEqual({
      id: 1,
      name: "Thing",
    });
    expect(fetchMock.mock.calls[0][0]).toEqual(
      new URL("/things/1", import.meta.env.VITE_API_URL),
    );
  });

  it("resolves to null without a body on a 204 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    await expect(request("DELETE", "/things/1")).resolves.toBeNull();
  });

  it("throws ApiError with status and parsed body on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Not found" }), {
          status: 404,
        }),
      ),
    );

    await expect(request("GET", "/things")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      body: { detail: "Not found" },
    });
  });

  it("wraps a network failure into ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(request("GET", "/things")).rejects.toBeInstanceOf(ApiError);
  });

  it("gives up on a load once it times out", async () => {
    stubStalledFetch();
    const { timeout, timeoutSpy } = stubTimeout();

    const pending = request("GET", "/things");
    timeout.abort(new DOMException("timed out", "TimeoutError"));

    await expect(pending).rejects.toBeInstanceOf(ApiError);
    expect(timeoutSpy).toHaveBeenCalledWith(15_000);
  });

  it("cancels a load when its caller aborts", async () => {
    stubStalledFetch();
    const controller = new AbortController();

    const pending = request("GET", "/things", { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toBeInstanceOf(ApiError);
  });

  it("keeps the status of a failed load whose body times out", async () => {
    const { timeout } = stubTimeout();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () =>
          new Promise((_resolve, reject) => {
            timeout.signal.addEventListener("abort", () =>
              reject(timeout.signal.reason),
            );
          }),
      }),
    );

    const pending = request("GET", "/things");
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    timeout.abort(new DOMException("timed out", "TimeoutError"));

    await expect(pending).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
    });
  });

  it("still times out a load in browsers without AbortSignal.any", async () => {
    stubStalledFetch();
    const { timeout } = stubTimeout();
    const { any } = AbortSignal;
    Reflect.deleteProperty(AbortSignal, "any");

    try {
      const pending = request("GET", "/things", {
        signal: new AbortController().signal,
      });
      timeout.abort(new DOMException("timed out", "TimeoutError"));

      await expect(pending).rejects.toBeInstanceOf(ApiError);
    } finally {
      AbortSignal.any = any;
    }
  });

  it("still cancels a load in browsers without AbortSignal.any", async () => {
    stubStalledFetch();
    stubTimeout();
    const { any } = AbortSignal;
    Reflect.deleteProperty(AbortSignal, "any");

    try {
      const controller = new AbortController();
      const pending = request("GET", "/things", { signal: controller.signal });
      controller.abort();

      await expect(pending).rejects.toBeInstanceOf(ApiError);
    } finally {
      AbortSignal.any = any;
    }
  });

  it("does not time out a save", async () => {
    const { timeout, timeoutSpy } = stubTimeout();
    let respond: (response: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: URL, init: RequestInit) =>
          new Promise<Response>((resolve, reject) => {
            respond = resolve;
            init.signal?.addEventListener("abort", () =>
              reject(init.signal?.reason),
            );
          }),
      ),
    );

    const pending = request("POST", "/things", { body: "{}" });
    timeout.abort(new DOMException("timed out", "TimeoutError"));
    respond(new Response(JSON.stringify({ id: 1 }), { status: 201 }));

    await expect(pending).resolves.toEqual({ id: 1 });
    expect(timeoutSpy).not.toHaveBeenCalled();
  });
});
