# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Confirmations', type: :request do
  let(:tenant) { create(:tenant, :free) }

  before { Tenant.set_current_tenant(tenant) }
  after { Tenant.logout }

  def invited_user
    user = User.new(email: Faker::Internet.email)
    user.save_and_invite_member
    user
  end

  describe 'GET /users/confirmation' do
    it 'confirms a normal self-signup user and signs them in automatically' do
      user = create(:user, :regular)
      user.update!(skip_confirm_change_password: true)
      token = user.confirmation_token

      get '/users/confirmation', params: { confirmation_token: token }

      expect(response).to redirect_to(root_path)
      expect(user.reload.confirmed?).to be true
    end

    it 'renders the create-password form for an invited user instead of crashing' do
      user = invited_user
      token = user.confirmation_token

      get '/users/confirmation', params: { confirmation_token: token }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Create Password')
      expect(user.reload.confirmed?).to be false
    end
  end

  describe 'PUT /user/confirmation' do
    it 'sets the password, confirms the account, and signs the user in' do
      user = invited_user
      token = user.confirmation_token

      put '/user/confirmation', params: {
        confirmation_token: token,
        user: { password: 'NewPassword456!', password_confirmation: 'NewPassword456!' }
      }

      expect(response).to redirect_to(root_path)
      user.reload
      expect(user.confirmed?).to be true
      expect(user.valid_password?('NewPassword456!')).to be true
    end

    it 're-renders the form with errors for a mismatched confirmation, without crashing' do
      user = invited_user
      token = user.confirmation_token

      put '/user/confirmation', params: {
        confirmation_token: token,
        user: { password: 'NewPassword456!', password_confirmation: 'something-else' }
      }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.body).to include('Create Password')
      expect(user.reload.confirmed?).to be false
    end
  end
end
