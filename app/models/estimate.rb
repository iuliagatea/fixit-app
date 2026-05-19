# frozen_string_literal: true

class Estimate < ActiveRecord::Base
  belongs_to :tenant
  belongs_to :product, inverse_of: :estimates

  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :product, presence: true

  scope :by_product, ->(product_id) { where(product_id: product_id) }
  scope :high_value, -> { where('price * quantity > ?', 5000) }

  after_create_commit :notify_user
  after_update_commit :notify_user

  def total_value
    (quantity * price).to_d
  end

  private

  def notify_user
    Products::UpdatedNotificationJob.perform_async(product_id)
  end
end
