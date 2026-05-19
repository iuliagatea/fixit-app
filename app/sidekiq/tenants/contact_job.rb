# frozen_string_literal: true

module Tenants
  class ContactJob
    include Sidekiq::Job

    def perform(params)
      if params[:product_id]
        product = Product.find(params[:product_id])
        params[:message] << "<hr> This message refers to #{view_context.link_to "#{product.code} #{product.name}",
                                                                                product_url(product)} <hr>"
      end
      UserNotifier.contact_tenant(params).deliver_later
    end
  end
end
