# frozen_string_literal: true

require 'faker'
FactoryBot.define do
  factory :category do
    entity { 'tenant' }
    name { Faker::Name.name }
  end
end
