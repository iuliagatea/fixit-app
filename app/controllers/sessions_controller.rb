class SessionsController < Devise::SessionsController
   skip_before_action :authenticate_tenant!, only: %i[new create]
end