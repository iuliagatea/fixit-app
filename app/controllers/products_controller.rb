# frozen_string_literal: true

class ProductsController < ApplicationController
  before_action :find_product, only: %i[show edit update destroy]
  before_action :verify_tenant
  before_action :verify_user, except: %i[show index]

  def index
    @products = paginate(products, params[:page])
  end

  def show
    logger.debug "Showing products of tenant with id #{params[:tenant_id]} for user #{current_user.email}"
    respond_to do |format|
      format.html
      format.pdf do
        render pdf: "#{@product.code}_product_card",
               template: 'products/product_pdf',
               formats: [:html],
               show_as_html: params[:debug].present?
      end
    end
  end

  def new
    @product = Product.new
    @product.estimates.build
    @statuses = current_tenant.statuses
  end

  def create
    @product = Product.new(product_params)
    logger.debug "New product: #{@product.attributes.inspect}"
    logger.debug "Product should be valid: #{@product.valid?}"

    @user = User.find_by(email: params[:user]['email'])
    if @user.blank?
      @user = User.new(user_params)
      logger.debug "New user, member: #{@user.attributes.inspect}"
      if @user.save_and_invite_member && @user.create_member(member_params)
        logger.debug "New member added and invitation email sent to #{@user.email}."
        flash[:notice] = "New member added and invitation email sent to #{@user.email}."
      else
        logger.error "Errors occurred while creating user #{@user.errors}"
        flash[:error] = 'errors occurred!'
        @member = Member.new(member_params) # only used if need to revisit form
        render :new
      end
    else
      @user.tenants << current_tenant unless @user.tenants.include?(current_tenant)
    end
    @product.user = @user

    status_id = params.dig(:status, :id)
    if status_id.present?
      @product.statuses << Status.find(status_id)
    else
      flash[:error] = "Status is required"
      render :new and return
    end

    respond_to do |format|
      if @product.save
        UserNotifier.send_status_change_email(@user, @product,
                                              "#{current_tenant.name} - New product #{@product.name}").deliver_now
        logger.info 'The product was saved and now the user is going to be redirected...'
        format.html { redirect_to tenant_products_url, notice: 'Product was successfully created.' }
      else
        logger.error "Errors occurred while creating product #{@product.errors}."
        format.html { render :new }
      end
    end
  end

  def edit
    @user = @product.user
    @status = @product.current_status
    @statuses = current_tenant.statuses
    @product.estimates.build
  end

  def update
    user = User.find_by(email: params[:user]['email'])
    @product.user = user
    status = Status.find(params[:status]['id'])
    current_status = @product.current_status
    @product.statuses << status unless current_status == status
    respond_to do |format|
      if @product.update(product_params)
        logger.info 'The product was updated and now the user is going to be redirected...'
        if status.send_email && (current_status != status)
          logger.info 'Send email to customer for status change'
          UserNotifier.send_status_change_email(user, @product,
                                                "#{current_tenant.name} - Status updated for product #{@product.name}").deliver_now
        end
        format.html { redirect_to tenant_products_url, notice: 'Product was successfully updated.' }
      else
        logger.error "Errors occurred while updating product #{@product.attributes.inspect}."
        format.html { render :edit }
      end
    end
  end

  def destroy
    logger.debug "Deleting product #{@product.attributes.inspect}"
    @product.destroy
    respond_to do |format|
      logger.info 'The product was deleted and now the user is going to be redirected...'
      format.html { redirect_to tenant_products_url, notice: 'Product was successfully destroyed.' }
    end
  end

  def send_product_card
    @product = Product.find(params[:product_id])
    logger.debug "Send product card via email #{@product.attributes.inspect}"
    UserNotifier.send_product_card_email_pdf(@product.user, @product,
                                             "#{current_tenant.name} - Product card - #{@product.name}").deliver_later
    redirect_to tenant_product_path(@product.id, tenant_id: @product.tenant_id), notice: 'Product card sent successfully.'
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
end
