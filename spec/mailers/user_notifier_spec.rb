# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserNotifier, type: :mailer do
  describe '#product_completed' do
    let(:tenant) { create(:tenant, :free) }
    let(:customer) do
      Tenant.set_current_tenant(tenant)
      create(:user, :regular, email: 'customer@example.com', member: create(:member))
    end
    let(:product) { create(:product, tenant: tenant, user: customer) }
    let(:mail) { described_class.product_completed(product) }

    after { Tenant.logout }

    it 'is addressed to the product\'s customer' do
      expect(mail.to).to eq(['customer@example.com'])
    end

    it 'mentions the tenant in the subject' do
      expect(mail.subject).to include(tenant.name)
    end

    it 'links to the tenant\'s public profile for leaving a review' do
      expect(mail.body.encoded).to include("/tenants/#{tenant.id}")
    end
  end
end
