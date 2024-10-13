const { firefox } = require('playwright');
const fs = require('fs');
const path = require('path');
const keypress = require('keypress');

// Adresi kelime kelime ayıran fonksiyon
function parseAddress(address) {
    // Adresi boşluklara göre ayır
    let parts = address.split(/\s+/);

    // Konsola ayrıştırılmış kelimeleri yaz
    console.log("Ayrıştırılan kelimeler:", parts);

    return parts; // Ayrıştırılmış adres parçaları
}

async function isBotDetected(page) {
    const botMessageSelector = 'selector-of-bot-detection-message'; // Buraya bot tespit mesajının CSS seçicisini yerleştir
    return await page.evaluate(selector => {
        const messageElement = document.querySelector(selector);
        return messageElement !== null && 
            messageElement.innerText.includes('bot detection message'); // Buraya bot tespit mesajının içeriğini yerleştir
    }, botMessageSelector);
}

async function findAndProcess(page, headlineText) {
    try {
        const addressDiv = await page.waitForSelector('.box-flex.vendor-info-vendor-address.mb-sm', { timeout: 60000 });
        const h1Element = await addressDiv.$('h1');

        if (h1Element) {
            const addressText = await h1Element.innerText();
            console.log(`Adres: ${addressText}`);

            // Adresi kelime kelime ayır
            const words = parseAddress(addressText);
            console.log("Ayrıştırılmış kelimeler:", words); // Ayrıştırılmış kelimeleri konsola yazdır

            // Ayrıştırılan kelimeleri ayrı ayrı konsola yazdır
            words.forEach((word, index) => {
                console.log(`Kelime ${index + 1}: ${word}`);
            });

            // "İzmir Karşıyaka" ifadesini ekliyoruz
            const googleSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(headlineText + ' İzmir Karşıyaka')}`;
            console.log(`Google Arama URL'si: ${googleSearchUrl}`);

            // Yeni bir tarayıcı aç ve Google aramasını yap
            const searchBrowser = await firefox.launch({ headless: false });
            const searchPage = await searchBrowser.newPage();

            try {
                await searchPage.goto(googleSearchUrl);
                await searchPage.waitForTimeout(Math.random() * 2000 + 1000); // Rastgele bekleme

                const nameElement = await searchPage.waitForSelector('h3', { timeout: 60000 });
                const nameText = nameElement ? await nameElement.innerText() : "İsim bulunamadı.";
                console.log(`Google'dan alınan isim: ${nameText}`);
            } catch (error) {
                console.error(`Hata: ${error.message}`);
            } finally {
                await searchBrowser.close(); // Tarayıcıyı kapat
            }
        } else {
            console.log("h1 etiketi bulunamadı.");
        }

        // Bot kontrolü
        if (await isBotDetected(page)) {
            console.log("Bot tespit edildi! Program durduruluyor...");
            process.exit();
        }

        return true;
    } catch (error) {
        console.error(`Hata: ${error.message}`);
        return false;
    }
}

async function clickButtonAfterDelay(page, className) {
    try {
        // Sayfanın tamamen yüklendiğinden emin ol
        await page.waitForLoadState('networkidle'); // Tüm ağ isteklerinin tamamlanmasını bekle

        // 5 saniye bekle
        await page.waitForTimeout(5000); // 5000 ms = 5 saniye

        // Belirtilen sınıf adını kullanarak butona tıkla
        const button = await page.waitForSelector(`button.${className}`, { timeout: 60000 });
        await button.click();

        console.log("Butona tıklandı.");
    } catch (error) {
        console.error(`Hata: ${error.message}`);
    }
}

// Kullanım örneği
const className = 'main-info__title';

async function onSearch(url) {
    const browser = await firefox.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log(`${url} adresine gidiliyor...`);
        const start = Date.now(); // Başlangıç zamanını kaydet
        await page.goto(url);
        const duration = Date.now() - start; // Geçen süreyi hesapla

        // Yükleme süresi kontrolü
        if (duration < 2000) {
            console.log("Bot davranışı tespit edildi!");
            await browser.close();
            return false;
        }

        console.log("Sayfa açıldı, işlemler başlıyor...");

        const headlineDiv = await page.waitForSelector('.bds-c-modal__header__headlines', { timeout: 60000 });
        const headlineSpan = await headlineDiv.$('span.bds-c-modal__header__title--truncate');

        let headlineText;
        if (headlineSpan) {
            headlineText = await headlineSpan.innerText();
            console.log(`Restoran İsmi: ${headlineText}`);
        } else {
            console.log("Başlık bulunamadı.");
            return false;
        }

        // Butona tıklamadan önce 5 saniye bekle ve tıklama yap
        await clickButtonAfterDelay(page, className);

        const success = await findAndProcess(page, headlineText);
        return success;
    } catch (error) {
        console.error(`Hata: ${error.message}`);
        return false;
    } finally {
        await browser.close(); // Tarayıcıyı kapat
    }
}

async function openUrls(urls) {
    for (const url of urls) {
        console.log(`Açılıyor: ${url}`);
        const success = await onSearch(url);
        
        if (success) {
            console.log("Başarıyla açıldı.");
        } else {
            console.log("URL açılamadı, bir sonraki URL'ye geçiliyor.");
        }
    }

    console.log("Tüm URL'ler açıldı!");
}

// JSON dosyalarından URL'leri oku
async function readUrlsFromFolder(folderPath) {
    const urls = [];
    const files = fs.readdirSync(folderPath);

    for (const filename of files) {
        if (filename.endsWith('.json')) {
            console.log(`${filename} dosyası işleniyor...`);
            const filePath = path.join(folderPath, filename);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            if (data.url) {
                urls.push(data.url);
                console.log(`URL eklendi: ${data.url}`);
            } else {
                console.log(`Hata: ${filePath} dosyasında 'url' anahtarı bulunamadı.`);
            }
        }
    }
    console.log(`Toplam ${urls.length} URL bulundu.`);
    return urls;
}

// Klavye dinleyicisi
keypress(process.stdin);

// Dinleyici kur
process.stdin.on('keypress', async (ch, key) => {
    if (key && key.name === 'insert') {
        console.log("Insert tuşuna basıldı, URL'ler açılacak...");
        const folderPath = './test';
        const urls = await readUrlsFromFolder(folderPath);
        await openUrls(urls);
    } else if (key && key.ctrl && key.name === 'i') {
        console.log("Açılacak URL'yi göster...");
        // Burada, URL'leri veya işlenmekte olan mevcut URL'yi gösterebilirsin
    } else if (key && key.name === 'escape') {
        console.log("Programdan çıkılıyor...");
        process.exit(); // Programdan çıkmak için
    }
});

// Sürekli dinleme için
process.stdin.setRawMode(true);
process.stdin.resume();
