/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',    // Deep Navy Slate
          primary: '#1e3a8a', // Deep Royal Blue
          accent: '#2563eb',  // Vibrant Blue
          emerald: '#059669', // Success/WhatsApp Green
        }
      }
    },
  },
  plugins: [],
}