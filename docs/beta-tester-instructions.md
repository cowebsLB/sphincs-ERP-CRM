# Beta Tester Instructions (V1)

Date: 2026-03-19

## Goal

Help us find real workflow and stability bugs in ERP/CRM Beta V1.

## 1) Access The Apps

- ERP: `https://cowebslb.github.io/sphincs-ERP-CRM/erp/`
- CRM: `https://cowebslb.github.io/sphincs-ERP-CRM/crm/`

## 2) Create Your Account

1. Open ERP or CRM login page.
2. Click `Create account`.
3. Use your test email + password.
4. Sign in and confirm dashboard opens.

## 3) What To Test

1. Create, edit, delete, and restore at least one record.
2. Refresh page and verify data still exists.
3. Logout/login again and verify data is still correct.
4. Confirm no unexpected crashes or blank screens.

## 4) Privacy Check (Important)

1. Use two different tester accounts.
2. Create records in account A.
3. Login with account B.
4. Confirm account B cannot see account A records.

## 5) Report Bugs (In App)

1. Click `Report Bug` in top bar.
2. Fill all required fields:
   - title
   - summary
   - steps (one per line)
   - expected result
   - actual result
   - severity
   - module/page
3. Submit and keep the returned issue number for reference.

## 6) Severity Guide

- `low`: minor UI issue, workaround exists
- `medium`: feature works partially or inconsistently
- `high`: key flow blocked, unreliable, or data wrong
- `critical`: data loss/security risk/app unusable

## 7) Known Beta Boundaries

- UI polish is intentionally minimal.
- Focus on functional correctness and reproducible bugs.
- Duplicate bug reports are okay if behavior differs by module/browser.
