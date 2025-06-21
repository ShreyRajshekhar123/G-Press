// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  // This tells Tailwind to look for 'dark' class on the HTML element
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Define custom colors that map to your CSS variables
      colors: {
        app: {
          // A custom namespace for your app's colors
          "bg-primary": "var(--color-bg-primary)",
          "bg-secondary": "var(--color-bg-secondary)",
          "text-primary": "var(--color-text-primary)",
          "text-secondary": "var(--color-text-secondary)",
          "blue-main": "var(--color-blue-primary)",
          "blue-light": "var(--color-blue-secondary)",
          "gray-border": "var(--color-gray-border)",
          "sidebar-bg": "var(--color-sidebar-bg)",
          "sidebar-text": "var(--color-sidebar-text)",
          "sidebar-active-bg": "var(--color-sidebar-active-bg)",
        },
        // You could also directly override existing Tailwind colors if you prefer,
        // but creating a custom 'app' namespace keeps things clear.
        // For example, to make gray-900 responsive to theme:
        // gray: {
        //   900: 'var(--color-bg-primary)', // Maps gray-900 to primary background
        //   800: 'var(--color-bg-secondary)', // Maps gray-800 to secondary background
        //   // etc. - be careful with this approach, it changes global Tailwind behavior
        // },
        // blue: {
        //   600: 'var(--color-blue-primary)', // Maps blue-600 to primary blue
        //   400: 'var(--color-blue-primary)', // Maps blue-400 to primary blue (adjust as needed for specific shades)
        // },
      },
    },
  },
  plugins: [],
};
