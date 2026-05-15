module Tenantable
  extend ActiveSupport::Concern

  class_methods do
    def set_current_tenant(resource)
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
      Thread.current[:tenant] = Tenant.find(tenant_id)
      logger.debug(" >>>>> [Tenant#change_tenant] new: #{tenant_id}\told:#{old_id}") unless logger.nil?
    end

    def current_tenant
      Thread.current[:tenant]  ||= begin
              tenant_id = Thread.current[:tenant_id]
              tenant_id.blank? ? nil : Tenant.find(tenant_id)
            rescue ActiveRecord::RecordNotFound => e
            logger.warn("Tenant not found for ID #{tenant_id}: #{e.message}")

            nil
      end
    end

    def current_tenant_id
      Thread.current[:tenant_id]
    end

    def logout
      Thread.current[:tenant_id] = nil
      Thread.current[:tenant] = nil
    end
  end
end