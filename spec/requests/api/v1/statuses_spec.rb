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

  after { Tenant.logout }

  describe 'GET /api/v1/tenants/:tenant_id/statuses' do
    it 'returns the tenant default statuses' do
      post '/api/v1/sign_in', params: { user: { email: admin_user.email, password: password } }, as: :json

      get "/api/v1/tenants/#{tenant.id}/statuses", as: :json

      expect(response).to have_http_status(:ok)
      names = response.parsed_body.pluck('name')
      expect(names).to include('Received', 'In progress', 'Completed', 'Canceled', 'Waiting')
    end
  end
end
