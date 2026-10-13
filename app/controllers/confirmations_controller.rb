# frozen_string_literal: true

class ConfirmationsController < Devise::ConfirmationsController
  before_action :set_confirmable, only: %i[show update]
  skip_before_action :authenticate_tenant!, only: %i[show update]

  def update
    if @confirmable.attempt_set_password(user_params)

      # this section is patterned off of devise 3.2.5 confirmations_controller#show

      self.resource = resource_class.confirm_by_token(params[:confirmation_token])
      yield resource if block_given?

      if resource.errors.empty?
        log_action('invitee confirmed')
        logger.debug "Invitee confirmed: #{resource}"
        set_flash_message(:notice, :confirmed)
        # sign in automatically
        sign_in_tenanted_and_redirect(resource)

      else
        log_action('invitee confirmation failed')
        logger.error "Invitee confirmation failed: #{resource.errors}"
        render :new, status: :unprocessable_entity
      end

    else
      log_action('invitee password set failed')
      logger.error 'Invitee password set failed'
      prep_do_show # prep for the form
      render :show, status: :unprocessable_entity
    end
  end

  def show
    if @confirmable.new_record? ||
       @confirmable.skip_confirm_change_password
      log_action('devise pass-thru')
      logger.debug 'devise pass-thru'
      self.resource = resource_class.confirm_by_token(params[:confirmation_token])
      yield resource if block_given?
      set_flash_message(:notice, :confirmed) if resource.errors.empty? && is_flashing_format?
      sign_in_tenanted_and_redirect(resource) if @confirmable.skip_confirm_change_password
    else
      log_action('password set form')
      logger.debug 'password set form'
      flash[:notice] = 'Please choose a password and confirm it'
      prep_do_show # prep for the form
    end
    # else fall thru to show template which is form to set a password
    # upon SUBMIT, processing will continue from update
  end

  def after_confirmation_path_for(_resource_name, _resource)
    if user_signed_in?
      root_path
    else
      new_user_session_path
    end
  end

  private

  # Sign in a user
  def sign_in_tenanted(resource)
    sign_in(resource)
    Tenant.set_current_tenant(resource)
  end

  # Sign in a user and tries to redirect
  def sign_in_tenanted_and_redirect(resource)
    sign_in_tenanted(resource)
    redirect_to after_sign_in_path_for(resource)
  end

  def set_confirmable
    @confirmable = User.find_or_initialize_with_error_by(:confirmation_token,
                                                         params[:confirmation_token])
  end

  # Prep for the "create password" form (show.html.erb): it needs `resource`
  # (for form_for/resource.errors) and @confirmation_token (for the hidden field).
  def prep_do_show
    self.resource = @confirmable
    @confirmation_token = params[:confirmation_token]
  end

  def user_params
    params.require(:user).permit(:password, :password_confirmation)
  end
end
