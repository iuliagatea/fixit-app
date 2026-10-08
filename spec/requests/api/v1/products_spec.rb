# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Products', type: :request do
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
  let(:products) { create_list(:product, 3, tenant_id: tenant.id, user: customer) }

  after { Tenant.logout }

  def sign_in_as(user)
    post '/api/v1/sign_in', params: { user: { email: user.email, password: password } }, as: :json
  end

  describe 'GET /api/v1/tenants/:tenant_id/products' do
    it 'returns 401 when not signed in' do
      get "/api/v1/tenants/#{tenant.id}/products", as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns the tenant's products with pagination metadata for an admin" do
      products
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{tenant.id}/products", as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['products'].size).to eq(3)
      expect(body['meta']).to include('total_entries' => 3, 'current_page' => 1)
    end

    it "rejects a tenant_id that isn't the current tenant" do
      sign_in_as(admin_user)

      get "/api/v1/tenants/#{other_tenant.id}/products", as: :json

      expect(response).to have_http_status(:forbidden)
    end

    describe 'filtering' do
      let(:other_customer) do
        Tenant.set_current_tenant(tenant)
        created = create(:user, :regular, email: 'jane@example.com', member: create(:member))
        created.confirm
        created
      end

      before { sign_in_as(admin_user) }

      it 'filters by product name or code (case-insensitive, partial match)' do
        create(:product, tenant_id: tenant.id, user: customer, name: 'Kitchen sink repair', code: 'KSR-1')
        create(:product, tenant_id: tenant.id, user: customer, name: 'Bathroom tiling', code: 'BT-1')

        get "/api/v1/tenants/#{tenant.id}/products", params: { name: 'kitchen' }, as: :json

        names = response.parsed_body['products'].pluck('name')
        expect(names).to eq(['Kitchen sink repair'])
      end

      it 'filters by status_id' do
        received = tenant.statuses.find_by(name: 'Received')
        in_progress = tenant.statuses.find_by(name: 'In progress')
        moved = create(:product, tenant_id: tenant.id, user: customer)
        moved.transition_to_status!(in_progress)
        create(:product, tenant_id: tenant.id, user: customer) # stays on Received

        get "/api/v1/tenants/#{tenant.id}/products", params: { status_id: received.id }, as: :json
        expect(response.parsed_body['products'].size).to eq(1)

        get "/api/v1/tenants/#{tenant.id}/products", params: { status_id: in_progress.id }, as: :json
        expect(response.parsed_body['products'].pluck('id')).to eq([moved.id])
      end

      it 'filters by customer email (case-insensitive, partial match)' do
        create(:product, tenant_id: tenant.id, user: customer)
        create(:product, tenant_id: tenant.id, user: other_customer)

        get "/api/v1/tenants/#{tenant.id}/products", params: { customer_email: 'JANE' }, as: :json

        emails = response.parsed_body['products'].map { |p| p['user']['email'] }
        expect(emails).to eq(['jane@example.com'])
      end

      it 'splits active vs. completed products via the completed param' do
        completed_status = tenant.statuses.find_by(name: 'Completed')
        done = create(:product, tenant_id: tenant.id, user: customer)
        done.transition_to_status!(completed_status)
        create(:product, tenant_id: tenant.id, user: customer) # stays on Received

        get "/api/v1/tenants/#{tenant.id}/products", params: { completed: 'true' }, as: :json
        expect(response.parsed_body['products'].pluck('id')).to eq([done.id])

        get "/api/v1/tenants/#{tenant.id}/products", params: { completed: 'false' }, as: :json
        expect(response.parsed_body['products'].pluck('id')).not_to include(done.id)
      end
    end
  end

  describe 'GET /api/v1/tenants/:tenant_id/products/:id' do
    it 'returns the product with its estimates for the owning customer' do
      product = create(:product, :with_estimates, tenant_id: tenant.id, user: customer)
      sign_in_as(customer)

      get "/api/v1/tenants/#{tenant.id}/products/#{product.id}", as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['id']).to eq(product.id)
      expect(body['estimates'].size).to eq(3)
      expect(body['current_status']['name']).to eq('Received')
    end

    it "404s for a product the current (non-admin) user doesn't own" do
      Tenant.set_current_tenant(tenant)
      other_customer = create(:user, :regular, member: create(:member))
      product = create(:product, tenant_id: tenant.id, user: other_customer)
      sign_in_as(customer)

      get "/api/v1/tenants/#{tenant.id}/products/#{product.id}", as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/tenants/:tenant_id/products' do
    let(:status_id) { tenant.statuses.find_by(name: 'Received').id }
    let(:create_params) do
      {
        product: {
          code: 'ABC-123',
          name: 'New product',
          expected_completion_date: 1.week.from_now.to_date.to_s,
          comments: 'Some comments',
          estimates_attributes: [{ name: 'Labor', quantity: 2, price: 50 }]
        },
        status_id: status_id
      }
    end

    it 'rejects a non-admin (regular customers cannot create products)' do
      sign_in_as(customer)

      post "/api/v1/tenants/#{tenant.id}/products",
           params: create_params.merge(user: { email: customer.email }), as: :json

      expect(response).to have_http_status(:forbidden)
    end

    it 'creates a product for an existing customer, with estimates' do
      existing_customer = customer
      sign_in_as(admin_user)

      expect do
        post "/api/v1/tenants/#{tenant.id}/products",
             params: create_params.merge(user: { email: existing_customer.email },
                                         member: { first_name: '',
                                                   last_name: '' }),
             as: :json
      end.to change(Product, :count).by(1).and change(User, :count).by(0)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body['code']).to eq('ABC-123')
      expect(body['estimates'].size).to eq(1)
      expect(body['current_status']['name']).to eq('Received')
    end

    it 'creates a new customer + member when the email is unknown to the tenant' do
      sign_in_as(admin_user)

      expect do
        post "/api/v1/tenants/#{tenant.id}/products",
             params: create_params.merge(user: { email: 'new-customer@example.com' },
                                         member: { first_name: 'Jane', last_name: 'Doe' }),
             as: :json
      end.to change(User, :count).by(1).and change(Member, :count).by(1).and change(Product, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it 'returns 422 when the free-plan product cap is hit' do
      allow_any_instance_of(Tenant).to receive(:products).and_wrap_original do |method|
        method.call.tap { |relation| allow(relation).to receive(:size).and_return(500) }
      end
      sign_in_as(admin_user)

      post "/api/v1/tenants/#{tenant.id}/products",
           params: create_params.merge(user: { email: customer.email }), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['error']['code']).to eq('create_failed')
    end
  end

  describe 'PATCH /api/v1/tenants/:tenant_id/products/:id' do
    it 'updates product fields and estimates' do
      product = create(:product, :with_estimates, tenant_id: tenant.id, user: customer)
      estimate_to_keep = product.estimates.first
      new_status_id = tenant.statuses.find_by(name: 'In progress').id
      sign_in_as(admin_user)

      patch "/api/v1/tenants/#{tenant.id}/products/#{product.id}",
            params: {
              product: {
                name: 'Updated name',
                estimates_attributes: [{ id: estimate_to_keep.id, name: estimate_to_keep.name,
                                         quantity: estimate_to_keep.quantity, price: estimate_to_keep.price }]
              },
              status_id: new_status_id
            }, as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['name']).to eq('Updated name')
      expect(body['current_status']['name']).to eq('In progress')
    end

    it 'rejects a non-admin' do
      product = create(:product, tenant_id: tenant.id, user: customer)
      sign_in_as(customer)

      patch "/api/v1/tenants/#{tenant.id}/products/#{product.id}",
            params: { product: { name: 'Hacked' } }, as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'POST /api/v1/tenants/:tenant_id/products/:id/send_product_card' do
    it 'enqueues the card email job' do
      product = create(:product, tenant_id: tenant.id, user: customer)
      sign_in_as(admin_user)

      expect do
        post "/api/v1/tenants/#{tenant.id}/products/#{product.id}/send_product_card", as: :json
      end.to change { Sidekiq::Worker.jobs.size }.by(1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
