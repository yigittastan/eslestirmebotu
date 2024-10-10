# import selenium.webdriver as webdriver
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# import keyboard

# # Chrome seçeneklerini ayarla
# chrome_options = webdriver.ChromeOptions()
# chrome_options.add_argument("--remote-debugging-port=9222")  # Debugging portunu ayarla
# chrome_options.add_argument("--user-data-dir=C:/Path/To/Your/Chrome/User/Data")  # Kullanıcı verilerini belirt

# # WebDriver'ı mevcut oturumla başlat
# driver = webdriver.Chrome(options=chrome_options)

# print("Program başladı. '*' tuşuna basarak h1 içeriğini alıp Google Maps'te arama yapabilirsiniz.")

# # "*" tuşuna basıldığında çalışacak fonksiyon
# def capture_and_search():
#     print("İşlem başladı...")  # İşlemin başladığını konsola yaz
#     try:
#         # XPath ile butonun görünür olmasını bekle
#         button = WebDriverWait(driver, 20).until(
#             EC.visibility_of_element_located((By.XPATH, '//*[@id="vendor-details-root"]/main/section[1]/div/button[1]'))
#         )
#         h1_text = button.find_element(By.TAG_NAME, 'h1').text
        
#         # Yeni sekme aç ve Google Maps'te arama yap
#         driver.execute_script(f"window.open('https://www.google.com/maps/search/{h1_text}', '_blank');")
#         print(f"Başarılı: '{h1_text}' Google Maps'te arandı.")  # Başarılı olduğunda mesaj
#     except Exception as e:
#         print("Hata:", e)

# # "*" tuşuna basıldığında fonksiyonu çağır
# keyboard.add_hotkey('*', capture_and_search)

# keyboard.wait()  # Programın sürekli çalışmasını sağlar