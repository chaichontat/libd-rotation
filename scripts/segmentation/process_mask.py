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
#
# This script is intended to be run as cells in VS Code.
# It can be converted to a notebook by running `jupytext --to notebook process_mask.py`.
# See https://jupytext.readthedocs.io/en/latest/using-cli.html for more information.
#
# and relate them to Visium spots.
#
# %%
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import tifffile
from scipy.spatial import KDTree
from skimage.measure import regionprops, regionprops_table

sns.set()

img_path = "Br2720.tif"
out_path = "Br2720_Ant_IF.csv"
mask_path = "/Users/chaichontat/Downloads/V10B01-087_A1_masks.npy"
spot_path = "/Users/chaichontat/Documents/VIF/Br2720_Ant_IF/spatial/tissue_positions_list.csv"
names = {0: "junk", 1: "dapi", 2: "gfap", 3: "neun", 4: "olig2", 5: "tmem119"}
thresholds = {
    "neun": 10,
    "olig2": 10,
    "tmem119": 25,
}
m_per_px = 0.497e-6
spot_radius = 65e-6


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
plot_roi(4)
plt.scatter(raw["x"], raw["y"], 2)
plt.scatter(df["y"], df["x"], 2)
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
filtered = combi[(combi.area > 200) & (combi.dist < px_dist)]

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
