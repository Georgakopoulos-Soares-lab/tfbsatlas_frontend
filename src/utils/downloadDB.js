import axios from "axios";

const columnSpeciesMapping = {
    species: "species_name",
    motifId: "motif_id",
    motifAltId: "motif_alt_id",
    sequenceName: "sequence_name",
    start: "start",
    stop: "stop",
    strand: "strand",
    score: "score",
    pValue: "p_value",
    qValue: "q_value",
    matchedSequence: "matched_sequence",
    genomeSize: "genome_size",
    gcPercent: "gc_percent",
    order: "order_taxon",
    family: "family",
    genus: "genus",
};

const columnMotifMapping = {
    tfSpecies: "assembly_accession",
    species: "tf_species",
    motifId: "motif_id",
    motifAltId: "motif_alt_id",
    sequenceName: "sequence_name",
    start: "start",
    stop: "stop",
    strand: "strand",
    score: "score",
    pValue: "p_value",
    qValue: "q_value",
    matchedSequence: "matched_sequence",
    protClass: "class",
    family: "family",
    taxGroup: "tax_group",
    type: "type"
};


export const downloadSpeciesData = async (
    data,
    columnsVisibility,
    format,
) => {
    try {
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error("No data available for download.");
        }
        if (!columnsVisibility || typeof columnsVisibility !== "object") {
            throw new Error("Columns visibility configuration is missing.");
        }

        // Extract selected columns and map them to backend column names
        const selectedColumns = Object.keys(columnsVisibility)
            .filter((key) => columnsVisibility[key])
            .map((col) => columnSpeciesMapping[col]); // Map to backend column names

        if (selectedColumns.length === 0) {
            throw new Error("No columns selected for download.");
        }

        // Verify all selected columns are mapped correctly
        const missingColumns = selectedColumns.filter((col) => !col);
        if (missingColumns.length > 0) {
            throw new Error(`Missing mapping for columns: ${missingColumns.join(", ")}`);
        }

        // POST request to backend
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/export-data`,
            {
                data,
                columns: selectedColumns,
                format,
            },
            { responseType: format === "parquet" ? "blob" : "json" }
        );

        if (format === "csv" || format === "parquet") {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `data.${format}`);
            document.body.appendChild(link);
            link.click();
        } else if (format === "json") {
            const jsonBlob = new Blob([JSON.stringify(response.data, null, 2)], {
                type: "application/json",
            });
            const url = window.URL.createObjectURL(jsonBlob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "data.json");
            document.body.appendChild(link);
            link.click();
        }
    } catch (error) {
        console.error("Error downloading file:", error.message || error);
    }
};


export const downloadMotifData = async (
    data,
    columnsVisibility,
    format,
) => {
    console.log(data, columnsVisibility)
    try {
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error("No data available for download.");
        }
        if (!columnsVisibility || typeof columnsVisibility !== "object") {
            throw new Error("Columns visibility configuration is missing.");
        }

        // Extract selected columns and map them to backend column names
        const selectedColumns = Object.keys(columnsVisibility)
            .filter((key) => columnsVisibility[key])
            .map((col) => columnMotifMapping[col]); // Map to backend column names

        if (selectedColumns.length === 0) {
            throw new Error("No columns selected for download.");
        }

        // Verify all selected columns are mapped correctly
        const missingColumns = selectedColumns.filter((col) => !col);
        if (missingColumns.length > 0) {
            throw new Error(`Missing mapping for columns: ${missingColumns.join(", ")}`);
        }

        // POST request to backend
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/export-data`,
            {
                data,
                columns: selectedColumns,
                format,
            },
            { responseType: format === "parquet" ? "blob" : "json" }
        );

        if (format === "csv" || format === "parquet") {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `data.${format}`);
            document.body.appendChild(link);
            link.click();
        } else if (format === "json") {
            const jsonBlob = new Blob([JSON.stringify(response.data, null, 2)], {
                type: "application/json",
            });
            const url = window.URL.createObjectURL(jsonBlob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "data.json");
            document.body.appendChild(link);
            link.click();
        }
    } catch (error) {
        console.error("Error downloading file:", error.message || error);
    }
};
