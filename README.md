# Зав байна

Хагас цагийн ажил хайх, ажилтан олох платформ. Next.js (App Router) + Supabase.

- Захиалагч: ажил зарладаг
- Ажил хийгч: чөлөөт өдрөө тэмдэглэж ажил авдаг
- Админ: зарыг хүлээж авч ажилтантай утсаар ярилцдаг
- Супер админ: бүх ажилчид, админууд, тохиргоог хянадаг

## 1. Орон нутгийн суурилуулалт

Тохиргоо:

```bash
npm ci
cp .env.example .env.local   # дотогш утгуудыг бөглөнө үү
npm run db:apply             # db/*.sql файлуудыг дарааллаар нь хэрэгжүүлнэ
npm run dev
```

Нэг апп, хоёр хост: нэг нь хэрэглэгч, нөгөө нь ажилтан.

| Хост                                                       | Зориулалт                                            |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `zav.localhost:3000`       | нүүр хуудас, бүртгэл, нэвтрэх, захиалагч, ажил хийгч |
| `admin.zav.localhost:3000` | админ, супер админ                                   |
| `localhost:3000`           | зөвхөн хөгжүүлэлтэд: хэрэглэгчийн хост               |

Бусад хост ирвэл 404. Орчин үеийн браузер `*.localhost`-г 127.0.0.1 рүү шилжүүлдэг
тул нэмэлт тохиргоо шаардлагагүй.

## 2. Орчны хувьсагчууд

`.env.local` (хэзээ ч бүү хуулбарлаарай, хэзээ ч бүү commit хийнэ үү):

