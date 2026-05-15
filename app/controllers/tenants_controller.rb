# frozen_string_literal: true

class TenantsController < ApplicationController
  skip_before_action :authenticate_tenant!, only: %i[search contact send_email]
  before_action :find_tenant, except: %i[search]
  before_action :verify_tenant, only: %i[edit update]
  before_action :verify_user, only: %i[edit update]

  def edit
    @categories = Category.where(entity: 'tenant')
  end

  def show
    @categories = @tenant.categories
    @user_review = @tenant.reviews.where(user_id: current_user)
    if @user_review.any?
      @reviews = paginate(@tenant.reviews.order(created_at: :desc), params[:page], 5)
    else
      @reviews = []
    end
  end

  def update
    respond_to do |format|
      Tenant.transaction do
        if @tenant.update(tenant_params)
          if @tenant.plan == 'premium' && @tenant.payment.blank?
            logger.debugg "Updating plan for tenant #{@tenant.attributes.inspect}"
            @payment = Payment.new(email: tenant_params['email'],
                                   token: params[:payment]['token'],
                                   tenant: @tenant)
            begin
              @payment.process_payment
              @payment.save
            rescue Exception => e
              flash[:error] = e.message
              @payment.destroy
              @tenant.plan = 'free'
              @tenant.save
              redirect_to edit_tenant_path(@tenant) and return
            end
          end
          format.html { redirect_to tenant_edit_plan_path(@tenant), notice: 'Tenant was successfully updated.' }
        else
          format.html { render :edit }
        end
      end
    end
  end

  def contact; end

  def send_email
    UserNotifier.send_email(params).deliver_now
    redirect_to root_path, notice: 'Email was sent successfully.'
  end

  def search
    @tenants = TenantSearch.new(params).search
    return flash[:notice] = 'No result for your search' unless @tenants.any?

    @tenants = paginate(@tenants, params[:page]) if @tenants
  end

  private

  def tenant_params
    params.require(:tenant).permit(:tenant_id, :name, :plan, :description, :keywords, category_ids: [])
  end

  def find_tenant
    @tenant = Tenant.find(params[:tenant_id])
  end
end
