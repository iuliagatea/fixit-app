# frozen_string_literal: true

module Api
  module V1
    class ConfirmationsController < Api::V1::BaseController
      skip_before_action :authenticate_tenant!, only: %i[create update]

      def create
        user = User.send_confirmation_instructions(confirmation_request_params)

        if user.errors.empty?
          head :ok
        else
          render_error(user.errors.full_messages.to_sentence, code: 'resend_confirmation_failed')
        end
      end

      def update
        user = User.confirm_by_token(confirm_params[:confirmation_token])

        if user.errors.empty?
          return unless sign_in_if_active(user)

          render_current_user
        else
          render_error(user.errors.full_messages.to_sentence, code: 'confirmation_failed')
        end
      end

      private

      def render_error(message, code:)
        render json: { error: { message: message, code: code } }, status: :unprocessable_entity
      end

      def confirmation_request_params
        params.require(:user).permit(:email)
      end

      def confirm_params
        params.require(:user).permit(:confirmation_token)
      end
    end
  end
end
