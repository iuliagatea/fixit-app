# frozen_string_literal: true

class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable, :confirmable,
         :recoverable, :rememberable, :trackable, :validatable

  has_and_belongs_to_many :tenants
  has_one :member, dependent: :destroy
  has_many :products
  has_many :reviews, dependent: :destroy

  before_create :check_tenant
  after_create :add_to_tenant
  before_destroy :clear_tenants

  def save_and_invite_member
    status = nil

    if (self.email.blank?)
      self.errors.add(:email, :blank)
    elsif User.where([ "lower(email) = ?", self.email.downcase ]).present?
      self.errors.add(:email, :taken)
	else
      check_or_set_password
      status = self.save && self.errors.empty?
    end
    logger.debug("User save_and_invite_member status: #{status}, errors: #{self.errors.full_messages.uniq.join(', ')}")

    status
  end

    private

    def check_tenant
      if Thread.current[:tenant_id].blank? ||
         !Thread.current[:tenant_id].is_a?(Integer) ||
         Thread.current[:tenant_id].zero?
        raise "no existing valid current tenant"
      end
    end

    def add_to_tenant
      tenant = Tenant.find(Thread.current[:tenant_id])
      tenant.users << self unless tenant.users.include?(self)
    end

    def clear_tenants
      tenants.clear
    end

    def check_or_set_password
      if self.password.blank?
        self.password = Devise.friendly_token.first(Devise.password_length.first)
        self.password_confirmation = self.password
      else
        # if a password is being supplied, then ok to skip
        # setting up a password upon confirm
        self.skip_confirm_change_password = true
      end
    end
end
