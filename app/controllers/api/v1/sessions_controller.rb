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
        return unless sign_in_if_active(user)

        render_current_user
      end

      def sign_in_params
        params.require(:user).permit(:email, :password)
      end
    end
  end
end
