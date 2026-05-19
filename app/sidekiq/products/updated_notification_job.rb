# frozen_string_literal: true

module Products
  class UpdatedNotificationJob
    include Sidekiq::Job

    def perform(product_id)
      product = Product.find(product_id)
      product_params = { product: product, action: 'updated' }
      UserNotifier.notify_product(product_params).deliver_later
      Rails.logger.info("Notified about product updated: #{product_id}")
    end
  end
end
