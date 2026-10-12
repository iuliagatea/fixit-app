# frozen_string_literal: true

module Api
  module V1
    # Public tenant search + profile, backing the React search/review pages.
    # No sign-in required, mirroring the legacy TenantsController#search.
    class TenantDirectoryController < Api::V1::BaseController
      skip_before_action :authenticate_tenant!, only: %i[index show]

      REVIEWS_PER_PAGE = 5

      def index
        tenants = paginate(Tenants::SearchService.call(params: search_params), params[:page])
        render json: { tenants: tenants.map { |tenant| tenant_summary_json(tenant) }, meta: pagination_meta(tenants) }
      end

      def show
        tenant = Tenant.find(params[:id])
        reviews = paginate(tenant.reviews.where.not(rating: nil).includes(:user).order(created_at: :desc),
                            params[:reviews_page], REVIEWS_PER_PAGE)

        render json: tenant_profile_json(tenant, reviews)
      end

      private

      # Tenants::SearchService blends @params[:query] and @params[:categories]
      # (a category NAME, not id - it feeds the pg_search tsearch against
      # categories.name) into one full-text query; :category_id is the
      # client-facing param (matches a <select> of Category records), so it's
      # translated to a name here rather than passed through as-is.
      def search_params
        { query: params[:query], categories: category_filter }
      end

      def category_filter
        return nil if params[:category_id].blank?

        Category.find_by(id: params[:category_id])&.name
      end

      def tenant_summary_json(tenant)
        {
          id: tenant.id,
          name: tenant.name,
          description: tenant.description&.truncate(500),
          category_ids: tenant.categories.pluck(:id),
          categories: tenant.categories.map { |category| { id: category.id, name: category.name } },
          average_rating: tenant.average_rating,
          rated_reviews_count: tenant.rated_reviews_count
        }
      end

      def tenant_profile_json(tenant, reviews)
        tenant_summary_json(tenant).merge(
          keywords: tenant.keywords,
          reviews: reviews.map { |review| review_json(review) },
          reviews_meta: pagination_meta(reviews)
        )
      end

      def review_json(review)
        {
          id: review.id,
          rating: review.rating,
          title: review.title,
          review: review.review,
          created_at: review.created_at,
          user: customer_json(review.user)
        }
      end
    end
  end
end