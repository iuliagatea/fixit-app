# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Tenant, type: :model do
  describe 'Validations' do
    it { should have_many(:members) }
    it { should have_many(:statuses) }
    it { should have_many(:products) }
    it { should have_many(:estimates) }
    it { should have_many(:tenant_categories) }
    it { should have_many(:categories).through(:tenant_categories) }
    it { should have_many(:reviews) }
    it { should have_one(:payment) }
    it { should validate_presence_of(:name) }
    it { should validate_uniqueness_of(:name) }
  end

  describe '#destroy' do
    it 'cascades through products, statuses, product_statuses, categories, and payment without FK violations' do
      tenant = create(:tenant, :premium)
      Tenant.set_current_tenant(tenant)
      user = create(:user, :regular, member: create(:member))
      create(:product, :with_estimates, tenant_id: tenant.id, user: user)
      tenant.categories << create(:category)
      Payment.create!(tenant: tenant, email: 'billing@example.com', token: 'tok_visa')
      create(:review, tenant: tenant, user: user)

      expect { tenant.destroy! }.not_to raise_error

      expect(Product.where(tenant_id: tenant.id)).to be_empty
      expect(Status.where(tenant_id: tenant.id)).to be_empty
      expect(TenantCategory.where(tenant_id: tenant.id)).to be_empty
      expect(Payment.where(tenant_id: tenant.id)).to be_empty
      expect(Review.where(tenant_id: tenant.id)).to be_empty
    end
  end
end
