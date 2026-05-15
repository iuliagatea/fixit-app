# frozen_string_literal: true

class ApplicationController < ActionController::Base
  helper_method :current_tenant
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  before_action :authenticate_tenant!
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from StandardError, with: :internal_error

  def products
    @products ||= current_user.is_admin ? current_tenant.products : current_user.products
  end

  def must_be_customer
    return if tenant.users.include?(current_user)

    not_authorized_redirect
  end

  def verify_admin
    return if current_user.is_admin

    not_authorized_redirect
  end

  def verify_user
    return unless current_user && !((params[:user_id].to_i == current_user.id) || current_user.is_admin)

    not_authorized_redirect
  end

  def verify_tenant
    return if params[:tenant_id].to_i == current_tenant.id

    not_authorized_redirect
  end

  def paginate(resource, page, per_page = nil)
    per_page ||= 10
    resource.paginate(page: page, per_page: per_page)
  end

  def log_action(action, resource = nil)
    err_msg = (resource.nil? ? '' : resource.errors.full_messages.uniq.join(', '))
    logger&.debug(
      ">>>>>  #{action} - #{err_msg}"
    )
  end

  # ------------------------------------------------------------------------------
  # authenticate_tenant! -- authorization & tenant setup
  # -- authenticates user
  # -- sets current tenant
  def authenticate_tenant!
    authenticate_user! unless user_signed_in?
    Tenant.set_current_tenant(current_user)

    return if user_signed_in? && !current_tenant.nil? && current_user.tenants.exists?(id: current_tenant.id)

    not_authorized_redirect
  end

  def not_authorized_redirect
    flash[:alert] = 'You are not authorized to perform this action.'

    redirect_to(request.referrer || root_path)
  end

  private

  def current_tenant
    Tenant.current_tenant
  end

  def not_found
    render json: { error: 'Not found' }, status: :not_found
  end

  def internal_error(exception)
    Rails.logger.error(exception.message)
    render json: { error: 'Internal server error' }, status: :internal_server_error
  end
end
