# frozen_string_literal: true

class StatusesController < ApplicationController
  before_action :find_status, only: %i[show edit update destroy]
  before_action :verify_tenant
  before_action :verify_user, except: [:products]

  def index
    @statuses = paginate(current_tenant.statuses, params[:page])
  end

  def show; end

  def new
    @status = Status.new
  end

  def edit; end

  def create
    @status = Status.new(status_params)
    respond_to do |format|
      if @status.save
        format.html { redirect_to tenant_statuses_url, notice: 'Status was successfully created.' }
      else
        format.html { render :new }
      end
    end
  end

  def update
    respond_to do |format|
      if @status.update(status_params)
        format.html { redirect_to tenant_statuses_url, notice: 'Status was successfully updated.' }
      else
        format.html { render :edit }
      end
    end
  end

  def destroy
    @status.destroy
    respond_to do |format|
      format.html { redirect_to tenant_statuses_url, notice: 'Status was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  def products
    logger.debug "Showing products with statuses for tenant #{current_user.email}"
    @status = Status.find(params[:status_id])
    @products = paginate(@status.status_products(current_user), params[:page])
  end

  private

  def find_status
    @status = Status.find(params[:id])
  end

  def status_params
    params.require(:status).permit(:name, :color, :tenant_id, :is_active)
  end
end
