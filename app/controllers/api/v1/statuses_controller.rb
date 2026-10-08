# frozen_string_literal: true

module Api
  module V1
    # Read-only for now — just enough for the product form's status picker.
    # Full status management (create/reorder/delete) is Phase 4 scope.
    class StatusesController < Api::V1::BaseController
      before_action :verify_tenant

      def index
        render json: current_tenant.statuses.map { |status| { id: status.id, name: status.name, color: status.color } }
      end
    end
  end
end
