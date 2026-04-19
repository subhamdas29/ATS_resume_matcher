import re
from PyPDF2 import PdfReader
def get_texts():
    reader = PdfReader("media/RIVO_resume.pdf")
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted
    return text

def split_into_sections(text):
    
    
    header_pattern = r'(EXPERIENCE|WORK HISTORY|TECHNICAL SKILLS|EDUCATION|ACADEMIC|ACADEMICS|QUALIFICATIONS|SKILLS|PROJECTS|SUMMARY)'
    
    # Split text by headers and keep the headers
    parts = re.split(header_pattern, text, flags=re.IGNORECASE)
    
    sections = {}
    # re.split with a capturing group returns [text_before, header, text_after, header...]
    category_map = {
        'ACADEMIC': 'EDUCATION',
        'ACADEMICS': 'EDUCATION',
        'QUALIFICATIONS': 'EDUCATION',
        'WORK HISTORY': 'EXPERIENCE',
        'TECHNNICAL SKILLS': 'SKILLS'
        # Add more mappings as you find them!
    }

    for i in range(1, len(parts), 2):
        header = parts[i].strip().upper()
        content = parts[i+1].strip()
        
        # If the header is a synonym, change it to the standard name
        standard_header = category_map.get(header, header)
        sections[standard_header] = content
        
    return sections