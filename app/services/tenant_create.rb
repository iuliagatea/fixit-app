class TenantCreate
   def self.call(tenant_params)
     tenant = Tenant.new(tenant_params)
     tenant.categories << Category.find_by(name: 'Service / Reparatii')
     raise 'Sorry, new accounts not permitted at this time' if Tenant.new_signups_not_permitted?

     tenant.save!
     Thread.current[:tenant_id] = tenant.id
     tenant.create_statuses
     tenant
   end
end