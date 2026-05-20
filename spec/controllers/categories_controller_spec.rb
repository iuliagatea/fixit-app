# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CategoriesController do
  let(:tenant) { create(:tenant, :free) }
  let(:admin_user) { create(:user, :admin, email: 'fixit.app2@gmail.com') }
  let!(:categories) { create_list(:category, 10) }
  let(:category) { categories.first }

  before do
    set_current_tenant(tenant.id)
    login(admin_user)
  end

  describe 'GET #index' do
    subject { get :index }

    it { expect(subject).to have_http_status(200) }
    it { expect(subject).to render_template(:index) }
    it {
      subject

      expect(assigns(:categories)).to match(Category.all)
    }
  end

  describe 'GET #new' do
    subject { get :new }
    include_examples 'new', :category
  end

  describe 'POST #create' do
    let(:create_attributes) { attributes_for(:category) }
    subject { post :create, params: { category: create_attributes } }
    include_examples 'create', Category
  end

  describe 'GET #show' do
    subject { get :show, params: { id: category.id } }
    before { category }
    it 'assigns values to variables' do
      subject
      expect(assigns(:category)).to eq(category)
    end
    it { expect(subject).to render_template(:show) }
  end

  describe 'GET #edit' do
    subject { get :edit, params: { id: category.id } }
    before { category }
    it 'assigns values to variables' do
      subject
      expect(assigns(:category)).to eq(category)
    end
    it { expect(subject).to render_template(:edit) }
  end

  describe 'PATCH #update' do
    let(:new_name) { 'New name' }
    let(:update_attributes) do
      { name: new_name }
    end
    subject { patch :update, params: { id: category.id, category: update_attributes } }
    before { category }
    it 'does not save a new category' do
      expect { subject }.to change(Category, :count).by(0)
    end
    it 'updates category with new params' do
      subject
      expect(assigns(:category).name).to eq(new_name)
    end
  end

  describe 'Delete #destroy' do
    subject { delete :destroy, params: { id: category.id } }
    before { category }
    include_examples 'destroy', Category
  end
end
