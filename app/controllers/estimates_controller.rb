# frozen_string_literal: true

class EstimatesController < ApplicationController
  before_action :find_estimate, only: %i[show edit update destroy]
  before_action :verify_tenant
  before_action :verify_user
  before_action :find_product

  def index
    @estimates = Estimate.all
  end

  def show; end

  def new
    @estimate = Estimate.new
  end

  def edit; end

  def create
    @estimate = Estimate.new(estimate_params)
    respond_to do |format|
      if @estimate.save
        format.html { redirect_to @estimate, notice: 'Estimate was successfully created.' }
      else
        logger.error "Errors occurred while creating Estimate! #{@estimate.errors}"
        format.html { render :new }
      end
    end
  end

  def update
    respond_to do |format|
      if @estimate.update(estimate_params)
        format.html { redirect_to @estimate, notice: 'Estimate was successfully updated.' }
      else
        format.html { render :edit }
        logger.error "Errors occurred while updating Estimate! #{@estimate.errors}"
      end
    end
  end

  def destroy
    logger.debug "Destroying estimate #{@estimate.attributes.inspect}"
    @estimate.destroy
    respond_to do |format|
      format.html { redirect_to estimates_url, notice: 'Estimate was successfully destroyed.' }
    end
  end

  private

  def find_estimate
    @estimate = Estimate.find(params[:id])
  end

  def find_product
    @product = Product.find(params[:product_id])
  end

  def estimate_params
    params.require(:estimate).permit(:name, :quantity, :price, :value, :tenant_id).tap do |param|
      param[:value] = param[:price].to_f * param[:quantity].to_f
    end
  end
end
