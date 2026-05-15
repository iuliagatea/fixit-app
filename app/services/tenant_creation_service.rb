# frozen_string_literal: true

class TenantCreationService
  def self.call(tenant_params, _user_params = nil)
    tenant = Tenant.new(tenant_params)
    tenant.categories << Category.find_or_create_by(name: 'Service / Reparatii')

    raise ArgumentError, 'New signups not permitted' if Tenant.new_signups_not_permitted?

    Tenant.transaction do
      tenant.save!
      Thread.current[:tenant_id] = tenant.id
      tenant.create_statuses
    end

    tenant
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error("Tenant creation failed: #{e.message}")
    raise
  end
end
