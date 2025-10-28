import os
import glob
from weasyprint import HTML, CSS

# --- Configuration ---
SOURCE_FOLDER = 'findings'
OUTPUT_FOLDER = 'pdf_exports'
CSS_FILE = 'assets/css/print.css'
BASE_URL = os.path.dirname(os.path.abspath(__file__))
# --- End Configuration ---

def create_pdf_exports():
    """
    Finds all HTML files in the source folder, converts them
    to PDF with a print stylesheet, and saves them in the
    output folder.
    """
    
    # 1. Load your print stylesheet once
    try:
        print_css = CSS(CSS_FILE)
    except Exception as e:
        print(f"Error: Could not find or load CSS file at {CSS_FILE}")
        print(f"Details: {e}")
        return

    # 2. Create the output folder if it doesn't exist
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        print(f"Created output folder: {OUTPUT_FOLDER}")

    # 3. Find all .html files in the source folder
    search_path = os.path.join(SOURCE_FOLDER, '*.html')
    html_files = glob.glob(search_path)
    
    if not html_files:
        print(f"Error: No .html files found in {SOURCE_FOLDER}")
        return

    print(f"Found {len(html_files)} HTML files to convert...")

    # 4. Loop through each file and convert it
    for html_file_path in html_files:
        
        # Get a clean filename for the output
        file_name = os.path.basename(html_file_path)
        output_name = os.path.splitext(file_name)[0] + '.pdf'
        output_pdf_path = os.path.join(OUTPUT_FOLDER, output_name)
        
        print(f"Converting {file_name} -> {output_name}...")
        
        try:
            # This tells WeasyPrint where to find relative assets
            # (like images and your main.css file)
            html_doc = HTML(html_file_path, base_url=f'file://{BASE_URL}/')
            
            # 5. Write the PDF
            # We provide the main print.css as the primary stylesheet.
            # WeasyPrint will automatically find other stylesheets
            # (like main.css) linked in your HTML.
            html_doc.write_pdf(
                output_pdf_path,
                stylesheets=[print_css]
            )
        except Exception as e:
            print(f"  !! FAILED to convert {file_name}. Error: {e}")

    print("\nBatch conversion complete!")

# --- This makes the script runnable ---
if __name__ == "__main__":
    create_pdf_exports()