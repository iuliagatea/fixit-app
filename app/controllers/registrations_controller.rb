# frozen_string_literal: true

class RegistrationsController < Devise::RegistrationsController
  skip_before_action :authenticate_tenant!, only: %i[new create cancel]

  # ------------------------------------------------------------------------------
  # ------------------------------------------------------------------------------
  # TODO: options if non-standard path for new signups view
  # ------------------------------------------------------------------------------
  # create -- intercept the POST create action upon new sign-up
  # new tenant account is vetted, then created, then proceed with devise create user
  # CALLBACK: Tenant.create_new_tenant  -- prior to completing user account
  # CALLBACK: Tenant.tenant_signup      -- after completing user account
  # ------------------------------------------------------------------------------
  def create
    # have a working copy of the params in case Tenant callbacks
    # make any changes
    tenant_params = sign_up_params_tenant
    user_params   = sign_up_params_user.merge({ is_admin: true })

    sign_out_session!

    Tenant.transaction do
      byebug
      @tenant = TenantCreationService.call(tenant_params, user_params)
      logger.debug "Creating tenant: #{@tenant.attributes.inspect}"
      logger.debug "Tenant should be valid: #{@tenant.valid?}"
      if @tenant.errors.empty? # tenant created
        if @tenant.plan == 'premium'
          @payment = Payment.new({ email: user_params['email'],
                                   token: params[:payment]['token'],
                                   tenant: @tenant })
          flash[:error] = 'Please, check registration errors' unless @payment.valid?
          logger.error "Error saving payment: #{@payment.errors}" unless @payment.valid?
          begin
            @payment.process_payment
            @payment.save
            logger.debug "Tenant created successfully: #{@tenant.attributes.inspect}"
          rescue Exception => e
            flash[:error] = e.message
            @tenant.destroy
            log_action('Payment failed')
            logger.error "Error processing payment: #{e.message}"
            render :new and return
          end
        end
      else
        resource.valid?
        logger.error "Tenant create failed: #{@tenant.errors}"
        log_action('tenant create failed', @tenant)
        render :new and return
      end

      if flash[:error].blank? || flash[:error].empty? # payment sucessful
        devise_create(user_params) # devise resource(user) creation; sets resource

        if resource.errors.empty? #  SUCCESS!
          log_action('signup user/tenant success', resource)
          logger.debug "Signup user/tenant success #{resource}"
          # do any needed tenant initial setup
          Member.create_org_admin(resource)
        else # user creation failed; force tenant rollback
          log_action('signup user create failed', resource)
          logger.error "Signup user create failed #{resource}"
          raise ActiveRecord::Rollback # force the tenant transaction to be rolled back
        end
      else
        resource.valid?
        log_action('Payment perocessing failed', @tenant)
        logger.error "Payment perocessing failed #{@tenant}"
        render :new and return
      end
    end
  end

  # ------------------------------------------------------------------------------
  # ------------------------------------------------------------------------------

  protected

  # ------------------------------------------------------------------------------
  # ------------------------------------------------------------------------------
  def sign_up_params_tenant
    params.require(:tenant).permit(:name, :plan, :description, :keywords)
  end

  # ------------------------------------------------------------------------------
  # ------------------------------------------------------------------------------
  def sign_up_params_user
    devise_parameter_sanitizer.sanitize(:sign_up)
  end

  # ------------------------------------------------------------------------------
  # sign_out_session! -- force the devise session signout
  # ------------------------------------------------------------------------------
  def sign_out_session!
    return unless user_signed_in?

    Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name)
  end

  # ------------------------------------------------------------------------------
  # devise_create -- duplicate of Devise::RegistrationsController
  # same as in devise gem EXCEPT need to prep signup form variables
  # ------------------------------------------------------------------------------
  def devise_create(user_params)
    build_resource(user_params)

    resource.skip_confirm_change_password = true

    resource.save
    yield resource if block_given?
    log_action('devise: signup user success', resource)
    logger.debug "devise: signup user success #{resource}"

    if resource.persisted?
      if resource.active_for_authentication?
        set_flash_message :notice, :signed_up if is_flashing_format?
        sign_up(resource_name, resource)
        respond_with resource, location: after_sign_up_path_for(resource)
      else
        set_flash_message :notice, :"signed_up_but_#{resource.inactive_message}" if is_flashing_format?
        expire_data_after_sign_in!
        respond_with resource, location: after_inactive_sign_up_path_for(resource)
      end
    else
      # re-show signup view
      clean_up_passwords resource
      log_action('devise: signup user failure', resource)
      logger.error "devise: signup user failure #{resource}"
      set_minimum_password_length
      respond_with resource
    end
  end

  # ------------------------------------------------------------------------------
  # ------------------------------------------------------------------------------
  def after_sign_up_path_for(_resource)
    headers['refresh'] = "0;url=#{root_path}"
    root_path
  end

  # ------------------------------------------------------------------------------
  # ------------------------------------------------------------------------------
  def after_inactive_sign_up_path_for(_resource)
    headers['refresh'] = "0;url=#{root_path}"
    root_path
  end
  # ------------------------------------------------------------------------------
  # ------------------------------------------------------------------------------

  # ------------------------------------------------------------------------------
  # ------------------------------------------------------------------------------

  # ------------------------------------------------------------------------------
  # ------------------------------------------------------------------------------
end
