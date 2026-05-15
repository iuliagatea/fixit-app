# frozen_string_literal: true

class PagesController < ApplicationController
  #   skip_before_action :authenticate_tenant!, only: [:about]
  before_action :verify_user

  def about; end
end
