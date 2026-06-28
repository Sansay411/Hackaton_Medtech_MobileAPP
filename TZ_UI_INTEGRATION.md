# ТЗ: Интеграция спарсенных данных в UI

## Проблема
Парсер собирает реальные данные (KDL, Invitro, TopDoc, 2GIS) и сохраняет в MongoDB. Но на главной странице сайта отображаются симулированные/моковые данные. Пользователь не видит реальных цен, клиник, координат на карте.

## Текущая архитектура

```
Парсеры → LocalDataLayer → MongoDB (коллекция rawTariffs)
                                    ↓
                      POST /api/search-services (ищет в MongoDB + JSON)
                                    ↓
                      App.tsx → setClinics() → ClinicCard[]
                      App.tsx → setMarkers()  → MapPlaceholder[]
```

## Формат данных

### Что возвращает search-services (из парсера)
```typescript
{
  id?: string,
  clinicId: string,
  clinicName: string,
  city: string,
  address?: string,
  phone?: string,
  serviceNameRaw: string,
  serviceNameNorm?: string,
  priceKzt: number,
  osmsEligible: boolean,
  parsedAt: string,
  lat?: number,       // координаты
  lng?: number,       // координаты
}
```

### Что ожидает ClinicCard
```typescript
interface Clinic {
  id: string;
  name: string;
  price: number;
  address: string;
  district: string;
  distance: string;
  osms: boolean;
  updated: string;
  phone: string;
  rating: number;
}
```

## Задачи

### 1. Маппинг данных в search-services
Изменить `POST /api/search-services` в `server.ts`:
- Привести формат из MongoDB → ClinicCard format
- Поля: `id`, `name` (из `clinicName`), `price` (из `priceKzt`), `address`, `osms` (из `osmsEligible`), `phone`
- Для поля `district` — пустая строка (данных нет)
- Для `distance` — рассчитать от центра города по координатам (если `lat/lng` есть)
- Для `updated` — `parsedAt` в формат "сегодня/вчера/дата"
- Для `rating` — 4.5 (базовое значение, можно из 2GIS)

**Ключевое**: search должен возвращать данные даже при частичном совпадении ключевых слов. Снизить порог совпадения до 1 слова из запроса.

### 2. Поиск по категориям
Добавить на главную страницу список популярных услуг:
- Анализ крови
- МРТ
- УЗИ
- Приём врача

При клике — поиск по этой категории с отображением реальных цен из парсера.

### 3. Карта с реальными маркерами
`GET /api/map-grounding` уже возвращает маркеры с координатами из MongoDB.
- В MapPlaceholder проверить что маркеры отображаются на правильных координатах
- Если координат нет — показывать метку в центре города
- На маркере показывать цену (priceKzt) и название клиники

### 4. Логотипы клиник (из реальных источников)
**Без заглушек.** Логотипы собираются из реальных источников и хранятся в MongoDB.

**Источники логотипов:**
- 2GIS API — может вернуть логотип организации (поле `logo` или через `items.external_content`)
- TopDoc.kz — логотипы в HTML страниц клиник, найти `img[src*="Company"]`
- Invitro — логотип на странице
- KDL — логотип на сайте
- Favicon клиники как fallback

**Формат хранения в MongoDB (коллекция clinics):**
```typescript
{
  clinicId: string,
  name: string,
  logoUrl: string,       // реальный URL логотипа
  logoSource: string,    // откуда взят (2gis, topdoc, favicon)
}
```

**API эндпоинт:**
```
GET /api/clinics/logos — список всех клиник с логотипами
POST /api/parser/fetch-logos — запустить сбор логотипов для всех клиник
```

**Отображение в ClinicCard:** брать `logoUrl` из MongoDB. Если логотипа нет — не показывать ничего (пустое место, не заглушку).

**Сбор логотипов:**
1. При парсинге TopDoc — сохранять URL логотипа из HTML
2. При парсинге 2GIS — запрашивать `items.external_content` для лого
3. Для остальных — парсить favicon сайта клиники
4. Хранить в коллекции `clinicLogos` в MongoDB

### 5. Группировка услуг по клиникам
Сейчас каждая услуга — отдельная запись. На главной нужно:
- Показать уникальные клиники (группировка по clinicName)
- В карточке клиники показать минимальную цену среди её услуг
- При клике на карточку — показать все услуги этой клиники

## Приоритет выполнения

| № | Задача | Время |
|:-:|--------|:----:|
| 1 | Маппинг формата в search-services | 30 мин |
| 2 | Категории-кнопки на главной | 30 мин |
| 3 | Проверка карты с реальными координатами | 30 мин |
| 4 | Логотипы клиник | 20 мин |
| 5 | Группировка по клиникам | 1 час |

## Проверка результата
1. Открыть главную страницу
2. Нажать "Анализ крови" — должны появиться реальные карточки с ценами
3. Кликнуть на карточку — показать все услуги этой клиники
4. На карте должны быть маркеры в правильных местах
5. `isSimulated` в ответе search-services должно быть `false`
