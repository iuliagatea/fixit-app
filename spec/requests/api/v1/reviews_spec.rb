# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Reviews', type: :request do
  let(:password) { 'Password123!' }
  let(:tenant) { create(:tenant, :free) }
  let(:other_tenant) { create(:tenant, :free) }
  let(:completed_status) { tenant.statuses.find_by(name: 'Completed') }

  def create_customer(for_tenant)
    Tenant.set_current_tenant(for_tenant)
    created = create(:user, :regular, password: password, password_confirmation: password, member: create(:member))
    created.confirm
    created
  end

  let(:customer) do
    created = create_customer(tenant)
    product = create(:product, tenant: tenant, user: created)
    product.transition_to_status!(completed_status)
    created
  end

  let(:customer_without_completed_product) do
    created = create_customer(tenant)
    create(:product, tenant: tenant, user: created) # stays at the default "Received" status
    created
  end

  let(:non_customer) { create_customer(other_tenant) }

  let(:admin) do
    Tenant.set_current_tenant(other_tenant)
    created = create(:user, :admin, password: password, password_confirmation: password)
    created.confirm
    created
  end

  after { Tenant.logout }

  def sign_in_as(user)
    post '/api/v1/sign_in', params: { user: { email: user.email, password: password } }, as: :json
  end

  describe 'POST /api/v1/tenants/:tenant_id/reviews' do
    it 'creates a review for a customer with a completed product' do
      sign_in_as(customer)

      post "/api/v1/tenants/#{tenant.id}/reviews",
           params: { review: { title: 'Great service', review: 'Fixed it fast', rating: 5 } }, as: :json

      expect(response).to have_http_status(:created)
      expect(tenant.reviews.count).to eq(1)
      expect(tenant.reviews.first.rating).to eq(5)
    end

    it 'rejects a customer whose product is not yet completed' do
      sign_in_as(customer_without_completed_product)

      post "/api/v1/tenants/#{tenant.id}/reviews",
           params: { review: { title: 'Great service', review: 'Fixed it fast', rating: 5 } }, as: :json

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['error']['code']).to eq('not_eligible')
      expect(tenant.reviews.count).to eq(0)
    end

    it 'rejects a user with no relationship to the tenant at all' do
      sign_in_as(non_customer)

      post "/api/v1/tenants/#{tenant.id}/reviews",
           params: { review: { title: 'Great service', review: 'Fixed it fast', rating: 5 } }, as: :json

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['error']['code']).to eq('not_eligible')
      expect(tenant.reviews.count).to eq(0)
    end

    it 'requires a rating' do
      sign_in_as(customer)

      post "/api/v1/tenants/#{tenant.id}/reviews",
           params: { review: { title: 'Great service', review: 'Fixed it fast' } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(tenant.reviews.count).to eq(0)
    end

    it 'rejects an out-of-range rating' do
      sign_in_as(customer)

      post "/api/v1/tenants/#{tenant.id}/reviews",
           params: { review: { title: 'Great service', review: 'Fixed it fast', rating: 9 } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'rejects a second review from the same customer for the same tenant' do
      sign_in_as(customer)
      post "/api/v1/tenants/#{tenant.id}/reviews",
           params: { review: { title: 'Great service', review: 'Fixed it fast', rating: 5 } }, as: :json

      post "/api/v1/tenants/#{tenant.id}/reviews",
           params: { review: { title: 'Again', review: 'Still great', rating: 4 } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(tenant.reviews.count).to eq(1)
    end
  end

  describe 'DELETE /api/v1/tenants/:tenant_id/reviews/:id' do
    let!(:review) { create(:review, tenant: tenant, user: customer, rating: 4) }

    it 'allows the review author to delete it' do
      sign_in_as(customer)

      delete "/api/v1/tenants/#{tenant.id}/reviews/#{review.id}", as: :json

      expect(response).to have_http_status(:no_content)
      expect(Review.exists?(review.id)).to be(false)
    end

    it 'allows an admin to delete any review' do
      sign_in_as(admin)

      delete "/api/v1/tenants/#{tenant.id}/reviews/#{review.id}", as: :json

      expect(response).to have_http_status(:no_content)
    end

    it 'rejects another non-admin user' do
      sign_in_as(non_customer)

      delete "/api/v1/tenants/#{tenant.id}/reviews/#{review.id}", as: :json

      expect(response).to have_http_status(:forbidden)
      expect(Review.exists?(review.id)).to be(true)
    end
  end
end
