# frozen_string_literal: true

class UserNotifier < ApplicationMailer
  default from: 'do-not-reply@fixit.com'

  def send_product_card_email_pdf(user, product, subject)
    @user = user
    @product = product
    product_card = WickedPdf.new.pdf_from_string(
      render_to_string(
        pdf: "#{@product.code}_product_card.pdf",
        template: 'products/product_pdf.html.erb',
        layout: 'layouts/pdf.html.erb'
      )
    )

    attachments["#{@product.code}_product_card.pdf"] = product_card
    mail to: @user.email, subject: subject
  end

  def send_status_change_email(user, product, subject)
    @product = product
    mail to: user.email, subject: subject
  end

  def send_email(params)
    if params[:product_id]
      product = Product.find(params[:product_id])
      params[:message] << "<hr> This message refers to #{view_context.link_to "#{product.code} #{product.name}",
                                                                              product_url(product)} <hr>"
    end
    @message = params[:message]
    mail to: Tenant.find(params[:tenant_id]).users.first.email, subject: params[:subject], reply_to: params[:email],
         bcc: params[:email]
  end
end
