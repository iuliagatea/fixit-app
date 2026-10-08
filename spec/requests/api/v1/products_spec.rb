# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Products', type: :request do
  let(:password) { 'Password123!' }
  let(:tenant) { create(:tenant, :free) }
  let(:other_tenant) { create(:tenant, :free) }
  let(:admin_user) do
    Tenant.set_current_tenant(tenant)
    created = create(:user, :admin, password: password, password_confirmation: password)
    created.confirm
    created
  end
  let(:customer) do
    Tenant.set_current_tenant(tenant)
    created = create(:user, :regular, password: password, password_confirmation: password, member: create(:member))
    created.confirm
    created
  end
  let(:products) { create_list(:product, 3, tenant_id: tenant.id, user: customer) }

  after { Tenant.logout }

  def sign_in_as(user)
    post '/api/v1/sign_in', params: { user: { email: user.email, password: password } }, as: :json
  end

  describe 'GET /api/v1/tenants/:tenant_id/products' do
    it 'returns 401 when not signed in' do
      get "/api/v1/tenants/#{tenant.id}/products", as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns the tenant's products with pagination metadata for an admin" do
      products
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{tenant.id}/products", as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['products'].size).to eq(3)
      expect(body['meta']).to include('total_entries' => 3, 'current_page' => 1)
    end

    it "rejects a tenant_id that isn't the current tenant" do
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{other_tenant.id}/products", as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'GET /api/v1/tenants/:tenant_id/products/:id' do
    it 'returns the product with its estimates for the owning customer' do
      product = create(:product, :with_estimates, tenant_id: tenant.id, user: customer)
      sign_in_as(customer)

      get "/api/v1/tenants/#{tenant.id}/products/#{product.id}", as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['id']).to eq(product.id)
      expect(body['estimates'].size).to eq(3)
      expect(body['current_status']['name']).to eq('Received')
    end

    it "404s for a product the current (non-admin) user doesn't own" do
      Tenant.set_current_tenant(tenant)
      other_customer = create(:user, :regular, member: create(:member))
      product = create(:product, tenant_id: tenant.id, user: other_customer)
      sign_in_as(customer)

      get "/api/v1/tenants/#{tenant.id}/products/#{product.id}", as: :json

      expect(response).to have_http_status(:not_found)
    end
  end
end
