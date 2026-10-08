# frozen_string_literal: true

module Api
  module V1
    # Tenant admin settings (name/description/keywords/categories) plus the
    # premium upgrade. Plan changes never go through #update — they're only
    # ever applied inside #upgrade, alongside the payment, exactly like the
    # legacy TenantsController#update's plan-change branch.
    class TenantsController < Api::V1::BaseController
      before_action :find_tenant
      before_action :verify_current_tenant
      before_action :verify_user, only: %i[update upgrade]

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

      # Mirrors legacy TenantsController#update's plan-change branch:
      # tentatively set plan to premium, attempt the (unchanged,
      # server-side-only) Payment#process_payment, and revert + destroy the
      # payment record on failure. The client only ever collects a Stripe
      # token (via Stripe Elements) — it never sees card details.
      def upgrade
        if @tenant.plan != 'free'
          render json: { error: { message: 'Tenant is already on a paid plan.', code: 'already_upgraded' } },
                 status: :unprocessable_entity
          return
        end

        outcome = apply_upgrade
        if outcome[:ok]
          render json: tenant_json(@tenant)
        else
          render json: { error: { message: outcome[:message], code: 'upgrade_failed' } }, status: :unprocessable_entity
        end
      end

      private

      def apply_upgrade
        result = { ok: false, message: nil }

        Tenant.transaction do
          @tenant.plan = 'premium'

          result = if @tenant.save
                     process_upgrade_payment
                   else
                     { ok: false, message: @tenant.errors.full_messages.join(', ') }
                   end
        end

        result
      end

      def process_upgrade_payment
        payment = Payment.new(email: upgrade_params[:email], token: upgrade_params[:token], tenant: @tenant)
        payment.process_payment
        payment.save!
        { ok: true, message: nil }
      rescue StandardError => e
        payment.destroy
        @tenant.update(plan: 'free')
        { ok: false, message: e.message }
      end

      def upgrade_params
        params.require(:payment).permit(:email, :token)
      end

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
