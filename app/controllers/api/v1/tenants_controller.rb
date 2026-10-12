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

      # Summary widgets for the post-login dashboard. Visibility-scoped
      # figures (status counts, active/completed/value) reuse the same
      # `products` helper (admin sees all, member sees own) that
      # ProductsController#index already relies on - except `plan`, which
      # deliberately uses *all* of the tenant's products regardless of who's
      # looking, because Product#validate_plan_limit enforces the free-tier
      # cap tenant-wide, not per-member.
      def dashboard
        render json: {
          status_counts: status_counts,
          total_active_products: active_products.count,
          completed_this_month: completed_this_month_count,
          total_estimated_value: total_estimated_value,
          plan: plan_summary,
          rating: { average: @tenant.average_rating, count: @tenant.rated_reviews_count }
        }
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

      def status_counts
        counts = products.group(:current_status_id).count
        @tenant.statuses.map do |status|
          { id: status.id, name: status.name, color: status.color, count: counts[status.id] || 0 }
        end
      end

      # "Active" mirrors ProductsController#filter_by_completed's convention:
      # everything other than the tenant's "Completed" status (so Canceled
      # products still count as active, same as there).
      def active_products
        products.where.not(current_status_id: completed_status_id)
      end

      def completed_this_month_count
        ProductStatus.where(status_id: completed_status_id, product_id: products.select(:id))
                      .where(created_at: Time.current.beginning_of_month..)
                      .count
      end

      def total_estimated_value
        Estimate.joins(:product).where(product_id: active_products.select(:id))
                .sum('estimates.price * estimates.quantity').to_d
      end

      def plan_summary
        {
          plan: @tenant.plan,
          product_count: @tenant.products.count,
          limit: @tenant.plan == 'free' ? 500 : nil
        }
      end

      def completed_status_id
        @completed_status_id ||= @tenant.statuses.find_by(name: 'Completed')&.id
      end
    end
  end
end
