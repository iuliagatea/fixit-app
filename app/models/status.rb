# frozen_string_literal: true

class Status < ActiveRecord::Base
  belongs_to :tenant
  has_many :product_statuses
  has_many :products, through: :product_statuses
  validates_presence_of :name
  validates_uniqueness_of :name, scope: :tenant_id

  def status_products(user)
    Product
      .where(current_status_id: id)
      .where('user_id = ? OR ? = true', user.id, user.is_admin)
      .includes(:estimates, :tenant, user: :member)
  end
end
