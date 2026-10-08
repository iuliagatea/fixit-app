# frozen_string_literal: true

module Api
  module V1
    # Tenant admin settings: name/description/keywords/categories only.
    # Plan changes go through Payment/Stripe (legacy `/plan/edit` for now —
    # that flow is Phase 5 scope) and are deliberately not permitted here.
    class TenantsController < Api::V1::BaseController
      before_action :find_tenant
      before_action :verify_current_tenant
      before_action :verify_user, only: %i[update]

      def show
        render json: tenant_json(@tenant)
      end

      def update
        if @tenant.update(tenant_params)
          render json: tenant_json(@tenant)
        else
          render json: { error: { message: @tenant.errors.full_messages.join(', '), code: 'update_failed' } },
                 status: :unprocessable_entity
        end
      end

      private

      def find_tenant
        @tenant = Tenant.find(params[:id])
      end

      # Not `verify_tenant` — that compares params[:tenant_id], but this is a
      # top-level (non-nested) resource keyed on params[:id].
      def verify_current_tenant
        return if @tenant.id == current_tenant.id

        not_authorized_redirect
      end

      def tenant_params
        params.require(:tenant).permit(:name, :description, :keywords, category_ids: [])
      end

      def tenant_json(tenant)
        {
          id: tenant.id,
          name: tenant.name,
          description: tenant.description,
          keywords: tenant.keywords,
          plan: tenant.plan,
          category_ids: tenant.categories.pluck(:id)
        }
      end
    end
  end
end
