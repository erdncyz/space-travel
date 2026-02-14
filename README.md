# Space Travel

Canvas tabanlı, mobil uyumlu uzay oyunu. Skorlar Firebase Firestore üzerinde tutulur.

## Hızlı Başlatma

1. Projeyi aç:

```bash
cd /Users/erdincyilmaz/Desktop/space-travel
```

2. Yerel sunucu başlat:

```bash
npx serve .
```

3. Tarayıcıdan aç:
- Genelde `http://localhost:3000`

## Firebase Kurulumu (Zorunlu)

Bu proje `Firestore` kullanır (`Realtime Database` değil).

1. Firebase Console'da Firestore oluştur.
2. `Firestore Database > Rules` bölümüne aşağıdaki kuralı yapıştırıp publish et:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{deviceId} {
      allow read: if true;
      allow delete: if false;

      allow create: if
        request.resource.data.deviceId == deviceId &&
        request.resource.data.name is string &&
        request.resource.data.name.size() > 0 &&
        request.resource.data.name.size() <= 15 &&
        request.resource.data.bestScore is int &&
        request.resource.data.bestScore >= 0 &&
        request.resource.data.bestLevel is int &&
        request.resource.data.bestLevel >= 1;

      allow update: if
        request.resource.data.deviceId == deviceId &&
        request.resource.data.name is string &&
        request.resource.data.name.size() > 0 &&
        request.resource.data.name.size() <= 15 &&
        request.resource.data.bestScore is int &&
        request.resource.data.bestScore >= resource.data.bestScore &&
        request.resource.data.bestLevel is int &&
        request.resource.data.bestLevel >= resource.data.bestLevel;
    }
  }
}
```

3. Firebase config kodu `game.js` içinde zaten tanımlı:
- `firebaseConfig` alanı: `/Users/erdincyilmaz/Desktop/space-travel/game.js`

## Nasıl Oynanır?

1. Açılış ekranında kullanıcı adını yaz.
2. `Oyuna Başla` butonuna bas.
3. Basılı tutup sürükleyerek karakteri yönlendir.
4. Yıldızları topla, engellerden kaç.
5. Bölüm hedefini tamamlayıp sonraki level’a geç.

## Veri Mantığı

- Her cihaz için tek bir oyuncu kaydı tutulur (`players/{deviceId}`).
- Kullanıcı adı değişirse aynı kayıttaki `name` güncellenir.
- `bestScore` ve `bestLevel` sadece artar, düşmez.
- Leaderboard Firestore'dan en yüksek skora göre listelenir.

## Kalıcı Device ID (Önerilen)

Web tarafında gerçek donanım ID alınamaz. En kalıcı yöntem:

1. Native app tarafında bir kere `installId` üret ve sakla.
2. WebView açmadan önce bu değeri JS tarafına geçir:
   - `window.APP_INSTALL_ID = "kalici-id"`
3. Oyun bu değeri otomatik kullanır. (`window.APP_INSTALL_ID` yoksa localStorage fallback kullanır.)

Bu sayede uygulama yeniden açıldığında aynı kullanıcı kaydı korunur.

## WebView Notu

- Uygulama WebView içinde tam ekran çalışacak şekilde optimize edilmiştir.
- `viewport-fit=cover` aktif olmalıdır.

## Netlify Deploy

Bu proje Netlify'da build gerektirmeden statik olarak yayınlanır.

1. Repo'yu GitHub'a push et.
2. Netlify > `Add new site` > `Import an existing project`.
3. İlgili repo'yu seç.
4. Build ayarları:
   - Build command: `echo 'Static site - no build step'`
   - Publish directory: `.`
5. Deploy et.

Bu ayarlar projede `netlify.toml` içinde hazır:
- `/Users/erdincyilmaz/Desktop/space-travel/netlify.toml`

### Notlar

- `index.html` cache'lenmez (yeni sürümler hızlı yansır).
- `asset/*` uzun süre cache'lenir (daha hızlı yükleme).
- `/* -> /index.html` redirect açık olduğu için route hatası yaşamazsın.
