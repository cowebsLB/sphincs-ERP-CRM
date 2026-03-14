# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Sphincs ERP
"""

import sys
import os
from pathlib import Path

block_cipher = None

# Project root - PyInstaller provides SPECPATH automatically
try:
    project_root = Path(SPECPATH)
except NameError:
    project_root = Path(os.path.dirname(os.path.abspath(SPEC)))

# Collect all data files
datas = [
    ('assets/icons/sphincs_icon.ico', 'assets/icons'),
    ('src/config', 'src/config'),
]

# Hidden imports for PyQt6 and other modules
hiddenimports = [
    # PyQt6 modules
    'PyQt6.QtCore',
    'PyQt6.QtGui',
    'PyQt6.QtWidgets',
    'PyQt6.QtSql',
    'PyQt6.QtNetwork',
    'PyQt6.QtPrintSupport',
    # SQLAlchemy
    'sqlalchemy',
    'sqlalchemy.orm',
    'sqlalchemy.ext.declarative',
    'sqlalchemy.dialects.sqlite',
    # Database
    'sqlite3',
    # Other dependencies
    'loguru',
    'bcrypt',
    'requests',
    'packaging',
    'flask',
    'flask_cors',
    'pandas',
    'numpy',
    'reportlab',
    'openpyxl',
    'matplotlib',
    'seaborn',
    'yaml',
    'configparser',
    'schedule',
    'psutil',
    'keyring',
    'cryptography',
    'pyserial',
    'python_escpos',
    'pydantic',
    'cerberus',
    'passlib',
    'wmi',
    'pywin32',
    # Application modules
    'src',
    'src.database',
    'src.database.models',
    'src.database.connection',
    'src.gui',
    'src.utils',
    'src.config',
    'src.api',
]

a = Analysis(
    ['src/erp_main.py'],
    pathex=[str(project_root)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='SphincsERP',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # No console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/icons/sphincs_icon.ico',
)