| Хувьсагч                        | Төрөл      | Тайлбар                                                          |
| ------------------------------- | ---------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | барих үе   | Supabase төсөл (https://<ref>.supabase.co)                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | барих үе   | anon түлхүүр                                                     |
| `NEXT_PUBLIC_SITE_HOST`         | барих үе   | хэрэглэгчийн хост (`zav.localhost:3000` / `zav.baina.mn`)        |
| `NEXT_PUBLIC_STAFF_HOST`        | барих үе   | ажилтны хост (`admin.zav.localhost:3000` / `admin.zav.baina.mn`) |
| `DATABASE_URL`                  | ажиллах үе | скриптүүдэд зориулсан холболт (програмд ашиглагдахгүй)           |
| `DATABASE_POOLER_URL`           | ажиллах үе | опционал: Session pooler хувилбар                                |

`NEXT_PUBLIC_*` утгууд `npm run build` үе **бүтээгдэх үед** код дотор шингэдэг. Тийм
учраас үйлдвэрлэлийн барилгыг бодит утгуудаар хийнэ.

## 3. Эхний супер админ

Эхний супер админыг зөвхөн доорх скриптээр үүсгэнэ. `tanii.email@example.com` гэсний
оронд өөрийн и-мэйл хаягаа тавина.

```bash
npm run super:make -- tanii.email@example.com
```

Дараа нь тухайн хаягаараа `http://admin.zav.localhost:3000/login`-аар нэвтэрч
`/security` хуудсан дээр TOTP давхар баталгаажуулалтаа тохируулна. Ажилтны бүх эрх
aal2 (хоёр шатлалт баталгаажуулалт) байхад өгөгдөнө; aal1 байхад түр хүлээгдэнэ.

Ажилтны нууц үгээ мартсан тохиолдолд сайтын автомат сэргээх холбоос ажиллахгүй
(ажилтны сесс зөвхөн ажилтны хост дээр хүчинтэй). Нууц үгийг Supabase-ийн
Authentication → Users хэсгээс шинэчилнэ.

## 4. Админ урилга

Супер админ `/super/admins` дээрээс урилгын код үүсгэнэ. Код **зөвхөн нэг удаа**
харагдана (серверт зөвхөн хэш нь хадгалагдана), 48 цагийн дотор хүчинтэй.
http
1. Код авсан хүн `://admin.zav.localhost:3000/join?code=XXXXXX` хуудсаар орж
   шинэ бүртгэл үүсгэнэ.
2. Бүртгэлд давхар баталгаажуулалт (TOTP) шаардлагатай.
3. Супер админ түүний мэргэжил, дүүрэг, харьяалагдах админыг заана.

## 5. Утсан дээрээ нэмэх

Зөвхөн хэрэглэгчийн хаягийг (`https://zav.baina.mn`) нэмнэ; ажилтны хаяг нэмэх
шаардлагагүй.

**iPhone (Safari)**

1. Safari хөтчөөр сайтыг нээнэ.
2. Доод талын «Хуваалцах» товчийг (дөрвөлжин дотроос дээшээ сум) дарна.
3. Цэснээс доош гүйлгээд «Нүүр дэлгэцэнд нэмэх»-ийг сонгоно.
4. Баруун дээд хэсэгт «Нэмэх»-ийг дарна.

**Android (Chrome)**

1. Chrome хөтчөөр сайтыг нээнэ.
2. Баруун дээд хэсэгт «⋮» цэсийг дарна.
3. «Нүүр дэлгэцэнд нэмэх»-ийг сонгоно (зарим утсанд «Апп суулгах» гэж гардаг).
4. «Нэмэх»-ийг дарна.

Дараа нь нүүр дэлгэцэн дээрх «Зав байна» дүрсээр апп шиг нээгдэнэ.

## 6. Тест, шалгалт

```bash
npm run typecheck      # төрөл шалгагч
npm run lint           # ESLint
npm run build          # үйлдвэрлэлийн барилгын шалгалт
npm run verify         # БД-ын болон HTTP эрхийн шалгалт (жинхэнэ хаяг шаардана)
npm run contrast       # өнгөний ялгарлын шалгалт (>= 4.5:1, хүрээ >= 3:1) + backdrop-ийн хэмжсэн өнгө
npm run backdrop       # нийтийн хуудсуудын backdrop харагдаж, ямар ч wrapper дараагүй эсэх
npm run layout         # 7 өргөн дээр хуудасны байрлал, хэвтээ гүйлтийн шалгалт + screenshot
npm run smoke          # хоёр хостын хүрэлцээ, робот, хостын хязгаар
```

`npm run verify`/`npm run smoke` `APP_URL` утгыг хэрэглэнэ: утас дээр
`APP_URL=http://127.0.0.1:3000 npm run verify` гэж нэмээрэй (сессионтой хамт шалгана).
`npm run layout`-ийг `npm run dev` дээр ажиллуулбал `/__kit` хуудсууд ч шалгагдана;
үйлдвэрлэлийн барилга дээр тэдгээр нь 404 тул алгасна.

## 7. VPS-д тавих

Шаардлага: Node 20+, эсвэл Docker; эсрэг прокси (Caddy эсвэл Nginx); програм
зөвхөн `127.0.0.1:3000` дээр ажилладаг — гадаад порт нээхгүй.

DNS: `zav` болон `admin.zav` домэйныг серверийн IP рүү A бичлэгээр чиглүүлнэ.
Firewall дээр 22/80/443-аас өөр порт нээхгүй.

### 7.1 Docker (зөвлөмж)

```bash
sudo mkdir -p /etc/zav && sudo chmod 700 /etc/zav
sudo editor /etc/zav/env        # 600 эрхтэй, дотоод утгууд
sudo chmod 600 /etc/zav/env

# NEXT_PUBLIC_* утгуудыг барих үед орчны хувьсагчаар дамжуулна
set -a && . /etc/zav/env && set +a
docker compose build
docker compose up -d
```

`docker-compose.yml` `NEXT_PUBLIC_*` утгуудыг **барилгын үе** дамжуулдаг — бодит
утгатайгаар барина.

### 7.2 Энгийн Node (systemd)

```bash
sudo useradd -r -m -d /opt/zav zav
sudo -u zav git clone <repo> /opt/zav
cd /opt/zav
# Барих үеийн NEXT_PUBLIC_* утгууд (production host, Supabase ключ)
sudo -u zav cp .env.example .env.local
sudo -u zav chmod 600 .env.local
sudo -u zav editor .env.local
sudo -u zav npm ci && sudo -u zav npm run build
# standalone горимд статик файлуудыг server.js-ийн хажууд хуулна
sudo -u zav cp -r .next/static .next/standalone/.next/
sudo -u zav cp -r public .next/standalone/
sudo cp deploy/zav.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now zav
```

### 7.3 Эсрэг прокси

- Caddy: `sudo cp deploy/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy`
- Nginx: `deploy/nginx.conf`-ийг хуулж, Let's Encrypt сертификат үүсгэнэ.

**Маш чухал:** прокси `Host` / `X-Forwarded-Host` / `X-Forwarded-For` / `X-Forwarded-Proto`
утгуудыг ДАХИН БИЧИЖ өгнө. Хэрэв зөвхөн клиентийн утгыг дамжуулбал хостын ялгалгүйгээр
хуурамч хост дамжуулах боломжтой. Rate limit `X-Forwarded-For`-ийн эхний утгыг
хэрэглэгчийн IP болгон ашиглана — ЗӨВХӨН нэг процесс ажиллах ёстой (PM2 cluster
хийхгүй; хожим Redis рүү шилжинэ).

### 7.4 Supabase тохиргоо

Auth → URL Configuration:

- Site URL: `https://zav.baina.mn`
- Redirect URLs: `https://zav.baina.mn/**`, `https://admin.zav.baina.mn/**`,
  `http://zav.localhost:3000/**`, `http://admin.zav.localhost:3000/**`
- Ашиглаж эхлэхээсээ өмнө **Confirm email**-г дахин **ON** болгоно уу (шалгалтын
  үеэр түр унтрааж болно).

### 7.5 Нөөц, шинэчилгээ

Шинэчилгээ:

```bash
cd /opt/zav && sudo -u zav git pull && sudo -u zav npm ci && sudo -u zav npm run build
sudo -u zav cp -r .next/static .next/standalone/.next/
sudo -u zav cp -r public .next/standalone/
sudo systemctl restart zav        # эсвэл docker compose up -d --build
```

Лог: `journalctl -u zav -f` эсвэл `docker compose logs -f app`

Нөөц (шөнө, cron): Supabase төслийн `DATABASE_URL`-ээс `pg_dump` авна. Cron нь
бүрхүүлийн хувьсагчийг өвлөдөггүй тул crontab-ийн эхэнд утгыг нь тодорхойлно.

```cron
DATABASE_URL=postgresql://...
0 2 * * * pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > /var/backups/zav-$(date +\%F).sql.gz
```

**Анхааруулга:** Supabase-ийн үнэгүй төсөл 7 хоног идэвхгүй бол түр зогсдог.
Хэрэглэгч ирж эхэлмэгц төлбөрт төлөвлөгөө рүү шилжинэ үү.
# zav
