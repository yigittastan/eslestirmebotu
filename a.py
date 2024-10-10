import json
import os
import time
import re
import keyboard
from playwright.sync_api import sync_playwright

def parse_address(address):
    match = re.match(r'^(.*?)\s+(\d+\s*.*)$', address)
    
    if match:
        street_name = match.group(1).strip()
        street_number = match.group(2).strip()
        additional_info = street_number.split(" ", 1)
        
        if len(additional_info) > 1:
            number = additional_info[0]
            details = additional_info[1]
        else:
            number = additional_info[0]
            details = ""

        return {
            "street_name": street_name,
            "street_number": number,
            "details": details
        }
    return None

def find(page):
    try:
        # Buton ve içeriği bulmak için bekleme
        button = page.wait_for_selector('//*[@id="vendor-details-root"]/main/section[1]/div/button[1]', timeout=60000)
        h1_text = button.query_selector('h1').inner_text()
        
        # Hakkında butonunu bul ve tıkla
        about_button = page.wait_for_selector("//button[@data-testid='vendor-info-more-info-btn']", timeout=30000)
        about_button.click()

        # İç penceredeki h1 etiketini bekle
        inner_h1 = page.wait_for_selector("/html/body/div[6]/div/div[2]/div/div/div/div/div[2]/div[3]/span/h1", timeout=30000)
        inner_text = inner_h1.inner_text()

        # reCAPTCHA kontrolü
        try:
            page.wait_for_selector("//iframe[contains(@src, 'recaptcha')]", timeout=10000)
            print("reCAPTCHA ile karşılaşıldı. Lütfen geçin.")
            input("Devam etmek için Enter tuşuna basın...")
        except Exception:
            print("reCAPTCHA yok veya geçildi.")

        # Google Maps araması
        page.evaluate(f"window.open('https://www.google.com/maps/search/{h1_text}', '_blank');")
        print(f"Başarılı: '{h1_text}' Google Maps'te arandı.")
    except Exception as e:
        print("Hata:", e)
        time.sleep(5)

def onSearch(page, url):
    try:
        page.goto(url)
        find(page)
    except Exception as e:
        print(f"Hata: {e}")
        time.sleep(5)

folder_path = 'C:\\Users\\LEVEL END\\Desktop\\yemeksepeti-data\\test'
urls = []
current_index = 0

# Klasördeki JSON dosyalarını oku
for filename in os.listdir(folder_path):
    if filename.endswith('.json'):
        print("çalışıyor")
        file_path = os.path.join(folder_path, filename)
        
        with open(file_path, 'r', encoding='utf-8') as file:
            try:
                data = json.load(file)
                if 'url' in data:
                    urls.append(data['url'])
                else:
                    print(f"Hata: {file_path} dosyasında 'url' anahtarı bulunamadı.")
            except json.JSONDecodeError as e:
                print(f"Hata: {file_path} dosyası okunamadı. {e}")
                time.sleep(5)

# "Insert" tuşuna basıldığında bir URL'yi aç
def open_url(playwright):
    global current_index
    
    if current_index < len(urls):
        print(f"Açılıyor: {urls[current_index]}")
        browser = playwright.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        
        onSearch(page, urls[current_index])
        
        # Chrome penceresini aktif et
        # PyAutoGUI veya benzeri bir kütüphane ile aktif hale getirebilirsiniz.
        
        current_index += 1
    else:
        print("Tüm URL'ler açıldı!")

# "Ctrl+I" tuşuna basıldığında bir URL'yi yazdır
def display_url():
    global current_index
    if current_index < len(urls):
        print(f"Açılacak URL: {urls[current_index]}")
    else:
        print("Tüm URL'ler yazıldı!")

with sync_playwright() as playwright:
    keyboard.add_hotkey('insert', lambda: open_url(playwright))
    keyboard.add_hotkey('ctrl+i', display_url)

    print("Insert tuşuna basarak URL'leri açabilirsiniz, Ctrl+I tuşuna basarak URL'leri yazdırabilirsiniz.")
    keyboard.wait()  # Programın sürekli çalışmasını sağlar
