# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Statuses', type: :request do
  let(:password) { 'Password123!' }
  let(:tenant) { create(:tenant, :free) }
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

  describe 'GET /api/v1/tenants/:tenant_id/statuses' do
    it 'returns the tenant default statuses' do
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{tenant.id}/statuses", as: :json

      expect(response).to have_http_status(:ok)
      names = response.parsed_body.pluck('name')
      expect(names).to include('Received', 'In progress', 'Completed', 'Canceled', 'Waiting')
    end
  end

  describe 'POST /api/v1/tenants/:tenant_id/statuses' do
    it 'creates a new status for an admin' do
      sign_in_as(admin_user)

      post "/api/v1/tenants/#{tenant.id}/statuses", params: { status: { name: 'On hold', color: '#ffffff' } }, as: :json

      expect(response).to have_http_status(:created)
      expect(response.parsed_body['name']).to eq('On hold')
    end

    it 'rejects a non-admin' do
      sign_in_as(customer)

      post "/api/v1/tenants/#{tenant.id}/statuses", params: { status: { name: 'On hold', color: '#ffffff' } }, as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'PATCH /api/v1/tenants/:tenant_id/statuses/:id' do
    it 'updates a status' do
      status = tenant.statuses.find_by(name: 'Waiting')
      sign_in_as(admin_user)

      patch "/api/v1/tenants/#{tenant.id}/statuses/#{status.id}", params: { status: { name: 'On hold' } }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['name']).to eq('On hold')
    end
  end

  describe 'DELETE /api/v1/tenants/:tenant_id/statuses/:id' do
    it 'deletes a deletable status with no products' do
      status = create(:status, tenant: tenant, can_be_deleted: true)
      sign_in_as(admin_user)

      delete "/api/v1/tenants/#{tenant.id}/statuses/#{status.id}", as: :json

      expect(response).to have_http_status(:no_content)
      expect(Status.exists?(status.id)).to be false
    end

    it "refuses to delete a status marked can_be_deleted: false (e.g. the 'Received' default)" do
      status = tenant.statuses.find_by(name: 'Received')
      sign_in_as(admin_user)

      delete "/api/v1/tenants/#{tenant.id}/statuses/#{status.id}", as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(Status.exists?(status.id)).to be true
    end

    it 'refuses to delete a status that still has products assigned' do
      status = tenant.statuses.find_by(name: 'Received')
      create(:product, tenant_id: tenant.id, user: customer)
      sign_in_as(admin_user)

      delete "/api/v1/tenants/#{tenant.id}/statuses/#{status.id}", as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'GET /api/v1/tenants/:tenant_id/statuses/:id/products' do
    it "returns products currently in that status (the status board's filter view)" do
      status = tenant.statuses.find_by(name: 'Received')
      create(:product, tenant_id: tenant.id, user: customer)
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{tenant.id}/statuses/#{status.id}/products", as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['products'].size).to eq(1)
      expect(body['meta']).to include('total_entries' => 1)
    end
  end
end
