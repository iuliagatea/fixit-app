# frozen_string_literal: true

class ApplicationController < ActionController::Base
  helper_method :current_tenant
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  before_action :authenticate_tenant!

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
# ------------------------------------------------------------------------------
  def authenticate_tenant!
    unless current_user.present? || authenticate_user!(force: true)
      email = params.dig(:user, :email) || "<email missing>"
      flash[:error] = "Cannot sign in as #{email}; check email/password"
      logger.info(">>>>> [failed auth user]") unless logger.nil?
      redirect_to new_user_session_path and return
    end

    # user_signed_in? == true also means current_user returns valid user
    unless user_signed_in?
      flash[:error] = "Invalid authentication"
      redirect_to new_user_session_path and return
    end

    Tenant.set_current_tenant(current_user)

    # successful tenant authentication; do any callback
    if respond_to?(:callback_authenticate_tenant, true)
      logger.debug(">>>>> [auth_tenant callback]")
      send(:callback_authenticate_tenant)
    end

    true
  end

  def not_authorized_redirect
    redirect_to :root,
                flash: { error: 'You are not authorized to do this action' }
  end

  private

  def current_tenant
    Tenant.current_tenant
  end
end
