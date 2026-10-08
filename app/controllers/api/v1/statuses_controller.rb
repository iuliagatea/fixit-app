# frozen_string_literal: true

module Api
  module V1
    class StatusesController < Api::V1::BaseController
      before_action :verify_tenant
      before_action :find_status, only: %i[update destroy products]
      before_action :verify_user, except: %i[index products]

      def index
        render json: current_tenant.statuses.map { |status| status_admin_json(status) }
      end

      def create
        status = current_tenant.statuses.build(status_params)

        if status.save
          render json: status_admin_json(status), status: :created
        else
          render_status_error(status)
        end
      end

      def update
        if @status.update(status_params)
          render json: status_admin_json(@status)
        else
          render_status_error(@status)
        end
      end

      # The legacy view only *shows* the delete action when the status has no
      # products and is marked can_be_deleted — but never enforced either
      # server-side, so a direct DELETE could remove a status (including the
      # "Received" default that Product#initialize_status hardcodes a lookup
      # for) out from under every product referencing it. Enforcing it here
      # for the new API.
      def destroy
        unless @status.can_be_deleted? && @status.status_products(current_user).none?
          render json: { error: { message: 'This status cannot be deleted.', code: 'not_deletable' } },
                 status: :unprocessable_entity
          return
        end

        @status.destroy
        head :no_content
      end

      # Status board / filter view: products currently in this status.
      def products
        paginated = paginate(@status.status_products(current_user), params[:page], params[:per_page])

        render json: {
          products: paginated.map { |product| product_json(product) },
          meta: pagination_meta(paginated)
        }
      end

      private

      def find_status
        @status = current_tenant.statuses.find(params[:id])
      end

      def status_params
        params.require(:status).permit(:name, :color, :is_active)
      end

      def status_admin_json(status)
        {
          id: status.id,
          name: status.name,
          color: status.color,
          is_active: status.is_active,
          can_be_deleted: status.can_be_deleted
        }
      end

      def render_status_error(status)
        render json: { error: { message: status.errors.full_messages.join(', '), code: 'invalid_status' } },
               status: :unprocessable_entity
      end
    end
  end
end
