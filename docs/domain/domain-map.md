# Initial Domain Map

The following domains are initial design boundaries. Their detailed capabilities,
entities, workflows, and integration contracts are TBD and should be discovered
through real vertical slices.

| Domain | Tentative responsibility |
| --- | --- |
| Identity / Access | Authentication, authorization, and access policy. Exact roles and permissions are TBD. |
| Customers | Customer records and customer-specific business behavior. |
| Vehicles | Vehicle records and vehicle-specific business behavior. |
| Workshop | Estimates, work orders, and execution of workshop work at a high level. Detailed lifecycle is TBD. |
| Inventory | Product/part catalog, stock, and stock movements at a high level. |
| Purchasing | Acquisition workflows at a high level. Supplier boundaries and detailed process are TBD. |
| Sales / Billing | Sales and invoices at a high level. Tax and legal rules are TBD. |
| Cash / Payments | Payments and cash-related records at a high level. Reconciliation rules are TBD. |

Relationships between these domains must be expressed through public application
services, contracts, or events—not shared internal models or cross-module writes.
Ownership of concepts that touch multiple domains must be settled from business
requirements and recorded here and, when architectural, in an ADR.

Possible future domains include accounting, appointments, notifications, reporting,
employees, and suppliers. They are not current modules and must not be designed in
advance.
