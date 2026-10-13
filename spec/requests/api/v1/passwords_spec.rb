# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Passwords', type: :request do
  let(:password) { 'Password123!' }
  let(:new_password) { 'NewPassword456!' }
  let(:tenant) { create(:tenant, :free) }
  let(:user) do
    Tenant.set_current_tenant(tenant)
    created = create(:user, :regular, password: password, password_confirmation: password)
    created.confirm
    created
  end

  after { Tenant.logout }

  def reset_params(token:, confirmation: new_password)
    { user: { reset_password_token: token, password: new_password, password_confirmation: confirmation } }
  end

  def change_params(current:, confirmation: new_password)
    { user: { current_password: current, password: new_password, password_confirmation: confirmation } }
  end

  describe 'POST /api/v1/password' do
    it 'sends reset instructions for a known email' do
      email = user.email

      expect do
        post '/api/v1/password', params: { user: { email: email } }, as: :json
      end.to change { ActionMailer::Base.deliveries.size }.by(1)

      expect(response).to have_http_status(:ok)
      expect(user.reload.reset_password_token).to be_present
    end

    it 'rejects an unknown email without sending anything' do
      expect do
        post '/api/v1/password', params: { user: { email: 'nobody@example.com' } }, as: :json
      end.not_to(change { ActionMailer::Base.deliveries.size })

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('reset_password_request_failed')
    end
  end

  describe 'PUT /api/v1/password' do
    def raw_reset_token_for(user)
      user.send(:set_reset_password_token)
    end

    it 'resets the password with a valid token and signs the user in' do
      token = raw_reset_token_for(user)

      put '/api/v1/password', params: reset_params(token: token), as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['user']['id']).to eq(user.id)
      expect(body['tenant']['id']).to eq(tenant.id)

      get '/api/v1/me', as: :json
      expect(response).to have_http_status(:ok)
    end

    it 'rejects an invalid token' do
      put '/api/v1/password', params: reset_params(token: 'garbage'), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('password_reset_failed')
    end

    it 'rejects an expired token' do
      token = raw_reset_token_for(user)
      user.update_column(:reset_password_sent_at, 7.hours.ago)

      put '/api/v1/password', params: reset_params(token: token), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('password_reset_failed')
    end

    it 'rejects a mismatched confirmation' do
      token = raw_reset_token_for(user)

      put '/api/v1/password', params: reset_params(token: token, confirmation: 'something-else'), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('password_reset_failed')
    end
  end

  describe 'PUT /api/v1/me/password' do
    before do
      post '/api/v1/sign_in', params: { user: { email: user.email, password: password } }, as: :json
    end

    it 'changes the password with the correct current password and keeps the session alive' do
      put '/api/v1/me/password', params: change_params(current: password), as: :json

      expect(response).to have_http_status(:ok)

      get '/api/v1/me', as: :json
      expect(response).to have_http_status(:ok)

      delete '/api/v1/sign_out', as: :json

      post '/api/v1/sign_in', params: { user: { email: user.email, password: new_password } }, as: :json
      expect(response).to have_http_status(:ok)
    end

    it 'rejects an incorrect current password' do
      put '/api/v1/me/password', params: change_params(current: 'wrong'), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('password_change_failed')
    end

    it 'returns 401 when not signed in' do
      delete '/api/v1/sign_out', as: :json

      put '/api/v1/me/password', params: change_params(current: password), as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
