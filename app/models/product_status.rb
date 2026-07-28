# frozen_string_literal: true

class ProductStatus < ActiveRecord::Base
  belongs_to :product, inverse_of: :product_statuses
  belongs_to :status

  validates :product_id, :status_id, presence: true
  validates :status_id, uniqueness: { scope: :product_id, message: 'already assigned to this product' }

  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status_id) { where(status_id: status_id) }

  after_create_commit :update_product_status

  def duration_in_status
    next_status = ProductStatus.where(product_id: product_id)
                          .where('created_at > ?', created_at)
                          .order(created_at: :asc)
                          .first
    ((next_status&.created_at || Time.current) - created_at).in_seconds
  end

  private

    def update_product_status
      product.update!(current_status_id: status_id)
    end
end
