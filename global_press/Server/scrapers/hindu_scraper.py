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

    driver.get("https://www.thehindu.com/latest-news/")
    driver.implicitly_wait(5)

    articles = []

    try:
        # Select all <li> elements inside the latest news list
        items = driver.find_elements(By.CSS_SELECTOR, "ul.timeline-with-img > li")

        for item in items[:30]:  # top 10 articles
            try:
                anchor = item.find_element(By.CSS_SELECTOR, "div.element > a")
                link = anchor.get_attribute("href")

                # Extract image alt/title text as summary/title
                img = anchor.find_element(By.TAG_NAME, "img")
                title = img.get_attribute("title") or img.get_attribute("alt")

                if title and link:
                    articles.append({
                        "title": title.strip(),
                        "link": link,
                        "summary": title.strip()
                    })

            except Exception as inner_e:
                continue

    except Exception as e:
        print("Scraping failed:", e)
        articles = []

    driver.quit()
    print(json.dumps(articles, indent=2))

if __name__ == "__main__":
    get_articles()
