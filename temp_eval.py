import os, requests
from dotenv import load_dotenv
load_dotenv('.env')
key = os.getenv('GROQ_API_KEY')
print(f'Key starts with: {key[:10]}...')
res = requests.get('https://api.groq.com/openai/v1/models', headers={'Authorization': f'Bearer {key}'})
print(res.status_code)
print(res.json())
