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
  has_many :statuses, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :estimates, dependent: :destroy
  has_many :tenant_categories
  has_many :categories, through: :tenant_categories
  has_one :payment
  has_many :reviews, dependent: :destroy
  accepts_nested_attributes_for :payment
  validates_presence_of :name
  validates_uniqueness_of :name
  validate :must_have_one_category

  before_destroy :clear_associated_users

  default_scope { where("#{table_name}.tenant_id IS NULL") }

  def self.create_new_tenant(params, _user_params)
    TenantCreate.call(params)
  end

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

  # ------------------------------------------------------------------------
  # tenant_signup -- setup a new tenant in the system
  # CALLBACK from devise RegistrationsController
  # AFTER user creation and current_tenant established
  # args:
  #   user  -- new user  obj
  #   tenant -- new tenant obj
  #   other  -- any other parameter string from initial request
  # ------------------------------------------------------------------------
  def self.tenant_signup(user, _tenant, _other = nil)
    Member.create_org_admin(user)
  end

  def must_have_one_category
    errors.add(:base, 'You must select at least one Category') if categories.blank?
  end

  private

  def clear_associated_users
    users.clear
  end
end
