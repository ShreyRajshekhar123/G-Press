from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
import sys

options = webdriver.ChromeOptions()
options.add_argument('--headless')  # Keep headless for backend use
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)
driver.get("https://timesofindia.indiatimes.com/news")

try:
    WebDriverWait(driver, 15).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a.VeCXM"))
    )
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
    driver.quit()
    sys.exit()

# Scroll to load more articles
driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
time.sleep(2)

anchors = driver.find_elements(By.CSS_SELECTOR, "a.VeCXM")

# Build headlines list
headlines = []
for a in anchors[:25]:  # Top 10
    title = a.text.strip()
    link = a.get_attribute("href")
    if title and link:
        headlines.append({
            "title": title,
            "link": link
        })

driver.quit()

# Print JSON for Express to consume
print(json.dumps(headlines, ensure_ascii=False))
