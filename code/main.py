from PyPDF2 import PdfReader

reader = PdfReader("media/susu_resume.pdf")

text = ""
for page in reader.pages:
    extracted = page.extract_text()
    if extracted:
        text += extracted

print(text)