# C:\Users\OKKKK\Desktop\G-Press\G-Press\Server\scrapers\times_of_india_scraper.py

import sys
import codecs
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())


options = webdriver.ChromeOptions()
options.add_argument('--headless') # Keep headless for backend use AFTER debugging
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
# --- ADD THESE NEW ARGUMENTS ---
options.add_argument('--disable-gpu') # Often helps in headless mode
options.add_argument('--start-maximized') # Maximizes window for consistent element visibility
options.add_argument('--window-size=1920,1080') # Explicit window size
options.add_argument('--remote-debugging-port=9222') # Can be useful for debugging
# options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36') # Use a more common user agent
# --- END NEW ARGUMENTS ---

driver = webdriver.Chrome(options=options)
driver.get("https://timesofindia.indiatimes.com/news")

try:
    # No change needed here, as the previous indentation fix was correct.
    WebDriverWait(driver, 15).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a.VeCXM"))
    )
except Exception as e:
    # Capture more specific error if WebDriverException occurs here
    if isinstance(e, selenium.common.exceptions.TimeoutException):
        error_msg = "Timeout waiting for elements. Page might not have loaded correctly or selectors are wrong."
    else:
        error_msg = str(e)
    print(json.dumps({"success": False, "error": error_msg}))
    driver.quit()
    sys.exit()

# Scroll to load more articles (use the robust loop if desired)
last_height = driver.execute_script("return document.body.scrollHeight")
scroll_attempts = 0
max_scroll_attempts = 3 # Reduced for quicker testing, adjust as needed

while scroll_attempts < max_scroll_attempts:
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2) # Give time for content to load
    new_height = driver.execute_script("return document.body.scrollHeight")
    if new_height == last_height:
        # If no new content loaded after scrolling, break the loop
        break
    last_height = new_height
    scroll_attempts += 1


anchors = driver.find_elements(By.CSS_SELECTOR, "a.VeCXM")

# Build headlines list
headlines = []
for a in anchors[:25]:
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