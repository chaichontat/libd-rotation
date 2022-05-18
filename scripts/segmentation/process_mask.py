# pyright: reportMissingTypeArgument=false, reportUnknownParameterType=false, reportUnknownArgumentType=false, reportUnknownVariableType=false

# ---
# jupyter:
#   jupytext:
#     cell_metadata_filter: -all
#     formats: ipynb,py:percent
#     text_representation:
#       extension: .py
#       format_name: percent
#       format_version: '1.3'
#       jupytext_version: 1.13.8
#   kernelspec:
#     display_name: Python 3 (ipykernel)
#     language: python
#     name: python3
# ---


# %% [markdown]
# ## Process ROI
# This script/notebook processes segmentation masks from `cellpose`
# and groups them to the Visium spots they belong to.
# Also, it thresholds the intensity of cell types and returns positive counts.
# Note that it is possible for a cell to belong to be positive in multiple channels.
#
# This script is intended to be run as cells in VS Code.
# It can be converted to a notebook by running `jupytext --to notebook process_mask.py`.
# See https://jupytext.readthedocs.io/en/latest/using-cli.html for more information.
#
# %%
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import tifffile
from scipy.spatial import KDTree
from skimage.measure import regionprops, regionprops_table

sns.set()

for ii, n in enumerate(["Br2720_Ant_IF", "Br6432_Ant_IF", "Br6522_Ant_IF", "Br8667_Post_IF"]):
    img_path = f"/Users/chaichontat/Documents/VIF/{n}.tif"
    out_path = f"{n}.csv"
    mask_path = f"/Users/chaichontat/Downloads/V10B01-087_{chr(65+ii)}1_masks.npy"
    spot_path = f"/Users/chaichontat/Documents/VIF/{n}/spatial/tissue_positions_list.csv"
    names = {0: "junk", 1: "dapi", 2: "gfap", 3: "neun", 4: "olig2", 5: "tmem119"}
    thresholds = {
        "neun": 10,
        "olig2": 20,
        "tmem119": 25,
    }
    m_per_px = 0.497e-6
    spot_radius = 65e-6
    area_threshold = 200

    assert set(thresholds.keys()).issubset(set(names.values()))
    raw = pd.read_csv(
        spot_path,
        header=None,
        names=["barcode", "included", "row", "col", "x", "y"],
    )
    raw = raw.iloc[raw.included[raw.included == 1].index].reset_index().drop(columns=["included", "index"])

    def setup():
        imgs = tifffile.imread(img_path)
        masks = np.load(mask_path)
        its = {
            names[i]: regionprops_table(masks, intensity_image=imgs[i], properties=["intensity_mean"])[
                "intensity_mean"
            ]
            for i in range(2, 6)
        }

        general = regionprops_table(masks, properties=["centroid", "area"])
        its["area"] = general["area"]
        its["x"] = general["centroid-0"]
        its["y"] = general["centroid-1"]

        return pd.DataFrame(its), masks, imgs

    df, masks, target = setup()
    props = regionprops(masks)

    idx = 400
    pad = 5

    def plot_roi(idx: int, vmax: int = 128, nrows: int = 3, ncols: int = 2):
        bbox = props[idx]["bbox"]
        roi = props[idx]["image"]
        fig, axs = plt.subplots(nrows=nrows, ncols=ncols, figsize=(8, 8))
        axs = axs.flatten()
        axs[0].imshow(np.pad(roi, (pad, pad), mode="constant", constant_values=0), aspect="equal")
        axs[0].set_title("Mask")
        axs[0].grid(False)
        for i in range(1, 6):
            axs[i].imshow(
                target[
                    i,
                    max(0, bbox[0] - pad) : min(target.shape[1], bbox[2] + pad),
                    max(0, bbox[1] - pad) : min(target.shape[2], bbox[3] + pad),
                ],
                vmax=vmax,
                aspect="equal",
            )
            axs[i].set_title(names[i])
            axs[i].grid(False)

        fig.tight_layout()
        return fig

    # %%
    # Plot ROI - sanity check
    # plot_roi(4)
    # plt.scatter(raw["x"], raw["y"], 2)
    # plt.scatter(df["y"], df["x"], 2)
    # %% [markdown]
    # ### Process ROI properties.
    #
    # Calculates mask parameters. See available parameters [here](https://scikit-image.org/docs/dev/api/skimage.measure.html#skimage.measure.regionprops).
    #
    # Builds a $k$-d tree to assign masks to spots.

    # %%
    props = regionprops_table(
        masks,
        intensity_image=target[5],
        properties=("centroid", "area", "intensity_max", "intensity_mean", "intensity_min"),
    )

    # Build KD tree for nearest neighbor search.
    kd = KDTree(raw[["x", "y"]])

    dist, idx = kd.query(df[["x", "y"]])
    dist = pd.DataFrame({"dist": dist, "idx": idx})
    combi = pd.concat([df, dist], axis=1)

    # Threshold
    for name, t in thresholds.items():
        combi[f"N_{name}"] = combi[name] > t
    # %%
    sns.histplot(data=df, x="area")
    # %% [markdown]
    # Filters out masks that are smaller than a threshold and
    # masks whose centroid is farther than the spot radius (aka not inside the spot).

    # %%
    px_dist = spot_radius / m_per_px  # meter per px.
    filtered = combi[(combi.area > area_threshold) & (combi.dist < px_dist)]

    summed = filtered[[f"N_{name}" for name in thresholds] + ["idx"]].groupby("idx").sum().astype(int)
    means = filtered[[f"{name}" for name in thresholds] + ["idx"]].groupby("idx").mean()

    # %% [markdown]
    # ### Export
    # %%
    out = pd.concat(
        [
            raw,
            summed,
            filtered[["idx", "dist"]].groupby("idx").count().dist.rename("counts"),
        ],
        axis=1,
    )
    out.fillna(0, inplace=True)
    for name in thresholds:
        out[f"N_{name}"] = out[f"N_{name}"].astype(int)
    out.counts = out.counts.astype(int)
    out.to_csv(out_path, float_format="%.3f")

    # %%
    import json

    Path(n).mkdir(exist_ok=True)
    Path(n + "/cellCoords.json").write_text(
        json.dumps([dict(x=row.y, y=row.x) for row in df[["x", "y"]].itertuples()])
    )

    #%%
    ct = 4 * combi["N_neun"] + 2 * combi["N_olig2"] + combi["N_tmem119"]

    mapping = ["TMEM+", "OLIG2+", "NeuN+"]

    def conv(n: int):
        if n == 0:
            return "Neg"
        out = ""
        for i, m in enumerate(mapping):
            if n & (1 << i):
                out += m
        return out

    key = [conv(i) for i in range(8)]

    types = [key[x] for x in ct.to_numpy()]
    # %%
    import json

    Path(n + "/cellType.json").write_text(json.dumps(types))
