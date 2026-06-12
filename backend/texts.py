from PyPDF2 import PdfReader
import re


def get_texts(file_path: str):
    reader = PdfReader(file_path)
    text = ""
    username = None
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
        if not username and "/Annots" in page:
            for annot in page["/Annots"]:
                obj = annot.get_object()
                if obj.get("/Subtype") == "/Link":
                    uri = obj.get("/A", {}).get("/URI")
                    if uri and "github.com/" in uri.lower():
                        annot_match = re.search(r'github\.com/([a-zA-Z0-9\-_]+)', uri, re.IGNORECASE)
                        if annot_match:
                            username = annot_match.group(1)
    
    # 3. Fallback to Plain Text Regex (Method 2) if Method 1 found nothing
    if not username:
        found = re.search(r'(?:https?://[^ \t\n\r\fv]*|www\.)?github\.com/([a-zA-Z0-9\-_]+)', text, re.IGNORECASE)
        if found:
            username = found.group(1)
    
    return text, username

