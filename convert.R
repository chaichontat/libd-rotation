convert_to_anndata <- function(filename, output) {
    load(filename, verbose = TRUE)
    zellkonverter::writeH5AD(get(ls()[1]), file = output)
}
