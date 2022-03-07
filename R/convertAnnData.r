# Activate conda with anndata first.
# Converts spe from spatialLIBD to AnnData.


renv::install("bioc::basilisk")
renv::install("bioc::ExperimentHub")
renv::install("bioc::zellkonverter")
renv::install("bioc::spatialLIBD")

box::use(
    zk = zellkonverter,
    ExperimentHub,
    spatialLIBD[fetch_data]
)

if (!exists("sce_layer")) sce_layer <- fetch_data(type = "sce_layer", eh = ehub)

ehub <- ExperimentHub::ExperimentHub()
spe <- fetch_data(type = "spe", eh = ehub)

# Somehow automatically installs the entire miniconda system.
zk$writeH5AD(spe, file = "spe.h5ad")
