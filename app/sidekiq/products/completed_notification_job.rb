# frozen_string_literal: true

module Products
  class CompletedNotificationJob
    include Sidekiq::Job

    def perform(product_id)
      product = Product.find(product_id)
      UserNotifier.product_completed(product).deliver_later
      Rails.logger.info("Notified customer to review tenant after product completed: #{product_id}")
    end
  end
end
