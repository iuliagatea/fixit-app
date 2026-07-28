# frozen_string_literal: true

class TenantMemberProductsController < ApplicationController
  before_action :find_user

  def index
    @products = paginate(products, params[:page])
  end

  private

  def products
    query = @user.is_admin ? current_tenant.products.where(user_id: params[:user_id]) : @user.products
    @products = query.includes(:tenant, :user, :statuses, :estimates)
  end

  def find_user
    @user = User.find(params[:user_id])
  end
end
