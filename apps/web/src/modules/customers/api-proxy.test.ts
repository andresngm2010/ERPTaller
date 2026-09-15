import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCustomerRequest,
  getCustomerRequest,
  listCustomersRequest,
  updateCustomerRequest,
} from "./api-proxy";

const fetchMock = vi.fn<typeof fetch>();

function requestWithBody(body: string): NextRequest {
  return { text: async () => body } as NextRequest;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("customer API proxy", () => {
  it("forwards list and propagates the response", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json([{ id: 1, display_name: "Ana" }], { status: 200 }),
    );

    const response = await listCustomersRequest();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/customers", {
      method: "GET",
      cache: "no-store",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: 1, display_name: "Ana" }]);
  });

  it("forwards create method and body", async () => {
    const body = JSON.stringify({ customer_type: "company", display_name: "Aliado" });
    fetchMock.mockResolvedValueOnce(Response.json({ id: 2 }, { status: 201 }));

    const response = await createCustomerRequest(requestWithBody(body));

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/customers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 2 });
  });

  it("forwards detail requests with an encoded identifier", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ detail: "invalid" }, { status: 422 }));

    const response = await getCustomerRequest(requestWithBody(""), {
      params: Promise.resolve({ customerId: "bad id" }),
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/customers/bad%20id", {
      method: "GET",
      cache: "no-store",
    });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ detail: "invalid" });
  });

  it("forwards update method and body", async () => {
    const body = JSON.stringify({ customer_type: "natural_person", display_name: "Ana" });
    fetchMock.mockResolvedValueOnce(Response.json({ id: 7 }, { status: 200 }));

    const response = await updateCustomerRequest(requestWithBody(body), {
      params: Promise.resolve({ customerId: "7" }),
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/customers/7", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: 7 });
  });

  it("returns 502 when FastAPI cannot be reached", async () => {
    fetchMock.mockRejectedValueOnce(new Error("connection refused"));

    const response = await listCustomersRequest();

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      detail: "No se pudo conectar con el servicio de clientes.",
    });
  });
});
