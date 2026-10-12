# frozen_string_literal: true

module Api
  module V1
    # Writing/removing a review for a tenant. Unlike TenantDirectoryController,
    # this requires sign-in (authenticate_tenant! is NOT skipped) - the reviewer
    # is always derived from the session, never a client-supplied user_id.
    class ReviewsController < Api::V1::BaseController
      before_action :find_tenant
      before_action :find_review, only: %i[destroy]

      def create
        return render_not_eligible unless eligible_to_review?
        return render_review_error("Rating can't be blank") if review_params[:rating].blank?
        return render_review_error('You have already reviewed this tenant') if already_reviewed?

        review = @tenant.reviews.new(review_params.merge(user: current_user))

        if review.save
          render json: review_json(review), status: :created
        else
          render_review_error(review.errors.full_messages.join(', '))
        end
      end

      def destroy
        unless current_user.id == @review.user_id || current_user.is_admin
          render json: { error: { message: 'You are not authorized to perform this action.', code: 'not_authorized' } },
                 status: :forbidden
          return
        end

        @review.destroy
        head :no_content
      end

      private

      def find_tenant
        @tenant = Tenant.find(params[:tenant_id])
      end

      def find_review
        @review = @tenant.reviews.find(params[:id])
      end

      # Only a customer with at least one product the tenant has marked
      # Completed can review them (checked via the cached current_status_id,
      # not status history - mirrors Api::V1::ProductsController's own
      # completed_status_id convention). "Completed" is matched by name,
      # like everywhere else this concept appears - if a tenant renames that
      # status, this (like the other call sites) silently stops matching.
      def eligible_to_review?
        completed_status_id = @tenant.statuses.find_by(name: 'Completed')&.id
        return false if completed_status_id.blank?

        @tenant.products.exists?(user_id: current_user.id, current_status_id: completed_status_id)
      end

      def already_reviewed?
        @tenant.reviews.exists?(user_id: current_user.id)
      end

      def render_not_eligible
        render json: { error: { message: 'You can review this tenant once you have a completed product with them.',
                                 code: 'not_eligible' } }, status: :forbidden
      end

      def render_review_error(message)
        render json: { error: { message: message, code: 'review_invalid' } }, status: :unprocessable_entity
      end

      def review_params
        params.require(:review).permit(:title, :review, :rating)
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