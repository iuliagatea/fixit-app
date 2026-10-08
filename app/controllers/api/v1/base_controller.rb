# frozen_string_literal: true

module Api
  module V1
    class BaseController < ApplicationController
      rescue_from ActionController::InvalidAuthenticityToken, with: :render_invalid_csrf
      # ApplicationController registers `rescue_from StandardError` after
      # `rescue_from ActiveRecord::RecordNotFound`, and Rails matches
      # rescue_from handlers in reverse-registration order — so inherited,
      # RecordNotFound is actually caught by the generic 500 handler, not
      # `not_found`. Re-registering it here (appended after both, in this
      # subclass) puts it first in the search order for API controllers.
      rescue_from ActiveRecord::RecordNotFound, with: :not_found

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

      # Shared JSON shaping, used by ProductsController and StatusesController
      # (status board / products-by-status).
      def product_json(product, include_estimates: false)
        json = {
          id: product.id,
          code: product.code,
          name: product.name,
          expected_completion_date: product.expected_completion_date,
          comments: product.comments,
          estimated_value: product.estimated_value,
          tenant_id: product.tenant_id,
          updated_at: product.updated_at,
          user: { id: product.user.id, email: product.user.email },
          current_status: status_json(product.current_status)
        }
        json[:estimates] = product.estimates.map { |estimate| estimate_json(estimate) } if include_estimates
        json
      end

      def status_json(status)
        return nil if status.blank?

        { id: status.id, name: status.name, color: status.color }
      end

      def estimate_json(estimate)
        {
          id: estimate.id,
          name: estimate.name,
          quantity: estimate.quantity,
          price: estimate.price,
          total_value: estimate.total_value
        }
      end

      def pagination_meta(paginated)
        {
          total_pages: paginated.total_pages,
          current_page: paginated.current_page,
          per_page: paginated.per_page,
          total_entries: paginated.total_entries
        }
      end
    end
  end
end
