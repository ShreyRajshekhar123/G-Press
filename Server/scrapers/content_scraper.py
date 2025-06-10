# Server/scrapers/content_scraper.py

import sys
import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options as ChromeOptions
from bs4 import BeautifulSoup
import logging
import re # IMPORTRANT: Added for regular expressions

# Configure logging for better debugging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_webdriver():
    """Initializes and returns a headless Chrome WebDriver."""
    options = ChromeOptions()
    options.add_argument('--headless')           # Run in headless mode (no UI)
    options.add_argument('--no-sandbox')         # Required for running as root in some environments
    options.add_argument('--disable-dev-shm-usage') # Overcomes limited resource problems
    options.add_argument('--disable-gpu')        # Disables GPU hardware acceleration (often needed for headless)
    options.add_argument('--window-size=1920x1080') # Set a consistent window size
    # User-Agent to mimic a regular browser, helps avoid bot detection
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36')
    options.add_experimental_option('excludeSwitches', ['enable-logging']) # Suppress DevTools warnings

    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        return driver
    except Exception as e:
        logging.error(f"Error initializing WebDriver: {e}")
        raise

def extract_paragraphs(soup, selector):
    """Helper to find a container and extract all paragraphs from it."""
    container = soup.select_one(selector)
    if container:
        paragraphs = container.find_all('p')
        # Join paragraphs with double newline for better AI reading
        return '\n\n'.join([p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)])
    return None

