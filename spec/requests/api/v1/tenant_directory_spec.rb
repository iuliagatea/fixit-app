# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::TenantDirectory', type: :request do
  let(:category) { create(:category, name: 'Plumbing') }
  let(:tenant) do
    created = create(:tenant, :free, name: 'Acme Repairs')
    created.categories = [category]
    created
  end

  describe 'GET /api/v1/tenant_directory' do
    it 'is accessible without signing in' do
      tenant

      get '/api/v1/tenant_directory', as: :json

      expect(response).to have_http_status(:ok)
    end

    it 'returns tenants matching the query with pagination meta' do
      tenant

      get '/api/v1/tenant_directory', params: { query: 'Acme' }, as: :json

      body = response.parsed_body
      expect(body['tenants'].map { |t| t['id'] }).to eq([tenant.id])
      expect(body['meta']).to include('total_entries' => 1)
    end

    it 'returns tenants matching a category filter' do
      tenant
      other_tenant = create(:tenant, :free, name: 'Zed Services')

      get '/api/v1/tenant_directory', params: { category_id: category.id }, as: :json

      ids = response.parsed_body['tenants'].map { |t| t['id'] }
      expect(ids).to include(tenant.id)
      expect(ids).not_to include(other_tenant.id)
    end

    it 'includes average rating and rated review count' do
      Tenant.set_current_tenant(tenant)
      reviewer = create(:user, :regular, member: create(:member))
      create(:review, tenant: tenant, user: reviewer, rating: 4)

      get '/api/v1/tenant_directory', params: { query: 'Acme' }, as: :json
      Tenant.logout

      result = response.parsed_body['tenants'].first
      expect(result['average_rating']).to eq(4.0)
      expect(result['rated_reviews_count']).to eq(1)
    end
  end

  describe 'GET /api/v1/tenant_directory/:id' do
    it 'is accessible without signing in and includes the tenant profile' do
      get "/api/v1/tenant_directory/#{tenant.id}", as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['name']).to eq(tenant.name)
      expect(body['reviews']).to eq([])
      expect(body['average_rating']).to be_nil
    end

    it 'includes rated reviews with reviewer info and pagination meta' do
      Tenant.set_current_tenant(tenant)
      reviewer = create(:user, :regular, member: create(:member))
      create(:review, tenant: tenant, user: reviewer, rating: 5, title: 'Great work')
      Tenant.logout

      get "/api/v1/tenant_directory/#{tenant.id}", as: :json

      review_json = response.parsed_body['reviews'].first
      expect(review_json['title']).to eq('Great work')
      expect(review_json['rating']).to eq(5)
      expect(review_json['user']['id']).to eq(reviewer.id)
      expect(response.parsed_body['reviews_meta']).to include('total_entries' => 1)
    end
  end
end