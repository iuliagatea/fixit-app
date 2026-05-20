# frozen_string_literal: true

class Product < ActiveRecord::Base
  belongs_to :tenant
  belongs_to :user
  has_many :product_statuses
  has_many :statuses, through: :product_statuses, dependent: :destroy
  has_many :estimates, inverse_of: :product, dependent: :destroy

  accepts_nested_attributes_for :user
  accepts_nested_attributes_for :estimates, reject_if: :all_blank, allow_destroy: true, limit: 50

  validates :name, presence: true, length: { minimum: 3, maximum: 255 }
  validates :code, presence: true, uniqueness: { scope: :tenant_id },
                   format: { with: /\A[a-zA-Z0-9-]+\z/, message: 'only letters, numbers, and hyphens' }
  validates :expected_completion_date, presence: true
  validates :tenant_id, presence: true
  validates :user_id, presence: true
  validate :validate_plan_limit, on: :create
  validate :validate_status_exists, unless: -> { new_record? }

  scope :active, -> { where(status: :active) }
  scope :by_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_status, ->(status_id) { joins(:product_statuses).where(product_statuses: { status_id: status_id }) }
  scope :recent, -> { order(created_at: :desc) }

  before_create :initialize_status
  after_create_commit :notify_creation
  after_update_commit :notify_update

  def current_status
    product_statuses.last.status
  end

  def estimated_value
    estimates.any? ? estimates.sum('price * quantity').to_d : 0
  end

  def transition_to_status!(new_status, _comment = nil)
    raise ArgumentError, 'Status must be a Status record' unless new_status.is_a?(Status)
    return if current_status == new_status

    transaction do
      product_statuses.create!(status: new_status)

      Products::UpdatedNotificationJob.perform_async(id) if new_status.send_email
    end
  end

  private

  def validate_plan_limit
    return if tenant.blank?

    return unless tenant.plan == 'free' && tenant.products.count >= 500

    errors.add(:base, 'Free plan limited to 500 products')
  end

  def validate_status_exists
    return unless statuses.blank?

    errors.add(:base, 'At least one status is required')
  end

  def initialize_status
    return if statuses.present?

    initial_status = tenant&.statuses&.find_by(name: 'Received')
    statuses << initial_status if initial_status.present?
  end

  def notify_creation
    Products::CreatedNotificationJob.perform_async(id)
  end

  def notify_update
    return unless saved_changes.keys.intersect?(%w[name expected_completion_date])

    Products::UpdatedNotificationJob.perform_async(id)
  end
end
