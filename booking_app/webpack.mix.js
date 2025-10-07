const mix = require('laravel-mix');

mix
  .js('resources/js/main.jsx', 'public/build/js')
  .react()
  .sass('resources/sass/app.scss', 'public/build/css')
  .sourceMaps()
  .version();

// Percorso pubblico (URL) usato nei Blade con mix()
mix.setPublicPath('public');
mix.setResourceRoot('/'); // asset absolute
