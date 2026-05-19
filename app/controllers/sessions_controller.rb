# frozen_string_literal: true

class SessionsController < Devise::SessionsController
  skip_before_action :authenticate_tenant!, only: %i[new create]

  def destroy
    Tenant.logout
    super
  end
end
