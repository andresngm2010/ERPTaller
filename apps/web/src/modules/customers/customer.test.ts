import { describe, expect, it } from "vitest";

import {
  customerInputFromFormData,
  customerTypeLabels,
  validateCustomerInput,
} from "./customer";
import type { CustomerInput } from "./customer";

const validCustomer: CustomerInput = {
  customer_type: "natural_person",
  display_name: "Ana Pérez",
  identification: null,
  phone: null,
  email: null,
  address: null,
};

describe("customer behavior", () => {
  it("supports the two explicit customer types", () => {
    expect(customerTypeLabels).toEqual({
      natural_person: "Persona natural",
      company: "Empresa",
    });
  });

  it("accepts a customer without optional contact fields", () => {
    expect(validateCustomerInput(validCustomer)).toBeNull();
  });

  it("trims submitted values and stores empty optional fields as null", () => {
    const formData = new FormData();
    formData.set("customer_type", "company");
    formData.set("display_name", "  Taller Aliado  ");
    formData.set("identification", "   ");
    formData.set("phone", "  555-0101  ");

    expect(customerInputFromFormData(formData)).toEqual({
      customer_type: "company",
      display_name: "Taller Aliado",
      identification: null,
      phone: "555-0101",
      email: null,
      address: null,
    });
  });

  it("requires a display name", () => {
    expect(validateCustomerInput({ ...validCustomer, display_name: "" })).toBe(
      "El nombre es obligatorio.",
    );
  });

  it("rejects an unsupported customer type", () => {
    const invalid = {
      ...validCustomer,
      customer_type: "other",
    } as unknown as CustomerInput;
    expect(validateCustomerInput(invalid)).toBe("Selecciona un tipo de cliente válido.");
  });
});
