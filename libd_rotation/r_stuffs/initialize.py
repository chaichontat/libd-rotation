from pathlib import Path

import rpy2.robjects as robj
from rpy2.robjects.packages import PackageNotInstalledError, importr, isinstalled


def install_renv(cran_mirror: int = 76) -> None:
    utils = importr("utils")
    utils.chooseCRANmirror(ind=cran_mirror)
    if not isinstalled("renv"):
        utils.install_packages("renv")


def restore_renv(project: Path, lockfile: Path) -> None:
    """
    Install `renv` and restore the R environment from a lockfile.
    See https://rstudio.github.io/renv/reference/restore.html

    Raises:
        RuntimeError: Cannot install `renv`.
    """
    for _ in range(2):
        try:
            renv = importr("renv")
        except PackageNotInstalledError:
            install_renv()
        else:
            break
    else:
        raise RuntimeError("Could not install renv")

    renv.activate(project=project.as_posix())
    renv.restore(lockfile=lockfile.as_posix(), prompt=False)


def load(path: Path) -> robj.vectors.StrVector:
    base = importr("base")
    return base.load(path.as_posix())
