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

  before_create do |new_user|
    if Thread.current[:tenant_id].blank? ||
        !Thread.current[:tenant_id].kind_of?(Integer) ||
        Thread.current[:tenant_id].zero?

      raise "no existing valid current tenant"
    end
  end # before create callback do

    after_create do |new_user|
      tenant = Tenant.find(Thread.current[:tenant_id])
      unless tenant.users.include?(new_user)
          tenant.users << new_user # add user to this tenant if not already there
      end
    end # before_create do

    before_destroy do |old_user|
      old_user.tenants.clear # remove all tenants for this user
    end # before_destroy do

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

      return status
    end

    private

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
