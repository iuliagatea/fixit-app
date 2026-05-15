# frozen_string_literal: true

FactoryBot.define do
  factory :product do
    code { Faker::Code.name }
    name { Faker::Name.name }
    expected_completion_date { Faker::Date.forward(days: 5) }
    comments { Faker::Lorem.sentence }
    estimates { create_list(:estimate, 3) }
  end
end
