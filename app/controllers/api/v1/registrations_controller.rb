# frozen_string_literal: true

module Api
  module V1
    class RegistrationsController < Api::V1::BaseController
      skip_before_action :authenticate_tenant!, only: %i[create]

      def create
        Tenant.transaction do
          Tenants::CreateService.call(tenant_params: tenant_params.merge(plan: 'free'), user_params: user_params)
          user = User.new(user_params.merge(is_admin: true))

          unless user.save
            render json: { error: { message: user.errors.full_messages.to_sentence, code: 'signup_failed' } },
                   status: :unprocessable_entity
            raise ActiveRecord::Rollback
          end

          Member.create_org_admin(user)
        end

        head :created unless performed?
      rescue Tenants::CreateService::ServiceError, ArgumentError => e
        render json: { error: { message: e.message, code: 'signup_failed' } }, status: :unprocessable_entity
      end

      private

      def tenant_params
        params.require(:tenant).permit(:name)
      end

      def user_params
        params.require(:user).permit(:email, :password, :password_confirmation)
      end
    end
  end
end
