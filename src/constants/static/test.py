import json
from collections import defaultdict

def load_json_data(file_path):
    """Safely loads data from a JSON file, handling potential UTF-8 BOM."""
    try:
        # Specify encoding to handle potential BOM (Byte Order Mark)
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
        print("Please ensure the hardcoded paths in the script are correct and accessible.")
        exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: The file '{file_path}' is not a valid JSON file. Details: {e}")
        exit(1)

def main():
    """
    This script audits TF classes and families independently to find which 
    categories are completely inactive based on a pre-computed list of empty motifs.
    """
    print("--- Starting Independent Audit of Empty Motif Categories ---")

    # --- Step 1: Define file paths and load the data ---
    
    # Paths are hardcoded as requested
    EMPTY_MOTIFS_PATH = "/storage/group/izg5139/default/nafsika/tf_project/website/src/constants/static/empty_motifs.json"
    MOTIF_META_PATH = "/storage/group/izg5139/default/nafsika/tf_project/website/src/constants/static/motif_metadata.json"

    print(f"Loading pre-computed empty motifs from: {EMPTY_MOTIFS_PATH}")
    empty_motifs_list = load_json_data(EMPTY_MOTIFS_PATH)
    # Convert the list to a set for highly efficient lookups
    empty_motif_set = set(empty_motifs_list)
    print(f"Successfully loaded {len(empty_motif_set)} unique empty motifs.")

    print(f"Loading motif metadata from: {MOTIF_META_PATH}")
    motif_metadata = load_json_data(MOTIF_META_PATH)
    print(f"Successfully loaded metadata for {len(motif_metadata)} motifs.")

    # --- Step 2: Group all motifs by Class and by Family (two separate groupings) ---

    print("\nGrouping all known motifs by TF Class and, separately, by TF Family...")
    
    motifs_by_class = defaultdict(set)
    motifs_by_family = defaultdict(set)
    
    for motif_info in motif_metadata:
        tf_class = motif_info.get('tf_class')
        tf_family = motif_info.get('tf_family')
        motif_id = motif_info.get('motif_id')
        
        if not motif_id:
            continue
            
        if tf_class:
            motifs_by_class[tf_class].add(motif_id)
        if tf_family:
            motifs_by_family[tf_family].add(motif_id)
            
    print(f"Found {len(motifs_by_class)} unique TF Classes.")
    print(f"Found {len(motifs_by_family)} unique TF Families.")

    # --- Step 3: Independently audit each TF Class ---
    
    print("\nAuditing TF Classes...")
    empty_classes = []
    
    for tf_class, motifs_in_class in motifs_by_class.items():
        # The core logic: A class is empty if ALL motifs belonging to it
        # are present in the set of empty motifs.
        if motifs_in_class.issubset(empty_motif_set):
            empty_classes.append(tf_class)

    # --- Step 4: Independently audit each TF Family ---

    print("Auditing TF Families...")
    empty_families = []

    for tf_family, motifs_in_family in motifs_by_family.items():
        # The same core logic applied to families: A family is empty if ALL
        # of its motifs are found within the empty_motif_set.
        if motifs_in_family.issubset(empty_motif_set):
            empty_families.append(tf_family)

    # --- Step 5: Print the final results in two separate sections ---
    
    print("\n" + "="*50)
    print("                 AUDIT RESULTS")
    print("="*50)
    
    # Print results for TF Classes
    if not empty_classes:
        print("\nNo TF Classes were found to be completely empty.")
    else:
        print(f"\nFound {len(empty_classes)} TF Classes where ALL associated motifs are empty:")
        # Sort alphabetically for consistent, readable output
        for tf_class in sorted(empty_classes):
            print(f"  - {tf_class}")
            
    # Print results for TF Families
    if not empty_families:
        print("\nNo TF Families were found to be completely empty.")
    else:
        print(f"\nFound {len(empty_families)} TF Families where ALL associated motifs are empty:")
        # Sort alphabetically
        for tf_family in sorted(empty_families):
            print(f"  - {tf_family}")
            
    print("\n--- Audit Complete ---")

if __name__ == "__main__":
    main()