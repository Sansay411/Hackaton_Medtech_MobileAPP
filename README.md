# 🛡️ MedTariff.kz

---

<div align="center">
  <img src="Логотип%20продукта.jpg" width="180" alt="MedTariff Logo" />
</div>

<div align="center">
  <br />
  <img src="https://img.shields.io/badge/Stack-TypeScript%20%7C%20React%20%7C%20Node.js-blue?style=for-the-badge" alt="Stack" />
  <img src="https://img.shields.io/badge/Styles-Tailwind%20CSS-sky?style=for-the-badge" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Database-Firebase%20Firestore-orange?style=for-the-badge" alt="Firebase" />
  <img src="https://img.shields.io/badge/AI-Google%20GenAI%20%7C%20Alem%20LLM-violet?style=for-the-badge" alt="AI" />
</div>

---

## 🌐 Language / Язык

Looking for the Russian version of this documentation?
👉 **[Читать документацию на русском языке](#русская-версия)**

---

## 📝 Overview

**MedTariff.kz** is a widescreen B2C web platform designed to analyze, parse, and aggregate medical tariffs and price lists from clinics across Kazakhstan. It connects patients with standard Ministry of Health (МЗ РК) clinical codes, monitors real-time price drops, and aggregates medical service comparisons.

### Key Philosophy
Patients shouldn't spend hours searching through nested PDFs and chaotic price sheets. MedTariff.kz automates data crawling, parses raw sheets with Gemini AI models, maps them to standard codes, and notifies users when target pricing is met.

### How It Works:
1. **Headless Crawler**: The background parser crawls active clinic websites and retrieves raw service names and prices.
2. **AI Mapping**: Raw entries are evaluated against standard МЗ РК codes using Gemini & Alem AI.
3. **Queue Normalization**: Unresolved items are routed to the administrator's review queue with confidence scores.
4. **Widescreen Patient Hub**: Patients can search, compare, bookmark, and subscribe to price drops from a unified widescreen dashboard.
5. **CMS & Digest**: Dynamic medical blogs and lifehacks targets are managed directly by admins.

---

## 📂 Repository Structure

| Directory / File | Technology | Description |
| :--- | :--- | :--- |
| `src/components/AdminHub.tsx` | TSX / React | Light-themed administrator dashboard containing parser controls, catalog, unmatched queue, subscriptions, and CMS. |
| `src/App.tsx` | TSX / React | Widescreen 3-column patient application with onboarding flow, map markers, clinic cards, and price alert drawers. |
| `server.ts` | Node.js / Express | Server-side script handling crawled sources, local regex fallbacks, and Express routes. |
| `src/data/servicesCatalog.ts` | TypeScript | Core database of МЗ РК clinical service classifications and synonym tags. |
| `src/lib/firebase.ts` | Firebase Web SDK | Database initialization, credentials, and rule settings for Firestore. |

---

## 🚀 How to Run

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your-gemini-key
ALEM_API_KEY=your-alem-key
```

### 3. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.
Open **`http://localhost:3000/admin`** to access the Admin Panel.

---

## <a name="русская-версия"></a>🇷🇺 Русская версия

**MedTariff.kz** — это веб-платформа для поиска, сравнения и агрегации цен на медицинские услуги в клиниках Казахстана. Решение объединяет парсинг прайс-листов с помощью ИИ (Gemini/Alem), классификацию услуг по кодам МЗ РК и личный кабинет пациента с умным мониторингом.

### Основные фичи:
- **Широкоэкранный дашборд 3-в-1**: Удобная навигация, интерактивная карта с гео-маркерами цен, и каталог клиник.
- **Подписки на снижение цен**: Пациенты могут выбрать услугу и подписаться на уведомления при падении тарифа ниже указанного порога.
- **Очередь разметки ИИ**: Нераспознанные строки автоматически сопоставляются с кодами МЗ РК при помощи моделей Gemini с расчетом уверенности (confidence score).
- **Дайджест и статьи**: CMS-блог с ИИ-генерацией обложек статей.

### Запуск проекта:
1. Установите зависимости: `npm install`
2. Настройте API-ключи в `.env`.
3. Запустите dev-сервер: `npm run dev`
