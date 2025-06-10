# C:\Users\OKKKK\Desktop\G-Press 1\G-Press\Server\scrapers\dna_scraper.py

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import json
import time
import sys # Import the sys module

# Set the default encoding for standard output to UTF-8
# This helps resolve UnicodeEncodeError when printing non-ASCII characters
sys.stdout.reconfigure(encoding='utf-8')

# Setup headless Chrome options
options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# Start browser
driver = webdriver.Chrome(options=options)
driver.get("https://www.dnaindia.com/latest-news")

time.sleep(5)   # Wait for dynamic content

data = []

# Instead of storing stale elements, loop with fresh access
for i in range(25):
    try:
        articles = driver.find_elements(By.CLASS_NAME, "explainer-subtext")
        if i >= len(articles):
            break
        link_elem = articles[i].find_element(By.TAG_NAME, "a")
        title = link_elem.text.strip()
        href = link_elem.get_attribute("href")

        if title and href:
            data.append({
                "title": title,
                "link": href,
                "source": "dna"
            })

    except Exception as e:
        # Optional: uncomment the line below for more detailed debugging if needed
        # print(f"Error processing article {i}: {e}", file=sys.stderr)
        continue

driver.quit()

# Print as JSON
print(json.dumps(data, ensure_ascii=False, indent=2))