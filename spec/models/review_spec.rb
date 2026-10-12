# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Review, type: :model do
  describe 'Validations' do
    it { should belong_to(:tenant) }
    it { should belong_to(:user) }

    it 'allows a blank rating (legacy reviews have none)' do
      expect(build(:review, rating: nil)).to be_valid
    end

    it 'allows a rating between 1 and 5' do
      expect(build(:review, rating: 3)).to be_valid
    end

    it 'rejects a rating outside 1..5' do
      review = build(:review, rating: 6)

      expect(review).not_to be_valid
      expect(review.errors[:rating]).to be_present
    end
  end
end
