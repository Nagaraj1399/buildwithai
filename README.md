# Gemini Reflection & Journal AI — Cloud Run Production Deployment Guide

A user-authenticated, multi-turn AI journaling and philosophical reflection application powered by **Google Gemini 3.6 Flash** and **Cloud Firestore**, designed and fortified for production deployment on **Google Cloud Run**.

---

## 1. System Architecture & Threat Model

| Threat Zone | Identified Attack Surface | Production Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection, oversized payloads, JSON poisoning | Defensive payload ingestion, null-safe destructuring, 10,000 char bounding, and zero-crash undefined-stripping (`stripUndefined`). |
| **Planning & Reasoning** | Prompt injection attempting to override system behavior | User input isolated as reflective narrative; system prompts enforce analytical boundaries and prohibit tool execution. |
| **Tool Execution** | SSRF or unauthorized API credential invocation | Backend proxy architecture (`/api/reflect`) with zero client-side exposure of API secrets. |
| **Memory & State** | Cross-user data bleed or unauthorized reads | Strict owner-bound Firestore subcollection path checks (`request.auth.uid == userId`) with default-deny rules. |
| **Inter-System Comm** | Gemini rate limits (`429`) or temporary service blips (`503`) | 4-tier Resilient Model Fallback Ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`). |

---

## 2. Environment Prerequisites

Ensure you have the Google Cloud CLI (`gcloud`) installed and configured:

```bash
# Authenticate gcloud
gcloud auth login

# Set your target Google Cloud Project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-isolated security rules to prevent cross-user data leaks and enforce authenticated access.

### `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Secret Management Setup (Google Cloud Secret Manager)

In compliance with Zero-Hardcoding directives, store the `GEMINI_API_KEY` securely in Secret Manager and grant Cloud Run read permissions:

```bash
# 1. Create the secret container in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API key as secret version
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Retrieve your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# 4. Grant the default Cloud Run runtime service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Google Cloud Run Deployment

Deploy the full-stack container to Cloud Run with Secret Manager environment injection:

```bash
# Deploy to Google Cloud Run
gcloud run deploy gemini-reflection-app \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --memory 1Gi \
  --cpu 1 \
  --port 3000
```

---

## 6. Required Campaign Verification Binding

To register and verify the deployed service for the **Cloud Run AI Challenge**, apply the mandatory campaign resource label:

```bash
gcloud run services update gemini-reflection-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

Verify that the label has been applied:
```bash
gcloud run services describe gemini-reflection-app \
  --region=asia-southeast1 \
  --format="value(metadata.labels)"
```

---

## 7. Local Development & Testing

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```
