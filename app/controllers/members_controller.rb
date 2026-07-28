# frozen_string_literal: true

class MembersController < ApplicationController
  before_action :verify_admin

  def new
    @member = Member.new
    @user   = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save_and_invite_member && @user.create_member(member_params)
      flash[:notice] = "New member added and invitation email sent to #{@user.email}."
      logger.debug "Creating user and sending email #{@user.attributes.inspect}"
      redirect_to root_path
    else
      flash[:error] = 'errors occurred!'
      logger.error "Error occurred while creating user #{@user.attributes.inspect}"
      @member = Member.new(member_params) # only used if need to revisit form
      render :new
    end
  end

  def get_name
    return unless params[:email].present?

    @user = User.find_by(email: params[:email])
    @data = {}
    @data['first_name'] = @user.member.first_name
    @data['last_name'] = @user.member.last_name
    render(json: @data) && false
  end

  private

  def member_params
    params.require(:member).permit(:first_name, :last_name)
  end

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end
end
