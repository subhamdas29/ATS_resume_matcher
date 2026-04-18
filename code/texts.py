from PyPDF2 import PdfReader
def get_texts():
    reader = PdfReader("media/susu_resume.pdf")
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted
    return text