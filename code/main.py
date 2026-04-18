from keywords import get_keywords
from texts import get_texts

def main():
    
    #PDF to Text extraction
    extracted_text=get_texts()
    
    #Text to Keywords extraction
    keywords_list = get_keywords(extracted_text)
    
    print("--- Extracted Keywords ---")
    print(keywords_list)
    print("---Extracted Text---")
    print(extracted_text)    
if __name__ == "__main__":
    main()