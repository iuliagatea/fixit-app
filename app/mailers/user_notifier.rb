# frozen_string_literal: true

class UserNotifier < ApplicationMailer
  default from: 'do-not-reply@fixit.com'

  def send_product_card(product)
    @product = product
    subject = "#{current_tenant.name} - Product card - #{@product.name}"
    product_card = WickedPdf.new.pdf_from_string(
      render_to_string(
        pdf: "#{@product.code}_product_card.pdf",
        template: 'products/product_pdf.html.erb',
        layout: 'layouts/pdf.html.erb'
      )
    )

    attachments["#{@product.code}_product_card.pdf"] = product_card
    mail to: @product.user.email, subject: subject
  end

  def notify_product(params)
    @product = params[:product]
    subject = "#{current_tenant.name} - Product was #{params[:action]} - #{@product.name}"
    mail to: @product.user.email, subject: subject
  end

  def contact_tenant(params)
    @message = params[:message]
    mail to: Tenant.find(params[:tenant_id]).users.first.email,
         subject: params[:subject],
         reply_to: params[:email],
         bcc: params[:email]
  end
end
