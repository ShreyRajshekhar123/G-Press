from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import json
import time

options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)
driver.get("https://indianexpress.com/")

time.sleep(3)  # Let the page load

articles = driver.find_elements(By.CSS_SELECTOR, "div.other-article")

data = []

for article in articles[:10]:  # top 10
    try:
        link_elem = article.find_element(By.TAG_NAME, "a")
        title = link_elem.text.strip()
        href = link_elem.get_attribute("href")
        if title and href:
            data.append({"title": title, "link": href})
    except:
        continue

driver.quit()

print(json.dumps(data, ensure_ascii=False))
