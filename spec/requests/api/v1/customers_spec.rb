# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Customers', type: :request do
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
    member = create(:member, first_name: 'Jane', last_name: 'Doe')
    created = create(:user, :regular, password: password, password_confirmation: password,
                                      email: 'jane@example.com', member: member)
    created.confirm
    created
  end

  after { Tenant.logout }

  def sign_in_as(user)
    post '/api/v1/sign_in', params: { user: { email: user.email, password: password } }, as: :json
  end

  describe 'GET /api/v1/tenants/:tenant_id/customers/lookup' do
    it 'finds an existing customer by email, case-insensitively' do
      customer
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{tenant.id}/customers/lookup", params: { email: 'JANE@EXAMPLE.COM' }, as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to include('email' => 'jane@example.com', 'first_name' => 'Jane', 'last_name' => 'Doe')
    end

    it 'returns 404 when no customer matches' do
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{tenant.id}/customers/lookup", params: { email: 'nobody@example.com' }, as: :json

      expect(response).to have_http_status(:not_found)
    end

    it 'does not find a customer belonging to a different tenant' do
      customer
      Tenant.set_current_tenant(other_tenant)
      other_admin = create(:user, :admin, password: password, password_confirmation: password)
      other_admin.confirm
      sign_in_as(other_admin)

      get "/api/v1/tenants/#{other_tenant.id}/customers/lookup", params: { email: 'jane@example.com' }, as: :json

      expect(response).to have_http_status(:not_found)
    end

    it 'rejects a non-admin' do
      sign_in_as(customer)

      get "/api/v1/tenants/#{tenant.id}/customers/lookup", params: { email: 'jane@example.com' }, as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end
end
