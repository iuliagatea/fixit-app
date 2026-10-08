# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sessions', type: :request do
  let(:password) { 'Password123!' }
  let(:tenant) { create(:tenant, :free) }
  let(:user) do
    Tenant.set_current_tenant(tenant)
    created = create(:user, :regular, password: password, password_confirmation: password)
    created.confirm
    created
  end

  after { Tenant.logout }

  describe 'POST /api/v1/sign_in' do
    it 'signs in with valid credentials and returns the user and tenant' do
      post '/api/v1/sign_in', params: { user: { email: user.email, password: password } }, as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['user']['email']).to eq(user.email)
      expect(body['tenant']['id']).to eq(tenant.id)
    end

    it 'rejects invalid credentials' do
      post '/api/v1/sign_in', params: { user: { email: user.email, password: 'wrong' } }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error']['code']).to eq('invalid_credentials')
    end
  end

  describe 'GET /api/v1/me' do
    it 'returns 401 when not signed in' do
      get '/api/v1/me', as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns the current user and tenant once signed in' do
      post '/api/v1/sign_in', params: { user: { email: user.email, password: password } }, as: :json

      get '/api/v1/me', as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['user']['id']).to eq(user.id)
    end
  end

  describe 'DELETE /api/v1/sign_out' do
    it 'signs the user out' do
      post '/api/v1/sign_in', params: { user: { email: user.email, password: password } }, as: :json

      delete '/api/v1/sign_out', as: :json
      expect(response).to have_http_status(:no_content)

      get '/api/v1/me', as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
