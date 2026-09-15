// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CustomerManagement } from "./customer-management";
import type { Customer } from "./customer";

const fetchMock = vi.fn<typeof fetch>();

const naturalPerson: Customer = {
  id: 1,
  customer_type: "natural_person",
  display_name: "Ana Pérez",
  identification: null,
  phone: null,
  email: null,
  address: null,
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("customer management", () => {
  it("loads the list, opens detail, and edits a customer", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(json([naturalPerson]));
    render(<CustomerManagement />);
    expect(screen.getByText("Cargando clientes…")).toBeTruthy();

    const listButton = await screen.findByRole("button", { name: /Ana Pérez/u });
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/customers", { cache: "no-store" });

    fetchMock.mockResolvedValueOnce(json(naturalPerson));
    await user.click(listButton);
    const detailHeading = await screen.findByRole("heading", { name: "Detalle del cliente" });
    const detailPanel = detailHeading.closest("section");
    expect(detailPanel).not.toBeNull();
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/customers/1", { cache: "no-store" });
    expect(within(detailPanel!).getByText("Persona natural")).toBeTruthy();

    await user.click(within(detailPanel!).getByRole("button", { name: "Editar" }));
    const nameInput = within(detailPanel!).getByLabelText("Nombre o razón social");
    await user.clear(nameInput);
    await user.type(nameInput, "Ana Pérez Actualizada");

    const updated = { ...naturalPerson, display_name: "Ana Pérez Actualizada" };
    fetchMock.mockResolvedValueOnce(json(updated));
    fetchMock.mockResolvedValueOnce(json([updated]));
    await user.click(within(detailPanel!).getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock.mock.calls[2]?.[0]).toBe("/api/customers/1");
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: "PUT" });
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toMatchObject({
      display_name: "Ana Pérez Actualizada",
    });
    await within(detailPanel!).findByText("Ana Pérez Actualizada");
  });

  it("creates a natural person and a company", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(json([]));
    render(<CustomerManagement />);
    await screen.findByText("Aún no hay clientes registrados.");

    const createHeading = screen.getByRole("heading", { name: "Nuevo cliente" });
    const createPanel = createHeading.closest("section");
    expect(createPanel).not.toBeNull();
    const form = within(createPanel!);
    const nameInput = form.getByLabelText("Nombre o razón social");

    await user.type(nameInput, "Ana Pérez");
    fetchMock.mockResolvedValueOnce(json(naturalPerson, 201));
    fetchMock.mockResolvedValueOnce(json([naturalPerson]));
    await user.click(form.getByRole("button", { name: "Crear cliente" }));
    await waitFor(() =>
      expect((form.getByLabelText("Nombre o razón social") as HTMLInputElement).value).toBe(""),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      customer_type: "natural_person",
      display_name: "Ana Pérez",
    });

    const company: Customer = {
      ...naturalPerson,
      id: 2,
      customer_type: "company",
      display_name: "Taller Aliado",
    };
    await user.selectOptions(form.getByLabelText("Tipo de cliente"), "company");
    const resetNameInput = form.getByLabelText("Nombre o razón social");
    await user.type(resetNameInput, "Taller Aliado");
    fetchMock.mockResolvedValueOnce(json(company, 201));
    fetchMock.mockResolvedValueOnce(json([naturalPerson, company]));
    await user.click(form.getByRole("button", { name: "Crear cliente" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    expect(JSON.parse(String(fetchMock.mock.calls[3]?.[1]?.body))).toMatchObject({
      customer_type: "company",
      display_name: "Taller Aliado",
    });
  });

  it("shows client validation and API errors", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(json([]));
    render(<CustomerManagement />);
    await screen.findByText("Aún no hay clientes registrados.");

    const createPanel = screen.getByRole("heading", { name: "Nuevo cliente" }).closest("section");
    expect(createPanel).not.toBeNull();
    const form = within(createPanel!);
    const nameInput = form.getByLabelText("Nombre o razón social");

    await user.type(nameInput, "   ");
    await user.click(form.getByRole("button", { name: "Crear cliente" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "El nombre es obligatorio.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.clear(nameInput);
    await user.type(nameInput, "Cliente inválido");
    fetchMock.mockResolvedValueOnce(
      json({ detail: [{ msg: "La solicitud no es válida." }] }, 422),
    );
    await user.click(form.getByRole("button", { name: "Crear cliente" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "La solicitud no es válida.",
    );
  });
});
