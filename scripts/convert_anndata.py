import logging
from logging import getLogger
from pathlib import Path
from typing import Union

import click
from anndata2ri.r2py import rpy2py_single_cell_experiment
from rpy2.robjects.packages import importr

import libd_rotation.r_stuffs.initialize as init

logging.basicConfig(level=logging.INFO)
logger = getLogger(__name__)
# Do NOT set the project directory to the current working directory.
# That will result in an out of memory error. Somehow.


@click.command()
@click.argument(
    "project_path",
    nargs=1,
    type=click.Path(exists=True, file_okay=False, path_type=Path),
)
@click.argument(
    "lock_file_path",
    nargs=1,
    type=click.Path(exists=True, dir_okay=False, path_type=Path),
)
@click.argument(
    "rdata_path",
    nargs=1,
    type=click.Path(exists=True, dir_okay=False, path_type=Path),
)
@click.argument(
    "output_path",
    nargs=1,
    type=click.Path(dir_okay=False, path_type=Path),
)
@click.option(
    "obj_name",
    "--obj_name",
    default=None,
    help="Name of the object to convert. Defaults to the first object in the file.",
)
def convert(
    project_path: Path, lock_file_path: Path, rdata_path: Path, output_path: Path, obj_name: Union[str, None]
):
    """
    Convert RDATA_PATH to OBJ_NAME using PROJECT_PATH and lock file LOCK_FILE_PATH for R.

    Args:
        project_path (Path): _description_
        rdata_path (Path): _description_
        output_path (Path): _description_
        obj_name (Union[str, None]): _description_
    """
    base = importr("base")
    init.restore_renv(project_path, lock_file_path)
    logger.info("RENV successfully restored.")

    objs = init.load(rdata_path)
    to_conv: str = objs[0] if obj_name is None else obj_name
    logger.info(f"Converting {to_conv}.")

    adata = rpy2py_single_cell_experiment(base.get(to_conv))
    adata.obs.detected = adata.obs.detected.astype(int)  # Emergency fix.
    adata.write_h5ad(output_path)
    logger.info("Done!")


if __name__ == "__main__":
    convert()
