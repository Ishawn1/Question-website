// tailwind.config.js
module.exports = {
    darkMode: 'class',
    content: [
        "./templates/**/*.html",
        "./static/**/*.js"
    ],
    theme: {
        extend: {
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-in-up': 'slideInUp 0.5s ease-out'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInUp: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            },
            colors: {
                'md-dark-bg': '#121212',          // Dark background (like Material Design surface #1)
                'md-dark-surface': '#1e1e1e',     // Slightly lighter surface color (surface #2)
                'md-dark-primary': '#bb86fc',      // Purple 200 (Material Design Primary color - can adjust)
                'md-dark-primary-variant': '#3700b3', // Deep Purple A700 (Primary Variant)
                'md-dark-secondary': '#03dac6',    // Teal 200 (Secondary/Accent color - can adjust)
                'md-dark-secondary-variant': '#018786', // Teal 700 (Secondary Variant)
                'md-dark-text-primary': '#ffffff',  // White text (Primary text color on dark)
                'md-dark-text-secondary': '#d0d0d0', // Light gray text (Secondary text color on dark)
                'md-dark-on-primary': '#000000',     // Black text on Primary color
                'md-dark-on-secondary': '#000000',   // Black text on Secondary color
                'md-light-divider': '#BDBDBD',      // Light divider color
            },
            boxShadow: { // Custom shadows for Material Design elevation
                'md-elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                'md-elevation-2': '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
                'md-elevation-3': '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
                // Add more elevation levels if needed (md-elevation-4, md-elevation-5...)
            },
        },
    },
    plugins: [],
}