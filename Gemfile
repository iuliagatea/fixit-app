# frozen_string_literal: true

source 'https://rubygems.org'

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails'
# Use postgresql as the database for Active Record
gem 'devise'
gem 'pg'
# Payment
gem 'stripe'
# Charts
gem 'chartkick'
gem 'groupdate'
# Pagination
gem 'will_paginate'
# Dynamic nested forms
gem 'cocoon'
# PDF generator
gem 'wicked_pdf'
gem 'wkhtmltopdf-binary'
# Search and filter
gem 'filterrific'
gem 'pg_search'
# ratings
gem 'seems_rateable'

gem 'puma'

# Use SCSS for stylesheets
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier'
# Use CoffeeScript for .coffee assets and views
gem 'coffee-rails'
# See https://github.com/rails/execjs#readme for more supported runtimes
# gem 'therubyracer', platforms: :ruby

# Use jquery as the JavaScript library
gem 'jquery-rails'
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder'
# bundle exec rake doc:rails generates the API under doc/api.
gem 'factory_bot_rails'
gem 'sdoc', group: :doc
# Use ActiveModel has_secure_password
# gem 'bcrypt', '~> 3.1.7'

# Use Unicorn as the app server
# gem 'unicorn'

# Use Capistrano for deployment
# gem 'capistrano-rails', group: :development
group :production do
  gem 'rails_12factor'
end
group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug'
  gem 'faker', '~> 2.2', '>= 2.2.0'
  gem 'rails-controller-testing'
  gem 'rspec-rails'
  gem 'rubocop'
  gem 'rubocop-faker', require: false
  gem 'rubocop-rails', require: false
  gem 'rubocop-rspec', require: false
  gem 'shoulda-matchers'
end

group :development do
  # Access an IRB console on exception pages or by using <%= console %> in views
  gem 'web-console'

  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
end

gem 'activerecord-session_store', github: 'rails/activerecord-session_store'
gem 'recaptcha', require: 'recaptcha/rails'

gem 'cssbundling-rails', '~> 1.4'

gem 'jsbundling-rails', '~> 1.3'

gem 'sprockets-rails', '~> 3.5'

gem 'sassc-rails', '~> 2.1'

gem 'twitter-bootstrap-rails', '~> 5.3'

gem 'pundit', '~> 2.5'

gem 'sidekiq'
