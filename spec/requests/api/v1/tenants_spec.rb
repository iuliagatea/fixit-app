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

  describe 'GET /api/v1/tenants/:id/dashboard' do
    it 'returns status counts, stats, plan usage, and rating for an admin' do
      received = tenant.statuses.find_by(name: 'Received')
      completed = tenant.statuses.find_by(name: 'Completed')
      create(:product, tenant_id: tenant.id, user: customer)
      done = create(:product, tenant_id: tenant.id, user: customer)
      done.transition_to_status!(completed)
      create(:estimate, product: done, price: 100, quantity: 2)
      create(:review, tenant: tenant, user: customer, rating: 4)
      create(:review, tenant: tenant, user: customer, rating: 2)
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{tenant.id}/dashboard", as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      counts_by_name = body['status_counts'].to_h { |s| [s['name'], s['count']] }
      expect(counts_by_name[received.name]).to eq(1)
      expect(counts_by_name[completed.name]).to eq(1)
      expect(body['total_active_products']).to eq(1)
      expect(body['completed_this_month']).to eq(1)
      expect(body['plan']).to eq('plan' => 'free', 'product_count' => 2, 'limit' => 500)
      expect(body['rating']).to eq('average' => 3.0, 'count' => 2)
    end

    it "scopes status counts and stats to a non-admin's own products, but reports the tenant-wide plan usage" do
      create(:product, tenant_id: tenant.id, user: customer)
      other_customer = begin
        Tenant.set_current_tenant(tenant)
        create(:user, :regular, member: create(:member))
      end
      create(:product, tenant_id: tenant.id, user: other_customer)
      sign_in_as(customer)

      get "/api/v1/tenants/#{tenant.id}/dashboard", as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['total_active_products']).to eq(1)
      expect(body['plan']).to eq('plan' => 'free', 'product_count' => 2, 'limit' => 500)
    end

    it 'reports no plan limit for a premium tenant' do
      premium_tenant = create(:tenant, :premium)
      Tenant.set_current_tenant(premium_tenant)
      premium_admin = create(:user, :admin, password: password, password_confirmation: password)
      premium_admin.confirm
      sign_in_as(premium_admin)

      get "/api/v1/tenants/#{premium_tenant.id}/dashboard", as: :json

      expect(response.parsed_body['plan']).to eq('plan' => 'premium', 'product_count' => 0, 'limit' => nil)
    end

    it "rejects a tenant id that isn't the current tenant" do
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{other_tenant.id}/dashboard", as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'POST /api/v1/tenants/:id/upgrade' do
    it 'upgrades the plan and persists a payment when Stripe succeeds' do
      allow_any_instance_of(Payment).to receive(:process_payment).and_return(true)
      sign_in_as(admin_user)
      payment_params = { payment: { email: admin_user.email, token: 'tok_visa' } }

      expect do
        post "/api/v1/tenants/#{tenant.id}/upgrade", params: payment_params, as: :json
      end.to change(Payment, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['plan']).to eq('premium')
      expect(tenant.reload.plan).to eq('premium')
    end

    it 'reverts the plan and discards the payment when Stripe fails' do
      card_error = Stripe::CardError.new('Your card was declined.', nil)
      allow_any_instance_of(Payment).to receive(:process_payment).and_raise(card_error)
      sign_in_as(admin_user)
      payment_params = { payment: { email: admin_user.email, token: 'tok_chargeDeclined' } }

      expect do
        post "/api/v1/tenants/#{tenant.id}/upgrade", params: payment_params, as: :json
      end.not_to change(Payment, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['message']).to eq('Your card was declined.')
      expect(tenant.reload.plan).to eq('free')
    end

    it 'refuses to upgrade a tenant that is already premium' do
      premium_tenant = create(:tenant, :premium)
      Tenant.set_current_tenant(premium_tenant)
      premium_admin = create(:user, :admin, password: password, password_confirmation: password)
      premium_admin.confirm
      sign_in_as(premium_admin)
      payment_params = { payment: { email: premium_admin.email, token: 'tok_visa' } }

      post "/api/v1/tenants/#{premium_tenant.id}/upgrade", params: payment_params, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('already_upgraded')
    end

    it 'rejects a non-admin' do
      sign_in_as(customer)

      post "/api/v1/tenants/#{tenant.id}/upgrade", params: { payment: { email: customer.email, token: 'tok_visa' } },
                                                   as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end
end
