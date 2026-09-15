"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import {
  customerInputFromForm,
  customerTypeLabels,
  validateCustomerInput,
} from "./customer";
import type { Customer } from "./customer";
import styles from "./customer-management.module.css";

type ApiError = { detail?: string | Array<{ msg?: string }> };

function errorMessage(payload: ApiError, fallback: string): string {
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) {
    return payload.detail.map((item) => item.msg ?? fallback).join(" ");
  }
  return fallback;
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    return errorMessage((await response.json()) as ApiError, fallback);
  } catch {
    return fallback;
  }
}

async function fetchCustomers(): Promise<Customer[]> {
  const response = await fetch("/api/customers", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await readError(response, "No se pudieron cargar los clientes."));
  }
  return (await response.json()) as Customer[];
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createFormVersion, setCreateFormVersion] = useState(0);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCustomers(await fetchCustomers());
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No se pudieron cargar los clientes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchCustomers()
      .then((loadedCustomers) => {
        if (active) setCustomers(loadedCustomers);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar los clientes.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function selectCustomer(customerId: number) {
    setError(null);
    setEditing(false);
    try {
      const response = await fetch(`/api/customers/${customerId}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await readError(response, "No se pudo cargar el cliente."));
      }
      setSelected((await response.json()) as Customer);
    } catch (detailError) {
      setError(
        detailError instanceof Error ? detailError.message : "No se pudo cargar el cliente.",
      );
    }
  }

  async function saveCustomer(event: FormEvent<HTMLFormElement>, customerId?: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = customerInputFromForm(form);
    const validationError = validateCustomerInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        customerId ? `/api/customers/${customerId}` : "/api/customers",
        {
          method: customerId ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      if (!response.ok) {
        throw new Error(await readError(response, "No se pudo guardar el cliente."));
      }
      const saved = (await response.json()) as Customer;
      if (!customerId) setCreateFormVersion((version) => version + 1);
      setSelected(saved);
      setEditing(false);
      await loadCustomers();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.customerLayout}>
      <section className={styles.panel} aria-labelledby="customer-list-title">
        <div className={styles.panelHeader}>
          <h2 id="customer-list-title">Clientes registrados</h2>
          <button
            className={`${styles.button} ${styles.secondary}`}
            type="button"
            onClick={() => void loadCustomers()}
          >
            Actualizar
          </button>
        </div>
        {loading ? <p className={styles.message}>Cargando clientes…</p> : null}
        {!loading && customers.length === 0 ? (
          <p className={styles.message}>Aún no hay clientes registrados.</p>
        ) : null}
        <ul className={styles.customerList}>
          {customers.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                aria-current={selected?.id === customer.id}
                onClick={() => void selectCustomer(customer.id)}
              >
                <strong>{customer.display_name}</strong>
                <span>{customerTypeLabels[customer.customer_type]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.customerContent}>
        <section className={styles.panel} aria-labelledby="create-customer-title">
          <h2 id="create-customer-title">Nuevo cliente</h2>
          <CustomerForm
            key={createFormVersion}
            saving={saving}
            onSubmit={(event) => void saveCustomer(event)}
          />
        </section>

        {error ? (
          <p className={`${styles.message} ${styles.error}`} role="alert">
            {error}
          </p>
        ) : null}

        {selected ? (
          <section className={styles.panel} aria-labelledby="customer-detail-title">
            <div className={styles.detailHeader}>
              <h2 id="customer-detail-title">Detalle del cliente</h2>
              <button
                className={`${styles.button} ${styles.secondary}`}
                type="button"
                onClick={() => setEditing(!editing)}
              >
                {editing ? "Cancelar edición" : "Editar"}
              </button>
            </div>
            {editing ? (
              <CustomerForm
                key={selected.id}
                customer={selected}
                saving={saving}
                onSubmit={(event) => void saveCustomer(event, selected.id)}
              />
            ) : (
              <CustomerDetails customer={selected} />
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CustomerForm({
  customer,
  saving,
  onSubmit,
}: {
  customer?: Customer;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className={styles.customerForm} onSubmit={onSubmit}>
      <label>
        Tipo de cliente
        <select name="customer_type" defaultValue={customer?.customer_type ?? "natural_person"}>
          <option value="natural_person">Persona natural</option>
          <option value="company">Empresa</option>
        </select>
      </label>
      <label>
        Nombre o razón social
        <input name="display_name" required defaultValue={customer?.display_name ?? ""} />
      </label>
      <label>
        Identificación
        <input name="identification" defaultValue={customer?.identification ?? ""} />
      </label>
      <label>
        Teléfono
        <input name="phone" type="tel" defaultValue={customer?.phone ?? ""} />
      </label>
      <label>
        Correo electrónico
        <input name="email" inputMode="email" defaultValue={customer?.email ?? ""} />
      </label>
      <label className={styles.fullWidth}>
        Dirección
        <textarea name="address" rows={3} defaultValue={customer?.address ?? ""} />
      </label>
      <div className={styles.formActions}>
        <button className={styles.button} type="submit" disabled={saving}>
          {saving ? "Guardando…" : customer ? "Guardar cambios" : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}

function CustomerDetails({ customer }: { customer: Customer }) {
  const value = (text: string | null) => text ?? "No registrado";
  return (
    <dl className={styles.details}>
      <div><dt>Tipo</dt><dd>{customerTypeLabels[customer.customer_type]}</dd></div>
      <div><dt>Nombre</dt><dd>{customer.display_name}</dd></div>
      <div><dt>Identificación</dt><dd>{value(customer.identification)}</dd></div>
      <div><dt>Teléfono</dt><dd>{value(customer.phone)}</dd></div>
      <div><dt>Correo</dt><dd>{value(customer.email)}</dd></div>
      <div><dt>Dirección</dt><dd>{value(customer.address)}</dd></div>
    </dl>
  );
}
