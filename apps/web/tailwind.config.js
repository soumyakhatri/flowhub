/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#12211f",
          muted: "#5c6f6b",
        },
        tide: {
          50: "#f3fbf9",
          100: "#d8f3ec",
          200: "#b3e6d9",
          400: "#3dbea6",
          600: "#0f8f7b",
          700: "#0c7566",
          800: "#115e54",
          900: "#134e48",
          950: "#0b2c2a",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 36, 34, 0.05), 0 10px 28px rgba(16, 36, 34, 0.06)",
      },
    },
  },
  plugins: [],
};