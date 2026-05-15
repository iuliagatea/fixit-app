# frozen_string_literal: true

FactoryBot.define do
  factory :estimate do
    name { Faker::Name.name }
    quantity { Faker::Number.within(range: 1..4) }
    price { Faker::Number.between(from: 10, to: 500) }
  end
end
