# frozen_string_literal: true

require 'rails_helper'

RSpec.describe StatusesController do
  include_context 'initialize'
  let!(:statuses) { create_list(:status, 10, tenant_id: tenant.id) }
  let(:status) { create(:status, tenant_id: tenant.id) }

  describe 'GET #index' do
    subject { get :index, params: { tenant_id: tenant.id } }
    let(:tenant_statuses) { tenant.statuses.paginate(page: 1, per_page: 10) }
    it 'renders a list of statuses' do
      subject
      expect(assigns(:statuses)).to match(tenant_statuses)
    end
    it { expect(subject).to render_template(:index) }
  end

  describe 'GET #new' do
    subject { get :new, params: { tenant_id: tenant.id } }
    include_examples 'new', :status
  end

  describe 'POST #create' do
    let(:create_attributes) { attributes_for(:status) }
    subject { post :create, params: { status: create_attributes, tenant_id: tenant.id } }
    include_examples 'create', Status
  end

  describe 'GET #show' do
    subject { get :show, params: { id: status.id, tenant_id: tenant.id } }
    before { status }
    it 'assigns values to variables' do
      subject
      expect(assigns(:status)).to eq(status)
    end
    it { expect(subject).to render_template(:show) }
  end

  describe 'GET #edit' do
    subject { get :edit, params: { id: status.id, tenant_id: tenant.id } }
    before { status }
    it 'assigns values to variables' do
      subject
      expect(assigns(:status)).to eq(status)
    end
    it { expect(subject).to render_template(:edit) }
  end

  describe 'PATCH #update' do
    let(:new_status_name) { 'New name' }
    let(:update_attributes) do
      { name: new_status_name }
    end
    subject { patch :update, params: { id: status.id, status: update_attributes, tenant_id: tenant.id } }
    before { status }
    it 'does not save a new status' do
      expect { subject }.to change(Status, :count).by(0)
    end
    it 'updates status with new params' do
      subject
      expect(assigns(:status).name).to eq(new_status_name)
    end
  end

  describe 'Delete #destroy' do
    subject { delete :destroy, params: { id: status.id, tenant_id: tenant.id } }
    before { status }
    include_examples 'destroy', Status
  end
end
