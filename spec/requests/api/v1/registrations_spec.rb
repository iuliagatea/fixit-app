# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Registrations', type: :request do
  let(:password) { 'Password123!' }

  def sign_up_params(overrides = {})
    {
      tenant: { name: 'New Service Co' },
      user: { email: 'founder@example.com', password: password, password_confirmation: password }
    }.deep_merge(overrides)
  end

  describe 'POST /api/v1/sign_up' do
    it 'creates a free-plan tenant, an admin user, and the admin member profile' do
      expect do
        post '/api/v1/sign_up', params: sign_up_params, as: :json
      end.to change(Tenant, :count).by(1)
         .and change(User, :count).by(1)
         .and change(Member, :count).by(1)

      expect(response).to have_http_status(:created)

      tenant = Tenant.find_by(name: 'New Service Co')
      expect(tenant.plan).to eq('free')

      user = User.find_by(email: 'founder@example.com')
      expect(user.is_admin).to be(true)
      expect(tenant.users).to include(user)
      expect(user.member.first_name).to eq('Admin')
    end

    it 'rejects a duplicate tenant name' do
      create(:tenant, :free, name: 'Taken Name')

      post '/api/v1/sign_up', params: sign_up_params(tenant: { name: 'Taken Name' }), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('signup_failed')
      expect(response.parsed_body['error']['message']).to match(/name/i)
    end

    it 'rejects a duplicate email' do
      Tenant.set_current_tenant(create(:tenant, :free))
      create(:user, :regular, email: 'founder@example.com')
      Tenant.logout

      post '/api/v1/sign_up', params: sign_up_params, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('signup_failed')
      expect(response.parsed_body['error']['message']).to match(/email/i)
    end

    it 'rejects a mismatched password confirmation' do
      post '/api/v1/sign_up',
           params: sign_up_params(user: { password_confirmation: 'something-else' }), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('signup_failed')
      expect(response.parsed_body['error']['message']).to match(/password confirmation/i)
    end

    it 'rolls back tenant creation when the user fails validation' do
      expect do
        post '/api/v1/sign_up',
             params: sign_up_params(user: { password_confirmation: 'something-else' }), as: :json
      end.not_to change(Tenant, :count)
    end
  end
end
