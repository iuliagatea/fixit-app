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

    # Not after(:create, &:create_statuses) — Tenant's own after_create
    # callback already creates the 5 default statuses; calling it again here
    # duplicated every one of them (10 statuses per tenant instead of 5),
    # which among other things made any same-name status update spuriously
    # fail the name-uniqueness validation against its own duplicate row.
  end
end
