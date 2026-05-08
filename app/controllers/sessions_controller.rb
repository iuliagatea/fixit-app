class SessionsController < Devise::SessionsController
   skip_before_action :authenticate_tenant!
end