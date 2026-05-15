# frozen_string_literal: true

module ControllerHelper
  def set_current_tenant(tenant)
    Tenant.set_current_tenant tenant
  end

  def current_tenant
    Tenant.current_tenant
  end

  def login(user)
    @request.env['devise.mapping'] = Devise.mappings[:user]
    sign_in user
    allow(controller).to receive(:authenticate_user!).and_return(true)
    allow(controller).to receive(:current_user).and_return(user)
  end

  def logout(user)
    sign_out(user)
    Tenant.logout
  end
end