def scrape_article_content(url, source_name):
    """
    Scrapes the full article content from the given URL based on the source.
    Implements source-specific logic for content extraction.
    """
    driver = None # Initialize driver to None
    full_content = None # Initialize full_content to None

    try:
        # The WebDriver and BeautifulSoup objects will now be created conditionally inside each block.

        if source_name == 'hindu':
            driver = get_webdriver() # Get driver for Hindu
            driver.get(url)
            logging.info(f"Successfully loaded URL for Hindu: {url}")
            driver.implicitly_wait(5) 
            soup = BeautifulSoup(driver.page_source, 'html.parser') # Create soup here

            selectors = [
                'div.articlebodycontent', # Often the most direct parent of paragraphs
                'div.story-element',
                'div[id^="content-body-"] .story-element', # Combines ID with a specific class
                'div.content-wrapper .story-element' # Another common structure
            ]
            for selector in selectors:
                logging.info(f"Trying selector for Hindu: {selector}")
                full_content = extract_paragraphs(soup, selector)
                if full_content:
                    logging.info(f"Content found with selector: {selector}")
                    break
            
            if not full_content:
                logging.warning("No specific Hindu selector worked, trying more general approaches.")
                body_content = soup.find('article') or soup.find('div', class_='article-content') or soup.find('div', id='main-content')
                if body_content:
                    paragraphs = body_content.find_all('p')
                    full_content = '\n\n'.join([p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)])
        
        elif source_name == 'hindustan-times':
            # Hindustan Times: Not free to scrap, so extract title from URL instead of scraping page
            logging.warning(f"Hindustan Times is marked as 'not free to scrap'. Attempting to extract title from URL slug for URL: {url}")
            
            try:
                path_segments = url.split('/')
                slug = ""
                for segment in reversed(path_segments):
                    if segment and (".html" in segment or re.match(r'^[a-zA-Z0-9_-]+$', segment)): # Look for html or a slug-like string
                        slug = segment.replace('.html', '') # Remove .html if present
                        break
                
                if slug:
                    # Remove any trailing numerical IDs (e.g., -101749461946504)
                    slug = re.sub(r'-\d+$', '', slug)
                    # Replace hyphens with spaces and capitalize each word
                    title_from_slug = ' '.join([word.capitalize() for word in slug.split('-') if word])
                    
                    if title_from_slug.strip():
                        # Prepend "Article Title:" to clearly indicate it's a derived title
                        full_content = f"Article Title: {title_from_slug}"
                        logging.info(f"Successfully extracted title from URL for Hindustan Times: '{title_from_slug}'. This will be used as content.")
                    else:
                        full_content = None # Fallback if slug extraction results in empty title
                else:
                    full_content = None # If no valid slug found
                    
            except Exception as e:
                logging.error(f"Error extracting title from URL for Hindustan Times: {e}", exc_info=True)
                full_content = None # Ensure full_content is None on error
            
            if not full_content:
                logging.warning(f"Could not extract a meaningful title from URL for Hindustan Times: {url}. Returning no content.")

        elif source_name == 'toi':
            driver = get_webdriver() # Get driver for TOI
            driver.get(url)
            logging.info(f"Successfully loaded URL for TOI: {url}")
            driver.implicitly_wait(5) 
            soup = BeautifulSoup(driver.page_source, 'html.parser') # Create soup here

            article_text_parts = []
            full_content = None

            main_content_div = soup.select_one('div._s30J.clearfix') 
            
            if main_content_div:
                logging.info("Found div._s30J.clearfix. Extracting content.")
                direct_text = main_content_div.get_text(separator='\n\n', strip=True)
                if direct_text:
                    article_text_parts.append(direct_text)
                
                paragraphs = main_content_div.find_all('p')
                for p in paragraphs:
                    text = p.get_text(strip=True)
                    if text and "read full story" not in text.lower():
                        article_text_parts.append(text)

                if article_text_parts:
                    full_content = "\n\n".join(list(dict.fromkeys(article_text_parts)))
                    logging.info(f"Content extracted from div._s30J.clearfix. Length: {len(full_content)}")
            
            if not full_content or len(full_content) < 50:
                logging.warning("Primary TOI selector (div._s30J.clearfix) yielded insufficient content, trying fallbacks.")
                fallback_selectors = [
                    'div._3Mkg- article',
                    'div.Normal',
                    'div.body_content_container',
                    'div.arttext'
                ]
                for selector in fallback_selectors:
                    logging.info(f"Trying fallback selector for Times of India: {selector}")
                    content_from_fallback = extract_paragraphs(soup, selector)
                    if content_from_fallback:
                        full_content = content_from_fallback
                        logging.info(f"Content found with fallback selector: {selector}")
                        break
            
            if not full_content or not full_content.strip():
                logging.error(f"Could not extract content for URL: {url} from source: toi (All selectors failed)")
                # No return here, let the final check handle it.
        
        elif source_name == 'ie': # This is the block for Indian Express
            driver = get_webdriver() # Get driver for Indian Express
            driver.get(url)
            logging.info(f"Applying Indian Express specific scraping logic for URL: {url}")
            driver.implicitly_wait(5) 
            soup = BeautifulSoup(driver.page_source, 'html.parser') # Create soup here
            
            article_text_parts = []
            full_content = None
            
            main_content_div = soup.select_one('div.full-details')
            
            if main_content_div:
                logging.info("Found div.full-details. Extracting content.")
                paragraphs = main_content_div.find_all('p')
                for p in paragraphs:
                    text = p.get_text(separator=' ', strip=True) 
                    if text and "Also Read" not in text and "Latest News" not in text and "More From" not in text and "Join our Telegram channel" not in text: 
                        article_text_parts.append(text)
                
                if article_text_parts:
                    full_content = "\n\n".join(article_text_parts)
                    logging.info(f"Content extracted from div.full-details. Length: {len(full_content)}")
            
            if not full_content or len(full_content) < 50:
                logging.warning("Indian Express specific selector (div.full-details) failed or yielded insufficient content, trying broader fallbacks.")
                pass 

        elif source_name == 'dna': # This is the block for DNA India
            driver = get_webdriver() # Get driver for DNA India
            driver.get(url)
            logging.info(f"Applying DNA India specific scraping logic for URL: {url}")
            driver.implicitly_wait(5) 
            soup = BeautifulSoup(driver.page_source, 'html.parser') # Create soup here
            
            article_text_parts = []
            full_content = None

            main_content_div = soup.select_one('div.article-description')
            
            if main_content_div:
                logging.info("Found div.article-description. Extracting content.")
                paragraphs = main_content_div.find_all('p')
                for p in paragraphs:
                    text = p.get_text(separator=' ', strip=True) 
                    if text and "Also Read" not in text and "More From" not in text and "DNA Web Team" not in text and "Disclaimer" not in text: 
                        article_text_parts.append(text)
                
                if article_text_parts:
                    full_content = "\n\n".join(article_text_parts)
                    logging.info(f"Content extracted from div.article-description. Length: {len(full_content)}")
            
            if not full_content or len(full_content) < 50:
                logging.warning("DNA India specific selector (div.article-description) failed or yielded insufficient content, trying broader fallbacks.")
                fallback_selectors = [
                    'div.story_content_area', # From your previous example
                    'div.article-detail-inner' # From your previous example
                ]
                for selector in fallback_selectors:
                    logging.info(f"Trying fallback selector for DNA India: {selector}")
                    content_from_fallback = extract_paragraphs(soup, selector)
                    if content_from_fallback:
                        full_content = content_from_fallback
                        logging.info(f"Content found with fallback selector: {selector}")
                        break

            if not full_content or not full_content.strip():
                logging.error(f"Could not extract content for URL: {url} from source: dna (All selectors failed)")
                # No return here, let the final check handle it.
            
        # Final check for full_content after all source-specific logic
        if not full_content or not full_content.strip():
            logging.error(f"Failed to extract any content for URL: {url} from source: {source_name}. Content was empty or extraction strategy yielded nothing.")
            return None # Explicitly return None if no content found
        
        return full_content

    except Exception as e:
        logging.error(f"An error occurred during scraping for {url}: {e}", exc_info=True)
        return None
    finally:
        if driver: # Ensure driver is quit only if it was initialized
            driver.quit()

if __name__ == '__main__':
    # This block runs when the script is executed directly (e.g., by Node.js child_process)
    if len(sys.argv) < 3:
        sys.stderr.write(json.dumps({'error': 'Usage: python content_scraper.py <url> <source_name>'}))
        sys.exit(1)
    
    article_url = sys.argv[1]
    article_source = sys.argv[2]
    
    try:
        content = scrape_article_content(article_url, article_source)
        sys.stdout.reconfigure(encoding='utf-8') 
        if content:
            sys.stdout.write(json.dumps({'content': content}))
        else:
            sys.stderr.write(json.dumps({'error': 'Failed to scrape article content or content was empty.'}))
            sys.exit(1)
    except Exception as e:
        sys.stderr.write(json.dumps({'error': str(e)}))
        sys.exit(1)