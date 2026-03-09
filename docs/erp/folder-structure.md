# ERP Folder Structure

Back to [Documentation Index](../INDEX.md), [ERP Implementation Summary](implementation-summary-2026-03-09.md), and [ERP Worklog](worklog.md).

## Goal

Define a clean ERP-only structure while preserving historical POS code safely.

## Active Runtime Structure

- `src/erp_main.py`: ERP entrypoint.
- `src/gui/`: active ERP UI modules.
- `src/database/`: models and connection.
- `src/api/`: mobile API.
- `src/utils/`: shared ERP utilities.
- `erp.spec`: ERP executable spec.
- `build_exe.py`: ERP-only executable builder.

## Archived (Non-Active) POS Structure

- `archive/pos/src/pos_main.py`
- `archive/pos/src/gui/pos_login.py`
- `archive/pos/src/gui/pos_window.py`
- `archive/pos/build/pos.spec`
- `archive/pos/build/sphincs_icon_pos.ico`

POS is no longer part of active runtime/import paths.

## Compatibility Stub

- `src/pos_main.py` is now a retirement stub that exits with guidance to run ERP.

## Conventions

1. New runtime code belongs under `src/` ERP modules only.
2. Deprecated/retired code goes under `archive/`.
3. Docs for structural changes must be logged in `docs/erp/worklog.md`.
4. Keep runtime entrypoints minimal and explicit (`erp_main.py` only for active app).
