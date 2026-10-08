# frozen_string_literal: true

module Api
  module V1
    class BaseController < ApplicationController
      rescue_from ActionController::InvalidAuthenticityToken, with: :render_invalid_csrf

      private

      def not_authorized_redirect
        render json: { error: { message: 'You are not authorized to perform this action.', code: 'not_authorized' } },
               status: :forbidden
      end

      def not_found
        render json: { error: { message: 'Not found', code: 'not_found' } }, status: :not_found
      end

      def internal_error(exception)
        Rails.logger.error(exception.message)
        render json: { error: { message: 'Internal server error', code: 'internal_error' } },
               status: :internal_server_error
      end

      def render_invalid_csrf
        render json: { error: { message: 'Invalid or missing CSRF token', code: 'invalid_csrf_token' } },
               status: :unprocessable_entity
      end
    end
  end
end
