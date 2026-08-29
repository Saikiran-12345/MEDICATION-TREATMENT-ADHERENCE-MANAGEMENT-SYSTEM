# Medication & Treatment Adherence Management System (MTAMS)

## Overview
MTAMS is a comprehensive clinical dashboard for managing patient medications, treatments, vitals, symptoms, and more. Designed for educational and demonstration purposes, this local-first application provides a complete interface for healthcare professionals and patients.

## Disclaimer
**MEDICAL DISCLAIMER:** This application is for demonstration and educational purposes ONLY. It is NOT a substitute for professional medical advice, diagnosis, or treatment.

## Features
- Patient Management & Profiles
- Medication & Prescription Tracking
- Vitals Monitoring
- Symptom & Side Effect Logging
- Appointment Scheduling
- Pharmacy Inventory

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Saikiran-12345/MEDICATION-TREATMENT-ADHERENCE-MANAGEMENT-SYSTEM.git
   cd MEDICATION-TREATMENT-ADHERENCE-MANAGEMENT-SYSTEM
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Build and Run

### Development Server
To start the Vite development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173/`.

### Production Build
To create a production build:
```bash
npm run build
```
To preview the production build:
```bash
npm run preview
```

### Docker
You can also run the application using Docker:
```bash
docker build -t mtams-app .
docker run -p 8080:80 mtams-app
```

## Usage
Login using the following demo credentials:
- **Admin**: `admin` / `admin123`
- **Healthcare Staff**: `staff` / `staff123`
- **Patient**: `patient` / `patient123`

## Dependencies
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Recharts
- Lucide React

All dependencies are tracked in `package.json` and `package-lock.json`.
