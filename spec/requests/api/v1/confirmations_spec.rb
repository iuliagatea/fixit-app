# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Confirmations', type: :request do
  let(:tenant) { create(:tenant, :free) }
  let(:user) do
    Tenant.set_current_tenant(tenant)
    create(:user, :regular)
  end

  after { Tenant.logout }

  describe 'POST /api/v1/confirmation' do
    it 'resends confirmation instructions for an unconfirmed email' do
      email = user.email

      expect do
        post '/api/v1/confirmation', params: { user: { email: email } }, as: :json
      end.to change { ActionMailer::Base.deliveries.size }.by(1)

      expect(response).to have_http_status(:ok)
    end

    it 'rejects an already-confirmed email' do
      user.confirm

      post '/api/v1/confirmation', params: { user: { email: user.email } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('resend_confirmation_failed')
    end

    it 'rejects an unknown email' do
      post '/api/v1/confirmation', params: { user: { email: 'nobody@example.com' } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('resend_confirmation_failed')
    end
  end

  describe 'PUT /api/v1/confirmation' do
    it 'confirms the account with a valid token and signs the user in' do
      token = user.confirmation_token

      put '/api/v1/confirmation', params: { user: { confirmation_token: token } }, as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['user']['id']).to eq(user.id)

      get '/api/v1/me', as: :json
      expect(response).to have_http_status(:ok)
    end

    it 'rejects an invalid token' do
      put '/api/v1/confirmation', params: { user: { confirmation_token: 'garbage' } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('confirmation_failed')
    end

    it 'rejects a token for an already-confirmed account' do
      token = user.confirmation_token
      user.confirm

      put '/api/v1/confirmation', params: { user: { confirmation_token: token } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('confirmation_failed')
    end
  end
end
