import React, { useState } from "react";
import "../styles/HelpPage.css";

const Help = () => {
    const [expandedSection, setExpandedSection] = useState(0);

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const sections = [
        {
            title: "Project Overview",
            content: (
                <div>

                    <p>
                        This project is a comprehensive platform designed to facilitate the exploration, filtering, and analysis of Transcription Factor Motifs across diverse species.
                        By leveraging advanced tools for data visualization and filtering, users can gain deeper insights into transcription factors and their associated metadata, enabling robust scientific analysis and discovery.
                    </p>
                    <ul className="ul_list">
                        <li>
                            <strong>Data Exploration and Visualization:</strong> Generate
                            detailed statistics and visualizations for transcription factors and
                            species-specific data. Access interactive graphs and tables to
                            enhance understanding and identify patterns.
                        </li>
                        <li>
                            <strong>Species Filtering:</strong> Filter species based on
                            taxonomy criteria, including family, genus, and order. View and
                            analyze curated data for selected species in an intuitive and
                            responsive datatable.
                        </li>
                        <li>
                            <strong>Transcription Factor Analysis:</strong> Apply filters to
                            transcription factors based on metadata such as class, type, and
                            associated species. Access relevant data in organized,
                            easy-to-navigate tablea for further analysis.
                        </li>
                        <li>
                            <strong>Data Export:</strong> Download selected subsets of data
                            directly from the datatables for offline use. Export the complete
                            dataset, including all species and transcription factors, in{" "}
                            <strong>.tsv</strong> format for comprehensive analysis.
                        </li>
                    </ul>
                </div>

            ),
        },
        {
            title: "Key Features on the Home Page",
            content: (
                <ul>
                    <ul>
                        <li>
                            <strong>Motif and Species Statistics:</strong> Provides comprehensive statistics, including the total number of species, motifs, and binding sites in the dataset.
                        </li>
                        <li>
                            <strong>Interactive Visualizations:</strong> Enables exploration of data distributions by motif family, species family, and other key characteristics through interactive charts and graphs.
                        </li>
                        <li>
                            <strong>Top 10 Species with Most Motifs:</strong> Displays a ranked chart showcasing the species with the highest number of motifs, aiding in quick identification of motif-rich species.
                        </li>
                        <li>
                            <strong>Species and Motif Explorer Links:</strong> Facilitates access to species-specific metadata and transcription factor motifs, allowing in-depth exploration of the dataset.
                        </li>
                    </ul>
                </ul>
            ),
        },
        {
            title: "Visualizations on the Home Page",
            content: (
                <div className="visualization-grid">
                    <div className="chart-card">
                        <h3>Motif and Species Statistics</h3>
                        <img
                            src="/images/help_home/motif_species_statistics_screenshot.png"
                            alt="Motif and Species Statistics"
                            className="screenshot"
                        />
                        <p>
                            View total species, families, orders, motifs analyzed, motif families and binding sites to understand the dataset at a glance.
                        </p>
                        <p>Click on the species, families, orders and motif families to see the data.</p>
                        <img
                            src="/images/help_home/home_family_popup.png"
                            alt="Motif and Species Statistics"
                            className="screenshot"
                        />
                    </div>
                    <div className="chart-card">
                        <h3>Transcription Factors by Motif Family</h3>
                        <img
                            src="/images/help_home/transcription_factors_by_motif_family.png"
                            alt="Top 10 Species with Most Motifs"
                            className="screenshot"
                        />
                        <p>Explore which motif families are commonly associated with specific transcription factors.</p>
                    </div>
                    <div className="chart-card">
                        <h3>Transcription Factor and Motif Family Relationships</h3>
                        <img
                            src="/images/help_home/tf_family_relationships.png"
                            alt="Top 10 Species with Most Motifs"
                            className="screenshot"
                        />
                        <p>This visualization provides a detailed network view of the relationships between transcription factors and motif families.Each connection represents an association, and the strength or frequency of these associations can be visualized. </p>
                    </div>
                    {/* <div className="chart-card">
                        <h3>Distribution by Species Family</h3>
                        <img
                            src="/images/help_home/top_species_motifs.png"
                            alt="Top 10 Species with Most Motifs"
                            className="screenshot"
                        />
                        <p>This analysis groups species based on their taxonomic family and shows how certain traits (e.g., motifs or transcription factors) are distributed within these families.</p>
                    </div> */}
                    {/* <div className="chart-card">
                        <h3>Distribution by Species Order</h3>
                        <img
                            src="/images/help_home/top_species_motifs.png"
                            alt="Top 10 Species with Most Motifs"
                            className="screenshot"
                        />
                        <p>This section focuses on the distribution of motifs or transcription factors across different orders of species. It provides a broader taxonomic grouping compared to species families.</p>
                    </div> */}
                    {/* <div className="chart-card">
                        <h3>Distribution by Species Genus</h3>
                        <img
                            src="/images/help_home/top_species_motifs.png"
                            alt="Top 10 Species with Most Motifs"
                            className="screenshot"
                        />
                        <p>The genus-level distribution allows for a finer resolution of how motifs and transcription factors are associated with specific groups of closely related species.</p>
                    </div> */}
                    {/* <div className="chart-card">
                        <h3>Motif Distribution by GC Content</h3>
                        <img
                            src="/images/help_home/top_species_motifs.png"
                            alt="Top 10 Species with Most Motifs"
                            className="screenshot"
                        />
                        <p>Motif Distribution by GC Content
                            This analysis categorizes motifs based on their GC content (the percentage of guanine and cytosine in the sequence). GC content is an important property that influences the stability and binding properties of DNA sequences.</p>
                    </div> */}
                    {/* <div className="chart-card">
                        <h3>Top 10 Species with Most Motifs</h3>
                        <img
                            src="/images/help_home/top_species_motifs.png"
                            alt="Top 10 Species with Most Motifs"
                            className="screenshot"
                        />
                        <p>Top 10 Species with Most Motifs
                            This section ranks species based on the number of motifs identified in their genomes.</p>
                    </div> */}
                    {/* <div className="chart-card">
                        <h3>Most Common Transcription Factors Across Species</h3>
                        <img
                            src="/images/help_home/top_species_motifs.png"
                            alt="Top 10 Species with Most Motifs"
                            className="screenshot"
                        />
                        <p>Most Common Transcription Factors Across Species
                            This section identifies transcription factors that are frequently found across multiple species. These transcription factors may play conserved or essential regulatory roles.</p>
                    </div> */}
                    <div className="chart-card">
                        <h3>Common Transcription Factors
                        </h3>
                        <img
                            src="/images/help_home/common_transcription_factors.png"
                            alt="Top 10 Species with Most Motifs"
                            className="screenshot"
                        />
                        <p>Most Common Transcription Factors Across Species.
                            This section identifies transcription factors that are frequently found across multiple species. You can select one of the available species from a dropdown and the relevant barplot will be shown.</p>
                    </div>
                </div>
            ),
        },
        {
            title: "Species Explorer",
            content: (
                <div>
                    <img
                        src="/images/help_explorer/species_intro.png"
                        alt="Top 10 Species with Most Motifs"
                        className="screenshot"
                    />
                    <p>Choose a Species Family, Order, Genus or the T2T Species and you will be redirected to a Datatable page with information regarding all the Species in this Category.
                    </p>
                    <p> When you select a category 4 cards with species categories will show up. You can </p>
                    <img
                        src="/images/help_explorer/species_table.png"
                        alt="Top 10 Species with Most Motifs"
                        className="screenshot"
                    />
                    <ul className="ul_list">
                        <li>A table with data regarding the selected category will be shown.</li>
                        <li>The selected species and the data from the motif analysis, along with metadata from the species are shown.</li>
                        <li>Click at the <strong>Show Instructions Button </strong> to see more info.</li>
                        <li>Three basic filters are shown, but you can filter anything from the data by clicking to the <strong>Show Advance Filters </strong>button. Click to Clear the filters to render all data.</li>
                        <li>Select how many rows per page you want to see.</li>
                        <li>Select which columns you want to preview.</li>
                        <li>Download filtered data as CSV, JSON and Parquet. Only the first 50MB will be downloaded since the dataset is too big.</li>
                        <li>Click at any motif in the table and its metadata will be shown.</li>
                    </ul>
                    <img
                        src="/images/help_explorer/motif_metadata.png"
                        alt="Top 10 Species with Most Motifs"
                        className="screenshot"
                    />
                </div>
            )
        },
        {
            title: "Motif Explorer",
            content: (
                <div>
                    <img
                        src="/images/help_explorer/motif_intro.png"
                        alt="Top 10 Species with Most Motifs"
                        className="screenshot"
                    />
                    <p>Choose a Motif Family, Class or Species and you will be redirected to a Datatable page with information regarding all the Motifs in this Category.
                    </p>
                    <img
                        src="/images/help_explorer/motif_table.png"
                        alt="Top 10 Species with Most Motifs"
                        className="screenshot"
                    />
                    <ul className="ul_list">
                        <li>A table with data regarding the selected category will be shown.</li>
                        <li>The selected motifs and the data from the motif analysis, along with metadata from the species are shown.</li>
                        <li>Click at the <strong>Show Instructions Button </strong> to see more info.</li>
                        <li>Three basic filters are shown, but you can filter anything from the data by clicking to the <strong>Show Advance Filters </strong>button. Click to Clear the filters to render all data.</li>
                        <li>Select how many rows per page you want to see.</li>
                        <li>Select which columns you want to preview.</li>
                        <li>Download filtered data as CSV, JSON and Parquet. Only the first 50MB will be downloaded since the dataset is too big.</li>
                    </ul>
                </div>
            )
        },
        {
            title: "Visualizations Page",
            content: (
                <div>
                    <h2>This page provides you with the option to explore the activity of transcription factors across species and conditions.</h2>
                    <div>
                        <div className="chart-card">

                            <img
                                src="/images/help_explorer/vis.png"
                                className="screenshot"
                            />
                        </div>
                        <div className="chart-card">

                            <img
                                src="/images/help_explorer/vs_clustermap.png"
                                alt="Clustermap of Median TF Densities"
                                className="screenshot"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="chart-card">

                            <img
                                src="/images/help_explorer/vis_median_tf.png"
                                alt="Median Transcription Factor Density by Family (Top 40 by Range)"
                                className="screenshot"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="chart-card">

                            <img
                                src="/images/help_explorer/vis_median.png"
                                alt="Median Transcription Factor Density by Order"
                                className="screenshot"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "Downloads Page",
            content: (
                <div>
                    <div>This page provides you with the option to download the entire dataset categorized by species and by the transcription factors themselves.</div>
                    <div>You can download the data in TSV format. Since the dataset is too big you will be redirected to another site in order to download the data.</div>
                    <img
                        src="/images/help_explorer/downloads.png"
                        alt="Top 10 Species with Most Motifs"
                        className="screenshot"
                    />
                </div>
            ),
        },
        {
            title: "FAQ",
            content: (
                <ul>
                    < li>
                        <strong>How do I filter data?</strong> Use the filter options available on the Filters by Motif and Filters by Species pages.
                    </li>
                    <li>
                        <strong>What file formats can I download?</strong> You can download datasets in CSV, JSON, or Parquet formats.
                    </li>
                    <li>
                        <strong>Can I request new features or report a bug?</strong> Absolutely! Please contact the development team.
                    </li>
                </ul>
            ),
        },
        {
            title: "Contact Support",
            content: (
                <p>
                    For further assistance, feel free to contact our support team.
                </p>
            ),
        },
    ];

    return (
        <div className="help-page-container">
            <h1 className="text-center fancy-title mt-5">Help & Documentation</h1>
            {sections.map((section, index) => (
                <div key={index} className="help-card">
                    <div
                        className="help-card-header"
                        onClick={() => toggleSection(index)}
                    >
                        <h2>{section.title}</h2>
                        <span>{expandedSection === index ? "▼" : "►"}</span>
                    </div>
                    {expandedSection === index && (
                        <div className="help-card-content">{section.content}</div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Help;
