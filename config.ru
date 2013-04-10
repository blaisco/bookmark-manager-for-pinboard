require './application'
run Sinatra::Application

if(ENV['RACK_ENV'] != "production")
  require 'sass/plugin/rack'

  Sass::Plugin.options.merge!(
    :style => :compact,
    :template_location => "public/css/sass",
    :css_location => "public/css"
  )

  use Sass::Plugin::Rack
end