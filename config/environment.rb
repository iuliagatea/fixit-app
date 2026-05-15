# frozen_string_literal: true

# Load the Rails application.
require File.expand_path('application', __dir__)

# Initialize the Rails application.
Rails.application.initialize!

ActionMailer::Base.smtp_settings = {
  address: 'smtp.sendgrid.net',
  port: '587',
  authentication: :plain,
  user_name: ENV.fetch('SENDGRID_USERNAME', nil),
  password: ENV.fetch('SENDGRID_PASSWORD', nil),
  domain: 'heroku.com',
  enable_starttls_auto: true
}
