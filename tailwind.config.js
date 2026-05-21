/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          'light': '#6FCF97',
          'primary': '#2FA084',
          'dark': '#1F6F5F',
          'bg': '#EEEEEE',
        },
      },
    },
  },
  plugins: [],
}
