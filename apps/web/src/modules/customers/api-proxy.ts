import type { NextRequest } from "next/server";

const apiBaseUrl = process.env.API_URL ?? "http://localhost:8000";

type DetailContext = { params: Promise<{ customerId: string }> };

async function proxy(responsePromise: Promise<Response>): Promise<Response> {
  try {
    const response = await responsePromise;
    return new Response(response.body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return Response.json(
      { detail: "No se pudo conectar con el servicio de clientes." },
      { status: 502 },
    );
  }
}

export async function listCustomersRequest(): Promise<Response> {
  return proxy(fetch(`${apiBaseUrl}/customers`, { method: "GET", cache: "no-store" }));
}

export async function createCustomerRequest(request: NextRequest): Promise<Response> {
  return proxy(fetch(`${apiBaseUrl}/customers`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
    cache: "no-store",
  }));
}

export async function getCustomerRequest(
  _request: NextRequest,
  context: DetailContext,
): Promise<Response> {
  const { customerId } = await context.params;
  return proxy(fetch(`${apiBaseUrl}/customers/${encodeURIComponent(customerId)}`, {
    method: "GET",
    cache: "no-store",
  }));
}

export async function updateCustomerRequest(
  request: NextRequest,
  context: DetailContext,
): Promise<Response> {
  const { customerId } = await context.params;
  return proxy(fetch(`${apiBaseUrl}/customers/${encodeURIComponent(customerId)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: await request.text(),
    cache: "no-store",
  }));
}
