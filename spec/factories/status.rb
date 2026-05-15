# frozen_string_literal: true

FactoryBot.define do
  factory :status do
    name { Faker::Name.name }
    color { Faker::Color.hex_color }
    association :tenant
  end
end
