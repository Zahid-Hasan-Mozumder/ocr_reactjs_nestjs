# Insurance Card OCR

A full-stack web application that uses **AI (OpenAI GPT-4o Vision)** to extract structured information from US medical insurance card images. Upload a photo of the front and/or back of an insurance card, and the app automatically reads and returns fields like member ID, group number, copays, deductible, pharmacy (Rx) info, and contact details.

---

## Table of Contents

- [What It Does](#what-it-does)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Running the Application](#running-the-application)
- [Using the App](#using-the-app)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)

---

## What It Does

Insurance Card OCR lets you:

- Upload front and/or back images of a US medical insurance card (JPEG, PNG, WebP — up to 10 MB each)
- Send those images to an AI-powered backend that reads the card using OpenAI's GPT-4o Vision model
- Receive structured data extracted from the card, including:
  - **Plan & Company** — Insurance company, plan name, network, payer ID
  - **Member Information** — Member name, member ID, group number, effective date
  - **Pharmacy (Rx)** — RX BIN, PCN, group, and pharmacy copay
  - **Copays** — Primary care, specialist, urgent care, emergency room
  - **Coverage Details** — Deductible and out-of-pocket maximum
  - **Contact Information** — Customer service phone, provider phone, website
- View the raw OCR text if needed
- Reset and scan another card

---

## How It Works

### End-to-End Flow

```
User (Browser)
     │
     │  1. Drag & drop or browse to select front/back card images
     ▼
React Frontend (localhost:3000)
     │
     │  2. Submits images via POST multipart/form-data request
     ▼
NestJS Backend (localhost:3001)
     │
     │  3. Validates image type and size (max 10 MB)
     │  4. Converts images to base64
     │  5. Sends base64 images + a structured extraction prompt to OpenAI
     ▼
OpenAI GPT-4o Vision API
     │
     │  6. Reads and interprets the card image(s)
     │  7. Returns structured JSON with all detected fields
     ▼
NestJS Backend
     │
     │  8. Parses and merges data from front + back (if both provided)
     │  9. Returns structured JSON response
     ▼
React Frontend
     │
     │  10. Displays the extracted information in organized sections
     ▼
User sees the results
```

### Backend Step-by-Step

1. The NestJS server starts and loads the `OPENAI_API_KEY` from the `.env` file.
2. CORS is configured to allow requests from `http://localhost:3000`.
3. When a `POST /api/ocr/extract` request arrives, the `OcrController` receives up to two image files (`front` and `back`) via `multipart/form-data`.
4. The controller validates the files (allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`; max 10 MB each).
5. The `OcrService` converts each image buffer to a base64 data URL.
6. The service calls the **OpenAI Chat Completions API** (model: `gpt-4o`) with a system prompt instructing it to extract insurance card fields and return them as a JSON object.
7. If both sides are provided, the service intelligently merges the two JSON results, preferring non-null values from either side.
8. The final structured object is returned to the client with a `{ success: true, data: { ... } }` envelope.

### Frontend Step-by-Step

1. The React app loads at `http://localhost:3000`.
2. The user sees two upload zones — **Front Side** and **Back Side** — with drag-and-drop support and image preview.
3. Uploading at least one image enables the **Extract Information** button.
4. On click, `axios` sends a `multipart/form-data` POST to `http://localhost:3001/api/ocr/extract`.
5. A loading spinner is shown while the AI processes the images (typically 10–20 seconds).
6. On success, the `ExtractedDataCard` component renders the extracted fields in labeled sections.
7. A **Show Raw Text** toggle reveals the full unstructured OCR output.
8. The **Reset** button clears everything to start over.

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19, Axios, Create React App       |
| Backend   | NestJS 11, TypeScript, Multer           |
| AI / OCR  | OpenAI GPT-4o Vision API                |
| Styling   | Custom CSS (CSS variables, responsive)  |

---

## Prerequisites

Make sure you have the following installed before setting up the project:

| Requirement         | Version       | Download |
|---------------------|---------------|----------|
| **Node.js**         | 18 or higher  | https://nodejs.org |
| **npm**             | 9 or higher   | Included with Node.js |
| **OpenAI API Key**  | GPT-4o access | https://platform.openai.com/api-keys |

> **Note:** Your OpenAI account must have access to the `gpt-4o` model and sufficient API credits. Vision-based requests consume more tokens than text-only requests.

---

## Project Structure

```
ocr_reactjs_nestjs/
├── README.md                   ← You are here
├── backend/                    ← NestJS API server
│   ├── src/
│   │   ├── main.ts             # Entry point (port, CORS, global prefix)
│   │   ├── app.module.ts       # Root module (loads .env, imports OcrModule)
│   │   └── ocr/
│   │       ├── ocr.module.ts   # OCR feature module
│   │       ├── ocr.controller.ts  # Route handler (POST /api/ocr/extract)
│   │       └── ocr.service.ts  # Business logic (OpenAI call, merging)
│   ├── .env                    # Your environment variables (not committed)
│   ├── package.json
│   └── tsconfig.json
└── frontend/                   ← React SPA
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/
    │   │   └── ocrApi.js       # Axios API call to backend
    │   ├── components/
    │   │   ├── ImageUploadZone.js    # Drag-and-drop upload UI
    │   │   └── ExtractedDataCard.js  # Results display UI
    │   ├── App.js              # Root component + state management
    │   ├── App.css             # Application styles
    │   └── index.js            # React entry point
    └── package.json
```

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ocr_reactjs_nestjs
```

---

### 2. Backend Setup

**Step 1 — Navigate to the backend folder:**

```bash
cd backend
```

**Step 2 — Install dependencies:**

```bash
npm install
```

**Step 3 — Create the environment file:**

Create a file named `.env` inside the `backend/` folder:

```bash
# backend/.env

OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=3001
```

> Replace `sk-your-openai-api-key-here` with your actual key from https://platform.openai.com/api-keys.
> The `PORT` variable is optional and defaults to `3001`.

---

### 3. Frontend Setup

**Step 1 — Navigate to the frontend folder** (open a new terminal):

```bash
cd frontend
```

**Step 2 — Install dependencies:**

```bash
npm install
```

> The frontend connects to the backend at `http://localhost:3001/api` by default. No additional configuration is needed for local development.

---

## Running the Application

You need **two terminals** running simultaneously — one for the backend and one for the frontend.

### Terminal 1 — Start the Backend

```bash
cd backend
npm run start:dev
```

The backend will start in watch mode (auto-restarts on file changes).

Expected output:
```
[NestJS] Application is running on: http://localhost:3001
```

### Terminal 2 — Start the Frontend

```bash
cd frontend
npm start
```

The React development server starts and automatically opens a browser tab.

Expected output:
```
Compiled successfully!
Local: http://localhost:3000
```

---

> Both servers must be running at the same time. The frontend (port 3000) communicates with the backend (port 3001).

---

## Using the App

1. Open your browser and go to **http://localhost:3000**
2. In the **Front Side** zone, drag-and-drop or click to select a photo of the front of an insurance card
3. Optionally, do the same for the **Back Side** zone
4. Click the **Extract Information** button
5. Wait 10–20 seconds while GPT-4o Vision analyzes the image(s)
6. Review the extracted data displayed in organized sections
7. Click **Show Raw Text** to see the unstructured OCR output if needed
8. Click **Reset** to clear everything and scan another card

### Supported Image Formats

| Format | MIME Type    |
|--------|--------------|
| JPEG   | image/jpeg   |
| PNG    | image/png    |
| WebP   | image/webp   |
| GIF    | image/gif    |

**Maximum file size:** 10 MB per image

---

## API Reference

### `POST /api/ocr/extract`

Extracts structured insurance card data from uploaded image(s).

**Request**

- Content-Type: `multipart/form-data`
- Fields:
  - `front` *(optional)* — Front image file
  - `back` *(optional)* — Back image file
  - At least one of `front` or `back` must be provided

**Response**

```json
{
  "success": true,
  "data": {
    "front": { ... },
    "back": { ... },
    "combined": {
      "insuranceCompany": "Blue Cross Blue Shield",
      "planName": "PPO Gold",
      "memberId": "XYZ123456789",
      "memberName": "John Doe",
      "groupNumber": "GRP987654",
      "payerId": "00901",
      "rxBin": "610014",
      "rxPcn": "BCBSM",
      "rxGroup": "RX1234",
      "copays": {
        "primaryCare": "$20",
        "specialist": "$40",
        "urgentCare": "$75",
        "emergencyRoom": "$150",
        "generic": "$10",
        "brandName": "$35"
      },
      "deductible": "$1,500",
      "outOfPocketMax": "$5,000",
      "effectiveDate": "01/01/2025",
      "network": "BlueCard PPO",
      "customerServicePhone": "1-800-123-4567",
      "providerPhone": "1-800-765-4321",
      "website": "www.bcbs.com",
      "additionalInfo": [],
      "rawText": "..."
    },
    "processingNotes": "Processed front and back sides"
  }
}
```

**Error Response**

```json
{
  "statusCode": 400,
  "message": "At least one image (front or back) must be provided"
}
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Required | Default | Description                              |
|------------------|----------|---------|------------------------------------------|
| `OPENAI_API_KEY` | Yes      | —       | Your OpenAI API key (must have GPT-4o access) |
| `PORT`           | No       | `3001`  | Port the NestJS server listens on        |

### Frontend

No environment variables are required for local development. The API base URL is set to `http://localhost:3001/api` by default in `src/api/ocrApi.js`.

---

## Available Scripts

### Backend

| Command              | Description                                 |
|----------------------|---------------------------------------------|
| `npm run start:dev`  | Start in development mode (watch/hot-reload)|
| `npm run start`      | Start in standard mode                      |
| `npm run build`      | Compile TypeScript to JavaScript            |
| `npm run start:prod` | Run the compiled production build           |
| `npm run lint`       | Lint and auto-fix code with ESLint          |
| `npm run test`       | Run unit tests                              |
| `npm run test:e2e`   | Run end-to-end tests                        |

### Frontend

| Command          | Description                              |
|------------------|------------------------------------------|
| `npm start`      | Start the development server             |
| `npm run build`  | Create an optimized production build     |
| `npm test`       | Run the test suite                       |

---
