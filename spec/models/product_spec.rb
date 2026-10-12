# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Product, type: :model do
  let(:tenant) { create(:tenant, :free) }
  let(:user) { create(:user, :admin) }
  let(:customer) { create(:user, :regular, member: create(:member)) }
  let(:product) { create(:product, tenant: tenant, user: customer) }
  let(:status) { create(:status, tenant: tenant, name: 'Received') }

  describe 'Associations' do
    it { should belong_to :tenant }
    it { should belong_to :user }
    it { should have_many(:product_statuses) }
    it { should have_many(:statuses).through(:product_statuses) }
    it { should have_many(:estimates).dependent(:destroy).inverse_of(:product) }
  end

  describe 'Nested Attributes' do
    it { should accept_nested_attributes_for(:estimates).allow_destroy(true).limit(50) }
  end

  describe 'Validations' do
    context 'presence validations' do
      it { should validate_presence_of(:name) }
      it { should validate_presence_of(:code) }
      it { should validate_presence_of(:expected_completion_date) }
      it { should validate_presence_of(:tenant_id) }
      it { should validate_presence_of(:user_id) }
    end

    context 'length validations' do
      it { should validate_length_of(:name).is_at_least(3).is_at_most(255) }
      it { should validate_length_of(:estimates_attributes) }
    end

    context 'code validation' do
      before do
        set_current_tenant(tenant.id)
      end
      it 'validates code format (uppercase, downcase, numbers, hyphens only)' do
        product.code = 'invalid-code-123'
        expect(product).to be_valid
      end

      it 'allows valid code format' do
        product.code = 'VALID-CODE-123'
        expect(product).to be_valid
      end

      it 'enforces uniqueness of code per tenant' do
        product.save!
        duplicate = build(:product, tenant: tenant, code: product.code)
        expect(duplicate).to be_invalid
      end

      it 'allows same code in different tenants' do
        product.save!
        other_tenant = create(:tenant, :premium)
        other_product = build(:product, tenant: other_tenant, user: customer, code: product.code)
        expect(other_product).to be_valid
      end
    end

    context 'plan limit validation' do
      it 'prevents free plan from exceeding 500 products' do
        free_tenant = create(:tenant, :free)
        set_current_tenant(free_tenant)
        create_list(:product, 500, tenant: free_tenant, user: customer)

        new_product = build(:product, tenant: free_tenant, user: customer)
        expect(new_product).to be_invalid
        expect(new_product.errors[:base]).to include('Free plan limited to 500 products')
      end

      it 'allows premium plans to exceed 500 products' do
        premium_tenant = create(:tenant, :premium)
        set_current_tenant(premium_tenant)
        create_list(:product, 501, tenant: premium_tenant, user: customer)

        new_product = build(:product, tenant: premium_tenant, user: customer)
        expect(new_product).to be_valid
      end
    end

    context 'status validation' do
      it 'requires at least one status' do
        set_current_tenant(tenant.id)
        product.statuses = []
        expect(product).to be_invalid
        expect(product.errors[:base]).to include('At least one status is required')
      end
    end
  end

  describe 'Scopes' do
    let(:other_tenant) { create(:tenant, :free) }
    let(:tenant_product1) { create(:product, tenant: tenant, user: customer) }
    let(:tenant_product2) { create(:product, tenant: tenant, user: customer) }
    let(:tenant_product3) { create(:product, tenant: tenant, user: customer) }
    let(:other_tenant_product) { create(:product, tenant: other_tenant, user: customer) }
    let(:high_value_product) { create(:product, tenant: tenant, user: customer) }

    before do
      set_current_tenant(tenant.id)
      create(:estimate, product: high_value_product, price: 8000, quantity: 2)
    end

    describe '.by_tenant' do
      it 'returns only products for specified tenant' do
        expect(Product.by_tenant(tenant.id)).to include(tenant_product1, tenant_product2, tenant_product3)
        expect(Product.by_tenant(tenant.id)).not_to include(other_tenant_product)
      end
    end

    describe '.by_user' do
      it 'returns only products for specified user' do
        expect(Product.by_user(customer.id)).to include(tenant_product1, tenant_product2, tenant_product3)
        expect(Product.by_user(user.id)).not_to include(other_tenant_product)
      end
    end

    describe '.by_status' do
      it 'returns products with specified status' do
        received_status = create(:status, tenant: tenant, name: 'Test')
        product.product_statuses.create!(status: received_status)

        expect(Product.by_status(received_status.id)).to include(product)
      end
    end

    describe '.recent' do
      it 'returns products ordered by creation date descending' do
        old_product = create(:product, tenant: tenant, user: customer, created_at: 2.days.ago)
        new_product = create(:product, tenant: tenant, user: customer)

        results = Product.recent
        expect(results.first).to eq(new_product)
        expect(results.last).to eq(old_product)
      end
    end
  end

  describe 'Instance Methods' do
    before do
      set_current_tenant(tenant.id)
    end
    describe '#current_status' do
      it 'returns the most recent status' do
        status1 = create(:status, tenant: tenant, name: 'Test')
        status2 = create(:status, tenant: tenant, name: 'Test1')

        product.product_statuses.create!(status: status1)
        product.product_statuses.create!(status: status2)

        expect(product.current_status).to eq(status2)
      end
    end

    describe '#estimated_value' do
      it 'calculates sum of (quantity * price) for all estimates' do
        create(:estimate, product: product, quantity: 2, price: 100)
        create(:estimate, product: product, quantity: 3, price: 50)

        expect(product.estimated_value).to eq(350)
      end

      it 'returns 0 when no estimates exist' do
        product.estimates.destroy_all
        expect(product.estimated_value).to eq(0)
      end

      it 'returns BigDecimal for precision' do
        create(:estimate, product: product, quantity: 1, price: 99.99)
        expect(product.estimated_value).to be_a(BigDecimal)
      end
    end

    describe '#transition_to_status!' do
      let(:status1) { create(:status, tenant: tenant, name: 'Test') }
      let(:status2) { create(:status, tenant: tenant, name: 'Test1') }

      before { product.product_statuses.create!(status: status1) }

      it 'creates new product status record' do
        expect do
          product.transition_to_status!(status2)
        end.to change(product.product_statuses, :count).by(1)
      end

      it 'updates current status' do
        product.transition_to_status!(status2)
        expect(product.current_status).to eq(status2)
      end

      it 'raises error if new status is not a Status record' do
        expect do
          product.transition_to_status!('invalid')
        end.to raise_error(ArgumentError, 'Status must be a Status record')
      end

      it 'schedules notification job if status has send_email flag' do
        status2.update!(send_email: true)

        expect(Products::UpdatedNotificationJob).to receive(:perform_async).with(product.id)
        product.transition_to_status!(status2)
      end

      it 'does not schedule job if status does not have send_email flag' do
        status2.update!(send_email: false)

        expect(Products::UpdatedNotificationJob).not_to receive(:perform_async)
        product.transition_to_status!(status2)
      end

      it 'schedules a completed-notification job when transitioning to a status named Completed' do
        # Tenant#create_statuses already seeds a 'Completed' status for every
        # tenant (Tenant::DEFAULT_STATUSES) - reuse it rather than creating a
        # second one, which would violate the name/tenant_id uniqueness
        # validation on Status.
        completed_status = tenant.statuses.find_by(name: 'Completed')

        expect(Products::CompletedNotificationJob).to receive(:perform_async).with(product.id)
        product.transition_to_status!(completed_status)
      end

      it 'does not schedule a completed-notification job for any other status name' do
        expect(Products::CompletedNotificationJob).not_to receive(:perform_async)
        product.transition_to_status!(status2)
      end
    end

    describe 'Callbacks' do
      describe 'before_create :initialize_status' do
        it 'assigns initial status from tenant' do
          initial_status = tenant&.statuses&.find_by(name: 'Received')
          new_product = build(:product, tenant: tenant, user: customer)

          new_product.save!

          expect(new_product.statuses).to include(initial_status)
        end
      end
    end

    describe 'Edge Cases' do
      it 'handles product with very long name' do
        product.name = 'A' * 255
        expect(product).to be_valid
      end

      it 'handles product with no estimates' do
        product.estimates.destroy_all
        expect(product.estimated_value).to eq(0)
      end

      it 'handles concurrent status transitions' do
        status1 = create(:status, tenant: tenant)
        status2 = create(:status, tenant: tenant)

        product.transition_to_status!(status1)
        product.transition_to_status!(status2)

        expect(product.product_statuses.count).to eq(3) # initial status + 2 transitions
      end
    end
  end
end
