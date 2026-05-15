# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EstimatesController do
  include_context 'initialize'
  let!(:estimates) { create_list(:estimate, 10) }
  let(:estimate) { create(:estimate) }

  describe 'GET #index' do
    subject { get :index }
    include_examples "index", 'estimate'
  end

  describe 'GET #new' do
    subject { get :new }
    include_examples "new", :estimate
  end

  describe 'POST #create' do
    let(:create_attributes) { attributes_for(:estimate) }
    subject { post :create, params: { estimate: create_attributes } }
    include_examples "create", Estimate
  end

  describe 'GET #show' do
    subject { get :show, params: { id: estimate.id } }
    before { estimate }
    it 'assigns values to variables' do
      subject
      expect(assigns(:estimate)).to eq(estimate)
    end
    it { expect(subject).to render_template(:show) }
  end

  describe 'GET #edit' do
    subject { get :edit, params: { id: estimate.id } }
    before { estimate }
    it 'assigns values to variables' do
      subject
      expect(assigns(:estimate)).to eq(estimate)
    end
    it { expect(subject).to render_template(:edit) }
  end

  describe 'PATCH #update' do
    let(:new_estimate_name) { 'New name' }
    let(:update_attributes) do
      { name: new_estimate_name }
    end
    subject { patch :update, params: { id: estimate.id, estimate: update_attributes } }
    before { estimate }
    it 'does not save a new estimate' do
      expect { subject }.to change(Estimate, :count).by(0)
    end
    it 'updates estimate with new params' do
      subject
      expect(assigns(:estimate).name).to eq(new_estimate_name)
    end
  end

  describe 'Delete #destroy' do
    subject { delete :destroy, params: { id: estimate.id } }
    before { estimate }
    include_examples "destroy", Estimate
  end
end
