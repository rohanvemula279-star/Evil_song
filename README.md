# 🎵 Evil Songs - Interactive Song Carousel & Filmstrip Player

An interactive, vintage filmstrip-styled music player and song carousel web application built with **React**, **TypeScript**, and **Vite**.

---

## 🌟 Features

- 🎞️ **Vintage Filmstrip Carousel**: Smooth, 3D interactive visual navigation through song cards.
- 🎧 **Playable Music Audio**: 
  - **Instant Demo Playlist**: One-click preset playlist with 8+ working audio tracks!
  - **Local MP3/Audio File Upload**: Drag & drop `.mp3`, `.wav`, `.m4a`, or `.ogg` files to play your own songs directly!
  - **Spotify CSV Playlist Upload**: Import any CSV song list.
- 🎛️ **Full Player Bar & Visualizer**:
  - Play / Pause, Next & Previous track controls.
  - Interactive song scrubber & progress timeline.
  - Volume slider and Mute control.
  - Animated audio spectrum visualizer.
- 📱 **Responsive Design**: Designed to look great on desktop screens, tablets, and mobile devices.
- ⚡ **Lightning Fast**: Powered by Vite for instant hot-module replacement (HMR).

---

## 📋 Prerequisites

Before running this project on your personal laptop, make sure you have the following installed:

1. **Node.js** (v18.0.0 or higher recommended)
   - Check if installed: open terminal/command prompt and run:
     ```bash
     node -v
     ```
   - If not installed, download it from [nodejs.org](https://nodejs.org/).
2. **npm** (comes automatically with Node.js)
   - Check if installed:
     ```bash
     npm -v
     ```

---

## 🚀 Steps to Run on Your Personal Laptop

Follow these simple step-by-step instructions to get the application running locally:

### 1. Download or Clone the Repository
If using Git, clone the project using Terminal or Command Prompt:
```bash
git clone <repository-url>
cd cards
```
*(If you downloaded a `.zip` file, extract it to a folder and open that folder in your terminal).*

---

### 2. Install Project Dependencies
Open your terminal (PowerShell / Command Prompt on Windows, Terminal on macOS/Linux) inside the project directory and run:

```bash
npm install
```
> This command will download all necessary packages specified in `package.json` (such as React, Vite, Lucide Icons, etc.).

---

### 3. Start the Development Server
Once the installation completes, start the local development server:

```bash
npm run dev
```

---

### 4. Open in Your Web Browser
After running `npm run dev`, open your web browser (Chrome, Edge, Firefox, Safari) and visit:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🎵 How to Listen to Songs

When you open the application:

1. **To listen immediately**: Click **"Load Demo Playlist (Instant Playable Music)"**. This loads curated tracks with live, high-quality audio streams.
2. **To play your own MP3 files**: Drag and drop any `.mp3`, `.wav`, or `.m4a` files onto the upload screen!
3. **To play songs**: Click on any card in the filmstrip or click the **Play** button in the bottom player bar to start playback.

---

## 📜 Available Scripts

In the project directory, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local development server with Hot Module Reloading (HMR). |
| `npm run build` | Bundles and optimizes the app for production in the `dist/` directory. |
| `npm run preview` | Runs a local web server to preview the production build from `dist/`. |

---

## 📁 Project Structure

```text
cards/
├── index.html                  # Main HTML template
├── package.json                # Project dependencies and scripts
├── song_carousel_filmstrip.tsx # Main Song Carousel Filmstrip component & player
├── src/
│   ├── app.css                 # Application styling & layout CSS
│   └── main.tsx                # Entry point mounting React to DOM
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite server & build configuration
```

---

## ❓ Troubleshooting & Common Issues

<details>
<summary><b>1. 'node' or 'npm' is not recognized as an internal or external command</b></summary>

- **Cause**: Node.js is not installed or not added to your system's PATH variable.
- **Fix**: Download and install Node.js (LTS version) from [nodejs.org](https://nodejs.org/). Restart your terminal after installing.
</details>

<details>
<summary><b>2. Port 5173 is already in use</b></summary>

- **Fix**: Vite will automatically try the next available port (e.g., `http://localhost:5174`). Check the terminal output for the correct URL.
</details>

<details>
<summary><b>3. Audio doesn't play automatically</b></summary>

- **Fix**: Modern web browsers require a user interaction (like clicking a play button or clicking a song card) before audio can start playing. Click any card in the filmstrip to start listening!
</details>

---

Happy Listening! 🎧