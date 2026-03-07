# 🌍 OSViewr (Open Street Viewer)

Welcome to **OSViewr**! Your floating, glowing, and slightly-addictive 3D window to planet Earth. 🚀

Ever wanted to spin a globe and watch 22,000 satellites whiz by? Or maybe track live flights zooming over your house? How about checking out where the earth is shaking right now, or spotting active thermal anomalies (yeah, we mean *literal fires*) from space? 

OSViewr brings all this live data together into one beautiful, glassmorphic package!

## ✨ Features That Will Make You Go "Whoa"

🛸 **Live Satellites**: We crunch orbital mechanics in your browser 60 times a second using CelesTrak TLEs. It's like a glowing web of space traffic! 
✈️ **Live Flights**: Hooked up to the OpenSky Network, rendering thousands of little airplane SVGs over the map.
🌋 **Live Earthquakes**: Real-time seismic rumbles fed directly from USGS GeoJSON. The bigger the quake, the deeper the red glow.
🔥 **NASA Wildfires**: We intercept NASA's FIRMS satellite data (via a sneaky Vite proxy) to paint active thermal dots on the globe. Yes, you can literally see where it's hot!
🕶️ **Glassmorphic UI**: Floating, frosted-glass panels because we like our data served with *style*.
🗺️ **MapTiler & Carto Bases**: Switch smoothly between a moody dark matter theme and high-res satellite imagery.

## 🛠️ How to Fire It Up

Ready to hijack a satellite feed? (Kidding, it's public data). 

1. **Clone the repo** (You knew this one):
   ```bash
   git clone https://github.com/vijaik2k7/OSViewr.git
   cd OSViewr
   ```

2. **Install the magic**:
   ```bash
   npm install
   ```

3. **Start the engine**:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173` and start spinning the globe! 🌎

## 🚀 Tech Stack

- **React + Vite**: Because life is too short for slow builds.
- **MapLibre GL JS**: The secret sauce keeping our 3D globe buttery smooth.
- **satellite.js**: For all the intense math required to predict where the ISS is right now.
- **Lucide React**: For those crisp, scalable icons.

## 🤝 Contributing

Found a bug? Want to track submarines next? PRs are always welcome! Feel free to open an issue or drop a pull request. Let's make this the coolest globe wrapper on the internet.

---
*Built with ❤️, ☕, and a lot of coordinates.*
