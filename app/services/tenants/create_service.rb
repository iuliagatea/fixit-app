# frozen_string_literal: true

module Tenants
  class CreateService
    include ServiceBase

    def initialize(tenant_params:, user_params:)
      @tenant_params = tenant_params
      @user_params = user_params
    end

    def call
      raise ArgumentError, 'New signups not permitted' if Tenant.new_signups_not_permitted?

      Tenant.transaction do
        tenant = Tenant.new(@tenant_params)
        tenant.save!
        Thread.current[:tenant_id] = tenant.id

        tenant
      end
    rescue ActiveRecord::RecordInvalid => e
      raise ServiceError, "Failed to create tenant: #{e.message}"
    end
  end
end
