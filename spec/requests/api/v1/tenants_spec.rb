# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Tenants', type: :request do
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

  after { Tenant.logout }

  def sign_in_as(user)
    post '/api/v1/sign_in', params: { user: { email: user.email, password: password } }, as: :json
  end

  describe 'GET /api/v1/tenants/:id' do
    it 'returns the tenant profile' do
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{tenant.id}", as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['name']).to eq(tenant.name)
    end

    it "rejects a tenant id that isn't the current tenant" do
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{other_tenant.id}", as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'PATCH /api/v1/tenants/:id' do
    it 'updates profile fields and categories for an admin' do
      category = create(:category)
      sign_in_as(admin_user)

      patch "/api/v1/tenants/#{tenant.id}",
            params: { tenant: { description: 'New description', keywords: 'repairs, plumbing',
                                 category_ids: [category.id] } }, as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['description']).to eq('New description')
      expect(body['category_ids']).to eq([category.id])
    end

    it 'ignores an attempt to change the plan (Phase 5 scope, not permitted here)' do
      sign_in_as(admin_user)

      patch "/api/v1/tenants/#{tenant.id}", params: { tenant: { plan: 'premium' } }, as: :json

      expect(response).to have_http_status(:ok)
      expect(tenant.reload.plan).to eq('free')
    end

    it 'rejects a non-admin' do
      sign_in_as(customer)

      patch "/api/v1/tenants/#{tenant.id}", params: { tenant: { description: 'Hacked' } }, as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end
end
