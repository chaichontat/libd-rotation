#%%
import subprocess

import numpy as np
import rasterio
import tifffile
from osgeo import gdal, osr

img = tifffile.imread("E:/Lab/V10B01-087_C1.tif")
z, y, x = img.shape

from pathlib import Path

#%%
from rasterio.enums import Resampling


def gen_files(img: np.ndarray, path: Path):
    ps = [path.parent / (path.stem + x + ".tif_") for x in ("_1", "_2")]
    for i in range(2):
        with rasterio.open(
            ps[i],
            "w",
            driver="GTiff",
            height=img.shape[1],
            width=img.shape[2],
            count=3 + i,
            dtype=img.dtype,
            crs="EPSG:32648",  # meters
            # compress="JPEG",
            tiled=True,
        ) as dst:
            for j in range(3):
                idx = j + 3 * i
                dst.write(img[idx], j + 1)
            dst.build_overviews([4, 8, 16, 32, 64], Resampling.nearest)
    return ps


ps = gen_files(img, Path("static/cogs/Br6522_Ant_IF.tif"))

# %%
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=2) as executor:
    executor.map(
        lambda i: subprocess.run(
            f"gdal_translate {ps[i].as_posix()} {ps[i].as_posix()[:-1]} -co TILED=YES -co COMPRESS=JPEG -co COPY_SRC_OVERVIEWS=YES -co JPEG_QUALITY=90",
            shell=True,
            capture_output=True,
            text=True,
            check=True,
        ),
        range(2),
    )

for p in ps:
    p.unlink()
# %%
