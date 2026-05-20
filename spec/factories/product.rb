# frozen_string_literal: true

FactoryBot.define do
  factory :product do
    code { Faker::Code.isbn }
    name { Faker::Name.name }
    expected_completion_date { Faker::Date.forward(days: 5) }
    comments { Faker::Lorem.sentence }

    trait :with_estimates do
        after(:create) do |product|
          create_list(:estimate, 3, product: product)
        end
    end
  end
end
