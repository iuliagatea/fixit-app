# frozen_string_literal: true

FactoryBot.define do
  factory :review do
    title { Faker::Lorem.sentence }
    review { Faker::Lorem.paragraph }
  end
end
