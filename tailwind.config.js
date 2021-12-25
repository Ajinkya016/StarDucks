module.exports = {
  content: ["./views/**/*.ejs","./views/*.ejs","./public/js/*.js"],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // require('@tailwindcss/aspect-ratio')
  ],
}
