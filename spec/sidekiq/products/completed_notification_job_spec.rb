# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Products::CompletedNotificationJob, type: :job do
  let(:tenant) { create(:tenant, :free) }
  let(:customer) do
    Tenant.set_current_tenant(tenant)
    create(:user, :regular, member: create(:member))
  end
  let(:product) { create(:product, tenant: tenant, user: customer) }

  after { Tenant.logout }

  it 'delivers the product_completed email for the product' do
    mail = instance_double(ActionMailer::MessageDelivery, deliver_later: true)
    allow(UserNotifier).to receive(:product_completed).with(product).and_return(mail)

    described_class.new.perform(product.id)

    expect(UserNotifier).to have_received(:product_completed).with(product)
    expect(mail).to have_received(:deliver_later)
  end
end
