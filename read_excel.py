import pandas as pd
import json

try:
    # Read the excel file
    df = pd.read_excel('记录数值.xlsx')
    # Convert to json string
    json_str = df.to_json(orient='records', force_ascii=False)
    print(json_str)
except Exception as e:
    print(f"Error: {e}")
