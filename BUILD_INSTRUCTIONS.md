# Building Executables for Sphincs ERP

This guide explains how to package the Sphincs ERP application into a standalone Windows executable (`.exe`).

## Prerequisites

1. Python 3.10+
2. Dependencies installed:

```bash
pip install -r requirements.txt
pip install pyinstaller
```

## Quick Build

Run the automated build script:

```bash
python build_exe.py
```

Output:
- `dist/SphincsERP.exe`

## Manual Build

```bash
pyinstaller --clean erp.spec
```

## Build Output

- Executable: `dist/SphincsERP.exe`
- Build artifacts: `build/` (optional to keep)
- Spec file: `erp.spec`

## Notes

- First run creates the database in `%APPDATA%\Sphincs ERP+POS\sphincs.db` (path kept for compatibility).
- Executables are typically large because PyInstaller bundles dependencies.
- Some antivirus tools may flag unsigned PyInstaller executables.

## Troubleshooting

### Missing modules

Add missing modules to `hiddenimports` in `erp.spec`.

### Debug build

Set `console=True` in `erp.spec` while debugging startup issues.

### Testing

After building:
1. Run `SphincsERP.exe` on a clean machine/VM.
2. Validate login, dashboard, and key ERP modules.
