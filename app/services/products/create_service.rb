# frozen_string_literal: true

require 'base/service_base'

module Products
  class CreateService
    include ServiceBase

    def initialize(tenant_id:, user_params:, member_params:, product_params:, status_id:)
      @tenant = Tenant.find(tenant_id)
      @user_params = user_params
      @product_params = product_params
      @member_params = member_params
      @status_id = status_id
    end

    def call
      Product.transaction do
        user = find_or_create_user

        product = @tenant.products.build(@product_params)
        product.user = user
        product.save!

        status = Status.find(@status_id)
        product.transition_to_status!(status)

        product
      end
    rescue ActiveRecord::RecordInvalid => e
      raise ServiceError, "Failed to create product: #{e.message}"
    end

    private

    def find_or_create_user
      User.find_or_create_by(email: @user_params[:email]) do |user|
        user.password = Devise.friendly_token.first(10)

        user.save_and_invite_member
        user.create_member(@member_params)
      end.tap do |user|
        user.tenants << @tenant unless user.tenants.exists?(id: @tenant.id)
      end
    end
  end
end
