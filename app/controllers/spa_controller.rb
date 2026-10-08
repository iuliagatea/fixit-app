# frozen_string_literal: true

# Serves the React SPA shell. React Router handles sub-routes client-side;
# this action only needs to render the mount point.
class SpaController < ApplicationController
  skip_before_action :authenticate_tenant!
  layout 'spa'

  def show; end
end
