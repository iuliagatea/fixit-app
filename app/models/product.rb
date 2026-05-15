# frozen_string_literal: true

class Product < ActiveRecord::Base
  belongs_to :tenant
  belongs_to :user
  has_many :product_statuses
  has_many :statuses, through: :product_statuses, dependent: :destroy
  has_many :estimates, inverse_of: :product, dependent: :destroy
  accepts_nested_attributes_for :user
  accepts_nested_attributes_for :estimates, reject_if: :all_blank, allow_destroy: true
  validate :free_plan_can_only_have_500_products

  def free_plan_can_only_have_500_products
    return unless tenant && new_record? && (tenant.products.count > 499) && (tenant.plan == 'free')

    errors.add(:base, 'Free plans cannot have more than 500 products')
  end

  def current_status
    product_statuses.last.status
  end

  def estimated_value
    estimates.any? ? estimates.sum('price * quantity') : 0
  end
end
