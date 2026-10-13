# frozen_string_literal: true

module Api
  module V1
    class PasswordsController < Api::V1::BaseController
      skip_before_action :authenticate_tenant!, only: %i[create update]

      def create
        user = User.send_reset_password_instructions(reset_request_params)

        if user.errors.empty?
          head :ok
        else
          render_error(user.errors.full_messages.to_sentence, code: 'reset_password_request_failed')
        end
      end

      def update
        user = User.reset_password_by_token(reset_params)

        if user.errors.empty?
          return unless sign_in_if_active(user)

          render_current_user
        else
          render_error(user.errors.full_messages.to_sentence, code: 'password_reset_failed')
        end
      end

      def change
        if current_user.update_with_password(change_params)
          bypass_sign_in(current_user, scope: :user)
          render_current_user
        else
          render_error(current_user.errors.full_messages.to_sentence, code: 'password_change_failed')
        end
      end

      private

      def render_error(message, code:)
        render json: { error: { message: message, code: code } }, status: :unprocessable_entity
      end

      def reset_request_params
        params.require(:user).permit(:email)
      end

      def reset_params
        params.require(:user).permit(:reset_password_token, :password, :password_confirmation)
      end

      def change_params
        params.require(:user).permit(:current_password, :password, :password_confirmation)
      end
    end
  end
end
