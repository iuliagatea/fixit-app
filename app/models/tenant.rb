# frozen_string_literal: true

class Tenant < ActiveRecord::Base
  include PgSearch
  include Tenantable

  DEFAULT_STATUSES = [{ name: 'Received', color: '#428bca' },
                      { name: 'In progress', color: '#d9534f' },
                      { name: 'Completed', color: '#3c763d' },
                      { name: 'Canceled', color: '#ad2f21' },
                      { name: 'Waiting', color: '#d9cf14' }].freeze
  pg_search_scope :search_any_word,
                  against: %i[name description keywords],
                  associated_against: {
                    categories: [:name]
                  },
                  using: {
                    tsearch: { any_word: true, dictionary: 'english' }
                  }
  has_and_belongs_to_many :users
  has_many :members, dependent: :destroy
  # Declaration order matters: `dependent: :destroy` runs as a
  # `before_destroy` callback, in the order declared. `products` must be
  # destroyed (and with it, their `product_statuses` rows) before
  # `statuses` — otherwise destroying a status whose product_statuses rows
  # still exist raises PG::ForeignKeyViolation.
  has_many :products, dependent: :destroy
  has_many :statuses, dependent: :destroy
  has_many :estimates, dependent: :destroy
  has_many :tenant_categories, dependent: :destroy
  has_many :categories, through: :tenant_categories
  has_one :payment, dependent: :destroy
  has_many :reviews, dependent: :destroy
  accepts_nested_attributes_for :payment
  validates_presence_of :name
  validates_uniqueness_of :name
  validate :must_have_one_category, unless: -> { new_record? }

  before_create :initialize_category
  after_create :create_statuses
  before_destroy :clear_associated_users

  def create_statuses
    statuses.insert_all(DEFAULT_STATUSES.map { |s| s.merge(tenant_id: id, can_be_deleted: false) })
  end

  # ------------------------------------------------------------------------
  # new_signups_not_permitted? -- returns true if no further signups allowed
  # args: params from user input; might contain a special 'coupon' code
  #       used to determine whether or not to allow another signup
  # ------------------------------------------------------------------------
  def self.new_signups_not_permitted?
    false
  end

  def must_have_one_category
    errors.add(:base, 'You must select at least one Category') if categories.blank?
  end

  def average_rating
    # .average returns a BigDecimal, which Rails' JSON serialization renders
    # as a string rather than a number - cast to Float first.
    reviews.where.not(rating: nil).average(:rating)&.to_f&.round(1)
  end

  def rated_reviews_count
    reviews.where.not(rating: nil).count
  end

  private

  def initialize_category
    return if categories.present?

    initial_category = Category.find_or_create_by(name: 'Service / Reparatii')
    categories << initial_category if initial_category.present?
  end

  def clear_associated_users
    users.clear
  end
end
