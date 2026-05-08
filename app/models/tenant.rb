# frozen_string_literal: true

class Tenant < ActiveRecord::Base
  include PgSearch
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

  before_destroy do |old_tenant|
    old_tenant.users.clear # remove all users from this tenant
    true
  end

  default_scope { where("#{table_name}.tenant_id IS NULL") }

  def self.create_new_tenant(tenant_params, _user_params)
    tenant = Tenant.new(tenant_params)
    tenant.categories << Category.where("name = 'Service / Reparatii'")
    if new_signups_not_permitted?
      raise 'Sorry, new accounts not permitted at this time'
    end

    tenant.save # create the tenant

    Thread.current[:tenant_id]  = tenant.id # set the current tenant for this thread
    tenant.create_statuses

    tenant
  end

  def create_statuses
    statuses = [{ name: 'Received', color: '#428bca' }, { name: 'In progress', color: '#d9534f' },
                { name: 'Completed', color: '#3c763d' }, { name: 'Canceled', color: '#ad2f21' },
                { name: 'Waiting', color: '#d9cf14' }]
    statuses.each do |s|
      status = Status.new(name: s[:name], color: s[:color], tenant_id: id, can_be_deleted: false)
      status.save
    end
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

    def self.set_current_tenant(resource)
      # able to handle tenant obj or tenant_id
      case resource
        when User then
          tenant_id = resource.tenants.first.id
        when Tenant then
          tenant_id = resource.id
        when Integer then
          tenant_id = resource
      else
        raise ArgumentError, "invalid tenant object or id"
      end # case

      old_id = (Thread.current[:tenant_id].nil? ? '%' : Thread.current[:tenant_id])
      Thread.current[:tenant_id] = tenant_id
      logger.debug(" >>>>> [Tenant#change_tenant] new: #{tenant_id}\told:#{old_id}") unless logger.nil?
    end

    def self.current_tenant()
      begin
          tenant = Thread.current[:tenant_id].blank? ? nil : Tenant.find(Thread.current[:tenant_id])

          return tenant
      rescue ActiveRecord::RecordNotFound
        return nil
      end
    end

  def self.current_tenant_id()
    return Thread.current[:tenant_id]
  end


  def must_have_one_category
    errors.add(:base, 'You must select at least one Catgeory') if categories.blank?
  end
end
