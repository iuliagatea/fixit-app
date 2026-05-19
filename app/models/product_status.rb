# frozen_string_literal: true

class ProductStatus < ActiveRecord::Base
  belongs_to :product, inverse_of: :product_statuses
  belongs_to :status

  validates :product_id, :status_id, presence: true
  validates :status_id, uniqueness: { scope: :product_id, message: 'already assigned to this product' }

  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status_id) { where(status_id: status_id) }

  def duration_in_status
    next_status = product.product_statuses.where('created_at > ?', created_at).first
    ((next_status&.created_at || Time.current) - created_at).in_seconds
  end
end
