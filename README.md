# 3D Solar System Simulator

A modern, interactive, and mobile-friendly 3D Solar System Simulator built with Three.js, Vite, and GSAP.

## Features
- Real-time 3D rendering of the solar system
- Mobile responsive design and controls
- Smooth camera transitions and planet focus (GSAP-powered)
- Pause/Resume and Reset View controls (bottom right, always visible)
- Interactive planet selection with info panel and tooltips
- Planets orbit the Sun and rotate on their axes
- Sun and asteroid belt rotation
- Galaxy/starfield background
- Saturn ring, planet textures, and orbit rings
- Fully synchronized animation loop
- Accessible UI (ARIA labels, keyboard shortcuts)

## Getting Started

### Install dependencies
```bash
npm install
```

### Start the development server
```bash
npm run dev
```

Open your browser to the provided local address (usually http://localhost:5173/).

### Build for production
```bash
npm run build
```

### Preview the production build
```bash
npm run preview
```

## Deployment (Vercel)
1. Push your project to GitHub (or GitLab/Bitbucket).
2. Go to [https://vercel.com/](https://vercel.com/) and import your repo.
3. Use the default Vite settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click Deploy. Your app will be live at a Vercel URL.

## Project Structure
- `src/` - Main JavaScript and logic
- `public/` - Static assets (textures, images)
- `index.html` - Main HTML entry point
- `vite.config.js` - Vite configuration
- `README.md` - This file

## Controls & Shortcuts
- **Pause/Resume:** Bottom right button
- **Reset View:** Bottom right button
- **Click planet:** Focus and lock camera on planet
- **Hover/tap planet:** Show tooltip with facts
- **Info panel:** Appears when focused on a planet
- **Keyboard:**
  - `Esc` — Reset view
  - `1-8, 0` — Focus on planets/Sun

## License
MIT 