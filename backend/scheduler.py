"""Thin wrapper around main.py — runs the scheduling engine with custom I/O paths."""

from __future__ import annotations

import shutil
import sys
import tempfile
import threading
import zipfile
from pathlib import Path

# Add project root so we can import main.py
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

import main as timetable_engine  # noqa: E402

# Lock to prevent concurrent runs from stomping on the monkey-patched globals
_engine_lock = threading.Lock()


def run_scheduling(courses_bytes: bytes, rooms_bytes: bytes) -> Path:
    """Run the timetable engine with uploaded files and return path to output zip.

    Creates a temporary workspace, writes the uploaded files into it,
    monkey-patches main.py's I/O paths, runs the engine, zips the results,
    and returns the zip path. The caller is responsible for cleaning up the
    zip file after sending it.
    """
    work_dir = Path(tempfile.mkdtemp(prefix="timetable_"))
    input_dir = work_dir / "inputs"
    output_dir = work_dir / "outputs"
    input_dir.mkdir()
    output_dir.mkdir()

    # Write uploaded files
    (input_dir / "courses.xlsx").write_bytes(courses_bytes)
    (input_dir / "rooms.xlsx").write_bytes(rooms_bytes)

    # Run the engine with patched paths
    with _engine_lock:
        original_input = timetable_engine.INPUT_DIR
        original_output = timetable_engine.OUTPUT_DIR
        try:
            timetable_engine.INPUT_DIR = input_dir
            timetable_engine.OUTPUT_DIR = output_dir
            timetable_engine.main()
        finally:
            timetable_engine.INPUT_DIR = original_input
            timetable_engine.OUTPUT_DIR = original_output

    # Zip all output files
    zip_path = work_dir / "timetables.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in output_dir.rglob("*"):
            if file.is_file():
                arcname = file.relative_to(output_dir)
                zf.write(file, arcname)

    return zip_path


def cleanup_workdir(zip_path: Path) -> None:
    """Remove the temporary workspace after the response has been sent."""
    work_dir = zip_path.parent
    shutil.rmtree(work_dir, ignore_errors=True)
