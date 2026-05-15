# frozen_string_literal: true

FactoryBot.define do
  factory :tenant do
    name { Faker::Name.name }
    trait :free do
      plan { 'free' }
    end
    trait :premium do
      plan { 'premium' }
    end
    description { Faker::Lorem.sentence }
    categories { create_list(:category, 2) }

    after(:create, &:create_statuses)
  end
end
