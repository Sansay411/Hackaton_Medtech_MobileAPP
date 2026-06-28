# ТЗ: Геокодинг клиник через 2GIS API

## Контекст
В проекте реализован парсер, который собирает данные о клиниках: названия, адреса, цены. Данные сохраняются в MongoDB. Но у клиник **нет координат (lat/lng)** — без них маркеры клиник не отображаются на карте.

## Цель
Проставить координаты (широта, долгота) для всех клиник в MongoDB, используя 2GIS API.

## API 2GIS (уже есть ключ)
```
API Key: 26c65059-f062-4a91-a973-b8a38fedf562
Базовый URL: https://catalog.api.2gis.com/3.0/items
```

## Что нужно сделать

### 1. Геокодинг через 2GIS
Для каждой клиники из MongoDB:
1. Взять её **название + город** (например `"КДЛ Олимп Алматы"`)
2. Отправить запрос в 2GIS API:
   ```
   GET https://catalog.api.2gis.com/3.0/items
   ?q=КДЛ Олимп
   &location=76.889,43.238
   &key=26c65059-f062-4a91-a973-b8a38fedf562
   &fields=items.point,items.address,items.contact_groups,items.schedule
   &limit=1
   ```
3. Если найден — сохранить `lat`, `lng`, `phone`, `working_hours` в MongoDB
4. Если не найден — попробовать геокодировать по **адресу** клиники (если адрес есть)

**Параметры:**
- `q` — название клиники + город (на русском)
- `location` — координаты центра города (для Алматы: `76.889,43.238`)
- `type=branch` — искать только организации
- `fields=items.point,items.address,items.contact_groups,items.schedule` — запросить координаты, адрес, телефон, расписание
- `limit=1` — достаточно первого совпадения

### 2. Координаты городов для location
| Город | location |
|-------|----------|
| Алматы | 76.889,43.238 |
| Астана | 71.449,51.169 |
| Шымкент | 69.590,42.341 |
| Караганда | 73.088,49.802 |
| Актобе | 57.926,50.283 |
| Павлодар | 76.931,52.287 |

### 3. Поля для обновления в MongoDB
В коллекции `rawTariffs` у каждого документа должны быть заполнены:
```typescript
lat?: number;           // широта из 2GIS
lng?: number;           // долгота из 2GIS
phone?: string;         // телефон (если 2GIS вернул)
working_hours?: string; // режим работы (если 2GIS вернул)
```

### 4. Файл для реализации
Создать `src/parser/providers/geoEnricher.ts`:
```typescript
export class GeoEnricher {
  async enrichClinic(name: string, city: string, address?: string): Promise<{
    lat?: number;
    lng?: number;
    phone?: string;
    workingHours?: string;
  }>

  async enrichAllUngeocoded(): Promise<void>  // прогнать все записи без координат
}
```

### 5. Ограничения
- 2GIS demo-ключ может не отдавать `items.point` (платное поле). В этом случае:
  - Использовать **Яндекс Geocoder** (уже есть ключ `6f4c8d9a-a6e8-49ea-8545-29bed81dd318`):
    ```
    https://geocode-maps.yandex.ru/1.x/?format=json&geocode=АДРЕС&apikey=6f4c8d9a-a6e8-49ea-8545-29bed81dd318
    ```
  - Яндекс Geocoder возвращает координаты даже для бесплатного тарифа
- Добавить задержку 0.5-1с между запросами (rate limiting)
- Пропускать клиники, у которых уже есть координаты

### 6. Проверка результата
После геокодинга в MongoDB должны быть:
```
db.rawTariffs.find({ lat: { $exists: true } }).count() > 0
```
Хотя бы 70-80% клиник должны получить координаты.

## Формат сдачи
- Один файл `src/parser/providers/geoEnricher.ts`
- Интеграция через API `/api/parser/geocode` (POST — запустить геокодинг для всех незаполненных)
- Логирование: сколько клиник обработано, сколько получили координаты
