/* eslint-disable no-console */
const BASE_URL = (process.env.BASE_URL ?? "https://sphincs-erp-crm-1.onrender.com").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "admin@sphincs.local";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "ChangeMe123!";

const results = [];

async function apiCall(method, path, options = {}) {
  const { token, body, expected = [200, 201], retries = 6, retryDelayMs = 1500, retryUnsafe = false } = options;
  const attemptLimit = Math.max(0, retries) + 1;
  let attempt = 0;
  let lastError = null;

  while (attempt < attemptLimit) {
    attempt += 1;
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const text = await res.text();
      let payload = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }

      const ok = expected.includes(res.status);
      const isUnsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
      const shouldRetry = !ok && res.status >= 500 && attempt < attemptLimit && (!isUnsafeMethod || retryUnsafe);
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
      if (error?.nonRetryable || attempt >= attemptLimit) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
    }
  }

  throw lastError ?? new Error(`${method} ${path} failed without response`);
}

function logSkip(path, reason) {
  results.push({
    method: "SKIP",
    path,
    status: 0,
    ok: true,
    expected: reason
  });
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\nTransition smoke summary: ${passed}/${results.length} passed, ${failed} failed`);
  for (const row of results) {
    const tag = row.method === "SKIP" ? "SKIP" : row.ok ? "PASS" : "FAIL";
    const status = row.status === 0 ? "-" : row.status;
    console.log(`${tag} ${row.method} ${row.path} -> ${status} (expected ${row.expected})`);
  }
}

function nextCode(prefix) {
  return `${prefix}-${Date.now().toString().slice(-8)}`;
}

async function run() {
  console.log(`Running transition smoke against ${BASE_URL}`);

  const login = await apiCall("POST", "/api/v1/auth/login", {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    expected: [201],
    retryUnsafe: true
  });
  const token = login.accessToken;
  if (!token) {
    throw new Error("Login succeeded but no accessToken returned");
  }

  const me = await apiCall("GET", "/api/v1/auth/me", { token, expected: [200] });
  const orgs = await apiCall("GET", "/api/v1/organizations", { token, expected: [200] });
  const organizationId = orgs[0]?.id;
  if (!organizationId) {
    throw new Error("Missing organization seed data");
  }
  const sourceBranchId = me?.branchId ?? me?.branch_id;
  if (!sourceBranchId) {
    throw new Error("Missing source branch in authenticated scope");
  }

  const destinationBranch = await apiCall("POST", "/api/v1/branches", {
    token,
    body: { organization_id: organizationId, name: nextCode("Trans Branch") },
    expected: [201]
  });
  const destinationBranchId = destinationBranch.id;

  const item = await apiCall("POST", "/api/v1/erp/items", {
    token,
    body: {
      name: nextCode("Trans Item"),
      sku: nextCode("TRN-ITEM"),
      status: "ACTIVE",
      selling_price: 25
    },
    expected: [201]
  });
  const itemId = item.id;

  const supplier = await apiCall("POST", "/api/v1/erp/suppliers", {
    token,
    body: {
      name: nextCode("Trans Supplier"),
      supplier_code: nextCode("TRN-SUP"),
      status: "ACTIVE"
    },
    expected: [201]
  });
  const supplierId = supplier.id;

  const location = await apiCall("POST", "/api/v1/distribution/warehouse-locations", {
    token,
    body: {
      code: nextCode("TLOC"),
      name: "Transition Location",
      location_type: "GENERAL"
    },
    expected: [201]
  });

  const lot = await apiCall("POST", "/api/v1/distribution/lots", {
    token,
    body: {
      item_id: itemId,
      supplier_id: supplierId,
      batch_number: nextCode("TBATCH"),
      quantity_received: 4,
      quantity_available: 4
    },
    expected: [201]
  });

  const reservation = await apiCall("POST", "/api/v1/distribution/reservations", {
    token,
    body: {
      item_id: itemId,
      reserved_quantity: 1,
      reference_type: "SALES_ORDER",
      reference_id: "11111111-1111-4111-8111-111111111111"
    },
    expected: [201]
  });

  const receiptA = await apiCall("POST", "/api/v1/distribution/receipts", {
    token,
    body: {
      supplier_id: supplierId,
      line_items: [{ item_id: itemId, ordered_qty: 4, received_qty: 0, rejected_qty: 0 }]
    },
    expected: [201]
  });
  await apiCall("PATCH", `/api/v1/distribution/receipts/${receiptA.id}/receive`, {
    token,
    body: { notes: "transition smoke receive" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/receipts/${receiptA.id}/close`, {
    token,
    body: { notes: "transition smoke close" },
    expected: [200]
  });

  const receiptB = await apiCall("POST", "/api/v1/distribution/receipts", {
    token,
    body: {
      supplier_id: supplierId,
      line_items: [{ item_id: itemId, ordered_qty: 2, received_qty: 0, rejected_qty: 0 }]
    },
    expected: [201]
  });
  await apiCall("PATCH", `/api/v1/distribution/receipts/${receiptB.id}/cancel`, {
    token,
    body: { notes: "transition smoke cancel" },
    expected: [200]
  });

  const transferA = await apiCall("POST", "/api/v1/distribution/transfers", {
    token,
    body: {
      destination_branch_id: destinationBranchId,
      line_items: [{ item_id: itemId, quantity_requested: 2, quantity_sent: 2, quantity_received: 2 }]
    },
    expected: [201]
  });
  await apiCall("PATCH", `/api/v1/distribution/transfers/${transferA.id}/request`, {
    token,
    body: { notes: "transition smoke request" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/transfers/${transferA.id}/approve`, {
    token,
    body: { notes: "transition smoke approve" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/transfers/${transferA.id}/dispatch`, {
    token,
    body: { notes: "transition smoke dispatch" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/transfers/${transferA.id}/receive`, {
    token,
    body: { notes: "transition smoke receive", status: "COMPLETED" },
    expected: [200]
  });

  const transferB = await apiCall("POST", "/api/v1/distribution/transfers", {
    token,
    body: {
      destination_branch_id: destinationBranchId,
      line_items: [{ item_id: itemId, quantity_requested: 1, quantity_sent: 0, quantity_received: 0 }]
    },
    expected: [201]
  });
  await apiCall("PATCH", `/api/v1/distribution/transfers/${transferB.id}/cancel`, {
    token,
    body: { notes: "transition smoke cancel" },
    expected: [200]
  });

  const adjustment = await apiCall("POST", "/api/v1/distribution/adjustments", {
    token,
    body: {
      adjustment_type: "INCREASE",
      reason: "Transition adjustment",
      line_items: [{ item_id: itemId, previous_qty: 0, adjusted_qty: 2, variance: 2 }]
    },
    expected: [201]
  });
  await apiCall("PATCH", `/api/v1/distribution/adjustments/${adjustment.id}/submit`, {
    token,
    body: { notes: "transition smoke submit" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/adjustments/${adjustment.id}/approve`, {
    token,
    body: { notes: "transition smoke approve" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/adjustments/${adjustment.id}/apply`, {
    token,
    body: { notes: "transition smoke apply" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/adjustments/${adjustment.id}/reverse`, {
    token,
    body: { notes: "transition smoke reverse" },
    expected: [200]
  });

  const dispatchA = await apiCall("POST", "/api/v1/distribution/dispatches", {
    token,
    body: {
      destination: "Transition Destination A",
      line_items: [{ item_id: itemId, quantity: 1 }]
    },
    expected: [201]
  });
  await apiCall("PATCH", `/api/v1/distribution/dispatches/${dispatchA.id}/ready`, {
    token,
    body: { notes: "transition smoke ready" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/dispatches/${dispatchA.id}/pack`, {
    token,
    body: { notes: "transition smoke pack" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/dispatches/${dispatchA.id}/dispatch`, {
    token,
    body: { notes: "transition smoke dispatch" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/dispatches/${dispatchA.id}/deliver`, {
    token,
    body: { notes: "transition smoke deliver" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/dispatches/${dispatchA.id}/return`, {
    token,
    body: { notes: "transition smoke return" },
    expected: [200]
  });

  const dispatchB = await apiCall("POST", "/api/v1/distribution/dispatches", {
    token,
    body: {
      destination: "Transition Destination B",
      line_items: [{ item_id: itemId, quantity: 1 }]
    },
    expected: [201]
  });
  await apiCall("PATCH", `/api/v1/distribution/dispatches/${dispatchB.id}/cancel`, {
    token,
    body: { notes: "transition smoke cancel" },
    expected: [200]
  });

  const pickJobs = await apiCall("POST", `/api/v1/distribution/dispatches/${dispatchA.id}/pick-jobs`, {
    token,
    body: {
      line_items: [
        {
          stock_dispatch_line_id: dispatchA.line_items[0].id,
          item_id: itemId,
          requested_qty: 1,
          picked_qty: 0
        }
      ]
    },
    expected: [201]
  });
  const pickJobId = pickJobs.id;
  await apiCall("PATCH", `/api/v1/distribution/pick-jobs/${pickJobId}/start`, {
    token,
    body: { notes: "transition smoke pick start" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/pick-jobs/${pickJobId}/complete`, {
    token,
    body: { notes: "transition smoke pick complete" },
    expected: [200]
  });

  const packJobs = await apiCall("POST", `/api/v1/distribution/dispatches/${dispatchA.id}/pack-jobs`, {
    token,
    body: {
      line_items: [
        {
          stock_dispatch_line_id: dispatchA.line_items[0].id,
          item_id: itemId,
          packed_qty: 0
        }
      ]
    },
    expected: [201]
  });
  const packJobId = packJobs.id;
  await apiCall("PATCH", `/api/v1/distribution/pack-jobs/${packJobId}/start`, {
    token,
    body: { notes: "transition smoke pack start" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/pack-jobs/${packJobId}/complete`, {
    token,
    body: { notes: "transition smoke pack complete" },
    expected: [200]
  });

  const returnA = await apiCall("POST", "/api/v1/distribution/returns", {
    token,
    body: {
      return_type: "CUSTOMER_RETURN",
      destination_branch_id: destinationBranchId,
      line_items: [{ item_id: itemId, quantity: 1, restock: true, damaged: false }]
    },
    expected: [201]
  });
  await apiCall("PATCH", `/api/v1/distribution/returns/${returnA.id}/receive`, {
    token,
    body: { notes: "transition smoke receive" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/returns/${returnA.id}/inspect`, {
    token,
    body: { notes: "transition smoke inspect" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/returns/${returnA.id}/complete`, {
    token,
    body: { notes: "transition smoke complete" },
    expected: [200]
  });

  const returnB = await apiCall("POST", "/api/v1/distribution/returns", {
    token,
    body: {
      return_type: "CUSTOMER_RETURN",
      destination_branch_id: destinationBranchId,
      line_items: [{ item_id: itemId, quantity: 1, restock: false, damaged: true }]
    },
    expected: [201]
  });
  await apiCall("PATCH", `/api/v1/distribution/returns/${returnB.id}/cancel`, {
    token,
    body: { notes: "transition smoke cancel" },
    expected: [200]
  });

  await apiCall("PATCH", `/api/v1/distribution/warehouse-locations/${location.id}/deactivate`, {
    token,
    body: { notes: "transition smoke deactivate" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/warehouse-locations/${location.id}/activate`, {
    token,
    body: { notes: "transition smoke activate" },
    expected: [200]
  });

  await apiCall("PATCH", `/api/v1/distribution/lots/${lot.id}/hold`, {
    token,
    body: { notes: "transition smoke hold" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/lots/${lot.id}/exhaust`, {
    token,
    body: { notes: "transition smoke exhaust" },
    expected: [200]
  });
  await apiCall("PATCH", `/api/v1/distribution/lots/${lot.id}/close`, {
    token,
    body: { notes: "transition smoke close" },
    expected: [200]
  });

  await apiCall("PATCH", `/api/v1/distribution/reservations/${reservation.id}/release`, {
    token,
    body: { notes: "transition smoke release" },
    expected: [200]
  });

  const alerts = await apiCall("GET", "/api/v1/distribution/alerts", { token, expected: [200] });
  const openAlert = Array.isArray(alerts) ? alerts.find((row) => row.status === "OPEN") : null;
  if (openAlert?.id) {
    await apiCall("PATCH", `/api/v1/distribution/alerts/${openAlert.id}/resolve`, {
      token,
      body: { resolution_note: "transition smoke resolve" },
      expected: [200]
    });
  } else {
    logSkip("/api/v1/distribution/alerts/:alertId/resolve", "no-open-alert");
  }

  printSummary();
}

run().catch((error) => {
  printSummary();
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`\nTransition smoke failed: ${message}`);
  process.exit(1);
});
