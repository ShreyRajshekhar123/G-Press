import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

def get_articles():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    driver.get("https://www.thehindu.com/")

    articles = []
    try:
        anchors = driver.find_elements(By.CSS_SELECTOR, "a:has(h3)")
        for a in anchors[:10]:
            title = a.text.strip()
            link = a.get_attribute("href")
            if title and link:
                articles.append({
                    "title": title,
                    "link": link,
                    "summary": title
                })
    except Exception:
        # On error, return empty list
        articles = []

    driver.quit()

    # Print only JSON output
    print(json.dumps(articles))


if __name__ == "__main__":
    get_articles()
