import React, { useState } from 'react';
import '../styles/HelpPage.css';

const Help = () => {
  const [expandedSection, setExpandedSection] = useState(0);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      title: 'Project Overview',
      content: (
        <div>
          <p>
            This project is a comprehensive platform designed to facilitate the
            exploration, filtering, and analysis of Transcription Factor Motifs
            across diverse species. By leveraging advanced tools for data
            visualization and filtering, users can gain deeper insights into
            transcription factors and their associated metadata, enabling robust
            scientific analysis and discovery.
          </p>
          <ul className="ul_list">
            <li>
              <strong>Data Exploration and Visualization:</strong> Generate
              detailed statistics and visualizations for transcription factors
              and species-specific data. Access interactive graphs and tables to
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
              dataset, including a per transcription factor or a per species
              grouping of records, in <strong>.tsv</strong> format for
              comprehensive analysis.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Key Features on the Home Page',
      content: (
        <ul>
          <ul>
            <li>
              <strong>At-a-Glance Statistics:</strong> Instantly view key
              database metrics, including the total number of mammalian species,
              taxonomic orders, motif families, and binding sites. Click on any
              statistic to see a detailed list.
            </li>
            <li>
              <strong>Interactive Dual-Chart Visualization:</strong> Explore the
              entire dataset through a powerful, interconnected interface. A
              taxonomic treemap visualizes the distribution of transcription
              factor binding sites across species, while a dynamic bar chart
              breaks down the corresponding motif composition.
            </li>
            <li>
              <strong>Deep-Dive and Drill-Down Analysis:</strong> Interactively
              filter the data. Clicking a taxon (e.g., an Order or Family) in
              the treemap instantly updates the bar chart to show motif data for
              only that selection. You can also drill down within the bar chart
              to move from motif classes to families and individual motifs.
            </li>
            <li>
              <strong>Dedicated Browsing Sections:</strong> Use dedicated
              sections to browse and explore all available species and motif
              categories, providing direct pathways to more detailed
              information.
            </li>
          </ul>
        </ul>
      ),
    },
    {
      title: 'Visualizations on the Home Page',
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
              View total species, families, orders, motifs analyzed, motif
              families and binding sites to understand the dataset at a glance.
            </p>
            <p>
              Click on the species, families, orders and motif families to see
              the data.
            </p>
            <img
              src="/images/help_home/home_family_popup.png"
              alt="Motif and Species Statistics"
              className="screenshot"
            />
          </div>
          <div className="chart-card">
            <h3>
              Treemap of taxonomic distribution of transcription factors per
              Order, Family, Genus, Species
            </h3>
            <img
              src="/images/help_home/treemap.png"
              alt="treemap"
              className="screenshot"
            />
            <p>
              If a user clicks at any taxonomic order present in the original
              view of the treemap, then the TFBS distribution across taxonomic
              families will be shown and by clicking on a specific family, the
              treemap will drill-down to genus and species levels
            </p>
          </div>
          <div className="chart-card">
            <h3>
              Interactive Barplot of transcription factor classes, families and
              individual factors per selected species-specific taxonomy
            </h3>
            <img
              src="/images/help_home/treemap_barplot.png"
              alt="treemap_barplot"
              className="screenshot"
            />
            <p>
              By clicking the treemap the bar plot is updated in real-time, and
              also it follows the same drill-down logic. When a user clicks a
              bar showing the counts of a specific TF class, then the
              distribution of counts for the families comprising the class will
              be shown. This can be expanded to specific TFs. .{' '}
            </p>
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
          {/* <div className="chart-card">
            <h3>Common Transcription Factors</h3>
            <img
              src="/images/help_home/common_transcription_factors.png"
              alt="Top 10 Species with Most Motifs"
              className="screenshot"
            />
            <p>
              Most Common Transcription Factors Across Species. This section
              identifies transcription factors that are frequently found across
              multiple species. You can select one of the available species from
              a dropdown and the relevant barplot will be shown.
            </p>
          </div> */}
        </div>
      ),
    },
    {
      title: 'Species Explorer',
      content: (
        <div>
          <img
            src="/images/help_explorer/species_intro.png"
            alt="Top 10 Species with Most Motifs"
            className="screenshot"
          />
          <p>
            Choose a Species Family, Order, Genus or the T2T Species and you
            will be redirected to a Datatable page with information regarding
            all the Species in this Category.
          </p>
          <p>
            {' '}
            When you select a category 4 cards with species categories will show
            up. You can click a taxonomic category and you will be redirected to
            a table regarding that category
          </p>
          <img
            src="/images/help_explorer/table_primates.png"
            alt="table_primates"
            className="screenshot"
          />
          <ul className="ul_list">
            <li>
              A table with data regarding the selected category will be shown.
            </li>
            <li>
              The selected species and the data from the motif analysis, along
              with metadata from the species are shown.
            </li>
            <li>
              Click at the <strong>Show Instructions Button </strong> to see
              more info.
            </li>
            <li>
              Three basic filters are shown, but you can filter anything from
              the data by clicking to the <strong>Show Advance Filters </strong>
              button. Click to Clear the filters to render all data.
            </li>
            <li>Select how many rows per page you want to see.</li>
            <li>Select which columns you want to preview.</li>
            <li>
              Download filtered data as CSV, JSON and Parquet. Only the first
              50MB will be downloaded since the dataset is too big.
            </li>
            <li>
              Click at any motif in the table and its metadata will be shown.
            </li>
          </ul>
          <img
            src="/images/help_explorer/motif_table_primates.png"
            alt="Top 10 Species with Most Motifs"
            className="screenshot"
          />
        </div>
      ),
    },
    {
      title: 'Motif Explorer',
      content: (
        <div>
          <img
            src="/images/help_explorer/motif_intro.png"
            alt="Top 10 Species with Most Motifs"
            className="screenshot"
          />
          <p>
            Choose a Motif Family, Class or Species and you will be redirected
            to a Datatable page with information regarding all the Motifs in
            this Category.
          </p>
          <img
            src="/images/help_explorer/table_sox14.png"
            alt="Top 10 Species with Most Motifs"
            className="screenshot"
          />
          <ul className="ul_list">
            <li>
              A table with data regarding the selected category will be shown.
            </li>
            <li>
              The selected motifs and the data from the motif analysis, along
              with metadata from the species are shown.
            </li>
            <li>
              Click at the <strong>Show Instructions Button </strong> to see
              more info.
            </li>
            <li>
              Three basic filters are shown, but you can filter anything from
              the data by clicking to the <strong>Show Advance Filters </strong>
              button. Click to Clear the filters to render all data.
            </li>
            <li>Select how many rows per page you want to see.</li>
            <li>Select which columns you want to preview.</li>
            <li>
              Download filtered data as CSV, JSON and Parquet. Only the first
              50MB will be downloaded since the dataset is too big.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Visualizations Page',
      content: (
        <div>
          <h2>
            This page provides interactive charts to explore transcription
            factor (TF) activity and distribution across different species and
            taxonomic groups.
          </h2>
          <p>
            The visualizations are designed to offer insights into the
            hierarchical structure of TF families, their density across genomes,
            and their enrichment near key genomic features like Transcription
            Start Sites (TSS).
          </p>

          {/* Sunburst Chart */}
          <div className="chart-card">
            <h3>TF Class, Family, and Motif Density Sunburst</h3>
            <p>
              This interactive sunburst chart provides a hierarchical view of
              transcription factor motif density for a selected species. The
              chart is organized with TF Classes in the inner ring and TF
              Families in the outer ring. You can click on a segment to drill
              down and explore the density contribution of specific
              sub-categories. Hovering over any segment reveals detailed
              information about its density and percentage contribution. Use the
              dropdown menu to select a species to analyze.
            </p>
            <img
              src="/images/help_explorer/sunburst_placeholder.png"
              alt="Sunburst Chart showing TF density hierarchy"
              className="screenshot"
            />
          </div>

          {/* Bar Chart */}
          <div className="chart-card">
            <h3>Motif Density Bar Chart</h3>
            <p>
              This  bar chart allows for a detailed
              exploration of transcription factor density across species per selected motif. Initially, it
              displays the total counts aggregated at the highest level (e.g.,
              TF Class). 
            </p>
            <img
              src="/images/help_explorer/barchart_placeholder.png"
              alt="Bar Chart for drilling down into motif counts"
              className="screenshot"
            />
          </div>

          {/* Box Plot */}
          <div className="chart-card">
            <h3>TF Class Density Box Plot</h3>
            <p>
              This plot compares the total density of a selected transcription
              factor class across all available species, which are grouped by
              their taxonomic order. Each point on the plot represents a single
              species, allowing you to see the distribution and variation of a
              TF class's density within and between different orders. You can
              select the TF class to analyze from the dropdown menu.
            </p>
            <img
              src="/images/help_explorer/boxplot_placeholder.png"
              alt="Box plot of TF class density grouped by order"
              className="screenshot"
            />
          </div>

          {/* Heatmap */}
          <div className="chart-card">
            <h3>TF Density Heatmap per Order</h3>
            <p>
              This heatmap shows the absolute TFBS class density (per Megabase)
              for all species within a selected taxonomic order. Each row
              represents a TF class, and each column represents a species. The
              color intensity corresponds to the density, with darker colors
              indicating higher density. This allows for quick identification of
              which TF classes are most prevalent across different species in
              the same order.
            </p>
            <img
              src="/images/help_explorer/heatmap_placeholder.png"
              alt="Heatmap showing TF densities for a taxonomic order"
              className="screenshot"
            />
          </div>

          {/* TSS Enrichment Plot */}
          <div className="chart-card">
            <h3>TSS Enrichment Plot</h3>
            <p>
              This plot shows the enrichment of TF binding motifs relative to
              Transcription Start Sites (TSS) for a selected T2T
              (Telomere-to-Telomere) genome. The x-axis represents the distance
              in base pairs from the TSS, and the y-axis shows the enrichment
              level (a value greater than 1 indicates higher than random
              occurrence). The shaded area represents the 95% confidence
              interval. Use the dropdown to select a T2T genome to analyze.
            </p>
            <img
              src="/images/help_explorer/tss_placeholder.png"
              alt="TSS enrichment plot"
              className="screenshot"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Downloads Page',
      content: (
        <div>
          <h2>Downloading Full Datasets</h2>
          <p>
            This page allows you to download the complete TFBS (Transcription
            Factor Binding Site) datasets. You can browse and select data
            organized either by individual species or by transcription factor
            motifs.
          </p>

          <h3>How to Download</h3>
          <ol style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '10px' }}>
              <strong>Choose a Download Mode:</strong> Use the toggle switch at
              the top right to select whether you want to browse datasets "Per
              Species" or "Per Motif". The table will update accordingly.
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Find and Select Your Data:</strong>
              <ul style={{ marginTop: '5px' }}>
                <li>
                  Use the <strong>search bar</strong> to filter the table. The
                  search matches items that start with your query.
                </li>
                <li>
                  Use the <strong>checkboxes</strong> on the left to select one
                  or more items you wish to download or all.
                </li>
              </ul>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Initiate the Download:</strong> Once you have made your
              selection, click the large "Download Selected" button.
            </li>
          </ol>

          <div>
            <h4 style={{ color: '#664d03' }}>Important: Allow Pop-ups!</h4>
            <p>
              When you start the download, your browser will attempt to open a
              new tab for each selected file.{' '}
              <strong>
                You must allow pop-ups from this website for the downloads to
                begin.
              </strong>{' '}
              A progress bar will show the status as the system prepares your
              files from our Zenodo repository.
            </p>
            <p>
              Each downloaded file is a compressed archive (<code>.tar.gz</code>
              ) containing the TFBS data for the selected species or motif.
            </p>
          </div>

          <img
            src="/images/help_explorer/downloads.png"
            alt="The Downloads page interface, showing the selection table and controls."
            className="screenshot"
            style={{ marginTop: '20px' }}
          />
        </div>
      ),
    },
    {
      title: 'Contact Support',
      content: (
        <p>
          For further assistance, feel free to contact <a>ilias@austin.utexas.edu</a>,
          <a>kap6605@psu.edu</a> or <a>ekb5871@psu.edu</a>
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
            <span>{expandedSection === index ? '▼' : '►'}</span>
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
