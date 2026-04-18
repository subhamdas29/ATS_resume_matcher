import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Download necessary data (punkt_tab is required in newer NLTK versions)
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('stopwords')

def get_keywords(text):
    #Tokenize (break text into individual words)
    tokens = word_tokenize(text.lower())
    
    #Filter out punctuation and stopwords
    stop_words = set(stopwords.words('english'))
    keywords = [word for word in tokens if word.isalnum() and word not in stop_words]
    
    return keywords
