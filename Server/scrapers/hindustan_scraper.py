# scrapers/hindustan_scraper.py

import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

def get_hindustan_times_articles():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    url = "https://www.hindustantimes.com/latest-news"
    driver.get(url)
    driver.implicitly_wait(5)

    articles = []
    try:
        article_divs = driver.find_elements(By.CSS_SELECTOR, "div.cartHolder.listView")
        for div in article_divs:
            title = div.get_attribute("data-vars-story-title")
            relative_url = div.get_attribute("data-vars-story-url")
            link = "https://www.hindustantimes.com" + relative_url if relative_url else None

            if title and link:
                articles.append({
                    "title": title.strip(),
                    "link": link,
                    "summary": title.strip(),
                    "source": "hindustantimes"
                })

            if len(articles) >= 25:
                break
    except Exception as e:
        print("Scraping Error:", str(e))

    driver.quit()
    return articles

if __name__ == "__main__":
    print(json.dumps(get_hindustan_times_articles()))
