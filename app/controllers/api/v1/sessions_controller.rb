# frozen_string_literal: true

module Api
  module V1
    class SessionsController < Api::V1::BaseController
      skip_before_action :authenticate_tenant!, only: %i[create]

      def create
        credentials = sign_in_params
        user = User.find_for_database_authentication(email: credentials[:email])

        if user&.valid_password?(credentials[:password])
          authenticate_and_respond(user)
        else
          render json: { error: { message: 'Invalid email or password', code: 'invalid_credentials' } },
                 status: :unauthorized
        end
      end

      def destroy
        Tenant.logout
        sign_out(current_user)
        head :no_content
      end

      def show
        render_current_user
      end

      private

      def authenticate_and_respond(user)
        unless user.active_for_authentication?
          render json: { error: { message: user.inactive_message.to_s.humanize, code: 'inactive_account' } },
                 status: :unauthorized
          return
        end

        sign_in(:user, user)
        Tenant.set_current_tenant(user)
        render_current_user
      end

      def sign_in_params
        params.require(:user).permit(:email, :password)
      end

      def render_current_user
        render json: {
          user: { id: current_user.id, email: current_user.email, is_admin: current_user.is_admin },
          tenant: current_tenant ? { id: current_tenant.id, name: current_tenant.name, plan: current_tenant.plan } : nil
        }
      end
    end
  end
end
