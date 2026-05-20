# frozen_string_literal: true

class ProductsController < ApplicationController
  before_action :find_product, only: %i[show edit update destroy]
  before_action :verify_tenant
  before_action :verify_user, except: %i[show index]

  def index
    @products = products.includes(:statuses, :estimates).paginate(page: params[:page])
  end

  def show
    logger.debug "Showing products of tenant with id #{params[:tenant_id]} for user #{current_user.email}"
    respond_to do |format|
      format.html
      format.pdf { render_product_pdf }
    end
  end

  def new
    @product = Product.new
    @product.estimates.build
    @statuses = current_tenant.statuses
  end

  def create
    @product = Products::CreateService.call(
      tenant_id: current_tenant.id,
      user_params: user_params,
      member_params: member_params,
      product_params: product_params,
      status_id: params[:status][:id]
    )

    redirect_to tenant_product_path(@product, tenant_id: current_tenant.id), notice: 'Product was successfully created.'
  rescue Products::CreateService::ServiceError => e
    flash.now[:error] = e.message
    @statuses = current_tenant.statuses
    render :new
  end

  def edit
    @user = @product.user
    @status = @product.current_status
    @statuses = current_tenant.statuses
    @product.estimates.build
  end

  def update
    result = Products::UpdateService.call(
      product: @product,
      product_params: product_params,
      new_status_id: params[:status][:id]
    )

    redirect_to tenant_product_path(result, tenant_id: current_tenant.id), notice: 'Product successfully updated.'
  rescue Products::UpdateService::ServiceError => e
    flash.now[:error] = e.message
    @statuses = current_tenant.statuses
    render :edit
  end

  def destroy
    logger.debug "Deleting product #{@product.attributes.inspect}"
    @product.destroy
    redirect_to tenant_products_path(tenant_id: current_tenant.id), notice: 'Product deleted.'
  end

  def send_product_card
    @product = Product.find(params[:product_id])
    logger.debug "Send product card via email #{@product.attributes.inspect}"

    Products::CardEmailJob.perform_async(@product.id)
    redirect_to tenant_product_path(@product.id, tenant_id: @product.tenant_id),
                notice: 'Product card sent successfully.'
  end

  private

  def find_product
    @product = Product.find(params[:id])
  end

  def product_params
    params.require(:product).permit(:code, :name, :expected_completion_date, :tenant_id, :comments,
                                    estimates_attributes: %i[id name quantity price value _destroy])
  end

  def estimate_params
    params.require(:estimates).permit(%i[id name quantity price value _destroy])
  end

  def member_params
    params.require(:member).permit(:first_name, :last_name)
  end

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end

  def render_product_pdf
    render pdf: "#{@product.code}_product_card",
           template: 'products/product_pdf',
           formats: [:html],
           show_as_html: params[:debug].present?
  end
end
