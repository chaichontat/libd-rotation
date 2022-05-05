import logging
from pathlib import Path

import click
import numpy as np
import tifffile


logging.basicConfig(level="INFO")


@click.command()
@click.argument("img_path", type=click.Path(exists=True, path_type=Path))
@click.argument("pretrained_model", type=click.Path(exists=True, path_type=Path))
@click.option("channel", "--channel", help="DAPI channel", default=1)
@click.option("diameter", "--diameter", help="Average cell diameter", default=30)
def run(img_path: Path, pretrained_model: Path, channel: int, diameter: float):
    img = tifffile.imread(img_path)
    # flows[0] = XY flow in HSV 0-255
    # flows[1] = flows at each pixel
    # flows[2] = scalar cell probability (Cellpose) or distance transform (Omnipose)
    # flows[3] = final pixel locations after Euler integration
    # flows[4] = boundary output (nonempty for Omnipose)
    # flows[5] = pixel traces (nonempty for calc_trace=True)
    model = models.CellposeModel(gpu=True, pretrained_model=pretrained_model.as_posix())

    masks, flows, styles = model.eval(
        img[channel],
        diameter=diameter,
    )
    np.save(img_path.stem + "_masks.npy", masks)


if __name__ == "__main__":
    run()
