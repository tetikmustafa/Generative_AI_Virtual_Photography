# Product Photo AI — Kurulum ve Başlatma

## Gereksinimler
- Node.js 18+ kurulu olmalı
- ComfyUI Portable kurulmuş olmalı (bu dizinde ComfyUI/ klasörü)

## İlk Kurulum
```bash
cd frontend
npm install
```

## Çalıştırma (her seferinde)
1. Önce ComfyUI'yı başlat:
   - `ComfyUI/run_nvidia_gpu.bat` dosyasını çalıştır
   - Terminal'de "To see the GUI go to: http://127.0.0.1:8188" yazısını gör
   - ComfyUI hazır olana kadar bekle (model yüklemesi 1-2 dakika sürebilir)

2. React uygulamasını başlat:
```bash
cd frontend
npm run dev
```

3. Tarayıcıda aç: http://localhost:5173

## Kullanım
1. Ürün fotoğrafını sürükle-bırak ya da tıklayarak seç
2. İsteğe bağlı: Ayarlar panelinden parametreleri düzenle
3. "Fotoğrafları Oluştur" butonuna bas
4. 3 farklı açıdan üretilen görsellerin tamamlanmasını bekle
5. Görsellere tıklayarak tam ekran görüntüle veya indir
