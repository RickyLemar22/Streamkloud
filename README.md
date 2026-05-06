## StreamKloud 

It is a modern cloud-based music streaming platform inspired by Spotify and Apple Music, built with a full-stack architecture using React, Node.js, Express, MySQL, MongoDB, and secure streaming technologies.


## Overview

StreamKloud is a secure and scalable music streaming web application that allows users to:

Stream music online
Create and manage playlists
Upload songs and cover images
Subscribe to premium plans
Enjoy secure encrypted audio streaming
Receive recommendations
Manage accounts with email verification and authentication

## The platform includes:

Frontend: React + Vite
Backend: Node.js + Express
Databases: MySQL + MongoDB Atlas
Authentication: JWT + Google OAuth
Payments: Flutterwave Integration
Storage: Local Storage / Cloud Ready
Streaming: AES-encrypted secure streaming


## Features

## Authentication & Security


User Registration & Login


JWT Authentication


Email Verification


Password Reset via Email


Google OAuth Login


Role-Based Access Control


Secure Protected Routes



## Music Streaming


Audio Upload & Streaming


AES-256 Encrypted Songs


Secure Streaming Endpoint


Real-time Audio Playback


Artist & Album Management


Song Metadata Handling


Streaming Progress Tracking



## Subscription System
Available Plans and Features

1.Free:  Ads, limited streaming  2.Lite: daily no ads, better audio quality, 3.Premium: Unlimited streaming, downloads to be integrated 4.Family: Multi-user premium access


## Subscription Features


Flutterwave Payment Integration


Subscription Expiry Tracking


Premium Access Validation


Upgrade & Renewal System



## Playlist Management


Create Playlists


Add/Remove Songs


Like Songs


Recently Played


Favorite Artists


Personalized Recommendations



## Admin Dashboard


Upload Songs


Manage Artists


Manage Albums


Manage Users


View Analytics


Monitor Uploads


Manage Subscriptions



##  System Architecture
Frontend (React + Vite),REST API (Express.js), Authentication Layer (JWT), Service Layer Databases: MySQL,(Structured ) , MongoDB Atlas(Flexible Data ) 

## Tech Stack
## Frontend


React


Vite


TypeScript


Tailwind CSS


ShadCN UI


Axios


React Router


## Backend


Node.js


Express.js


JWT Authentication


Multer


Nodemailer


bcryptjs


## Databases
## MySQL
Used for:


Users


Songs


Artists


Albums


Subscriptions


Authentication


## MongoDB Atlas
Used for:


Playlists


Recommendations


Activity Logs


User Preferences


Analytics

## Installation on local environment
1. Clone Repository
git clone https://github.com/yourusername/StreamKloud.gitcd StreamKloud

2. Install Backend Dependencies
cd backend npm install

3.Install Frontend Dependencies
cd frontend npm install

## Environment Variables
Create a .env file inside the backend folder.
PORT=3000# 
## JWT
JWT_SECRET=your_jwt_secret 
MySQLDB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=streamkloud
MongoDBMONGO_URI=your_mongodb_connection
EmailSMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password
Google OAuthGOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
 ## Flutterwave
 FLUTTERWAVE_PUBLIC_KEY=your_public_key
 FLUTTERWAVE_SECRET_KEY=your_secret_key

## Database Setup
MySQL
Create database:
CREATE DATABASE streamkloud;
Run migrations/import SQL schema.

MongoDB Atlas


Create MongoDB Atlas Cluster


Obtain connection string


Add it to .env



## Running the Application
Start Backend
cd backend npm run dev

## Start Frontend
cd frontend npm run dev

## Default URLs
ServiceURLFrontendhttp://localhost:5173Backendhttp://localhost:3000API Healthhttp://localhost:3000/api/health

## Secure Streaming
StreamKloud uses:


AES-256-CBC encryption


Secure token-based streaming


Protected streaming endpoints


Server-side decryption


Chunk-based streaming


Example endpoint:
GET /api/songs/stream/:id

## Email Features


Email Verification


Password Reset


Welcome Emails


OTP Verification


Subscription Notifications


## Flutterwave Integration
Supported payment features:


Card Payments


Mobile Money


Subscription Payments


Payment Verification


Webhook Support



## Deployment
## Frontend
Deploy using:
Vercel
Netlify

## Backend
Planning to Deploy using:
AWS 
Render
Railway
DigitalOcean


## Database


MySQL Server
MongoDB Atlas



## Future Improvements


AI Music Recommendation System


Offline Downloads for subcribed users


Real-Time Charts


Podcast Streaming


Lyrics Synchronization


AI Playlist Generation


Multi-language Support


DRM Integration






## StreamKloud

“Music Everywhere, Securely Streamed.”




## Run Locally

**Prerequisites:**  Node.js 


1. Install dependencies:
   `npm install`
2. add your keys to the  .env file
3. Run the app:
   `npm run dev`
