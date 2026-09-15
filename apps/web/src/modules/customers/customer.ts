export const customerTypes = ["natural_person", "company"] as const;

export type CustomerType = (typeof customerTypes)[number];

export type CustomerInput = {
  customer_type: CustomerType;
  display_name: string;
  identification: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type Customer = CustomerInput & { id: number };

export const customerTypeLabels: Record<CustomerType, string> = {
  natural_person: "Persona natural",
  company: "Empresa",
};

export function customerInputFromForm(form: HTMLFormElement): CustomerInput {
  return customerInputFromFormData(new FormData(form));
}

export function customerInputFromFormData(formData: FormData): CustomerInput {
  const optionalText = (name: string): string | null => {
    const value = String(formData.get(name) ?? "").trim();
    return value === "" ? null : value;
  };

  return {
    customer_type: String(formData.get("customer_type")) as CustomerType,
    display_name: String(formData.get("display_name") ?? "").trim(),
    identification: optionalText("identification"),
    phone: optionalText("phone"),
    email: optionalText("email"),
    address: optionalText("address"),
  };
}

export function validateCustomerInput(input: CustomerInput): string | null {
  if (!customerTypes.includes(input.customer_type)) {
    return "Selecciona un tipo de cliente válido.";
  }
  if (input.display_name === "") {
    return "El nombre es obligatorio.";
  }
  return null;
}
