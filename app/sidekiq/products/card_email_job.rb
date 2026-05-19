# frozen_string_literal: true

module Products
  class CardEmailJob
    include Sidekiq::Job

    def perform(product_id)
      product = Product.find(product_id)
      UserNotifier.send_product_card(product).deliver_later
    end
  end
end
