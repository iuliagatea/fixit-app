# frozen_string_literal: true

module Api
  module V1
    # Read-only. Category CRUD stays on the legacy `/categories` controller,
    # which is gated behind a single hardcoded admin email — a narrow,
    # platform-level tool unrelated to normal tenant administration, not
    # worth migrating as part of this phase's tenant-admin work. This just
    # exposes the list so the tenant settings form can populate its
    # category checkboxes.
    class CategoriesController < Api::V1::BaseController
      def index
        categories = Category.all
        categories = categories.where(entity: params[:entity]) if params[:entity].present?

        render json: categories.map { |category| { id: category.id, name: category.name, entity: category.entity } }
      end
    end
  end
end
