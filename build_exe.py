"""Build script for creating the Sphincs ERP executable."""

import subprocess
import sys
from pathlib import Path

def build_executable(spec_file: str, app_name: str):
    """Build an executable from a spec file"""
    print(f"\n{'='*60}")
    print(f"Building {app_name}...")
    print(f"{'='*60}\n")
    
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'PyInstaller', '--clean', spec_file],
            check=True,
            capture_output=False
        )
        print(f"\n[SUCCESS] {app_name} built successfully!")
        print(f"  Executable location: dist/{app_name}.exe\n")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n[FAILED] Failed to build {app_name}")
        print(f"  Error: {e}\n")
        return False

def main():
    """Main build function"""
    print("="*60)
    print("Sphincs ERP - Executable Builder")
    print("="*60)
    
    # Check if spec files exist
    erp_spec = Path("erp.spec")
    
    if not erp_spec.exists():
        print(f"Error: {erp_spec} not found!")
        return 1
    
    # Build ERP executable
    success = True
    
    if build_executable("erp.spec", "SphincsERP"):
        print("ERP build completed successfully")
    else:
        success = False
    
    if success:
        print("\n" + "="*60)
        print("Build completed successfully!")
        print("="*60)
        print("\nExecutables are in the 'dist' folder:")
        print("  - dist/SphincsERP.exe")
        print("\nYou can distribute these files to users.")
        print("Note: The first run may take a moment to initialize the database.")
        return 0
    else:
        print("\n" + "="*60)
        print("Build completed with errors. Check the output above.")
        print("="*60)
        return 1

if __name__ == "__main__":
    sys.exit(main())

