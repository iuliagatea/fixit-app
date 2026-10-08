# frozen_string_literal: true

module Api
  module V1
    class HealthController < Api::V1::BaseController
      skip_before_action :authenticate_tenant!

      def ping
        render json: { status: 'ok' }
      end
    end
  end
end
