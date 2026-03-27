/* eslint-disable no-console */
const BASE_URL = (process.env.BASE_URL ?? "https://sphincs-erp-crm-1.onrender.com").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "admin@sphincs.local";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "ChangeMe123!";

const results = [];

async function apiCall(method, path, options = {}) {
  const { token, body, expected = [200, 201], retries = 2, retryDelayMs = 800 } = options;
  const attemptLimit = Math.max(0, retries) + 1;
  let attempt = 0;
  let lastError = null;

  while (attempt < attemptLimit) {
    attempt += 1;
    const url = `${BASE_URL}${path}`;
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      let payload = null;
      const text = await res.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }

      const ok = expected.includes(res.status);
      const shouldRetry = !ok && res.status >= 500 && attempt < attemptLimit;
      if (shouldRetry) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
        continue;
      }

      results.push({
        method,
        path,
        status: res.status,
        ok,
        expected: expected.join("|")
      });

      if (!ok) {
        const err = new Error(
          `${method} ${path} -> ${res.status} (expected ${expected.join(",")}) :: ${JSON.stringify(payload)}`
        );
        err.nonRetryable = true;
        throw err;
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (error?.nonRetryable) {
        throw error;
      }
      if (attempt >= attemptLimit) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
    }
  }

  throw lastError ?? new Error(`${method} ${path} failed without response`);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\nSmoke summary: ${passed}/${results.length} passed, ${failed} failed`);
  for (const row of results) {
    const tag = row.ok ? "PASS" : "FAIL";
    console.log(`${tag} ${row.method} ${row.path} -> ${row.status} (expected ${row.expected})`);
  }
}

function nextCode(prefix) {
  return `${prefix}-${Date.now().toString().slice(-8)}`;
}

async function run() {
  console.log(`Running live smoke against ${BASE_URL}`);

  await apiCall("GET", "/health", { expected: [200] });
  await apiCall("GET", "/api/v1/system/info", { expected: [200] });

  const login = await apiCall("POST", "/api/v1/auth/login", {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    expected: [201]
  });
  const token = login.accessToken;
  if (!token) {
    throw new Error("Login succeeded but no accessToken returned");
  }

  const me = await apiCall("GET", "/api/v1/auth/me", { token, expected: [200] });
  await apiCall("GET", "/api/v1/roles", { token, expected: [200] });
  const orgs = await apiCall("GET", "/api/v1/organizations", { token, expected: [200] });
  const branches = await apiCall("GET", "/api/v1/branches", { token, expected: [200] });
  await apiCall("GET", "/api/v1/users", { token, expected: [200] });
  await apiCall("GET", "/api/v1/audit/logs", { token, expected: [200] });
  await apiCall("GET", "/api/v1/erp/items", { token, expected: [200] });
  await apiCall("GET", "/api/v1/erp/suppliers", { token, expected: [200] });
  await apiCall("GET", "/api/v1/erp/purchase-orders", { token, expected: [200] });
  await apiCall("GET", "/api/v1/crm/contacts", { token, expected: [200] });
  await apiCall("GET", "/api/v1/crm/leads", { token, expected: [200] });
  await apiCall("GET", "/api/v1/crm/opportunities", { token, expected: [200] });

  const organizationId = orgs[0]?.id;
  if (!organizationId) {
    throw new Error("Missing organization seed data");
  }

  const sourceBranchId = me?.branchId ?? me?.branch_id ?? branches[0]?.id;
  if (!sourceBranchId) {
    throw new Error("Missing source branch for branch-scoped smoke writes");
  }

  const destinationBranch = await apiCall("POST", "/api/v1/branches", {
    token,
    body: { organization_id: organizationId, name: nextCode("Smoke Branch") },
    expected: [201]
  });
  const destinationBranchId = destinationBranch.id;

  const item = await apiCall("POST", "/api/v1/erp/items", {
    token,
    body: {
      name: nextCode("Smoke Item"),
      sku: nextCode("SMK-ITEM"),
      status: "ACTIVE",
      selling_price: 20
    },
    expected: [201]
  });
  const itemId = item.id;

  const supplier = await apiCall("POST", "/api/v1/erp/suppliers", {
    token,
    body: {
      name: nextCode("Smoke Supplier"),
      supplier_code: nextCode("SMK-SUP"),
      status: "ACTIVE"
    },
    expected: [201]
  });
  const supplierId = supplier.id;

  await apiCall("POST", "/api/v1/erp/purchase-orders", {
    token,
    body: {
      supplier_id: supplierId,
      status: "DRAFT",
      line_items: [{ item_id: itemId, quantity: 2, unit_cost: 10, tax_rate: 0, discount: 0 }]
    },
    expected: [201]
  });

  await apiCall("POST", "/api/v1/distribution/movements", {
    token,
    body: {
      movement_type: "STOCK_CORRECTION",
      item_id: itemId,
      quantity: 1,
      status: "POSTED",
      notes: "smoke movement"
    },
    expected: [201]
  });

  await apiCall("POST", "/api/v1/distribution/inventory-stocks", {
    token,
    body: {
      item_id: itemId,
      quantity_on_hand: 10,
      reserved_quantity: 0,
      in_transit_quantity: 0,
      incoming_quantity: 0,
      damaged_quantity: 0,
      stock_valuation: 100
    },
    expected: [201]
  });

  const location = await apiCall("POST", "/api/v1/distribution/warehouse-locations", {
    token,
    body: {
      code: nextCode("LOC"),
      name: "Smoke Location",
      location_type: "GENERAL"
    },
    expected: [201]
  });

  await apiCall("POST", "/api/v1/distribution/receipts", {
    token,
    body: {
      supplier_id: supplierId,
      line_items: [{ item_id: itemId, ordered_qty: 5, received_qty: 0, rejected_qty: 0 }]
    },
    expected: [201]
  });

  const transfer = await apiCall("POST", "/api/v1/distribution/transfers", {
    token,
    body: {
      destination_branch_id: destinationBranchId,
      line_items: [{ item_id: itemId, quantity_requested: 1, quantity_sent: 0, quantity_received: 0 }]
    },
    expected: [201]
  });

  await apiCall("POST", "/api/v1/distribution/adjustments", {
    token,
    body: {
      adjustment_type: "INCREASE",
      reason: "Smoke adjustment",
      line_items: [{ item_id: itemId, previous_qty: 0, adjusted_qty: 1, variance: 1 }]
    },
    expected: [201]
  });

  const dispatch = await apiCall("POST", "/api/v1/distribution/dispatches", {
    token,
    body: {
      destination: "Smoke Destination",
      line_items: [{ item_id: itemId, quantity: 1 }]
    },
    expected: [201]
  });

  await apiCall("POST", "/api/v1/distribution/returns", {
    token,
    body: {
      return_type: "CUSTOMER_RETURN",
      destination_branch_id: destinationBranchId,
      line_items: [{ item_id: itemId, quantity: 1, restock: true, damaged: false }]
    },
    expected: [201]
  });

  const lot = await apiCall("POST", "/api/v1/distribution/lots", {
    token,
    body: {
      item_id: itemId,
      supplier_id: supplierId,
      batch_number: nextCode("BATCH"),
      quantity_received: 5,
      quantity_available: 5
    },
    expected: [201]
  });

  await apiCall("POST", "/api/v1/distribution/lot-balances", {
    token,
    body: {
      item_id: itemId,
      lot_id: lot.id,
      location_id: location.id,
      quantity_on_hand: 5,
      reserved_quantity: 0,
      available_quantity: 5,
      damaged_quantity: 0,
      in_transit_quantity: 0
    },
    expected: [201]
  });

  await apiCall("POST", "/api/v1/distribution/reservations", {
    token,
    body: {
      item_id: itemId,
      reserved_quantity: 1,
      reference_type: "SALES_ORDER",
      reference_id: "11111111-1111-4111-8111-111111111111"
    },
    expected: [201]
  });

  await apiCall("POST", "/api/v1/distribution/reorder-rules", {
    token,
    body: {
      item_id: itemId,
      preferred_supplier_id: supplierId,
      minimum_stock: 1,
      reorder_level: 2,
      reorder_quantity: 3,
      lead_time_days: 2,
      is_active: true
    },
    expected: [201]
  });

  if (dispatch?.id && dispatch?.line_items?.[0]?.id) {
    await apiCall("POST", `/api/v1/distribution/dispatches/${dispatch.id}/pick-jobs`, {
      token,
      body: {
        line_items: [
          {
            stock_dispatch_line_id: dispatch.line_items[0].id,
            item_id: itemId,
            requested_qty: 1,
            picked_qty: 0
          }
        ]
      },
      expected: [201]
    });

    await apiCall("POST", `/api/v1/distribution/dispatches/${dispatch.id}/pack-jobs`, {
      token,
      body: {
        line_items: [
          {
            stock_dispatch_line_id: dispatch.line_items[0].id,
            item_id: itemId,
            packed_qty: 0
          }
        ]
      },
      expected: [201]
    });
  }

  await apiCall("GET", "/api/v1/distribution/dashboard", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/movements", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/inventory-stocks", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/receipts", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/transfers", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/adjustments", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/dispatches", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/returns", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/warehouse-locations", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/lots", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/lot-balances", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reservations", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reorder-rules", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/restocking-suggestions", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/alerts", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/stock-on-hand", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/branch-stock-summary", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/movements", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/transfers", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/adjustments", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/receipts", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/stock-loss", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/stock-valuation", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/fast-slow-movers", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/supplier-fulfillment", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/operations-exceptions", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/branch-sla", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/inactive-stock", { token, expected: [200] });
  await apiCall("GET", "/api/v1/distribution/reports/shortages", { token, expected: [200] });

  printSummary();
}

run().catch((error) => {
  printSummary();
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`\nSmoke failed: ${message}`);
  process.exit(1);
});
