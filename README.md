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

Нэг апп, гурван хост: хэрэглэгч, ажил хийгч, ажилтан (админ). Хост бүр өөрийн
сесс, өөрийн нэвтрэх хуудастай; нэг хост дээр нөгөөгийн зам байхгүй (404).

| Хост                        | Зориулалт                                                    |
| --------------------------- | ------------------------------------------------------------ |
| `zav.localhost:3000`        | нүүр хуудас, захиалагчийн бүртгэл/нэвтрэх, зар, нөхцөл       |
| `ajil.zav.localhost:3000`   | ажил хийгчийн бүртгэл/нэвтрэх, өдөр, санал, хуваарь, профайл |
| `admin.zav.localhost:3000`  | админ, супер админ                                           |
| `localhost:3000`            | зөвхөн хөгжүүлэлтэд: хэрэглэгчийн хост                       |

Бусад хост ирвэл 404. Орчин үеийн браузер `*.localhost`-г 127.0.0.1 рүү шилжүүлдэг
тул нэмэлт тохиргоо шаардлагагүй.

## 2. Орчны хувьсагчууд

`.env.local` (хэзээ ч бүү хуулбарлаарай, хэзээ ч бүү commit хийнэ үү):

| Хувьсагч                        | Төрөл      | Тайлбар                                                          |
| ------------------------------- | ---------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | барих үе   | Supabase төсөл (https://<ref>.supabase.co)                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | барих үе   | anon түлхүүр                                                     |
| `NEXT_PUBLIC_SITE_HOST`         | барих үе   | хэрэглэгчийн хост (`zav.localhost:3000` / `zav.baina.mn`)        |
| `NEXT_PUBLIC_WORKER_HOST`       | барих үе   | ажил хийгчийн хост (`ajil.zav.localhost:3000` / `ajil.zav.baina.mn`) |
| `NEXT_PUBLIC_STAFF_HOST`        | барих үе   | ажилтны хост (`admin.zav.localhost:3000` / `admin.zav.baina.mn`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`  | барих үе   | вэб пүшийн нийтийн түлхүүр (`npm run push:keys` хэвлэнэ)         |
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

Нууц үгээ мартсан бол гурван хостын `/login` хуудаснаас **Нууц үгээ мартсан уу?**
гэсэн холбоосоор и-мэйл авна. Сэргээх холбоос тухайн хост дээрээ нээгдэнэ:
захиалагч `zav`, ажил хийгч `ajil`, ажилтан `admin` хост дээрээ нууц үгээ шинэчилнэ.

## 4. Админ урилга

Супер админ `/super/admins` дээрээс урилгын код үүсгэнэ. Код **зөвхөн нэг удаа**
харагдана (серверт зөвхөн хэш нь хадгалагдана), 48 цагийн дотор хүчинтэй.
1. Код авсан хүн `http://admin.zav.localhost:3000/join?code=XXXXXX` хуудсаар орж
   шинэ бүртгэл үүсгэнэ.
2. Бүртгэлд давхар баталгаажуулалт (TOTP) шаардлагатай.
3. Супер админ түүний мэргэжил, дүүрэг, харьяалагдах админыг заана.

## 5. Утсан дээрээ нэмэх

Ажил хийгч өөрийн хаягийг (`https://ajil.zav.baina.mn`) нэмнэ. Хэрэглэгчийн
(`https://zav.baina.mn`) хаяг ч нэмж болно. Ажилтны хаяг нэмэх шаардлагагүй.

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
npm run check:links    # супер файл админы зам руу, админ файл /super руу холбоогүй эсэх
npm run contrast       # өнгөний ялгарлын шалгалт (>= 4.5:1, хүрээ >= 3:1) + backdrop-ийн хэмжсэн өнгө
npm run backdrop       # нийтийн хуудсуудын backdrop харагдаж, ямар ч wrapper дараагүй эсэх
npm run layout         # 7 өргөн дээр гурван хостын байрлал, хэвтээ гүйлтийн шалгалт + screenshot
npm run density        # админы 1440/1920 өргөн дэх товчны тоо, шошгоны урт
npm run smoke          # гурван хостын хүрэлцээ, робот, хостын хязгаар
npm run check:auth     # гурван хостын нэвтрэх/сэргээх зам, имэйл холбоосын шилжилт
```

`npm run verify`/`npm run smoke` `APP_URL` утгыг хэрэглэнэ: утас дээр
`APP_URL=http://127.0.0.1:3000 npm run verify` гэж нэмээрэй (сессионтой хамт шалгана).
`npm run layout`-ийг `npm run dev` дээр ажиллуулбал `/__kit` хуудсууд ч шалгагдана;
үйлдвэрлэлийн барилга дээр тэдгээр нь 404 тул алгасна.

### 6.1 Жишээ (демо) өгөгдөл — зөвхөн хөгжүүлэлтийн үед

```bash
ALLOW_DEMO_SEED=1 npm run seed:demo            # 2 админ, 12 ажилтан, 6 захиалагч, 16 зар
npm run seed:demo -- --remove                  # зөвхөн @demo.zav.test бүртгэлүүдийг устгана
```

Скрипт нь `NODE_ENV=production` үед болон `ALLOW_DEMO_SEED=1` тохируулаагүй үед
ажиллахаас татгалзана. Бүртгэлүүд нь ердийн signup API-аар `@demo.zav.test`
хаягаар үүсч, нууц үг нь санамсаргүй бөгөөд хэзээ ч хэвлэгдэхгүй. Дүүргийн
хуваарилалт нь бодит жинтэй (Баянзүрх 22%, Сонгинохайрхан 20%, …), нэг дүүрэгт
нийт зарын 25%-иас илүү орохгүй. Жинхэнэ хүнд админ эрх өгөхгүй, жинхэнэ
супер админыг хөндөхгүй. `npm run seed:demo -- --remove` нь зөвхөн демо
бүртгэлийг устгана; production хуудсууд энэ өгөгдлийг хэзээ ч хатуу кодлохгүй.

## 7. VPS-д тавих

Шаардлага: Node 22 LTS (`>=20.18` бас ажиллана), эсвэл Docker; эсрэг прокси
(Caddy эсвэл Nginx); програм зөвхөн `127.0.0.1:3000` дээр ажилладаг — гадаад
порт нээхгүй.

DNS: `zav`, `ajil.zav`, `admin.zav` гэсэн гурван нэрийг серверийн IP рүү A
бичлэгээр чиглүүлнэ. Firewall дээр 22/80/443-аас өөр порт нээхгүй. Бүх нэр нэг
апп руу заадаг тул стриминг сертификат эсвэл гурван certificate авна.

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
утгатайгаар барина. Үүнд гурван хост (`SITE`, `WORKER`, `STAFF`) болон
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` орно; аль нэг нь хоосон бол тухайн хост/пүш
build дээр ажиллахгүй тул `/etc/zav/env`-д бүгдийг бөглөсөн эсэхээ шалгана уу.

### 7.2 Энгийн Node (systemd)

```bash
sudo useradd -r -m -d /opt/zav zav
sudo -u zav git clone <repo> /opt/zav
cd /opt/zav
# Барих үеийн NEXT_PUBLIC_* утгууд (production host, Supabase ключ)
sudo -u zav cp .env.example .env.local
sudo -u zav chmod 600 .env.local
sudo -u zav editor .env.local
sudo -u zav npm ci && sudo -u zav NEXT_OUTPUT=standalone npm run build
# NEXT_OUTPUT=standalone нь .next/standalone гаралтыг үүсгэнэ (Docker мөн адил).
# standalone горимд статик файлуудыг server.js-ийн хажууд хуулна
sudo -u zav cp -r .next/static .next/standalone/.next/
sudo -u zav cp -r public .next/standalone/
sudo cp deploy/zav.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now zav
```

`deploy/zav.service` нь standalone гаралтыг `node .next/standalone/server.js`-ээр
ажиллуулна. Гараар шалгах бол `npm run start:standalone` (ижил команд). Статик
файлыг хуулаагүй бол CSS/JS 404 болно — дээрх хоёр `cp` мөрийг бүү алгас.

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
- Redirect URLs: `https://zav.baina.mn/**`, `https://ajil.zav.baina.mn/**`,
  `https://admin.zav.baina.mn/**`, `http://zav.localhost:3000/**`,
  `http://ajil.zav.localhost:3000/**`, `http://admin.zav.localhost:3000/**`
- Нэвтрэх/сэргээх холбоосыг `emailRedirectTo` үргэлж тухайн хостынх нь бүтэн
  хаягаар илгээдэг: хэрэглэгч `zav`, ажил хийгч `ajil`, ажилтан `admin`.
- Ашиглаж эхлэхээсээ өмнө **Confirm email**-г дахин **ON** болгоно уу (шалгалтын
  үеэр түр унтрааж болно).

**И-мэйл загварууд (заавал солино):** апп холбоосыг `token_hash`-аар шалгадаг
(`/auth/confirm`), учир нь хэрэглэгч холбоосоо өөр утас, өөр браузер дээр нээхэд
хүчинтэй байх ёстой. Auth → Email Templates доторх холбоосыг дараах хэлбэрт
оруулна:

| Загвар | Холбоос |
| --- | --- |
| Reset Password | `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery` |
| Confirm signup | `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup` |
| Invite user | `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite` |
| Magic Link | `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink` |

`{{ .ConfirmationURL }}`-ыг БҮҮ ашигла: тэр нь Supabase-ийн `/verify` руу явж,
сайтад буцахдаа `#access_token` хэлбэрээр ирдэг тул серверт хүрдэггүй, мөн
cookie үүсгэсэн браузер дээрээ л ажилладаг. `.RedirectTo` нь апп-аас илгээсэн
тухайн хостын хаягийг (жишээ нь `https://ajil.zav.baina.mn/auth/confirm`) барина.

Ажиллаж буй домэйнүүдээ `.env.local` эсвэл production орчны build-time хувьсагчид
яг хост хэлбэрээр (scheme, path-гүй) тавина:

```dotenv
NEXT_PUBLIC_SITE_HOST=zav.baina.mn
NEXT_PUBLIC_WORKER_HOST=ajil.zav.baina.mn
NEXT_PUBLIC_STAFF_HOST=admin.zav.baina.mn
```

`NEXT_PUBLIC_*` утгууд build үед шингэдэг тул өөрчилсний дараа production build-ийг
дахин хийгээд аппыг restart/deploy хийнэ. Админд `https://admin.zav.baina.mn/login`
гэсэн хаягаар орно (`zav.baina.mn/admin/login` биш). Local development-д дээрх
утгуудыг `.env.example`-ийн `*.localhost:3000` утгуудаар солиод `npm run dev`
ажиллуулна. Хостын нэр тохиргоотой яг таарахгүй бол middleware санаатайгаар 404
буцаадаг.

### 7.5 Вэб пүш (ажилтанд мэдэгдэх)

Ажил хийгч санал ирэхэд утасны мэдэгдэл авна. Түлхүүрүүд зөвхөн серверийн
`.env.push` (mode 600) файлд байна.

```bash
npm run push:keys      # VAPID түлхүүр үүсгэж .env.push руу бичнэ
npm run push:role      # push_sender мэдээлэл сангийн тусдаа роль үүсгэнэ
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY`-г `.env.local` (болон `/etc/zav/env`)-д хуулж,
**дахин build хийнэ** — энэ утга барилгын үед кодод шингэдэг. Дараа нь илгээгчийг
ажиллуулна:

```bash
sudo cp deploy/zav-push.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now zav-push
```

Илгээгч нь зөвхөн `notifications` хүснэгтээс унших, `push_subscriptions`
устгах эрхтэй (`db/06_push.sql`). Нэг л процесс ажиллана; лог нь `journalctl -u
zav-push -f`. Дэлгэрэнгүйг `scripts/push-worker.mjs`-ийн толгойгоос үзнэ үү.

### 7.6 Нөөц, шинэчилгээ

Шинэчилгээ:

```bash
cd /opt/zav && sudo -u zav git pull && sudo -u zav npm ci && sudo -u zav npm run build
sudo -u zav cp -r .next/static .next/standalone/.next/
sudo -u zav cp -r public .next/standalone/
sudo systemctl restart zav        # эсвэл docker compose up -d --build
```

Лог: `journalctl -u zav -f` эсвэл `docker compose logs -f app`

### 7.7 Нууц үг сэргээх урсгал

1. Хэрэглэгч тухайн хостын `/forgot-password` дээр и-мэйлээ оруулна. Хариу
   үргэлж ижил: «Хэрэв энэ имэйл бүртгэлтэй бол сэргээх холбоос илгээгдлээ.»
   Бүртгэл байгаа эсэх, ямар хостын бүртгэл вэ гэдгийг хэзээ ч задруулахгүй.
2. `emailRedirectTo` нь тухайн хостын хаягаар (`.../auth/confirm`) явна —
   ажил хийгчийн холбоос хэрэглэгчийн домэйн руу хэзээ ч очихгүй.
3. Холбоосыг дарсаны дараа 15 минутын `zav_recovery` cookie (httpOnly)
   үүсч, `/reset-password` нээгдэнэ. Cookie-гүй бол зөвхөн нэвтэрсэн байсан ч
   хуудас `/forgot-password?error=link` руу буцаана — хуучин нууц үгийг мэдэхгүйгээр
   солих боломжгүй.
4. Хадгалсны дараа тухайн хостын сесс хаагдаж `/login?reset=1` руу шилжинэ.
   Ажилтан дараагийн нэвтрэлтэд MFA-аа дахин хийнэ; хуучин сессүүд хүчингүй
   болдог (Supabase нь нууц үг солиход бусад refresh token-ыг хүчингүй болгодог).

Хязгаар: `POST /forgot-password` нэг IP-д 5/минут (middleware), нэг (IP, и-мэйл)
хосд 3/цаг (`src/lib/forgot-limit.ts`). И-мэйл холбоосын endpoint (`/auth/confirm`,
`/auth/callback`) 30/минут — имэйл сканер холбоосыг дарахад хүрэлцэхүйц.

Ажилтны урилга: админ `https://admin.zav.baina.mn/join?code=…` холбоосыг илгээнэ.
Урилгатай хүн кодоор бүртгүүлж, и-мэйлээ баталгаажуулсны дараа шууд `/join`
хуудас дээр гарч кодоо идэвхжүүлнэ (энэ төлөвт админ хост дээр зөвхөн `/join`
нээлттэй, бусад зам 404).

Нөөц (шөнө, cron): Supabase төслийн `DATABASE_URL`-ээс `pg_dump` авна. Cron нь
бүрхүүлийн хувьсагчийг өвлөдөггүй тул crontab-ийн эхэнд утгыг нь тодорхойлно.

```cron
DATABASE_URL=postgresql://...
0 2 * * * pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > /var/backups/zav-$(date +\%F).sql.gz
```

**Анхааруулга:** Supabase-ийн үнэгүй төсөл 7 хоног идэвхгүй бол түр зогсдог.
Хэрэглэгч ирж эхэлмэгц төлбөрт төлөвлөгөө рүү шилжинэ үү.
# zav

## 8. Vercel-д байрлуулах

Одоо байгаа Docker болон VPS тохиргоог өөрчлөхгүй. `output: "standalone"` нь зөвхөн
`NEXT_OUTPUT=standalone` үед асаалттай (Docker болон VPS дээр тийм), Vercel дээр
унтраалттай тул тусгай `vercel.json` хэрэггүй.

1. GitHub репозиторыг Vercel-д импортолж, **Node.js 22.x** сонгоно.
2. Project Settings → Environment Variables хэсэгт **Production** орчинд:

   | Хувьсагч | Утга |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase төслийн URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase-ийн publishable/anon key |
   | `NEXT_PUBLIC_SITE_HOST` | Vercel → Settings → Domains дээрх `your-project.vercel.app` хаяг, `https://`-гүй |
   | `NEXT_PUBLIC_WORKER_HOST` | ажил хийгчийн домэйн (жишээ нь `ajil.your-domain.mn`), `https://`-гүй |
   | `NEXT_PUBLIC_STAFF_HOST` | админы домэйн (жишээ нь `admin.your-domain.mn`), `https://`-гүй |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | пүш ашиглах бол `npm run push:keys`-ийн нийтийн түлхүүр |

   Vercel өөрөө `VERCEL_PROJECT_PRODUCTION_URL` болон `VERCEL_URL`-г өгдөг тул
   `.vercel.app` хостыг хэрэглэгчийн сайт гэж танина. Гэхдээ `NEXT_PUBLIC_SITE_HOST`-ийг
   Production URL-тай ижил болгосноор и-мэйлийн холбоос зөв домэйнд очно.
   `NEXT_PUBLIC_*` утгууд build үеэр кодод шингэдэг тул өөрчилсний дараа дахин deploy
   хийнэ. `service_role` key болон `DATABASE_URL`-ийг Vercel дээр нэмэх шаардлагагүй;
   `service_role` key-г браузерт хэзээ ч бүү тавь.
3. Production deployment-ийн `your-project.vercel.app` URL-ийг ашиглана. Preview
   deployment URL ч хэрэглэгчийн сайт гэж танигдана. Vercel-ийн Project → Settings →
   Domains хэсэгт харагдах project-ийн production URL-ийг Supabase → Authentication →
   URL Configuration дотор Site URL болгоод, Redirect URLs-д
   `https://your-project.vercel.app/**`-г нэмнэ.
4. Програм гурван тусдаа хост шаарддаг: хэрэглэгч (`NEXT_PUBLIC_SITE_HOST`),
   ажил хийгч (`NEXT_PUBLIC_WORKER_HOST`), ажилтан (`NEXT_PUBLIC_STAFF_HOST`).
   Vercel-ийн ганц `.vercel.app` хаягийг гурав болгож давхар ашиглаж болохгүй —
   production-д гурван домэйн авч Vercel Domains-д нэмнэ. Preview deployment бүр
   зөвхөн хэрэглэгчийн сайт гэж танигдана (ажил хийгч/ажилтны зам 404).
 5. GitHub-ийн үндсэн branch-ийг deploy хийнэ.

Vercel-ийн Environment Variables дотор `DATABASE_URL` нэмсэн ч `db:apply`,
`super:make` зэрэг CLI скриптүүд автоматаар ажиллахгүй. Өгөгдлийн сангийн SQL-ийг
төслөө анх бэлдэхдээ нэг удаа гараар хэрэгжүүлж, эхний супер админыг итгэмжлэгдсэн
орчноос `npm run super:make -- email@example.com` командаар үүсгэнэ.
