# libd-rotation

## On running Cellpose at JHPCE

Run these commands in [`$MYSCRATCH`](https://jhpce.jhu.edu/knowledge-base/disk-storage-space-on-the-jhpce-cluster/fastscratch-space-on-jhpce/).

1) Get a GPU instance (not necessary for environment setup)

```sh
qrsh -pe local 1 -R y -l caracol,h_vmem=128G,mem_free=128G -now n bash
```

2) Use the `cellpose` module.

3) Run [`run_cp.py`](scripts/segmentation/run_cp.py).
```sh
python run_cp.py IMG_PATH_CHANGE_ME PRETRAINED_MODEL_CHANGE_ME
```

Docs
```
Usage: cp.py [OPTIONS] IMG_PATH PRETRAINED_MODEL

Options:
  --channel INTEGER   DAPI channel
  --diameter INTEGER  Average cell diameter
  --help              Show this message and exit.
```

The output file can be opened with `np.load`,
which is a matrix of the same size as your image.
The values correspond to the segment's id.
This is a format that can be analyzed with
[`skimage.measure.regionprops`](https://scikit-image.org/docs/dev/api/skimage.measure.html#skimage.measure.regionprops)
and is compatible with typical binary image operations (dilation, etc).

This takes around ~5 minutes on an 20000 × 20000 image with a Tesla A100.


#### Manual conda installation
- Install `miniforge`

```sh
wget https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh
chmod +x Miniforge3-Linux-x86_64.sh
./Miniforge3-Linux-x86_64.sh
```

If `miniforge` is not in your `PATH`, run `conda init bash`.

- Setup conda environment

```sh
conda create -n cellpose numpy numba scipy opencv-python-headless fastremap tifffile -y
conda activate cellpose
conda install pytorch cudatoolkit=11.3 -c pytorch -y
pip install cellpose
```

## Process ROI

A script/notebook is available at [scripts/segmentation/process_roi.py](scripts/segmentation/process_roi.py).
This script extracts the physical parameters of each mask and assign it to the nearest spot.
