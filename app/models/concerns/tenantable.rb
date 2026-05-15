# frozen_string_literal: true

module Tenantable
  extend ActiveSupport::Concern

  included do
    #     default_scope { where(tenant_id: Tenant.current_tenant_id) }
  end

  class_methods do
    def set_current_tenant(resource)
      tenant_id = case resource
                  when User then resource.tenants.first&.id
                  when Tenant then resource.id
                  when Integer then resource
                  else raise ArgumentError, "Invalid resource: #{resource.class}"
                  end
      Thread.current[:tenant_id] = tenant_id
      @current_tenant = Tenant.find_by(id: current_tenant_id)
    end

    def current_tenant
      @current_tenant ||= Tenant.find_by(id: current_tenant_id)
    end

    def current_tenant_id
      Thread.current[:tenant_id]
    end

    def logout
      Thread.current[:tenant_id] = nil
      Thread.current[:tenant] = nil
      @current_tenant = nil
    end
  end
end
