# frozen_string_literal: true

module Api
  module V1
    # Supports the "new product" form autocompleting/locking the customer's
    # name when the entered email already belongs to a tenant customer —
    # matches Products::CreateService's own find_or_create_user, which
    # silently ignores member_params for an existing user.
    class CustomersController < Api::V1::BaseController
      before_action :verify_tenant
      before_action :verify_user

      def lookup
        email = params[:email].to_s.strip
        user = current_tenant.users.find_by('lower(email) = ?', email.downcase)

        if user
          render json: customer_json(user)
        else
          render json: { error: { message: 'No customer found with that email.', code: 'not_found' } },
                 status: :not_found
        end
      end
    end
  end
end
