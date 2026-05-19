# frozen_string_literal: true

module Products
  class CreatedNotificationJob
    include Sidekiq::Job

    sidekiq_options retry: 3, dead: true

    def perform(product_id)
      product = Product.find(product_id)
      product_params = { product: product, action: 'created' }
      UserNotifier.notify_product(product_params).deliver_later
      Rails.logger.info("Notified about product being created: #{product_id}")
    end
  end
end
