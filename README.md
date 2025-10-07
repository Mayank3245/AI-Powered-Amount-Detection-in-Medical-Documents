# 🧾 OCR-Based Financial Amount Extraction Service

An intelligent **Node.js backend service** that extracts and classifies **financial amounts** (Total, Paid, Due, Discount, etc.) from **medical bills, receipts, or invoices** — whether typed or scanned.  

Built using **Tesseract.js** for OCR and **Sharp** for preprocessing, it supports both **text and image inputs**, returning clean, structured JSON outputs.

---

## 📖 Table of Contents
1. [Overview](#overview)
2. [Prompts Used and Refinements](#prompts-used-and-refinements)
3. [Architecture](#architecture)
4. [State Management Choices](#state-management-choices)
5. [Setup Instructions](#setup-instructions)
6. [API Routes and Usage](#api-routes-and-usage)
7. [Example Workflow](#example-workflow)
8. [Screenshots](#screenshots)
9. [Known Issues](#known-issues)
10. [Potential Improvements](#potential-improvements)
11. [Tech Stack](#tech-stack)
12. [Author](#author)


---

## 🧠 Overview

This service runs a **4-step modular OCR pipeline** that can process both text and image inputs.  
It extracts numbers, fixes OCR errors, classifies them contextually, and outputs labeled data.

### Core Goals
- Extract accurate financial amounts from real-world documents.
- Correct OCR errors contextually (e.g., `T0tal` → `Total`, `1NR` → `INR`).
- Produce structured JSON ready for use in financial or medical systems.

### Sample Input
Total: INR 1200 
Paid: 1000 
Due: 200 
Discount: 10%


### Sample Final Output
{
 "currency": "INR",
 "amounts": [
  {"type":"total_bill","value":1200,"source":"text: 'Total: INR 1200'"},
  {"type":"paid","value":1000,"source":"text: 'Paid: 1000'"},
  {"type":"due","value":200,"source":"text: 'Due: 200'"}
 ],
 "status":"ok"
}

## 🧱 Architecture
🧩 Flow


 Input (Text or Image)                   
       ↓
 Step 1: OCR Extraction
       ↓
 Step 2: Normalization (clean numbers)
       ↓
 Step 3: Classification (assign labels)
       ↓
 Step 4: Finalization (structured JSON)

📂 Folder Structure


<img width="125" height="352" alt="image" src="https://github.com/user-attachments/assets/3e73822b-e6e7-4f8f-8861-cfddf26e7cc6" />


## 🧩 State Management Choices

Although this backend is stateless, internal modules handle state transitions logically between steps.

| Component       | Responsibility                              |
| --------------- | ------------------------------------------- |
| `ocrService.js` | Handles text extraction from image (OCR)    |
| `normalize.js`  | Cleans and parses numeric data              |
| `classify.js`   | Classifies values as Total, Paid, Due, etc. |
| `builder.js`    | Combines everything into the final response |


## ⚙️ Setup Instructions

Prerequisites

Node.js v18 or newer

npm or yarn

(Optional) Tesseract CLI for better OCR speed

Installation
npm init -y 
npm install express multer sharp tesseract.js dotenv @google/genai @google/generative-ai && npm install --save-dev nodemon


Run Server
npm start


Server runs at:
👉 http://localhost:5000

## 🌐 API Routes and Usage

| Step | Endpoint               | Input Type   | Description                   |
| ---- | ---------------------- | ------------ | ----------------------------- |
| 1️⃣  | `/api/step1_extract`   | Text / Image | Extract raw numeric tokens    |
| 2️⃣  | `/api/step2_normalize` | Text / Image | Clean and normalize values    |
| 3️⃣  | `/api/step3_classify`  | Text / Image | Classify as total, paid, etc. |
| 4️⃣  | `/api/step4_finalize`  | Text / Image | Final structured output       |


## 🧪 Example Workflow

 Input:
{
  "text": "Total: INR 1200\nPaid: 1000\nDue: 200\nDiscount: 10%"
}

🔹 Step 1 - Extraction

POST /api/step1_extract

{
  "raw_tokens": ["1200", "1000", "200", "10%"],
  "currency_hint": "INR",
  "confidence": 0.87
}

🔹 Step 2 - Normalization

POST /api/step2_normalize

{
  "normalized_amounts": [1200, 1000, 200, 10],
  "normalization_confidence": 0.9
}
🔹 Step 3 - Classification

POST /api/step3_classify
{
  "amounts": [
    { "type": "total_bill", "value": 1200 },
    { "type": "paid", "value": 1000 },
    { "type": "due", "value": 200 },
    { "type": "discount", "value": 10 }
  ],
  "confidence": 0.85
}


🔹 Step 4 - Final Output

POST /api/step4_finalize

{
  "currency": "INR",
  "amounts": [
    { "type": "total_bill", "value": 1200, "source": "text: 'Total: INR 1200'" },
    { "type": "paid", "value": 1000, "source": "text: 'Paid: 1000'" },
    { "type": "due", "value": 200, "source": "text: 'Due: 200'" },
    { "type": "discount", "value": 10, "source": "text: 'Discount: 10%'" }
  ],
  "status": "ok"
}

## Screenshots 
<img width="365" height="123" alt="img" src="https://github.com/user-attachments/assets/0f252236-c2ff-40f8-b33d-b48d2e6afc7f" />


Step 1 (OCR Extraction):Shows raw tokens from image or text

<img width="496" height="362" alt="image" src="https://github.com/user-attachments/assets/0c0202ff-8a57-4a63-9c94-4c78a8632caa" />


Step 2 (Normalization):Cleans and fixes decimals


<img width="1081" height="749" alt="image" src="https://github.com/user-attachments/assets/97d5d583-636e-4469-8ffd-269e420d064d" />

Step 3 (Classification): Detects total, paid, due


<img width="1164" height="844" alt="image" src="https://github.com/user-attachments/assets/30a0ae50-edbc-4d11-b9f7-14216bab182f" />


Step 4 (Final Output): Returns structured JSON


<img width="879" height="861" alt="image" src="https://github.com/user-attachments/assets/e6593e2a-d8f3-4412-a923-64253d5fac0d" />



## 🧩 Known Issues
| Issue                                 | Description                       |
| ------------------------------------- | --------------------------------- |
| OCR struggles with blurry photos      | May miss or misread numbers       |
| Limited currency detection            | Currently supports INR and ₹ only |
| Not multilingual                      | English-only OCR                  |
| Misclassified totals on complex bills | Requires improved NLP             |
| Confidence from Tesseract is generic  | May need digit-based reweighting  |


## 🔮 Potential Improvements

Support multi-currency detection (USD, EUR, GBP)

Add PDF parsing for digital receipts

Improve OCR accuracy for handwritten bills

Add frontend dashboard for visual results

Implement Redis caching for OCR optimization


## ⚙️ Tech Stack

| Component           | Technology        |
| ------------------- | ----------------- |
| Backend             | Node.js + Express |
| OCR                 | Tesseract.js      |
| Image Preprocessing | Sharp             |
| File Upload         | Multer            |
| Config              | dotenv            |
| AI      |           | GEMINI LLM model  |



## 👨‍💻 Author

Mayank soni 
Backend Engineer | OCR + AI Systems

## Summary Diagram

        🖼️ Image / 📝 Text
                ↓
     🧠 Step 1: OCR Extraction
                ↓
     🔢 Step 2: Normalization
                ↓
     🏷️ Step 3: Classification
                ↓
     📦 Step 4: Final JSON Output


## ✅ Final Notes

Fully modular — each route works independently

Works with both text and image inputs

Auto-cleans temporary uploads after use

Confidence scores returned at every stage

Ideal for medical billing, expense automation, or invoice analysis



