# frozen_string_literal: true

require 'base/service_base'

module Products
  class UpdateService
    include ServiceBase

    def initialize(product:, product_params:, new_status_id: nil)
      @product = product
      @product_params = product_params
      @new_status_id = new_status_id
    end

    def call
      Product.transaction do
        @product.update!(@product_params)

        if @new_status_id.present? && @product.current_status.id != @new_status_id.to_i
          new_status = Status.find(@new_status_id)
          @product.transition_to_status!(new_status)
        end

        @product
      end
    rescue ActiveRecord::RecordInvalid => e
      raise ServiceError, "Failed to update product: #{e.message}"
    end
  end
end
