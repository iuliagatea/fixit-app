# frozen_string_literal: true

module Api
  module V1
    class ProductsController < Api::V1::BaseController
      before_action :verify_tenant
      before_action :find_product, only: %i[show]

      def index
        scoped = products.includes(:estimates, :tenant, :user, :statuses).order(created_at: :desc)
        paginated = paginate(scoped, params[:page], params[:per_page])

        render json: {
          products: paginated.map { |product| product_json(product) },
          meta: pagination_meta(paginated)
        }
      end

      def show
        render json: product_json(@product, include_estimates: true)
      end

      private

      # Scoped to the current tenant/user (via the `products` helper), unlike
      # ProductsController#find_product — this closes an IDOR gap in the
      # legacy action, where `show` can be hit with any product id regardless
      # of tenant/ownership.
      def find_product
        @product = products.find(params[:id])
      end

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
