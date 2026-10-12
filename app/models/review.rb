# frozen_string_literal: true

class Review < ActiveRecord::Base
  belongs_to :tenant
  belongs_to :user

  validates :rating, inclusion: { in: 1..5 }, allow_nil: true
end
