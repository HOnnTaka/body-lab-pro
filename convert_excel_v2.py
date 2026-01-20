import pandas as pd
import json
import os

try:
    df = pd.read_excel('记录数值.xlsx')
    # Use fillna to handle empty cells if needed, or drop
    # df = df.fillna(0)
    
    # Check shape
    print(f"Rows: {len(df)}")
    
    json_path = 'src/utils/reference_data.json'
    df.to_json(json_path, orient='records', force_ascii=False, indent=2)
    print(f"Saved to {json_path}")
    
except Exception as e:
    print(f"Error: {e}")
