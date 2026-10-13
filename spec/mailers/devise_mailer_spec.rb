# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Devise::Mailer, type: :mailer do
  describe '#reset_password_instructions' do
    let(:tenant) { create(:tenant, :free) }
    let(:user) do
      Tenant.set_current_tenant(tenant)
      create(:user, :regular)
    end
    let(:mail) { described_class.reset_password_instructions(user, 'some-raw-token') }

    after { Tenant.logout }

    it 'links to the React reset-password route, not the legacy Devise page' do
      expect(mail.body.encoded).to include('/app/reset-password/edit?reset_password_token=some-raw-token')
      expect(mail.body.encoded).not_to include('/users/password/edit')
    end
  end

  describe '#confirmation_instructions' do
    let(:tenant) { create(:tenant, :free) }
    let(:user) do
      Tenant.set_current_tenant(tenant)
      create(:user, :regular)
    end
    let(:mail) { described_class.confirmation_instructions(user, 'some-raw-token') }

    after { Tenant.logout }

    it 'links to the React confirm route, not the legacy Devise page' do
      expect(mail.body.encoded).to include('/app/confirm/edit?confirmation_token=some-raw-token')
      expect(mail.body.encoded).not_to include('/users/confirmation')
    end
  end
end
