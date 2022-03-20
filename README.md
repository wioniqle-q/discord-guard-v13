# Wioniqle.q Discord Guard

Discord serverları için hazırlanmış bir projedir. Serverlarınızı kötü amaçlı kişilerden uzak tutarak güvenliği sağlayabilirsiniz.

## Özellikler
 - ✅ channelCreate
 - ✅ channelUpdate
 - ✅ channelDelete
 - ✅ roleCreate
 - ✅ roleUpdate
 - ✅ roleDelete
 - ✅ guildUpdate
 - ✅ guildBan
 - ✅ guildKick
 - ✅ addBot

## Güncellemeler
 Bilgi için tıkla... [here](CHANGELOG.md)

## Bilgi Menü
çoğu projede olduğu gibi discord rate limit içeriyor. Bu projede de rate limit en az seviyede tutuluyor.
hata payı en aza indirilerek sunucunuzu korumanız hedeflenir. :)
Tabii ki bu projede de hatalar olacaktır ve bana hataları bildirmeniz gerekiyor.
**%100 koruma sağlayamacak şekilde %95 güvenirlik sağlar.** 

## Esktralar
- Yakında otomatik güncelleme sistemi gelecek eskisi gibi...
- Sunucu analizine göre otomatik hata payı çıkaran sistem eklenecek...
- Rate limit kaldırıcı sistem eklenecek...

## Önemli
Unutmayın her zaman bir hata payı vardır. Kişinin kaç işlem yaptığı değil; neticede ne gerçekleştiği!

## Kurulum
Wio guard [Node.js](https://nodejs.org/) v14+ NodeJS istiyor.

```sh
npm i/yarn add
node .
```

```sh
Bot ve sunucu ayarlarını [`Config.js`] üzerinden yapabilirsiniz.
Güvenli ayarı için [`src/utils/Util.js`] üzerinden yapabilirsiniz. (Örnek altta ki fotoğrafta!)
```
![image](https://user-images.githubusercontent.com/69215407/159180150-82076946-c213-48a2-b10e-99af5b3e7471.png)

> Not: `SAFE_BOTS` gerekli alandır! 

## DEVELOP
- written with ECMAScript 2015 🚬
- Transpiled 🌌
- Optimized 📈
- Readable 📊
- Used by Discord API Type V9 🚀
- Used by MongoDB ODM 💓

## Class 
- utils içerisinde bulunan classlar [`Util.js`] ana dosya olarak kullanılıyor.
- utils içerisinde loglama aracı olarak kullanılan modül Winston.

## Yapımcı
Discord Ad: wioniqle.q#4661
Discord ID: 790018895847096380
