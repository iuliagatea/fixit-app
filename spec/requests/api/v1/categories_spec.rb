# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Categories', type: :request do
  let(:password) { 'Password123!' }
  let(:tenant) { create(:tenant, :free) }
  let(:admin_user) do
    Tenant.set_current_tenant(tenant)
    created = create(:user, :admin, password: password, password_confirmation: password)
    created.confirm
    created
  end

  after { Tenant.logout }

  describe 'GET /api/v1/categories' do
    it 'lists categories, optionally filtered by entity' do
      create(:category, entity: 'tenant', name: 'Plumbing')
      create(:category, entity: 'other', name: 'Not tenant-facing')
      post '/api/v1/sign_in', params: { user: { email: admin_user.email, password: password } }, as: :json

      get '/api/v1/categories', params: { entity: 'tenant' }, as: :json

      expect(response).to have_http_status(:ok)
      names = response.parsed_body.pluck('name')
      expect(names).to include('Plumbing')
      expect(names).not_to include('Not tenant-facing')
    end
  end
end
