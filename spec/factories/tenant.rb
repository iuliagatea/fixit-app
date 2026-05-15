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

    after(:create) do |tenant|
      tenant.create_statuses
    end
  end
end