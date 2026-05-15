# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    email { Faker::Internet.email }
    password { Faker::Internet.password }
    trait :admin do
      is_admin { true }
    end
    trait :regular do
      is_admin { false }
    end
  end
  factory :member do
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
  end
end
