# frozen_string_literal: true

module Api
  module V1
    class ProductsController < Api::V1::BaseController
      before_action :verify_tenant
      before_action :find_product, only: %i[show update send_product_card]
      before_action :verify_user, except: %i[index show]

      def index
        scoped = products.includes(:estimates, :tenant, :user, :statuses)
        scoped = apply_filters(scoped)
        paginated = paginate(scoped.order(created_at: :desc), params[:page], params[:per_page])

        render json: {
          products: paginated.map { |product| product_json(product) },
          meta: pagination_meta(paginated)
        }
      end

      def show
        render json: product_json(@product, include_estimates: true)
      end

      def create
        @product = Products::CreateService.call(
          tenant_id: current_tenant.id,
          user_params: user_params,
          member_params: member_params,
          product_params: product_params,
          status_id: params[:status_id]
        )

        render json: product_json(@product, include_estimates: true), status: :created
      rescue Products::CreateService::ServiceError => e
        render json: { error: { message: e.message, code: 'create_failed' } }, status: :unprocessable_entity
      end

      def update
        result = Products::UpdateService.call(
          product: @product,
          product_params: product_params,
          new_status_id: params[:status_id]
        )

        render json: product_json(result, include_estimates: true)
      rescue Products::UpdateService::ServiceError => e
        render json: { error: { message: e.message, code: 'update_failed' } }, status: :unprocessable_entity
      end

      def send_product_card
        Products::CardEmailJob.perform_async(@product.id)
        head :no_content
      end

      private

      # Scoped to the current tenant/user (via the `products` helper), unlike
      # ProductsController#find_product — this closes an IDOR gap in the
      # legacy action, where `show` can be hit with any product id regardless
      # of tenant/ownership.
      def find_product
        @product = products.find(params[:id])
      end

      def product_params
        params.require(:product).permit(:code, :name, :expected_completion_date, :comments,
                                        estimates_attributes: %i[id name quantity price _destroy])
      end

      def user_params
        (params[:user] || ActionController::Parameters.new).permit(:email)
      end

      def member_params
        (params[:member] || ActionController::Parameters.new).permit(:first_name, :last_name)
      end

      # Supports the products index's name/status/customer-email filters and
      # the active-vs-completed table split. "Completed" is matched by name,
      # same convention the rest of the app already uses for magic statuses
      # (e.g. Product#initialize_status hardcodes "Received") — renaming the
      # tenant's "Completed" status would silently break the split.
      def apply_filters(scope)
        scope = filter_by_name(scope)
        scope = filter_by_customer_email(scope)
        scope = filter_by_status(scope)
        filter_by_completed(scope)
      end

      def filter_by_name(scope)
        return scope if params[:name].blank?

        scope.where('products.name ILIKE :q OR products.code ILIKE :q', q: "%#{params[:name]}%")
      end

      def filter_by_customer_email(scope)
        return scope if params[:customer_email].blank?

        scope.joins(:user).where('users.email ILIKE :email', email: "%#{params[:customer_email]}%")
      end

      def filter_by_status(scope)
        return scope if params[:status_id].blank?

        scope.where(current_status_id: params[:status_id])
      end

      def filter_by_completed(scope)
        case params[:completed]
        when 'true' then scope.where(current_status_id: completed_status_id)
        when 'false' then scope.where.not(current_status_id: completed_status_id)
        else scope
        end
      end

      def completed_status_id
        @completed_status_id ||= current_tenant.statuses.find_by(name: 'Completed')&.id
      end
    end
  end
end
